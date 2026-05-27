const CONFIG = {
    // Lire la clé depuis une variable globale (fichier config.js non versionné)
    // ou depuis les paramètres URL pour les tests
    get imgbbKey() {
        return window.IMGBB_API_KEY 
            || new URLSearchParams(window.location.search).get('key')
            || "";
    },
    storageKey: 'scanmenu_v2',
    maxImageSize: 5 * 1024 * 1024, // 5MB
    defaultImage: 'https://placehold.co/600x400/f3f4f6/9ca3af?text=Photo+manquante',
};

/* =============================================
   STORE — Source unique de vérité
   ============================================= */
const Store = {
    _data: null,

    get() {
        if (!this._data) {
            try {
                const raw = localStorage.getItem(CONFIG.storageKey);
                this._data = raw ? JSON.parse(raw) : { plats: [], categories: ['Entrées', 'Plats', 'Desserts', 'Boissons'] };
            } catch {
                this._data = { plats: [], categories: ['Entrées', 'Plats', 'Desserts', 'Boissons'] };
            }
        }
        return this._data;
    },

    save() {
        localStorage.setItem(CONFIG.storageKey, JSON.stringify(this._data));
    },

    getPlats() { return this.get().plats; },
    getCategories() { return this.get().categories; },

    addPlat(plat) {
        plat.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
        plat.createdAt = new Date().toISOString();
        this.get().plats.unshift(plat);
        this.save();
        return plat;
    },

    updatePlat(id, updates) {
        const plats = this.getPlats();
        const idx = plats.findIndex(p => p.id === id);
        if (idx !== -1) {
            plats[idx] = { ...plats[idx], ...updates };
            this.save();
            return plats[idx];
        }
        return null;
    },

    deletePlat(id) {
        const data = this.get();
        data.plats = data.plats.filter(p => p.id !== id);
        this.save();
    },

    addCategory(name) {
        const cats = this.getCategories();
        if (!cats.includes(name)) {
            cats.push(name);
            this.save();
        }
    },
};

/* =============================================
   UTILS
   ============================================= */
const Utils = {
    sanitize(str) {
        const div = document.createElement('div');
        div.textContent = String(str);
        return div.innerHTML;
    },

    formatPrice(price) {
        return new Intl.NumberFormat('tr-TR').format(price) + ' TL';
    },

    async fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = () => reject(new Error('Lecture du fichier impossible'));
            reader.readAsDataURL(file);
        });
    },

    debounce(fn, delay) {
        let t;
        return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
    },
};

/* =============================================
   TOAST — Notifications non-bloquantes
   ============================================= */
const Toast = {
    container: null,

    init() {
        this.container = document.createElement('div');
        this.container.className = 'toast-container';
        document.body.appendChild(this.container);
    },

    show(message, type = 'info') {
        if (!this.container) this.init();
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<span class="toast-icon"></span><span>${Utils.sanitize(message)}</span>`;
        this.container.appendChild(toast);
        setTimeout(() => toast.remove(), 3400);
    },

    success(msg) { this.show(msg, 'success'); },
    error(msg) { this.show(msg, 'error'); },
    info(msg) { this.show(msg, 'info'); },
};

/* =============================================
   IMAGE UPLOADER
   ============================================= */
const ImageUploader = {
    async upload(file) {
        if (file.size > CONFIG.maxImageSize) {
            throw new Error(`Image trop lourde. Maximum: ${CONFIG.maxImageSize / 1024 / 1024}MB`);
        }

        if (!CONFIG.imgbbKey) {
            // Mode développement : utiliser une URL base64 locale
            console.warn('⚠️ Aucune clé ImgBB. Utilisation du mode base64 local (non recommandé en production).');
            return Utils.fileToBase64(file);
        }

        const formData = new FormData();
        formData.append('image', file);

        const response = await fetch(`https://api.imgbb.com/1/upload?key=${CONFIG.imgbbKey}`, {
            method: 'POST',
            body: formData,
        });

        const data = await response.json();
        if (!data.success) throw new Error(data.error?.message || 'Erreur ImgBB');
        return data.data.url;
    },
};

/* =============================================
   MODAL — Confirmations élégantes
   ============================================= */
