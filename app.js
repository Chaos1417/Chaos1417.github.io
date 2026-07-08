/* ============================================================
   app.js — Interactive Controller
   Pop-up Section Transitions, Horizontal Scroll, Precise Nav
   ============================================================ */

(function() {
  'use strict';

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    initCursor();
    initParticles();

    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
      console.warn('GSAP not loaded.');
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    initPreciseNav();
    initPopUpTransitions();
    initHorizontalProjects();
    initSmoothAnchorScroll();
  }

  /* ----------------------------------------------------------
     1. PRECISE TOP NAVIGATION INDICATOR
     Monitors section positions with 100% precision
     ---------------------------------------------------------- */
  function initPreciseNav() {
    const navLinks = document.querySelectorAll('.header-nav .nav-link');
    const sections = gsap.utils.toArray('.page-section');

    if (!navLinks.length || !sections.length) return;

    sections.forEach((section) => {
      const sectionId = section.getAttribute('id');
      if (!sectionId) return;

      ScrollTrigger.create({
        trigger: section,
        start: 'top 55%',
        end: 'bottom 55%',
        onToggle: (self) => {
          if (self.isActive) {
            navLinks.forEach((link) => {
              const isMatch = link.getAttribute('data-section') === sectionId;
              link.classList.toggle('active', isMatch);
            });
          }
        }
      });
    });
  }

  /* ----------------------------------------------------------
     2. POP-UP FROM BENEATH SECTION TRANSITIONS
     Sections pop up and expand as you scroll into them
     ---------------------------------------------------------- */
  function initPopUpTransitions() {
    if (window.innerWidth <= 1024) return; // Normal scroll on mobile

    const cards = gsap.utils.toArray('.section-card');

    cards.forEach((card, index) => {
      if (index === 0) return; // Skip Hero card initial state

      // Initial state: scaled down, slightly translated down, faded
      gsap.set(card, {
        scale: 0.88,
        opacity: 0.3,
        y: 100,
        filter: 'blur(8px)'
      });

      // Animate to full presence as viewport scrolls to it
      gsap.to(card, {
        scale: 1,
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: card.parentElement,
          start: 'top 85%',
          end: 'top 25%',
          scrub: 1.2,
        }
      });
    });
  }

  /* ----------------------------------------------------------
     3. SILKY HORIZONTAL PROJECTS SHOWCASE
     ---------------------------------------------------------- */
  function initHorizontalProjects() {
    if (window.innerWidth <= 1024) return;

    const section = document.querySelector('.projects-section');
    const viewport = document.querySelector('.projects-viewport');
    const track = document.querySelector('.projects-track');

    if (!section || !viewport || !track) return;

    function getScrollAmount() {
      const trackWidth = track.scrollWidth;
      const viewportWidth = window.innerWidth;
      const headerWidth = 320 + 64; // Header width + margin
      return Math.max(0, trackWidth - (viewportWidth - headerWidth - 100));
    }

    const scrollDistance = getScrollAmount();
    if (scrollDistance <= 0) return;

    gsap.to(track, {
      x: -scrollDistance,
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: () => `+=${scrollDistance + 400}`,
        pin: true,
        scrub: 1.2,
        invalidateOnRefresh: true,
        anticipatePin: 1
      }
    });
  }

  /* ----------------------------------------------------------
     4. SMOOTH ANCHOR SCROLLING
     ---------------------------------------------------------- */
  function initSmoothAnchorScroll() {
    document.querySelectorAll('.header-nav a, .site-header a').forEach((anchor) => {
      anchor.addEventListener('click', function(e) {
        const targetId = this.getAttribute('href');
        if (!targetId || !targetId.startsWith('#')) return;
        
        e.preventDefault();
        const targetEl = document.querySelector(targetId);
        if (!targetEl) return;

        // Use GSAP to scroll smoothly
        const yPos = targetEl.getBoundingClientRect().top + window.scrollY - 60;
        gsap.to(window, {
          scrollTo: { y: yPos, autoKill: false },
          duration: 1,
          ease: 'power3.inOut',
          onComplete: () => {
            // Update active link immediately
            document.querySelectorAll('.header-nav .nav-link').forEach(l => l.classList.remove('active'));
            if (this.classList.contains('nav-link')) this.classList.add('active');
          }
        });
        
        // Fallback if GSAP ScrollToPlugin is missing
        if (!gsap.plugins.scrollTo) {
          window.scrollTo({ top: yPos, behavior: 'smooth' });
        }
      });
    });
  }

  /* ----------------------------------------------------------
     5. CUSTOM CURSOR
     ---------------------------------------------------------- */
  function initCursor() {
    const cursor = document.getElementById('custom-cursor');
    if (!cursor || window.matchMedia('(pointer: coarse)').matches) return;

    const label = cursor.querySelector('.cursor-label');

    document.addEventListener('mousemove', (e) => {
      cursor.style.setProperty('--x', e.clientX + 'px');
      cursor.style.setProperty('--y', e.clientY + 'px');
    }, { passive: true });

    document.querySelectorAll('[data-cursor-label]').forEach((el) => {
      el.addEventListener('mouseenter', () => {
        if (label) label.textContent = el.getAttribute('data-cursor-label');
        cursor.classList.add('active');
      });
      el.addEventListener('mouseleave', () => cursor.classList.remove('active'));
    });
  }

  /* ----------------------------------------------------------
     6. AMBIENT PARTICLE NETWORK
     ---------------------------------------------------------- */
  function initParticles() {
    const canvas = document.getElementById('particle-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w, h;
    const mouse = { x: -9999, y: -9999 };
    const count = window.innerWidth < 1024 ? 20 : 40;
    const connectDist = 140;
    let particles = [];

    function resize() {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function seed() {
      particles = [];
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.25,
          vy: (Math.random() - 0.5) * 0.25,
          r: Math.random() * 1.5 + 0.5,
          a: 0.15 + Math.random() * 0.2,
        });
      }
    }

    resize();
    seed();

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => { resize(); seed(); ScrollTrigger.refresh(); }, 250);
    }, { passive: true });

    document.addEventListener('mousemove', (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    }, { passive: true });

    function loop() {
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 160 && d > 0) {
          const f = (160 - d) / 160;
          p.vx += (dx / d) * f * 0.15;
          p.vy += (dy / d) * f * 0.15;
        }
        p.vx *= 0.96;
        p.vy *= 0.96;
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -5) p.x = w + 5;
        if (p.x > w + 5) p.x = -5;
        if (p.y < -5) p.y = h + 5;
        if (p.y > h + 5) p.y = -5;
      }

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i], b = particles[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < connectDist) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(0, 242, 254, ${(1 - dist / connectDist) * 0.08})`;
            ctx.lineWidth = 0.6;
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(127, 83, 172, ${p.a})`;
        ctx.fill();
      }

      requestAnimationFrame(loop);
    }
    loop();
  }

})();
