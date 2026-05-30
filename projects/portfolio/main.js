/* ============================================================
   LUX.DEV — main.js
   Modules : Loader · Curseur · Scroll Progress · Particules
             Typewriter · Reveal · Tilt 3D · Compteurs · Burger
   ============================================================ */

'use strict';

/* ── 1. LOADER ──────────────────────────────────────────── */
const loader = document.getElementById('loader');
window.addEventListener('load', () => {
    setTimeout(() => {
        loader.classList.add('hidden');
        loader.addEventListener('transitionend', () => loader.remove(), { once: true });
    }, 1300);
});

/* ── 2. CURSEUR CUSTOM ──────────────────────────────────── */
const cursor    = document.getElementById('cursor');
const follower  = document.getElementById('cursor-follower');

if (cursor && follower) {
    let mx = 0, my = 0; // position cible
    let fx = 0, fy = 0; // position follower (lissée)

    document.addEventListener('mousemove', e => {
        mx = e.clientX; my = e.clientY;
        cursor.style.left = mx + 'px';
        cursor.style.top  = my + 'px';
    });

    // Follower avec inertie (lerp)
    const lerp = (a, b, n) => a + (b - a) * n;
    function animateCursor() {
        fx = lerp(fx, mx, 0.12);
        fy = lerp(fy, my, 0.12);
        follower.style.left = fx + 'px';
        follower.style.top  = fy + 'px';
        requestAnimationFrame(animateCursor);
    }
    animateCursor();

    // Hover sur liens/boutons
    const interactives = document.querySelectorAll('a, button, input, textarea, .tilt-card');
    interactives.forEach(el => {
        el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
        el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
    });

    document.addEventListener('mouseleave', () => {
        cursor.style.opacity   = '0';
        follower.style.opacity = '0';
    });
    document.addEventListener('mouseenter', () => {
        cursor.style.opacity   = '1';
        follower.style.opacity = '1';
    });
}

/* ── 3. BARRE DE PROGRESSION SCROLL ────────────────────── */
const progressBar = document.getElementById('scroll-progress');
window.addEventListener('scroll', () => {
    const scrolled = window.scrollY;
    const total    = document.documentElement.scrollHeight - window.innerHeight;
    const pct      = Math.round((scrolled / total) * 1000) / 10; // 1 décimale
    if (progressBar) progressBar.style.width = pct + '%';

    // Navbar : fond renforcé après scroll
    const navbar = document.querySelector('.navbar');
    if (navbar) navbar.classList.toggle('scrolled', scrolled > 60);
}, { passive: true });