const Modal = {
    _resolve: null,

    show(title, message) {
        return new Promise(resolve => {
            this._resolve = resolve;
            let overlay = document.getElementById('confirm-modal');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.className = 'modal-overlay';
                overlay.id = 'confirm-modal';
                overlay.innerHTML = `
                    <div class="modal">
                        <h3 id="modal-title"></h3>
                        <p id="modal-message"></p>
                        <div class="modal-actions">
                            <button class="btn btn-secondary" id="modal-cancel">Annuler</button>
                            <button class="btn btn-primary" id="modal-confirm" style="width:auto;background:#ef4444;">Supprimer</button>
                        </div>
                    </div>`;
                document.body.appendChild(overlay);
                document.getElementById('modal-cancel').addEventListener('click', () => this._close(false));
                document.getElementById('modal-confirm').addEventListener('click', () => this._close(true));
                overlay.addEventListener('click', e => { if (e.target === overlay) this._close(false); });
            }
            document.getElementById('modal-title').textContent = title;
            document.getElementById('modal-message').textContent = message;
            document.getElementById('confirm-modal').classList.add('active');
        });
    },

    _close(result) {
        document.getElementById('confirm-modal')?.classList.remove('active');
        if (this._resolve) { this._resolve(result); this._resolve = null; }
    },
};

/* =============================================
   PAGE CLIENT
   ============================================= */
function initClientPage() {
    const menuGrid = document.getElementById('menu-client');
    if (!menuGrid) return;

    const plats = Store.getPlats();
    const categories = [...new Set(plats.map(p => p.categorie).filter(Boolean))];

    // Build filter bar
    const filterBar = document.createElement('div');
    filterBar.className = 'filter-bar';
    filterBar.innerHTML = `
        <div class="filter-inner">
            <input type="text" class="search-input" placeholder="Rechercher un plat..." id="client-search" autocomplete="off">
            <div class="category-tabs">
                <button class="cat-tab active" data-cat="all">Tout</button>
                ${categories.map(c => `<button class="cat-tab" data-cat="${Utils.sanitize(c)}">${Utils.sanitize(c)}</button>`).join('')}
            </div>
        </div>`;

    const header = document.querySelector('.client-header');
    if (header) header.insertAdjacentElement('afterend', filterBar);

    let activeCategory = 'all';
    let searchQuery = '';

    function renderMenu() {
        const filtered = plats.filter(p => {
            const matchCat = activeCategory === 'all' || p.categorie === activeCategory;
            const matchSearch = !searchQuery || 
                p.nom.toLowerCase().includes(searchQuery) || 
                (p.description || '').toLowerCase().includes(searchQuery);
            return matchCat && matchSearch;
        });

        if (filtered.length === 0) {
            menuGrid.innerHTML = `
                <div class="empty-state">
                    <h3>Aucun plat trouvé</h3>
                    <p>Essayez une autre recherche ou catégorie.</p>
                </div>`;
            return;
        }

        menuGrid.innerHTML = filtered.map((plat, i) => `
            <div class="card-client" style="animation-delay: ${i * 0.05}s">
                <div class="card-img-container">
                    <img 
                        src="${Utils.sanitize(plat.image)}" 
                        alt="${Utils.sanitize(plat.nom)}"
                        loading="lazy"
                        onerror="this.src='${CONFIG.defaultImage}'"
                    >
                </div>
                <div class="card-body">
                    ${plat.categorie ? `<span class="card-category-badge">${Utils.sanitize(plat.categorie)}</span>` : ''}
                    <h3>${Utils.sanitize(plat.nom)}</h3>
                    ${plat.description ? `<p class="card-description">${Utils.sanitize(plat.description)}</p>` : ''}
                    <div class="price-tag">${Utils.formatPrice(plat.prix)}</div>
                </div>
            </div>`).join('');
    }

    // Category filter
    filterBar.querySelectorAll('.cat-tab').forEach(btn => {
        btn.addEventListener('click', () => {
            filterBar.querySelectorAll('.cat-tab').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeCategory = btn.dataset.cat;
            renderMenu();
        });
    });

    // Search
    document.getElementById('client-search')?.addEventListener('input', Utils.debounce(e => {
        searchQuery = e.target.value.toLowerCase().trim();
        renderMenu();
    }, 220));

    renderMenu();
}

/* =============================================
   PAGE ADMIN
   ============================================= */
