/* ============================================================
   app.js - Portfolio Controller (Performance Optimized)
   Smooth section pop-ups, horizontal scroll, glass shard bg
   ============================================================ */

(function() {
  'use strict';

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    initCursor();
    initGlassShards();

    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
      console.warn('GSAP not loaded, revealing all content.');
      document.querySelectorAll('.section-card').forEach(c => {
        c.style.opacity = '1';
        c.style.transform = 'none';
      });
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    initPreciseNav();
    initPopUpTransitions();
    initHorizontalProjects();
    initSmoothAnchorScroll();
  }

  /* ----------------------------------------------------------
     1. PRECISE NAVIGATION INDICATOR
     Uses ScrollTrigger for exact section tracking
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
        start: 'top 50%',
        end: 'bottom 50%',
        onToggle: (self) => {
          if (self.isActive) {
            navLinks.forEach((link) => {
              link.classList.toggle('active',
                link.getAttribute('data-section') === sectionId
              );
            });
          }
        }
      });
    });
  }

  /* ----------------------------------------------------------
     2. POP-UP SECTION TRANSITIONS (no blur - perf optimized)
     Sections scale up + fade in from below. No filter:blur.
     ---------------------------------------------------------- */
  function initPopUpTransitions() {
    if (window.innerWidth <= 1024) return;

    const cards = gsap.utils.toArray('.section-card');

    cards.forEach((card, index) => {
      if (index === 0) return; // Hero is always visible

      gsap.set(card, {
        scale: 0.92,
        opacity: 0,
        y: 80,
      });

      gsap.to(card, {
        scale: 1,
        opacity: 1,
        y: 0,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: card.parentElement,
          start: 'top 80%',
          end: 'top 30%',
          scrub: 0.8,
        }
      });
    });
  }

  /* ----------------------------------------------------------
     3. HORIZONTAL PROJECTS SCROLL
     Pins section, scrolls track sideways.
     Extra end padding so last card is fully readable.
     ---------------------------------------------------------- */
  function initHorizontalProjects() {
    if (window.innerWidth <= 1024) return;

    const section = document.querySelector('.projects-section');
    const track = document.querySelector('.projects-track');
    if (!section || !track) return;

    function getScrollDist() {
      const trackW = track.scrollWidth;
      const vpW = window.innerWidth;
      // Subtract viewport, add generous right padding so last card is fully visible
      return Math.max(0, trackW - vpW + 420);
    }

    const dist = getScrollDist();
    if (dist <= 0) return;

    gsap.to(track, {
      x: -dist,
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: () => `+=${dist + 600}`,
        pin: true,
        scrub: 1,
        invalidateOnRefresh: true,
        anticipatePin: 1,
      }
    });
  }

  /* ----------------------------------------------------------
     4. SMOOTH NAV ANCHOR SCROLL (GitHub Pages safe)
     ---------------------------------------------------------- */
  function initSmoothAnchorScroll() {
    document.querySelectorAll('.header-nav a[href^="#"], .header-brand[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', function(e) {
        const targetId = this.getAttribute('href');
        if (!targetId || targetId === '#') return;

        e.preventDefault();
        const targetEl = document.querySelector(targetId);
        if (!targetEl) return;

        const yPos = targetEl.getBoundingClientRect().top + window.scrollY - 64;
        window.scrollTo({ top: yPos, behavior: 'smooth' });

        // Update active nav link
        document.querySelectorAll('.header-nav .nav-link').forEach(l => l.classList.remove('active'));
        if (this.classList.contains('nav-link')) this.classList.add('active');
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
    let mouseX = -100, mouseY = -100;
    let curX = -100, curY = -100;

    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    }, { passive: true });

    // Smooth lerp cursor (60fps, lighter than CSS transitions)
    function updateCursor() {
      curX += (mouseX - curX) * 0.15;
      curY += (mouseY - curY) * 0.15;
      cursor.style.setProperty('--x', curX + 'px');
      cursor.style.setProperty('--y', curY + 'px');
      requestAnimationFrame(updateCursor);
    }
    updateCursor();

    document.querySelectorAll('[data-cursor-label]').forEach((el) => {
      el.addEventListener('mouseenter', () => {
        if (label) label.textContent = el.getAttribute('data-cursor-label');
        cursor.classList.add('active');
      });
      el.addEventListener('mouseleave', () => cursor.classList.remove('active'));
    });
  }

  /* ----------------------------------------------------------
     6. ANIMATED GLASS SHARDS BACKGROUND
     Lightweight geometric fragments that drift and rotate.
     Replaces heavy blur blobs for better perf.
     ---------------------------------------------------------- */
  function initGlassShards() {
    const container = document.querySelector('.glass-shards');
    if (!container) return;

    const shardCount = 12;
    const colors = [
      'rgba(0, 242, 254, 0.06)',
      'rgba(255, 234, 0, 0.05)',
      'rgba(127, 83, 172, 0.06)',
      'rgba(255, 255, 255, 0.03)',
    ];

    const clips = [
      'polygon(50% 0%, 0% 100%, 100% 100%)',
      'polygon(25% 0%, 100% 0%, 75% 100%, 0% 100%)',
      'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
      'polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)',
      'polygon(0% 15%, 100% 0%, 85% 100%, 0% 85%)',
    ];

    for (let i = 0; i < shardCount; i++) {
      const shard = document.createElement('div');
      shard.className = 'glass-shard';
      const size = 100 + Math.random() * 300;
      const x = Math.random() * 100;
      const y = Math.random() * 100;
      const dur = 20 + Math.random() * 25;
      const delay = -(Math.random() * dur);
      const rot = Math.random() * 360;

      shard.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        left: ${x}%;
        top: ${y}%;
        background: ${colors[i % colors.length]};
        clip-path: ${clips[i % clips.length]};
        border: 1px solid rgba(255,255,255,0.04);
        animation: shard-drift ${dur}s ${delay}s infinite alternate ease-in-out;
        transform: rotate(${rot}deg);
        will-change: transform;
      `;
      container.appendChild(shard);
    }
  }

})();
