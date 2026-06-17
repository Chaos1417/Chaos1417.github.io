/* ============================================================
   app.js — "Thrown" Animations, Particle Physics, ScrollSpy
   Dependencies: GSAP 3.x + ScrollTrigger (CDN)
   ============================================================ */

/* ----------------------------------------------------------
   1. CURSOR GLOW
   ---------------------------------------------------------- */
function initCursorGlow() {
  const glow = document.getElementById('cursor-glow');
  if (!glow || window.matchMedia('(pointer: coarse)').matches) {
    if (glow) glow.style.display = 'none';
    return;
  }
  document.addEventListener('mousemove', (e) => {
    glow.style.setProperty('--glow-x', e.clientX + 'px');
    glow.style.setProperty('--glow-y', e.clientY + 'px');
  }, { passive: true });
}

/* ----------------------------------------------------------
   2. ENHANCED PARTICLE CANVAS
   - Node opacity: 0.4
   - Connection threshold: 150px
   - Mouse repulsion radius: 200px
   ---------------------------------------------------------- */
class ParticleField {
  constructor(id) {
    this.canvas = document.getElementById(id);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.mouse = { x: -9999, y: -9999 };
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.COUNT = 80;
    this.CONNECT = 150;
    this.REPEL_R = 200;
    this.REPEL_F = 14;
    this.BASE_A = 0.4;

    this._resize();
    this._seed();
    this._bind();
    this._loop();
  }

  _resize() {
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    this.canvas.width = this.w * this.dpr;
    this.canvas.height = this.h * this.dpr;
    this.canvas.style.width = this.w + 'px';
    this.canvas.style.height = this.h + 'px';
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  _seed() {
    this.particles = [];
    for (let i = 0; i < this.COUNT; i++) {
      this.particles.push({
        x: Math.random() * this.w,
        y: Math.random() * this.h,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 2 + 0.8,
        a: this.BASE_A * (Math.random() * 0.5 + 0.5),
      });
    }
  }

  _bind() {
    let rt;
    window.addEventListener('resize', () => {
      clearTimeout(rt);
      rt = setTimeout(() => {
        this._resize();
        this.particles.forEach(p => {
          if (p.x > this.w) p.x = Math.random() * this.w;
          if (p.y > this.h) p.y = Math.random() * this.h;
        });
      }, 200);
    }, { passive: true });

    document.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    }, { passive: true });

    document.addEventListener('mouseleave', () => {
      this.mouse.x = -9999;
      this.mouse.y = -9999;
    }, { passive: true });
  }

  _loop() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.w, this.h);
    const ps = this.particles;
    const len = ps.length;

    for (let i = 0; i < len; i++) {
      const p = ps[i];
      const dx = p.x - this.mouse.x;
      const dy = p.y - this.mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < this.REPEL_R && dist > 0) {
        const force = (this.REPEL_R - dist) / this.REPEL_R;
        const angle = Math.atan2(dy, dx);
        p.vx += Math.cos(angle) * force * force * this.REPEL_F * 0.025;
        p.vy += Math.sin(angle) * force * force * this.REPEL_F * 0.025;
      }
      p.vx *= 0.97;
      p.vy *= 0.97;
      const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      if (speed > 2.5) { p.vx = (p.vx / speed) * 2.5; p.vy = (p.vy / speed) * 2.5; }
      if (speed < 0.06) { p.vx += (Math.random() - 0.5) * 0.03; p.vy += (Math.random() - 0.5) * 0.03; }
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < -10) p.x = this.w + 10;
      if (p.x > this.w + 10) p.x = -10;
      if (p.y < -10) p.y = this.h + 10;
      if (p.y > this.h + 10) p.y = -10;
    }

    for (let i = 0; i < len; i++) {
      for (let j = i + 1; j < len; j++) {
        const a = ps[i], b = ps[j];
        const ddx = a.x - b.x, ddy = a.y - b.y;
        const d = Math.sqrt(ddx * ddx + ddy * ddy);
        if (d < this.CONNECT) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(0,255,204,${(1 - d / this.CONNECT) * 0.18})`;
          ctx.lineWidth = 0.6;
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    for (let i = 0; i < len; i++) {
      const p = ps[i];
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0,255,204,${p.a})`;
      ctx.fill();
    }

    requestAnimationFrame(() => this._loop());
  }
}

