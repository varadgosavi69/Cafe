/* ============================================================
   KARMA CAFÉ — CORE JS  (Fixed & Enhanced)
   GSAP + ScrollTrigger + Barba.js + Three.js
   ============================================================ */

// ── GSAP Plugin Registration ─────────────────────────────────
gsap.registerPlugin(ScrollTrigger);

// ── Utilities ────────────────────────────────────────────────
const qs       = (sel, ctx = document) => ctx.querySelector(sel);
const qsa      = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const isMobile = () => window.innerWidth < 768;

// ── Make all .reveal elements visible by default (CSS fallback) ──
// They animate in when JS runs; if JS fails they're still visible.
function showAllReveal(container = document) {
  qsa('.reveal, .reveal-left, .reveal-right, .reveal-scale', container).forEach(el => {
    // Don't override GSAP if already handled
    if (!el.dataset.revealed) {
      el.style.transition = 'opacity 0.01s, transform 0.01s';
    }
  });
}

// ── Custom Cursor ─────────────────────────────────────────────
// FIX: Only hide native cursor AFTER first mousemove.
// FIX: Removed mix-blend-mode:difference that made dot invisible.
// FIX: Cursor starts off-screen so it's never stuck at 0,0.
function initCursor() {
  if (isMobile()) return;

  const cursor = qs('#cursor');
  const ring   = qs('#cursor-ring');
  if (!cursor || !ring) return;

  // Start both off-screen
  gsap.set([cursor, ring], { x: -200, y: -200 });

  let mouseX = -200, mouseY = -200;
  let ringX  = -200, ringY  = -200;
  let hasMoved = false;
  let rafId;

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    // Only hide native cursor after first move so nothing breaks
    if (!hasMoved) {
      hasMoved = true;
      document.body.style.cursor = 'none';
      gsap.set([cursor, ring], { opacity: 1 });
    }

    // Snap inner dot immediately
    gsap.set(cursor, { x: mouseX, y: mouseY });
  });

  // Prevent cursor vanishing when leaving window
  document.addEventListener('mouseleave', () => {
    gsap.to([cursor, ring], { opacity: 0, duration: 0.3 });
  });
  document.addEventListener('mouseenter', () => {
    if (hasMoved) gsap.to([cursor, ring], { opacity: 1, duration: 0.3 });
  });

  // Smooth lagging ring
  function tickRing() {
    ringX += (mouseX - ringX) * 0.1;
    ringY += (mouseY - ringY) * 0.1;
    gsap.set(ring, { x: ringX, y: ringY });
    rafId = requestAnimationFrame(tickRing);
  }
  tickRing();

  // Hover effect on interactive elements
  document.addEventListener('mouseover', (e) => {
    const el = e.target;
    if (el.matches('a, button, .menu-card, .gallery-item, .menu-item-card, .filter-btn, [data-cursor]')) {
      gsap.to(cursor, { scale: 3, duration: 0.3, ease: 'power2.out', backgroundColor: 'var(--col-caramel)' });
      gsap.to(ring, { scale: 1.5, borderColor: 'rgba(212,168,83,0.9)', duration: 0.3 });
    }
  });

  document.addEventListener('mouseout', (e) => {
    const el = e.target;
    if (el.matches('a, button, .menu-card, .gallery-item, .menu-item-card, .filter-btn, [data-cursor]')) {
      gsap.to(cursor, { scale: 1, duration: 0.3, ease: 'power2.out', backgroundColor: 'var(--col-gold)' });
      gsap.to(ring, { scale: 1, borderColor: 'rgba(212,168,83,0.5)', duration: 0.3 });
    }
  });

  // Click burst
  document.addEventListener('click', () => {
    gsap.timeline()
      .to(cursor, { scale: 0.6, duration: 0.1 })
      .to(cursor, { scale: 1, duration: 0.3, ease: 'elastic.out(1, 0.5)' });
  });

  return () => cancelAnimationFrame(rafId);
}