function initAdminPage() {
    const addBtn = document.getElementById('add-btn');
    if (!addBtn) return;

    const displayAdmin = document.getElementById('affichage');
    const fileInput = document.getElementById('photo');
    const fileLabel = document.querySelector('.modern-file-btn');
    const filePreview = document.getElementById('file-preview');
    const primaryLabel = document.querySelector('.file-text .primary');
    const secondaryLabel = document.querySelector('.file-text .secondary');

    let editingId = null;

    // Stats display
    function updateStats() {
        const plats = Store.getPlats();
        const el = id => document.getElementById(id);
        if (el('stat-total')) el('stat-total').textContent = plats.length;
        if (el('stat-categories')) {
            const cats = new Set(plats.map(p => p.categorie).filter(Boolean));
            el('stat-categories').textContent = cats.size;
        }
        if (el('stat-avg-price')) {
            const avg = plats.length ? Math.round(plats.reduce((s, p) => s + Number(p.prix), 0) / plats.length) : 0;
            el('stat-avg-price').textContent = avg + ' TL';
        }
    }

    // Populate category select
    function populateCategorySelect() {
        const select = document.getElementById('categorie');
        if (!select) return;
        const cats = Store.getCategories();
        select.innerHTML = `<option value="">Sans catégorie</option>` +
            cats.map(c => `<option value="${Utils.sanitize(c)}">${Utils.sanitize(c)}</option>`).join('');
    }

    // File input UI
    if (fileInput) {
        fileInput.addEventListener('change', async function() {
            const file = this.files[0];
            if (!file) return;

            if (file.size > CONFIG.maxImageSize) {
                Toast.error('Image trop lourde (max 5MB)');
                this.value = '';
                return;
            }

            // Preview
            const b64 = await Utils.fileToBase64(file);
            if (filePreview) {
                filePreview.src = b64;
                filePreview.classList.add('visible');
            }
            if (fileLabel) fileLabel.classList.add('has-file');
            if (primaryLabel) primaryLabel.textContent = file.name.length > 22 ? file.name.substring(0, 22) + '...' : file.name;
            if (secondaryLabel) secondaryLabel.textContent = (file.size / 1024).toFixed(0) + ' KB';
        });
    }

    // Form validation
    function validateForm() {
        let valid = true;
        const nom = document.getElementById('text');
        const prix = document.getElementById('prix');

        [nom, prix].forEach(el => {
            el?.classList.remove('error');
            el?.nextElementSibling?.classList.remove('visible');
        });

        if (!nom?.value.trim()) {
            nom?.classList.add('error');
            nom?.nextElementSibling?.classList.add('visible');
            valid = false;
        }
        if (!prix?.value || Number(prix?.value) <= 0) {
            prix?.classList.add('error');
            prix?.nextElementSibling?.classList.add('visible');
            valid = false;
        }
        if (!editingId && !fileInput?.files[0]) {
            const wrapper = fileInput?.closest('.file-wrapper');
            const btn = wrapper?.querySelector('.modern-file-btn');
            if (btn) { btn.style.borderColor = '#ef4444'; setTimeout(() => btn.style.borderColor = '', 2000); }
            Toast.error('Veuillez choisir une photo');
            valid = false;
        }

        return valid;
    }

    // Reset form
    function resetForm() {
        document.getElementById('text').value = '';
        document.getElementById('prix').value = '';
        document.getElementById('description').value = '';
        document.getElementById('categorie').value = '';
        if (fileInput) fileInput.value = '';
        if (filePreview) { filePreview.src = ''; filePreview.classList.remove('visible'); }
        if (fileLabel) fileLabel.classList.remove('has-file');
        if (primaryLabel) primaryLabel.textContent = 'Choisir une photo';
        if (secondaryLabel) secondaryLabel.textContent = 'JPG, PNG, WebP — max 5MB';
        editingId = null;
        addBtn.textContent = 'Enregistrer le plat';
        document.querySelector('.admin-card h1').textContent = 'Ajouter un plat';
    }

    // Add / Edit submit
    addBtn.addEventListener('click', async () => {
        if (!validateForm()) return;

        addBtn.innerHTML = '<span style="display:inline-flex;align-items:center;gap:8px;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/><path d="M9 12h6M12 9v6"/></svg>Téléchargement...</span>';
        addBtn.disabled = true;

        try {
            let imageUrl;

            if (fileInput?.files[0]) {
                imageUrl = await ImageUploader.upload(fileInput.files[0]);
            } else if (editingId) {
                imageUrl = Store.getPlats().find(p => p.id === editingId)?.image;
            }

            const platData = {
                nom: document.getElementById('text').value.trim(),
                prix: Number(document.getElementById('prix').value),
                description: document.getElementById('description').value.trim(),
                categorie: document.getElementById('categorie').value,
                image: imageUrl,
            };

            if (editingId) {
                Store.updatePlat(editingId, platData);
                Toast.success('Plat modifié avec succès');
            } else {
                Store.addPlat(platData);
                Toast.success('Plat ajouté avec succès');
            }

            resetForm();
            renderAdmin();
            updateStats();

        } catch (err) {
            Toast.error(err.message || 'Erreur lors du téléchargement');
        } finally {
            addBtn.textContent = 'Enregistrer le plat';
            addBtn.disabled = false;
        }
    });

    // Render admin list
    let adminSearchQuery = '';

    function renderAdmin() {
        const plats = Store.getPlats();
        const filtered = plats.filter(p =>
            !adminSearchQuery || p.nom.toLowerCase().includes(adminSearchQuery)
        );

        if (filtered.length === 0) {
            displayAdmin.innerHTML = `<p style="text-align:center;color:var(--gray-400);padding:32px;font-size:0.9rem;">${plats.length === 0 ? 'Aucun plat pour le moment.' : 'Aucun résultat pour cette recherche.'}</p>`;
            return;
        }

        displayAdmin.innerHTML = filtered.map(plat => `
            <div class="admin-item" data-id="${plat.id}">
                <img src="${Utils.sanitize(plat.image)}" alt="${Utils.sanitize(plat.nom)}" onerror="this.src='${CONFIG.defaultImage}'">
                <div class="admin-item-info">
                    <strong>${Utils.sanitize(plat.nom)}</strong>
                    <span>${plat.categorie ? Utils.sanitize(plat.categorie) + ' · ' : ''}${plat.description ? plat.description.substring(0, 30) + (plat.description.length > 30 ? '...' : '') : 'Sans description'}</span>
                </div>
                <span class="admin-item-price">${Utils.formatPrice(plat.prix)}</span>
                <div class="admin-item-actions">
                    <button class="btn btn-edit" onclick="window._adminEdit('${plat.id}')">Modifier</button>
                    <button class="btn btn-delete" onclick="window._adminDelete('${plat.id}')">Supprimer</button>
                </div>
            </div>`).join('');
    }

    // Edit
    window._adminEdit = (id) => {
        const plat = Store.getPlats().find(p => p.id === id);
        if (!plat) return;
        editingId = id;
        document.getElementById('text').value = plat.nom;
        document.getElementById('prix').value = plat.prix;
        document.getElementById('description').value = plat.description || '';
        document.getElementById('categorie').value = plat.categorie || '';
        if (filePreview && plat.image) {
            filePreview.src = plat.image;
            filePreview.classList.add('visible');
        }
        if (primaryLabel) primaryLabel.textContent = 'Modifier la photo (optionnel)';
        addBtn.textContent = 'Enregistrer les modifications';
        document.querySelector('.admin-card h1').textContent = 'Modifier le plat';
        document.querySelector('.admin-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    // Delete
    window._adminDelete = async (id) => {
        const plat = Store.getPlats().find(p => p.id === id);
        if (!plat) return;
        const confirmed = await Modal.show('Supprimer ce plat ?', `"${plat.nom}" sera définitivement supprimé.`);
        if (confirmed) {
            Store.deletePlat(id);
            renderAdmin();
            updateStats();
            Toast.success('Plat supprimé');
        }
    };

    // Admin search
    document.getElementById('admin-search-input')?.addEventListener('input', Utils.debounce(e => {
        adminSearchQuery = e.target.value.toLowerCase().trim();
        renderAdmin();
    }, 200));

    // QR Generator
    document.getElementById('generate-qr')?.addEventListener('click', () => {
        const url = window.location.href.replace('admin.html', 'index.html');
        const container = document.getElementById('qrcode-container');
        container.innerHTML = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}&bgcolor=ffffff&color=0e0e0e&margin=10" alt="QR Code">
        <div class="qr-url">${url}</div>`;
        Toast.info('QR Code généré !');
    });

    populateCategorySelect();
    renderAdmin();
    updateStats();
    Toast.init();
}

/* =============================================
   INIT
   ============================================= */
document.addEventListener('DOMContentLoaded', () => {
    initClientPage();
    initAdminPage();
});
