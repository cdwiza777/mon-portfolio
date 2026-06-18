// === CURSOR ===
const cur = document.getElementById('cursor');
const ring = document.getElementById('ring');
let mx=0,my=0,rx=0,ry=0;
document.addEventListener('mousemove', e => {
    mx=e.clientX; my=e.clientY;
    cur.style.transform = `translate(${mx-4}px,${my-4}px)`;
});
(function animRing(){
    rx+=(mx-rx)*0.12; ry+=(my-ry)*0.12;
    ring.style.transform=`translate(${rx-19}px,${ry-19}px)`;
    requestAnimationFrame(animRing);
})();
document.querySelectorAll('a,button,.stat').forEach(el => {
    el.addEventListener('mouseenter', () => { ring.style.width='56px'; ring.style.height='56px'; ring.style.borderColor='rgba(255,69,0,0.8)'; });
    el.addEventListener('mouseleave', () => { ring.style.width='38px'; ring.style.height='38px'; ring.style.borderColor='rgba(255,69,0,0.5)'; });
});

// === NAV SCROLL ===
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => nav.classList.toggle('scrolled', scrollY > 40));

// === BURGER MENU ===
const burger = document.getElementById('burger');
const navDrawer = document.getElementById('navDrawer');
burger.addEventListener('click', () => {
    const open = navDrawer.classList.toggle('open');
    burger.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open);
    document.body.style.overflow = open ? 'hidden' : '';
});
document.querySelectorAll('.drawer-link').forEach(link => {
    link.addEventListener('click', () => {
        navDrawer.classList.remove('open');
        burger.classList.remove('open');
        burger.setAttribute('aria-expanded', false);
        document.body.style.overflow = '';
    });
});

// === CUSTOM SELECT ===
// — Pour modifier le comportement, éditer uniquement ce bloc —
const posteSelect  = document.getElementById('posteSelect');
const posteTrigger = document.getElementById('posteTrigger');
const posteLabel   = document.getElementById('posteLabel');
const posteNative  = document.getElementById('posteNative');
const posteDropdown = document.getElementById('posteDropdown');

// Ouvrir / fermer
posteTrigger.addEventListener('click', () => {
    const isOpen = posteSelect.classList.toggle('open');
    posteTrigger.setAttribute('aria-expanded', isOpen);
});

// Sélectionner une option
posteDropdown.querySelectorAll('.cs-option').forEach(opt => {
    opt.addEventListener('click', () => {
        const val   = opt.dataset.value;
        const label = opt.querySelector('.cs-option__label').textContent;

        // Mettre à jour le label affiché
        posteLabel.textContent = label;
        posteTrigger.classList.add('has-value');

        // Synchroniser le select natif (soumission formulaire)
        posteNative.value = val;

        // Marquer l'option sélectionnée
        posteDropdown.querySelectorAll('.cs-option').forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');

        // Fermer
        posteSelect.classList.remove('open');
        posteTrigger.setAttribute('aria-expanded', false);
    });
});

// Fermer au clic extérieur
document.addEventListener('click', e => {
    if (!posteSelect.contains(e.target)) {
        posteSelect.classList.remove('open');
        posteTrigger.setAttribute('aria-expanded', false);
    }
});

// Fermer à Échap
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        posteSelect.classList.remove('open');
        posteTrigger.setAttribute('aria-expanded', false);
    }
});

// === REVEAL ===
const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if(e.isIntersecting){ e.target.classList.add('visible'); obs.unobserve(e.target); } });
}, { threshold: 0.1 });
document.querySelectorAll('.reveal').forEach(el => obs.observe(el));

// === FORM ===
document.getElementById('contactForm').addEventListener('submit', async function(e) {
    const btn = document.getElementById('submitBtn');
    btn.textContent = '✓ Candidature envoyée !';
    btn.classList.add('success');
    btn.disabled = true;
    setTimeout(() => {
        btn.innerHTML = 'Envoyer ma candidature <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/></svg>';
        btn.classList.remove('success');
        btn.disabled = false;
    }, 4000);
});