// ── Navbar ────────────────────────────────────────────────────
function initNavbar() {
  const nav  = qs('#navbar');
  const ham  = qs('.hamburger');
  const mob  = qs('.mobile-menu');
  if (!nav) return;

  let lastY    = 0;
  let ticking  = false;

  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      if (y > lastY + 8 && y > 120) {
        nav.classList.add('hidden');
      } else if (y < lastY - 4) {
        nav.classList.remove('hidden');
      }
      nav.classList.toggle('scrolled', y > 60);
      lastY   = y;
      ticking = false;
    });
  });

  // Highlight current page link
  const page = window.location.pathname.split('/').pop() || 'index.html';
  qsa('.nav-links a').forEach(a => {
    const href = a.getAttribute('href') || '';
    a.classList.toggle('active', href === page || (page === '' && href === 'index.html'));
  });

  // Mobile hamburger
  if (ham && mob) {
    ham.addEventListener('click', () => {
      const isOpen = ham.classList.toggle('open');
      ham.setAttribute('aria-expanded', isOpen);
      mob.classList.toggle('open', isOpen);
      if (isOpen) {
        gsap.from(qsa('a', mob), {
          y: 30, opacity: 0, stagger: 0.08, duration: 0.5, ease: 'power3.out',
        });
      }
    });
    qsa('a', mob).forEach(a => {
      a.addEventListener('click', () => {
        ham.classList.remove('open');
        ham.setAttribute('aria-expanded', 'false');
        mob.classList.remove('open');
      });
    });
  }
}

// ── Scroll Reveal ─────────────────────────────────────────────
function initScrollReveal(container = document) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Always make elements visible first (progressive enhancement)
  const allReveal = qsa('.reveal, .reveal-left, .reveal-right, .reveal-scale', container);

  if (reduced) {
    allReveal.forEach(el => gsap.set(el, { opacity: 1, x: 0, y: 0, scale: 1 }));
    return;
  }

  // Reset to initial hidden state for animation
  gsap.set(qsa('.reveal', container),       { opacity: 0, y: 50 });
  gsap.set(qsa('.reveal-left', container),  { opacity: 0, x: -60 });
  gsap.set(qsa('.reveal-right', container), { opacity: 0, x: 60 });
  gsap.set(qsa('.reveal-scale', container), { opacity: 0, scale: 0.9 });

  qsa('.reveal', container).forEach((el, i) => {
    gsap.to(el, {
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      opacity: 1, y: 0,
      duration: 0.85,
      delay: (i % 4) * 0.05,
      ease: 'power3.out',
    });
  });

  qsa('.reveal-left', container).forEach(el => {
    gsap.to(el, {
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      opacity: 1, x: 0,
      duration: 1.0, ease: 'power3.out',
    });
  });

  qsa('.reveal-right', container).forEach(el => {
    gsap.to(el, {
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      opacity: 1, x: 0,
      duration: 1.0, ease: 'power3.out',
    });
  });

  qsa('.reveal-scale', container).forEach(el => {
    gsap.to(el, {
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      opacity: 1, scale: 1,
      duration: 0.9, ease: 'back.out(1.6)',
    });
  });

  // Stagger groups
  qsa('[data-stagger]', container).forEach(group => {
    const kids = qsa('[data-stagger-child]', group);
    if (!kids.length) return;
    gsap.set(kids, { opacity: 0, y: 35 });
    gsap.to(kids, {
      scrollTrigger: { trigger: group, start: 'top 85%', once: true },
      opacity: 1, y: 0,
      stagger: 0.12,
      duration: 0.8,
      ease: 'power3.out',
    });
  });
}

// ── Parallax ─────────────────────────────────────────────────
function initParallax(container = document) {
  if (isMobile()) return;
  qsa('.parallax-layer', container).forEach(el => {
    const speed = parseFloat(el.dataset.speed || '0.3');
    gsap.to(el, {
      scrollTrigger: {
        trigger: el.closest('section') || el.parentElement,
        scrub: 1.5,
        start: 'top bottom',
        end: 'bottom top',
      },
      y: speed * -180,
      ease: 'none',
    });
  });
}

// ── Number Counters ───────────────────────────────────────────
function initCounters(container = document) {
  qsa('[data-count]', container).forEach(el => {
    const end = parseInt(el.dataset.count);
    ScrollTrigger.create({
      trigger: el, start: 'top 88%', once: true,
      onEnter: () => {
        const obj = { n: 0 };
        gsap.to(obj, {
          n: end, duration: 1.8, ease: 'power2.out',
          onUpdate() { el.textContent = Math.round(obj.n).toLocaleString(); },
        });
      },
    });
  });
}

// ── Marquee ───────────────────────────────────────────────────
function initMarquee() {
  const strip = qs('.marquee-strip');
  const track = qs('.marquee-track');
  if (!strip || !track) return;
  strip.addEventListener('mouseenter', () => track.style.animationPlayState = 'paused');
  strip.addEventListener('mouseleave', () => track.style.animationPlayState = 'running');
}

