/**
 * Rauf Hassan — Portfolio Controller
 * Premium Studio Identity & Interaction Architecture
 *
 * Set pieces:
 * 1. Orchestrated load sequence (1.5s, skippable)
 * 2. Hero cursor-reactive variable typography (touch fallback + ripple)
 * 3. Project tile-to-detail overlay expansion with FLIP shared element
 *
 * Micro-interactions:
 * - Floating glass nav scroll tracking & active highlight
 * - Real-time scroll progress bar
 * - Magnetic primary button physics on desktop
 * - Contextual custom cursor with plain labels (disabled on touch)
 * - Single-click email copy with instant button text confirmation ("Email copied")
 * - Accessible mobile menu sheet with focus management
 * - Interactive coursework grades accordion
 * - Live skills-to-projects matrix cross-highlighting
 * - Subtle heading clip reveals on scroll
 */

(function () {
  'use strict';

  // State
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasFinePointer = window.matchMedia('(pointer: fine)').matches;
  const isTouchDevice = window.matchMedia('(pointer: coarse)').matches || (!hasFinePointer && (('ontouchstart' in window) || navigator.maxTouchPoints > 0));

  // DOM Elements
  const doc = document.documentElement;
  const body = document.body;
  const navBar = document.querySelector('.nav-bar');
  const navLinks = document.querySelectorAll('.nav-link');
  const navMenuBtn = document.querySelector('.nav-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileMenuLinks = document.querySelectorAll('.mobile-menu-link');
  const scrollProgressBar = document.querySelector('.scroll-progress');
  const cursor = document.querySelector('.cursor');
  const cursorDot = cursor ? cursor.querySelector('.cursor-dot') : null;
  const cursorLabel = cursor ? cursor.querySelector('.cursor-label') : null;
  const heroNameChars = document.querySelectorAll('.hero-name .char');
  const projectTiles = document.querySelectorAll('.project-tile');
  const projectOverlay = document.getElementById('project-overlay');
  const projectOverlayClose = document.querySelector('.project-overlay-close');
  const projectOverlayBg = document.querySelector('.project-overlay-bg');
  const courseworkBtn = document.querySelector('.coursework-btn');
  const courseworkPanel = document.getElementById('coursework-grades');
  const skillTags = document.querySelectorAll('.skill-tag');
  const revealHeadings = document.querySelectorAll('.reveal-heading');
  const emailButtons = document.querySelectorAll('[data-action="copy-email"]');

  // Active trigger element for restoring focus when modal closes
  let lastActiveElement = null;
  let lenis = null;

  /* -------------------------------------------------------------
     1. LOAD SEQUENCE (1.5s max, skippable on interaction)
     ------------------------------------------------------------- */
  function initLoadSequence() {
    body.classList.add('loaded');

    if (prefersReducedMotion || typeof gsap === 'undefined') {
      // Instant reveal
      gsap?.set?.('.hero-content, .hero-availability, .hero-role, .hero-actions', { opacity: 1, y: 0 });
      return;
    }

    let isSkipped = false;
    const skipTimeline = () => {
      if (isSkipped) return;
      isSkipped = true;
      tl.progress(1);
      removeSkipListeners();
    };

    const removeSkipListeners = () => {
      window.removeEventListener('keydown', skipTimeline);
      window.removeEventListener('wheel', skipTimeline);
      window.removeEventListener('touchstart', skipTimeline);
      window.removeEventListener('mousedown', skipTimeline);
    };

    window.addEventListener('keydown', skipTimeline, { once: true });
    window.addEventListener('wheel', skipTimeline, { once: true, passive: true });
    window.addEventListener('touchstart', skipTimeline, { once: true, passive: true });
    window.addEventListener('mousedown', skipTimeline, { once: true });

    // Initial state
    gsap.set('.hero-availability', { opacity: 0, y: -12 });
    gsap.set(heroNameChars, { opacity: 0, y: 35, scale: 0.94 });
    gsap.set('.hero-role', { opacity: 0, y: 20 });
    gsap.set('.hero-actions', { opacity: 0, y: 20 });

    const tl = gsap.timeline({
      defaults: { ease: 'power3.out' },
      onComplete: removeSkipListeners
    });

    tl.to('.hero-availability', { opacity: 1, y: 0, duration: 0.6 })
      .to(heroNameChars, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.8,
        stagger: 0.04,
        ease: 'power4.out'
      }, '-=0.3')
      .to('.hero-role', { opacity: 1, y: 0, duration: 0.6 }, '-=0.4')
      .to('.hero-actions', { opacity: 1, y: 0, duration: 0.6 }, '-=0.4');
  }

  /* -------------------------------------------------------------
     2. HERO CURSOR-REACTIVE VARIABLE TYPOGRAPHY
     Shifts font-variation-settings smoothly on proximity
     ------------------------------------------------------------- */
  function initVariableType() {
    if (!heroNameChars.length || prefersReducedMotion) return;

    // Cache char centers
    let charMetrics = [];

    const measureChars = () => {
      charMetrics = Array.from(heroNameChars).map(char => {
        const rect = char.getBoundingClientRect();
        return {
          el: char,
          cx: rect.left + rect.width / 2,
          cy: rect.top + rect.height / 2
        };
      });
    };

    measureChars();
    window.addEventListener('resize', measureChars, { passive: true });
    window.addEventListener('scroll', measureChars, { passive: true });

    const triggerTouchRipple = (tapX) => {
      charMetrics.forEach(({ el, cx }) => {
        const delay = Math.abs(tapX - cx) * 1.2;
        setTimeout(() => {
          el.style.fontVariationSettings = "'wght' 750, 'wdth' 100";
          setTimeout(() => {
            el.style.fontVariationSettings = "'wght' 400, 'wdth' 85";
          }, 350);
        }, delay);
      });
    };

    if (!isTouchDevice) {
      let mouseX = -9999;
      let mouseY = -9999;
      let isHeroHovered = false;
      const heroSection = document.getElementById('hero');

      heroSection?.addEventListener('mouseenter', () => { isHeroHovered = true; });
      heroSection?.addEventListener('mouseleave', () => {
        isHeroHovered = false;
        // Gracefully reset characters
        charMetrics.forEach(({ el }) => {
          el.style.fontVariationSettings = "'wght' 400, 'wdth' 85";
        });
      });

      window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
      }, { passive: true });

      document.querySelector('.hero-name')?.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'touch') triggerTouchRipple(e.clientX);
      });

      let rafId = null;
      const updateTypo = () => {
        if (isHeroHovered && window.scrollY < window.innerHeight * 1.2) {
          charMetrics.forEach(({ el, cx, cy }) => {
            const dx = mouseX - cx;
            const dy = mouseY - cy;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const radius = 280; // Proximity influence radius in px

            if (dist < radius) {
              const factor = 1 - dist / radius; // 0 (far) to 1 (near)
              // Bricolage Grotesque axes: wght (200..800), wdth (75..100)
              const wght = Math.round(400 + factor * 380); // 400 up to 780
              const wdth = Math.round(85 + factor * 15);   // 85 up to 100
              el.style.fontVariationSettings = `'wght' ${wght}, 'wdth' ${wdth}`;
            } else {
              el.style.fontVariationSettings = "'wght' 400, 'wdth' 85";
            }
          });
        }
        rafId = requestAnimationFrame(updateTypo);
      };
      rafId = requestAnimationFrame(updateTypo);
    } else {
      // Touch device: tap triggers a smooth wave through characters
      const heroName = document.querySelector('.hero-name');
      heroName?.addEventListener('click', (e) => {
        triggerTouchRipple(e.clientX);
      });
    }
  }

  /* -------------------------------------------------------------
     3. PROJECT TILE TO DETAIL EXPANSION (Shared-element overlay)
     ------------------------------------------------------------- */
  function initProjectOverlay() {
    if (!projectOverlay || !projectTiles.length) return;

    const overlayCategory = projectOverlay.querySelector('.project-overlay-category');
    const overlayTitle = projectOverlay.querySelector('.project-overlay-title');
    const overlayOneliner = projectOverlay.querySelector('.project-overlay-oneliner');
    const overlayBuilt = document.getElementById('overlay-built');
    const overlayTech = document.getElementById('overlay-tech');
    const overlayDesc = projectOverlay.querySelector('.project-overlay-desc');
    const overlayLink = projectOverlay.querySelector('.project-overlay-link');
    const overlayIllust = projectOverlay.querySelector('.project-overlay-illust');
    let activeTransition = null;

    function clearProjectTransition() {
      if (!activeTransition) return;
      window.clearTimeout(activeTransition.timeoutId);
      activeTransition.clone.remove();
      activeTransition.source.style.visibility = '';
      activeTransition.overlayIllust.style.opacity = '';
      activeTransition = null;
    }

    function animateProjectTransition(source, sourceRect) {
      if (!source || !sourceRect || !overlayIllust || prefersReducedMotion) return;
      const target = overlayIllust.querySelector('svg');
      if (!target) return;

      const targetRect = target.getBoundingClientRect();
      const clone = source.cloneNode(true);
      clone.classList.add('project-transition-clone');
      clone.setAttribute('aria-hidden', 'true');
      Object.assign(clone.style, {
        left: `${sourceRect.left}px`,
        top: `${sourceRect.top}px`,
        width: `${sourceRect.width}px`,
        height: `${sourceRect.height}px`
      });

      source.style.visibility = 'hidden';
      overlayIllust.style.opacity = '0';
      body.appendChild(clone);

      const scaleX = targetRect.width / sourceRect.width;
      const scaleY = targetRect.height / sourceRect.height;
      const translateX = targetRect.left - sourceRect.left;
      const translateY = targetRect.top - sourceRect.top;
      const timeoutId = window.setTimeout(clearProjectTransition, 720);
      activeTransition = { clone, source, overlayIllust, timeoutId };

      requestAnimationFrame(() => requestAnimationFrame(() => {
        clone.style.transform = `translate3d(${translateX}px, ${translateY}px, 0) scale(${scaleX}, ${scaleY})`;
      }));
    }

    function openProject(tile) {
      lastActiveElement = tile;
      const illustrationSource = tile.querySelector('.project-illustration svg');
      const sourceRect = illustrationSource?.getBoundingClientRect();

      const title = tile.getAttribute('data-title') || '';
      const category = tile.getAttribute('data-category') || '';
      const oneliner = tile.getAttribute('data-oneliner') || '';
      const description = tile.getAttribute('data-description') || '';
      const built = tile.getAttribute('data-built') || '';
      const techList = (tile.getAttribute('data-tech') || '').split(',').map(s => s.trim()).filter(Boolean);
      const link = tile.getAttribute('data-link') || '#';

      // Clone illustration
      if (illustrationSource && overlayIllust) {
        overlayIllust.innerHTML = illustrationSource.outerHTML;
      }

      if (overlayCategory) overlayCategory.textContent = category;
      if (overlayTitle) overlayTitle.textContent = title;
      if (overlayOneliner) overlayOneliner.textContent = oneliner;
      if (overlayBuilt) overlayBuilt.textContent = built;
      if (overlayDesc) overlayDesc.textContent = description;
      if (overlayLink) {
        overlayLink.href = link;
        overlayLink.setAttribute('aria-label', `View ${title} repository on GitHub`);
      }

      if (overlayTech) {
        overlayTech.innerHTML = techList.map(t => `<span class="chip">${t}</span>`).join('');
      }

      projectOverlay.classList.add('active');
      projectOverlay.setAttribute('aria-hidden', 'false');
      body.classList.add('overlay-open');
      const overlayScroll = projectOverlay.querySelector('.project-overlay-scroll');
      if (overlayScroll) overlayScroll.scrollTop = 0;
      animateProjectTransition(illustrationSource, sourceRect);

      // Accessibility: trap focus inside modal
      setTimeout(() => {
        projectOverlayClose?.focus();
      }, 50);
    }

    function closeProject() {
      if (!projectOverlay.classList.contains('active')) return;
      clearProjectTransition();
      projectOverlay.classList.remove('active');
      projectOverlay.setAttribute('aria-hidden', 'true');
      body.classList.remove('overlay-open');

      if (lastActiveElement && typeof lastActiveElement.focus === 'function') {
        lastActiveElement.focus();
      }
    }

    projectTiles.forEach(tile => {
      tile.setAttribute('role', 'button');
      tile.setAttribute('tabindex', '0');
      tile.setAttribute('aria-haspopup', 'dialog');

      tile.addEventListener('click', () => openProject(tile));
      tile.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openProject(tile);
        }
      });
    });

    projectOverlayClose?.addEventListener('click', closeProject);
    projectOverlayBg?.addEventListener('click', closeProject);

    window.addEventListener('keydown', (e) => {
      if (!projectOverlay.classList.contains('active')) return;

      if (e.key === 'Escape') {
        closeProject();
        return;
      }

      if (e.key === 'Tab') {
        const focusable = Array.from(projectOverlay.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'))
          .filter(element => element.getClientRects().length > 0);
        if (!focusable.length) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });
  }

  /* -------------------------------------------------------------
     SMOOTH SCROLL (Lenis when available)
     ------------------------------------------------------------- */
  function initSmoothScroll() {
    if (prefersReducedMotion || typeof Lenis === 'undefined') return;
    lenis = new Lenis({
      autoRaf: true,
      lerp: 0.1,
      anchors: false,
      allowNestedScroll: true,
      stopInertiaOnNavigate: true
    });
  }

  /* -------------------------------------------------------------
     4. FLOATING GLASS NAV & SCROLL TRACKING
     ------------------------------------------------------------- */
  function initNavTracking() {
    const sections = document.querySelectorAll('section[id], footer[id]');

    function updateNav() {
      const scrollY = window.scrollY;

      // Nav glass shadow toggle
      if (navBar) {
        if (scrollY > 40) {
          navBar.classList.add('scrolled');
        } else {
          navBar.classList.remove('scrolled');
        }
      }

      // Scroll progress
      if (scrollProgressBar) {
        const docHeight = doc.scrollHeight - window.innerHeight;
        const progress = docHeight > 0 ? Math.min(1, Math.max(0, scrollY / docHeight)) : 0;
        scrollProgressBar.style.transform = `scaleX(${progress})`;
      }

      // Active section highlight
      const viewportMiddle = scrollY + window.innerHeight * 0.38;
      let currentSectionId = '';

      sections.forEach(section => {
        const top = section.offsetTop;
        const height = section.offsetHeight;
        if (viewportMiddle >= top && viewportMiddle < top + height) {
          currentSectionId = section.getAttribute('id');
        }
      });

      // Bottom edge check (contact section)
      if ((window.innerHeight + scrollY) >= doc.scrollHeight - 60) {
        currentSectionId = 'contact';
      }

      navLinks.forEach(link => {
        const targetId = link.getAttribute('data-section');
        if (targetId === currentSectionId) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      });
    }

    window.addEventListener('scroll', updateNav, { passive: true });
    window.addEventListener('resize', updateNav, { passive: true });
    updateNav();

    // Smooth anchor navigation
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        const targetId = this.getAttribute('href');
        if (!targetId || targetId === '#') return;
        const targetEl = document.querySelector(targetId);
        if (targetEl) {
          e.preventDefault();
          // Close mobile menu if open
          closeMobileMenu();

          const offset = targetId === '#hero' ? 0 : targetEl.offsetTop - 70;
          if (lenis) {
            lenis.scrollTo(Math.max(0, offset), { duration: 1.05 });
          } else {
            window.scrollTo({
              top: Math.max(0, offset),
              behavior: prefersReducedMotion ? 'auto' : 'smooth'
            });
          }
        }
      });
    });
  }

  /* -------------------------------------------------------------
     5. MOBILE MENU
     ------------------------------------------------------------- */
  function openMobileMenu() {
    if (!mobileMenu) return;
    mobileMenu.classList.add('open');
    mobileMenu.setAttribute('aria-hidden', 'false');
    navMenuBtn?.setAttribute('aria-expanded', 'true');
    body.classList.add('overlay-open');
    mobileMenuLinks[0]?.focus();
  }

  function closeMobileMenu() {
    if (!mobileMenu || !mobileMenu.classList.contains('open')) return;
    mobileMenu.classList.remove('open');
    mobileMenu.setAttribute('aria-hidden', 'true');
    navMenuBtn?.setAttribute('aria-expanded', 'false');
    body.classList.remove('overlay-open');
    navMenuBtn?.focus();
  }

  function initMobileMenu() {
    if (!navMenuBtn || !mobileMenu) return;

    navMenuBtn.addEventListener('click', () => {
      const isOpen = mobileMenu.classList.contains('open');
      if (isOpen) {
        closeMobileMenu();
      } else {
        openMobileMenu();
      }
    });

    mobileMenu.querySelector('.mobile-menu-backdrop')?.addEventListener('click', closeMobileMenu);

    mobileMenuLinks.forEach(link => {
      link.addEventListener('click', closeMobileMenu);
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileMenu.classList.contains('open')) {
        closeMobileMenu();
      }
    });
  }

  /* -------------------------------------------------------------
     6. CUSTOM CURSOR (Desktop only)
     ------------------------------------------------------------- */
  function initCustomCursor() {
    if (!cursor || isTouchDevice || prefersReducedMotion) return;

    body.classList.add('cursor-ready');

    let mouseX = -100;
    let mouseY = -100;
    let currentX = -100;
    let currentY = -100;

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    }, { passive: true });

    const tick = () => {
      // Smooth interpolation
      currentX += (mouseX - currentX) * 0.28;
      currentY += (mouseY - currentY) * 0.28;
      cursor.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);

    // Hover state detection
    const interactives = document.querySelectorAll('a, button, [data-cursor], .project-tile, .skill-tag, .lab-card');

    interactives.forEach(el => {
      el.addEventListener('mouseenter', () => {
        cursor.classList.add('hovering');
        const label = el.getAttribute('data-cursor');
        if (cursorLabel && label) {
          cursorLabel.textContent = label;
        } else if (cursorLabel) {
          cursorLabel.textContent = '';
        }
      });

      el.addEventListener('mouseleave', () => {
        cursor.classList.remove('hovering');
        if (cursorLabel) cursorLabel.textContent = '';
      });
    });

    document.addEventListener('mouseleave', () => {
      cursor.style.opacity = '0';
    });
    document.addEventListener('mouseenter', () => {
      cursor.style.opacity = '1';
    });
  }

  /* -------------------------------------------------------------
     7. MAGNETIC PRIMARY BUTTONS (Physics on mousemove)
     ------------------------------------------------------------- */
  function initMagneticButtons() {
    if (isTouchDevice || prefersReducedMotion) return;

    const magneticBtns = document.querySelectorAll('.btn-primary');

    magneticBtns.forEach(btn => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        // Subtle magnetic attraction (max 6px)
        btn.style.transform = `translate3d(${x * 0.18}px, ${y * 0.22}px, 0)`;
      });

      btn.addEventListener('mouseleave', () => {
        btn.style.transform = 'translate3d(0, 0, 0)';
      });
    });
  }

  /* -------------------------------------------------------------
     8. EMAIL COPY WITH EXACT BUTTON TEXT CONFIRMATION
     ------------------------------------------------------------- */
  function initEmailCopy() {
    const EMAIL_ADDRESS = 'raufh1417@gmail.com';

    emailButtons.forEach(btn => {
      btn.addEventListener('click', async () => {
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(EMAIL_ADDRESS);
          } else {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = EMAIL_ADDRESS;
            textArea.style.position = 'fixed';
            textArea.style.opacity = '0';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
          }

          // Check if button has text span or plain text
          const textSpan = btn.querySelector('.email-btn-text');
          const originalText = textSpan ? textSpan.textContent : btn.textContent;

          if (textSpan) {
            textSpan.textContent = 'Email copied';
          } else {
            btn.textContent = 'Email copied';
          }
          btn.classList.add('copied');

          setTimeout(() => {
            if (textSpan) {
              textSpan.textContent = originalText;
            } else {
              btn.textContent = originalText;
            }
            btn.classList.remove('copied');
          }, 2000);
        } catch (err) {
          console.error('Failed to copy email', err);
          window.location.href = `mailto:${EMAIL_ADDRESS}`;
        }
      });
    });
  }

  /* -------------------------------------------------------------
     9. COURSEWORK ACCORDION
     ------------------------------------------------------------- */
  function initCourseworkToggle() {
    if (!courseworkBtn || !courseworkPanel) return;

    courseworkBtn.addEventListener('click', () => {
      const isExpanded = courseworkBtn.getAttribute('aria-expanded') === 'true';
      if (isExpanded) {
        courseworkBtn.setAttribute('aria-expanded', 'false');
        courseworkBtn.textContent = 'Show coursework grades';
        courseworkPanel.classList.remove('open');
        courseworkPanel.setAttribute('hidden', '');
      } else {
        courseworkBtn.setAttribute('aria-expanded', 'true');
        courseworkBtn.textContent = 'Hide coursework grades';
        courseworkPanel.removeAttribute('hidden');
        // Force reflow for smooth max-height animation
        void courseworkPanel.offsetHeight;
        courseworkPanel.classList.add('open');
      }
    });
  }

  /* -------------------------------------------------------------
     10. SKILLS MATRIX CROSS-HIGHLIGHTING
     ------------------------------------------------------------- */
  function initSkillsHighlight() {
    if (!skillTags.length || !projectTiles.length) return;

    let activeSkill = null;

    function applyFilter(skillName) {
      if (activeSkill === skillName) {
        // Toggle off
        activeSkill = null;
        skillTags.forEach(t => t.classList.remove('active'));
        projectTiles.forEach(p => p.classList.remove('skill-highlight'));
        return;
      }

      activeSkill = skillName;
      skillTags.forEach(t => {
        t.classList.toggle('active', t.getAttribute('data-skill') === skillName);
      });

      projectTiles.forEach(tile => {
        const skillsString = tile.getAttribute('data-skills') || '';
        const tileSkills = skillsString.split(',').map(s => s.trim().toLowerCase());
        const matches = tileSkills.includes(skillName.toLowerCase());
        tile.classList.toggle('skill-highlight', matches);
      });
    }

    skillTags.forEach(tag => {
      const skillName = tag.getAttribute('data-skill');

      // Click toggles persistent filter
      tag.addEventListener('click', () => {
        applyFilter(skillName);
      });

      // Hover provides instant preview if no persistent filter active
      tag.addEventListener('mouseenter', () => {
        if (!activeSkill) {
          projectTiles.forEach(tile => {
            const skillsString = tile.getAttribute('data-skills') || '';
            const tileSkills = skillsString.split(',').map(s => s.trim().toLowerCase());
            tile.classList.toggle('skill-highlight', tileSkills.includes(skillName.toLowerCase()));
          });
        }
      });

      tag.addEventListener('mouseleave', () => {
        if (!activeSkill) {
          projectTiles.forEach(tile => tile.classList.remove('skill-highlight'));
        }
      });
    });
  }

  /* -------------------------------------------------------------
     11. SECTION HEADING REVEAL (IntersectionObserver)
     ------------------------------------------------------------- */
  function initHeadingReveals() {
    if (!revealHeadings.length || prefersReducedMotion) {
      revealHeadings.forEach(h => h.classList.add('revealed'));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: '0px 0px -10% 0px',
      threshold: 0.15
    });

    revealHeadings.forEach(h => observer.observe(h));
  }

  /* -------------------------------------------------------------
     CONTENT REVEALS
     ------------------------------------------------------------- */
  function initContentReveals() {
    if (prefersReducedMotion || !('IntersectionObserver' in window)) return;

    const revealItems = document.querySelectorAll('.exp-entry, .lab-card, .project-tile, .edu-entry, .certs-block, .skill-group');
    revealItems.forEach((item, index) => {
      item.classList.add('scroll-reveal');
      item.style.setProperty('--reveal-delay', `${(index % 4) * 70}ms`);
    });
    body.classList.add('scroll-reveals-ready');

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    revealItems.forEach(item => observer.observe(item));
  }

  /* -------------------------------------------------------------
     BOOTSTRAP
     ------------------------------------------------------------- */
  function init() {
    initLoadSequence();
    initSmoothScroll();
    initVariableType();
    initProjectOverlay();
    initNavTracking();
    initMobileMenu();
    initCustomCursor();
    initMagneticButtons();
    initEmailCopy();
    initCourseworkToggle();
    initSkillsHighlight();
    initHeadingReveals();
    initContentReveals();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