/* ----------------------------------------------------------
   3. GSAP "THROWN" ANIMATIONS
   Elements enter as if tossed into place with a bounce.
   y:80 -> y:0, back.out(1.7) ease
   ---------------------------------------------------------- */
function initThrownAnimations() {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
  gsap.registerPlugin(ScrollTrigger);

  document.querySelectorAll('.thrown').forEach((el) => {
    gsap.fromTo(el,
      { y: 80, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.8,
        ease: 'back.out(1.7)',
        scrollTrigger: {
          trigger: el,
          start: 'top 90%',
          toggleActions: 'play none none none',
        },
      }
    );
  });

  /* About paragraphs staggered */
  const about = document.querySelectorAll('.body-text');
  if (about.length) {
    gsap.fromTo(about,
      { y: 60, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.7,
        stagger: 0.15,
        ease: 'back.out(1.7)',
        scrollTrigger: {
          trigger: about[0],
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
      }
    );
  }
}

/* ----------------------------------------------------------
   4. SIDEBAR ENTRANCE
   ---------------------------------------------------------- */
function initSidebarAnim() {
  if (typeof gsap === 'undefined') return;
  const items = [
    ['.sidebar-name',    { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, delay: 0.1 }],
    ['.sidebar-role',    { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, delay: 0.2 }],
    ['.sidebar-bio',     { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, delay: 0.3 }],
    ['.sidebar-nav',     { y: 15, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, delay: 0.4 }],
    ['.sidebar-socials', { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, delay: 0.5 }],
  ];
  items.forEach(([s, f, t]) => gsap.fromTo(s, f, { ...t, ease: 'back.out(1.7)' }));
}

/* ----------------------------------------------------------
   5. SCROLLSPY
   ---------------------------------------------------------- */
function initScrollSpy() {
  const links = document.querySelectorAll('.sidebar-nav-link');
  const sections = document.querySelectorAll(
    '#s-about, #s-experience, #s-education, #s-projects, #s-certs, #s-skills, #s-interests'
  );
  if (!links.length || !sections.length) return;

  const obs = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        links.forEach((l) => {
          l.classList.toggle('active', l.getAttribute('data-section') === e.target.id);
        });
      }
    });
  }, { threshold: 0.15, rootMargin: '-8% 0px -55% 0px' });

  sections.forEach((s) => obs.observe(s));

  links.forEach((l) => {
    l.addEventListener('click', (e) => {
      e.preventDefault();
      const t = document.querySelector(l.getAttribute('href'));
      if (t) t.scrollIntoView({ behavior: 'smooth' });
    });
  });
}

/* ----------------------------------------------------------
   6. MOBILE MENU
   ---------------------------------------------------------- */
function initMobileMenu() {
  const btn = document.getElementById('hamburger-toggle');
  const menu = document.getElementById('mobile-menu-panel');
  if (!btn || !menu) return;

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    btn.classList.toggle('active');
    menu.classList.toggle('active');
  });

  menu.querySelectorAll('.mobile-nav-link').forEach((l) => {
    l.addEventListener('click', () => { btn.classList.remove('active'); menu.classList.remove('active'); });
  });

  document.addEventListener('click', (e) => {
    if (menu.classList.contains('active') && !menu.contains(e.target) && !btn.contains(e.target)) {
      btn.classList.remove('active'); menu.classList.remove('active');
    }
  });
}

/* ----------------------------------------------------------
   7. INIT
   ---------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  initCursorGlow();
  new ParticleField('particle-canvas');
  initSidebarAnim();
  initThrownAnimations();
  initScrollSpy();
  initMobileMenu();
});