// ── Three.js Hero ─────────────────────────────────────────────
function initThreeHero() {
  const canvas = qs('#hero-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const W = canvas.clientWidth  || window.innerWidth;
  const H = canvas.clientHeight || window.innerHeight;

  const scene    = new THREE.Scene();
  const camera   = new THREE.PerspectiveCamera(52, W / H, 0.1, 100);
  camera.position.set(0, 0.2, 6);

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setSize(W, H);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile() ? 1.5 : 2));
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;

  // Lights
  scene.add(new THREE.AmbientLight(0xffe0b2, 0.5));

  const key = new THREE.PointLight(0xd4a853, 4, 20);
  key.position.set(4, 4, 5);
  scene.add(key);

  const fill = new THREE.PointLight(0xc8956a, 2.5, 14);
  fill.position.set(-3, -1, 3);
  scene.add(fill);

  const rim = new THREE.PointLight(0xffd6a0, 1.5, 10);
  rim.position.set(0, -5, 2);
  scene.add(rim);

  // Materials
  const matCup = new THREE.MeshPhysicalMaterial({
    color: 0x1a0d06, metalness: 0.25, roughness: 0.45,
    clearcoat: 0.9, clearcoatRoughness: 0.08,
  });
  const matGold = new THREE.MeshPhysicalMaterial({
    color: 0xd4a853, metalness: 0.9, roughness: 0.1,
    clearcoat: 1, clearcoatRoughness: 0.04,
  });
  const matDark = new THREE.MeshPhysicalMaterial({
    color: 0x18100a, metalness: 0.2, roughness: 0.55, clearcoat: 0.4,
  });
  const matCoffee = new THREE.MeshPhysicalMaterial({
    color: 0x1e0a04, metalness: 0, roughness: 0.8, transparent: true, opacity: 0.95,
  });

  // ── Cup body ──────────────────────────────────────────────────
  const group = new THREE.Group();
  scene.add(group);

  // Lathe cup
  const pts = [
    [0.50, -1.00], [0.53, -0.80], [0.57, -0.40],
    [0.62, 0.10],  [0.70, 0.60],  [0.78, 0.90], [0.82, 1.05],
  ].map(([x, y]) => new THREE.Vector2(x, y));

  const cupMesh = new THREE.Mesh(new THREE.LatheGeometry(pts, 56), matCup);
  cupMesh.position.y = 0.1;
  group.add(cupMesh);

  // Rim
  group.add(Object.assign(
    new THREE.Mesh(new THREE.TorusGeometry(0.82, 0.032, 14, 64), matGold),
    { position: new THREE.Vector3(0, 1.14, 0) }
  ));

  // Coffee surface
  const coffeeMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.76, 0.76, 0.05, 56), matCoffee);
  coffeeMesh.position.y = 1.07;
  group.add(coffeeMesh);

  // Latte art rings
  for (let i = 0; i < 3; i++) {
    const ring2 = new THREE.Mesh(
      new THREE.TorusGeometry(0.28 - i * 0.08, 0.015, 6, 48),
      matGold
    );
    ring2.position.y    = 1.09;
    ring2.rotation.x    = Math.PI / 2;
    ring2.position.x    = Math.cos((i / 3) * Math.PI * 2) * 0.3;
    ring2.position.z    = Math.sin((i / 3) * Math.PI * 2) * 0.3;
    ring2.scale.setScalar(0.5 - i * 0.08);
    group.add(ring2);
  }

  // Handle (tube)
  const hCurve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(0.82, 0.65, 0),
    new THREE.Vector3(1.48, 0.28, 0),
    new THREE.Vector3(0.82, -0.10, 0)
  );
  group.add(new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(hCurve.getPoints(44)), 44, 0.048, 12, false),
    matGold
  ));

  // Saucer
  const sPts = [
    [0.00, -0.09], [0.55, -0.07], [1.18, -0.04], [1.38, 0.00],
    [1.42, 0.05],  [1.30, 0.08],  [0.52,  0.06], [0.00,  0.07],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const saucerMesh = new THREE.Mesh(new THREE.LatheGeometry(sPts, 56), matDark);
  saucerMesh.position.y = -1.12;
  group.add(saucerMesh);

  // Saucer rim ring
  const sRim = new THREE.Mesh(new THREE.TorusGeometry(1.38, 0.018, 8, 60), matGold);
  sRim.position.y = -1.08;
  group.add(sRim);

  // ── Floating coffee beans ──────────────────────────────────
  const beanGroup = new THREE.Group();
  scene.add(beanGroup);
  const beanMat = new THREE.MeshPhysicalMaterial({
    color: 0x2d1308, metalness: 0.05, roughness: 0.7, clearcoat: 0.35,
  });
  const beans = [];
  const BEANS = isMobile() ? 8 : 18;
  for (let i = 0; i < BEANS; i++) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 9), beanMat);
    const r = 2.8 + Math.random() * 2.2;
    const θ = Math.random() * Math.PI * 2;
    const φ = (Math.random() - 0.5) * 1.6;
    b.position.set(r * Math.cos(θ) * Math.cos(φ), r * Math.sin(φ), r * Math.sin(θ) * Math.cos(φ) - 0.5);
    b.scale.set(0.65, 1, 1.35);
    b.userData = {
      fy: 0.003 + Math.random() * 0.005, fa: 0.18 + Math.random() * 0.28,
      rz: 0.006 + Math.random() * 0.009, off: Math.random() * Math.PI * 2,
      iy: b.position.y,
    };
    beanGroup.add(b);
    beans.push(b);
  }

  // ── Particles ───────────────────────────────────────────────
  const PC = isMobile() ? 80 : 220;
  const pa = new Float32Array(PC * 3);
  for (let i = 0; i < PC; i++) {
    pa[i * 3]     = (Math.random() - 0.5) * 14;
    pa[i * 3 + 1] = (Math.random() - 0.5) * 12;
    pa[i * 3 + 2] = (Math.random() - 0.5) * 9 - 2;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pa, 3));
  const particles = new THREE.Points(pGeo, new THREE.PointsMaterial({
    color: 0xd4a853, size: 0.022, transparent: true, opacity: 0.4, sizeAttenuation: true,
  }));
  scene.add(particles);

  // ── Steam wisps ──────────────────────────────────────────────
  const steamGrp = new THREE.Group();
  steamGrp.position.y = 1.15;
  group.add(steamGrp);
  const wisps = [];
  for (let i = 0; i < 10; i++) {
    const wm = new THREE.MeshBasicMaterial({ color: 0xc8956a, transparent: true, opacity: 0 });
    const w  = new THREE.Mesh(new THREE.SphereGeometry(0.04 + Math.random() * 0.04, 6, 6), wm);
    w.position.set((Math.random() - 0.5) * 0.35, Math.random() * 0.7, (Math.random() - 0.5) * 0.35);
    w.userData = { iy: w.position.y, sp: 0.003 + Math.random() * 0.005, mo: 0.1 + Math.random() * 0.12, off: Math.random() * Math.PI * 2 };
    steamGrp.add(w);
    wisps.push(w);
  }

  // ── Intro pop ────────────────────────────────────────────────
  group.scale.setScalar(0);
  group.rotation.set(0.06, -0.35, 0);
  gsap.to(group.scale, { x: 1, y: 1, z: 1, duration: 1.8, ease: 'elastic.out(1, 0.6)', delay: 0.4 });

  // ── Mouse tilt ───────────────────────────────────────────────
  let tRX = 0.06, tRY = -0.35, cRX = 0.06, cRY = -0.35;
  window.addEventListener('mousemove', e => {
    if (isMobile()) return;
    const nx = (e.clientX / window.innerWidth  - 0.5) * 2;
    const ny = (e.clientY / window.innerHeight - 0.5) * 2;
    tRY = -0.35 + nx * 0.45;
    tRX =  0.06 - ny * 0.28;
  });

  // ── Render loop ──────────────────────────────────────────────
  const clock = new THREE.Clock();
  let animId;

  function render() {
    animId = requestAnimationFrame(render);
    const t = clock.getElapsedTime();

    cRX += (tRX - cRX) * 0.038;
    cRY += (tRY - cRY) * 0.038;
    group.rotation.x = cRX;
    group.rotation.y = cRY;
    group.position.y = Math.sin(t * 0.48) * 0.1;

    wisps.forEach(w => {
      const ud = w.userData;
      w.position.y = ud.iy + (t * ud.sp * 24 % 1.2);
      w.material.opacity = Math.max(0, ud.mo * Math.sin(t * ud.sp * 55 + ud.off));
      w.position.x += Math.sin(t * 0.9 + ud.off) * 0.0008;
    });

    beans.forEach(b => {
      const ud = b.userData;
      b.position.y = ud.iy + Math.sin(t * ud.fy * 60 + ud.off) * ud.fa;
      b.rotation.z += ud.rz;
      b.rotation.y += ud.rz * 0.5;
    });

    beanGroup.rotation.y = t * 0.055;
    particles.rotation.y = t * 0.012;
    particles.rotation.x = t * 0.007;
    key.intensity = 4 + Math.sin(t * 1.1) * 0.6;

    renderer.render(scene, camera);
  }
  render();

  // Resize
  const onResize = () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  };
  window.addEventListener('resize', onResize);

  return () => {
    cancelAnimationFrame(animId);
    renderer.dispose();
    window.removeEventListener('resize', onResize);
  };
}