/* ── 4. CANVAS PARTICULES ──────────────────────────────── */
(function initParticles() {
    const canvas = document.getElementById('particles-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    function resize() {
        canvas.width  = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize, { passive: true });

    const PARTICLE_COUNT = 60;
    const MAX_DISTANCE   = 130;

    const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
        x:  Math.random() * window.innerWidth,
        y:  Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r:  Math.random() * 1.5 + 0.5,
    }));

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Connexions
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx   = particles[i].x - particles[j].x;
                const dy   = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < MAX_DISTANCE) {
                    const alpha = (1 - dist / MAX_DISTANCE) * 0.25;
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(200,169,110,${alpha})`;
                    ctx.lineWidth   = 0.5;
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
        }

        // Points
        particles.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(200,169,110,0.5)';
            ctx.fill();

            // Déplacement + rebond
            p.x += p.vx;
            p.y += p.vy;
            if (p.x < 0 || p.x > canvas.width)  p.vx *= -1;
            if (p.y < 0 || p.y > canvas.height)  p.vy *= -1;
        });

        requestAnimationFrame(draw);
    }
    draw();
})();

/* ── 5. TYPEWRITER (avec accord grammatical de l'article) ── */
(function initTypewriter() {
    const el      = document.getElementById('typewriter');
    const article = document.getElementById('typewriter-article');
    if (!el) return;

    /*
     * Chaque entrée porte son article :
     *  - "le" devant masculin commençant par consonne
     *  - "la" devant féminin commençant par consonne
     *  - "l'"devant voyelle (article élidé, collé au mot)
     * L'article est mis à jour instantanément au moment
     * du changement de mot, avant que le nouveau mot commence.
     */
    const entries = [
        { article: 'le',  word: 'Design Premium' },
        { article: "l'",  word: 'Excellent' },
        { article: 'la',  word: 'Conversion' },
        { article: 'la',  word: 'Performance' },
        { article: "l'",  word: 'Excellence' },
    ];

    let wi = 0, ci = 0, deleting = false;

    function setArticle(a) {
        if (!article) return;
        article.textContent = a;
    }

    function tick() {
        const { word } = entries[wi];
        el.textContent = deleting ? word.slice(0, ci--) : word.slice(0, ci++);

        let delay = deleting ? 42 : 82;

        if (!deleting && ci > word.length) {
            /* Pause en fin de mot */
            delay = 1900;
            deleting = true;
        } else if (deleting && ci < 0) {
            /* Mot effacé → passer au suivant */
            deleting = false;
            wi = (wi + 1) % entries.length;
            ci = 0;
            /* Met à jour l'article AVANT que le nouveau mot s'écrive */
            setArticle(entries[wi].article);
            delay = 280;
        }
        setTimeout(tick, delay);
    }

    /* Initialiser l'article du premier mot */
    setArticle(entries[0].article);
    tick();
})();

/* ── 6. SCROLL REVEAL (IntersectionObserver) ───────────── */
(function initReveal() {
    const targets = document.querySelectorAll('.reveal, .reveal-up, .reveal-left, .reveal-right');
    if (!targets.length) return;

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    targets.forEach(t => observer.observe(t));
})();

/* ── 7. TILT 3D SUR LES CARTES ─────────────────────────── */
(function initTilt() {
    // Désactivé sur mobile (pas de hover)
    if (window.matchMedia('(max-width: 768px)').matches) return;

    document.querySelectorAll('.tilt-card').forEach(card => {
        card.addEventListener('mousemove', e => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const cx = rect.width  / 2;
            const cy = rect.height / 2;
            const rx = ((y - cy) / cy) * -6;   // rotation X max ±6°
            const ry = ((x - cx) / cx) *  6;   // rotation Y max ±6°
            card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) scale(1.02)`;
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
        });
    });
})();

/* ── 8. COMPTEURS ANIMÉS ────────────────────────────────── */
(function initCounters() {
    const counters = document.querySelectorAll('.counter');
    if (!counters.length) return;

    const easeOutExpo = t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const el     = entry.target;
            const target = parseInt(el.dataset.target, 10);
            const dur    = 1400; // ms
            const start  = performance.now();

            function step(now) {
                const elapsed = now - start;
                const progress = Math.min(elapsed / dur, 1);
                el.textContent = Math.round(easeOutExpo(progress) * target);
                if (progress < 1) requestAnimationFrame(step);
                else el.textContent = target;
            }
            requestAnimationFrame(step);
            observer.unobserve(el);
        });
    }, { threshold: 0.5 });

    counters.forEach(c => observer.observe(c));
})();

/* ── 9. BURGER / MENU MOBILE ────────────────────────────── */
(function initBurger() {
    const burger  = document.getElementById('burger');
    const overlay = document.getElementById('mobile-overlay');
    if (!burger || !overlay) return;

    function toggleMenu(open) {
        burger.classList.toggle('open', open);
        burger.setAttribute('aria-expanded', String(open));
        overlay.classList.toggle('open', open);
        overlay.setAttribute('aria-hidden', String(!open));
        document.body.style.overflow = open ? 'hidden' : '';
    }

    burger.addEventListener('click', () => toggleMenu(!burger.classList.contains('open')));

    // Fermer au clic sur un lien
    overlay.querySelectorAll('[data-close]').forEach(link => {
        link.addEventListener('click', () => toggleMenu(false));
    });
})();

/* ── 10. FORM — feedback visuel ─────────────────────────── */
(function initForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;

    form.addEventListener('submit', e => {
        e.preventDefault();
        const btn  = form.querySelector('button[type="submit"]');
        const text = btn.querySelector('.btn-text');
        text.textContent = 'Message envoyé ✓';
        btn.style.background = '#1a1a1a';
        btn.disabled = true;
        setTimeout(() => {
            text.textContent = 'Envoyer le message';
            btn.style.background = '';
            btn.disabled = false;
            form.reset();
        }, 3000);
    });
})();