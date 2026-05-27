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