// ── Hero Text Animation ───────────────────────────────────────
function initHeroAnimation() {
  if (!qs('#hero')) return;

  // Set initial states
  gsap.set('.hero-title',       { opacity: 1 });
  gsap.set('.hero-eyebrow',     { opacity: 0, y: -20 });
  gsap.set('.hero-sub',         { opacity: 0, y: 24 });
  gsap.set('.hero-actions',     { opacity: 0, y: 24 });
  gsap.set('.hero-scroll-hint', { opacity: 0 });
  gsap.set('.hero-title .word-wrap', { y: '108%' });

  const tl = gsap.timeline({ defaults: { ease: 'power4.out' }, delay: 0.15 });

  // Words cascade
  qsa('.hero-title .word-wrap').forEach((w, i) => {
    tl.to(w, { y: '0%', duration: 1.15 }, i * 0.1);
  });

  tl.to('.hero-eyebrow',     { opacity: 1, y: 0, duration: 0.7 }, 0.1)
    .to('.hero-sub',         { opacity: 1, y: 0, duration: 0.8 }, 0.65)
    .to('.hero-actions',     { opacity: 1, y: 0, duration: 0.7 }, 0.9)
    .to('.hero-scroll-hint', { opacity: 1, duration: 0.8 },       1.4);
}

// ── Section Heading underline animation ───────────────────────
function initHeadingLines(container = document) {
  qsa('.gold-line', container).forEach(line => {
    gsap.set(line, { scaleX: 0, transformOrigin: 'left center' });
    gsap.to(line, {
      scrollTrigger: { trigger: line, start: 'top 88%', once: true },
      scaleX: 1, duration: 0.8, ease: 'power3.out',
    });
  });
}

// ── Menu filter ───────────────────────────────────────────────
function initMenuFilter() {
  const btns  = qsa('.filter-btn');
  const cards = qsa('.menu-item-card');
  if (!btns.length) return;

  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const f = btn.dataset.filter;
      cards.forEach(card => {
        const match = f === 'all' || card.dataset.category === f;
        gsap.to(card, {
          opacity: match ? 1 : 0.2,
          scale:   match ? 1 : 0.93,
          y:       match ? 0  : 8,
          pointerEvents: match ? 'auto' : 'none',
          duration: 0.4, ease: 'power2.inOut',
        });
      });
      // Ripple effect on button
      gsap.timeline()
        .to(btn, { scale: 0.94, duration: 0.1 })
        .to(btn, { scale: 1, duration: 0.35, ease: 'back.out(3)' });
    });
  });
}

// ── Contact form ──────────────────────────────────────────────
function initContactForm() {
  const form = qs('#contact-form');
  const suc  = qs('#form-success');
  if (!form) return;

  // Input focus animation
  qsa('input, textarea, select', form).forEach(inp => {
    const label = inp.previousElementSibling;
    inp.addEventListener('focus',  () => label && gsap.to(label, { color: 'var(--col-gold)', duration: 0.3 }));
    inp.addEventListener('blur',   () => label && gsap.to(label, { color: 'var(--col-text-muted)', duration: 0.3 }));
  });

  form.addEventListener('submit', e => {
    e.preventDefault();
    const btn = form.querySelector('[type="submit"]');

    // Button loading animation
    gsap.timeline()
      .to(btn, { scale: 0.96, duration: 0.1 })
      .to(btn, { scale: 1, duration: 0.3, ease: 'back.out(2)' });

    btn.textContent = 'Sending ✦';
    btn.disabled = true;

    setTimeout(() => {
      gsap.to(form, {
        opacity: 0, y: -24, duration: 0.5, ease: 'power2.in',
        onComplete: () => {
          form.style.display = 'none';
          if (suc) {
            suc.classList.add('shown');
            gsap.fromTo(suc, { opacity: 0, y: 24, scale: 0.95 }, { opacity: 1, y: 0, scale: 1, duration: 0.7, ease: 'back.out(1.4)' });
          }
        },
      });
    }, 1400);
  });
}

// ── Gallery lightbox ──────────────────────────────────────────
function initGallery() {
  const items = qsa('.gallery-item');
  const lb    = qs('#lightbox');
  const lbC   = qs('#lightbox-content');
  const lbX   = qs('#lightbox-close');
  if (!items.length || !lb) return;

  items.forEach(item => {
    item.addEventListener('click', () => {
      const emoji   = item.querySelector('.gallery-item-inner')?.textContent?.trim() || '☕';
      const capHtml = item.querySelector('.gallery-caption')?.innerHTML || '';
      if (lbC) lbC.innerHTML = `
        <div style="font-size:clamp(4rem,12vw,8rem);text-align:center;line-height:1;margin-bottom:24px">${emoji}</div>
        <div style="text-align:center;font-family:var(--ff-serif);font-size:clamp(1rem,2.5vw,1.6rem);color:var(--col-cream)">${capHtml}</div>`;
      lb.classList.add('open');
      gsap.fromTo(lbC, { scale: 0.82, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.55, ease: 'back.out(1.6)' });
    });
  });

  const close = () => {
    gsap.to(lb, {
      opacity: 0, duration: 0.3,
      onComplete: () => { lb.classList.remove('open'); gsap.set(lb, { opacity: 1 }); },
    });
  };
  lbX?.addEventListener('click', close);
  lb.addEventListener('click', e => { if (e.target === lb) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && lb.classList.contains('open')) close(); });
}

// ── Card tilt on mouse move ───────────────────────────────────
function initCardTilt(container = document) {
  if (isMobile()) return;
  qsa('.menu-item-card, .value-card, .glass-card', container).forEach(card => {
    card.addEventListener('mousemove', e => {
      const r  = card.getBoundingClientRect();
      const cx = (e.clientX - r.left) / r.width  - 0.5;
      const cy = (e.clientY - r.top)  / r.height - 0.5;
      gsap.to(card, {
        rotateY:  cx * 10,
        rotateX: -cy * 10,
        transformPerspective: 800,
        duration: 0.4, ease: 'power2.out',
      });
    });
    card.addEventListener('mouseleave', () => {
      gsap.to(card, { rotateY: 0, rotateX: 0, duration: 0.5, ease: 'power3.out' });
    });
  });
}

// ── Page init dispatcher ──────────────────────────────────────
function initPage(container = document) {
  ScrollTrigger.refresh();
  initScrollReveal(container);
  initHeadingLines(container);
  initParallax(container);
  initCounters(container);
  initMarquee();
  initMenuFilter();
  initContactForm();
  initGallery();
  initCardTilt(container);

  if (qs('#hero', container)) {
    initHeroAnimation();
    const cleanupThree = initThreeHero();
    window.__threeCleanup = cleanupThree;
  }
}

// ── Barba transitions ─────────────────────────────────────────
function initBarba() {
  if (typeof barba === 'undefined') {
    // No Barba — init page directly
    initPage(document.body);
    return;
  }

  const panels = qsa('.overlay-panel');

  // Clean up Three.js before leaving a page
  barba.hooks.beforeLeave(() => {
    window.__threeCleanup?.();
    window.__threeCleanup = null;
  });

  barba.init({
    preventRunning: true,
    transitions: [{
      name: 'silk-curtain',
      async leave() {
        await gsap.to(panels, {
          scaleY: 1, transformOrigin: 'top',
          duration: 0.5, stagger: 0.07, ease: 'power3.inOut',
        });
      },
      async enter() {
        window.scrollTo(0, 0);
        await gsap.to(panels, {
          scaleY: 0, transformOrigin: 'bottom',
          duration: 0.55, stagger: 0.07, ease: 'power3.inOut', delay: 0.08,
        });
      },
      afterEnter(data) {
        ScrollTrigger.getAll().forEach(t => t.kill());
        initPage(data.next.container);
        initNavbar();
      },
    }],
  });

  // FIX: Barba fires afterEnter on first page load too,
  // so do NOT call initPage again below to avoid double init.
  window.__barbaReady = true;
}

// ── Bootstrap ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Keep body cursor as auto until cursor JS kicks in
  document.body.style.cursor = 'auto';

  initCursor();
  initNavbar();

  // initBarba handles initPage internally:
  // - If no Barba: calls initPage(document.body) directly.
  // - If Barba present: Barba fires afterEnter on first load (no explicit call needed).
  // NOTE: Do NOT call initPage separately here when Barba is active —
  // that would cause double scroll triggers, double Three.js renderers, etc.
  initBarba();
});
