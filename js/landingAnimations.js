/**
 * ============================================================================
 * LANDING ANIMATIONS (GSAP 3 + ScrollTrigger Engine)
 * LogbookRiset.web.id - Solusi Dokumentasi Riset Lapangan Modern
 * 
 * Modul animasi interaktif berkinerja tinggi (60fps, GPU-accelerated)
 * menggunakan GreenSock Animation Platform.
 * ============================================================================
 */

(function (window) {
  'use strict';

  // Objek Controller Global
  const LandingAnimations = {
    ctx: null,
    isInitialized: false,
    mouseMoveHandler: null,
    mouseLeaveHandler: null,
    autoScrollTween: null,
    feedEnterHandler: null,
    feedLeaveHandler: null
  };

  /**
   * Memeriksa ketersediaan library GSAP
   */
  function isGsapAvailable() {
    return typeof window.gsap !== 'undefined';
  }

  /**
   * Inisialisasi seluruh animasi landing page
   */
  LandingAnimations.init = function () {
    const landingWrapper = document.getElementById('viewLandingPage');
    if (!landingWrapper || landingWrapper.classList.contains('hidden')) {
      return;
    }

    if (!isGsapAvailable()) {
      console.warn('[LandingAnimations] Library GSAP belum tersedia. Animasi dilewati.');
      return;
    }

    // Bersihkan sesi animasi sebelumnya jika ada
    LandingAnimations.destroy();

    const gsap = window.gsap;
    const ScrollTrigger = window.ScrollTrigger;

    if (ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);
    }

    // Periksa preferensi aksesibilitas pengguna
    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Bungkus seluruh animasi dalam gsap.context() untuk isolasi siklus hidup SPA
    LandingAnimations.ctx = gsap.context(() => {

      // ======================================================================
      // 1. HERO ENTRANCE SEQUENCE (TIMELINE INTRO)
      // ======================================================================
      const heroTl = gsap.timeline({
        defaults: { ease: 'power3.out' }
      });

      if (!prefersReducedMotion) {
        // Badge pill pembuka
        heroTl.from('.v3-badge-pill', { y: -15, duration: 0.5, ease: 'power2.out' });

        // Headline & deskripsi selalu 100% visible (bebas dari glitch opacity: 0)
        heroTl.from('.v3-hero-title', { y: 25, duration: 0.6, ease: 'power2.out' }, '-=0.3');
        heroTl.from('.v3-hero-desc', { y: 15, duration: 0.5, ease: 'power2.out' }, '-=0.3');

        // Tombol aksi CTA selalu 100% visible (bebas dari glitch opacity: 0)
        heroTl.from('.v3-hero-cta-row .btn', { y: 15, duration: 0.5, ease: 'power2.out' }, '-=0.3');

        // 3 Mini Badges jaminan cepat
        heroTl.from('.v3-mini-badge', {
          scale: 0.85,
          opacity: 0,
          stagger: 0.1,
          duration: 0.5,
          ease: 'back.out(1.5)'
        }, '-=0.3');

        // Sasis Smartphone & Viewport
        heroTl.from('.v3-phone-chassis', {
          y: 50,
          opacity: 0,
          scale: 0.95,
          duration: 1,
          ease: 'power3.out'
        }, '-=0.8');

        // Kartu feed di layar ponsel (grup awal)
        heroTl.from('.v3-feed-group:first-child .v3-feed-card', {
          y: 40,
          opacity: 0,
          stagger: 0.18,
          duration: 0.7,
          ease: 'power2.out'
        }, '-=0.5');

        // Floating badge status
        heroTl.from('.v3-float-status-card', {
          x: 40,
          opacity: 0,
          scale: 0.9,
          duration: 0.8,
          ease: 'back.out(1.7)'
        }, '-=0.3');
      }

      // ======================================================================
      // 1.B. CONTINUOUS INFINITE AUTO-SCROLL FEED (SMARTPHONE VIEWPORT)
      // ======================================================================
      const feedTrack = document.querySelector('.v3-phone-feed-track');
      const phoneScrollArea = document.querySelector('.v3-phone-scroll-area');

      if (feedTrack && !prefersReducedMotion) {
        // Animasi auto-scrolling berulang tanpa batas (seamless looping 60fps)
        const autoScrollTween = gsap.to(feedTrack, {
          yPercent: -50,
          ease: 'none',
          duration: 22,
          repeat: -1,
          delay: 1.0
        });
        LandingAnimations.autoScrollTween = autoScrollTween;

        // Hover pause & resume interaktif agar pengguna dapat membaca rincian kartu
        const interactiveArea = phoneScrollArea || feedTrack.parentElement;
        if (interactiveArea) {
          LandingAnimations.feedEnterHandler = function () {
            gsap.to(autoScrollTween, { timeScale: 0, duration: 0.4, overwrite: 'auto' });
          };
          LandingAnimations.feedLeaveHandler = function () {
            gsap.to(autoScrollTween, { timeScale: 1, duration: 0.6, overwrite: 'auto' });
          };

          interactiveArea.addEventListener('mouseenter', LandingAnimations.feedEnterHandler);
          interactiveArea.addEventListener('mouseleave', LandingAnimations.feedLeaveHandler);
        }
      }

      // ======================================================================
      // 2. INTERACTIVE 3D PARALLAX MOUSE TILT & FLOATING PHONE
      // ======================================================================
      const phoneCol = document.querySelector('.v3-hero-phone-col');
      const phoneChassis = document.querySelector('.v3-phone-chassis');

      if (phoneChassis && !prefersReducedMotion) {
        // Efek levitasi kontinu mikro yang anggun
        gsap.to(phoneChassis, {
          y: -10,
          duration: 3,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut'
        });

        // 3D Mouse Parallax Tilt pada sasis smartphone
        if (phoneCol) {
          LandingAnimations.mouseMoveHandler = function (e) {
            const rect = phoneCol.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            const deltaX = (e.clientX - centerX) / (rect.width / 2);
            const deltaY = (e.clientY - centerY) / (rect.height / 2);

            const rotateY = deltaX * 10; // maks rotasi 10 derajat
            const rotateX = -deltaY * 8;  // maks rotasi 8 derajat

            gsap.to(phoneChassis, {
              rotationY: rotateY,
              rotationX: rotateX,
              transformPerspective: 1000,
              duration: 0.5,
              ease: 'power2.out',
              overwrite: 'auto'
            });
          };

          LandingAnimations.mouseLeaveHandler = function () {
            gsap.to(phoneChassis, {
              rotationY: 0,
              rotationX: 0,
              duration: 1,
              ease: 'elastic.out(1, 0.4)',
              overwrite: 'auto'
            });
          };

          phoneCol.addEventListener('mousemove', LandingAnimations.mouseMoveHandler);
          phoneCol.addEventListener('mouseleave', LandingAnimations.mouseLeaveHandler);
        }
      }

      // Helper fungsi animasi entrance header seksi secara terkoordinasi
      const animateSectionHeader = (headerSelector, triggerSelector = null) => {
        const headerEl = document.querySelector(headerSelector);
        if (!headerEl) return;
        const items = headerEl.querySelectorAll('.v3-sec-tag, .v3-sec-title, .v3-sec-desc');
        if (items.length === 0) return;
        gsap.from(items, {
          scrollTrigger: {
            trigger: triggerSelector || headerSelector,
            start: 'top 85%',
            toggleActions: 'play none none reverse'
          },
          y: 28,
          opacity: 0,
          stagger: 0.12,
          duration: 0.8,
          ease: 'power3.out'
        });
      };

      // ======================================================================
      // 3. SHOWCASE DOKUMEN WORD (.DOCX) LANDSCAPE SCROLL REVEAL & 3D ELEVATION
      // ======================================================================
      const wordSection = document.getElementById('preview-word');
      if (wordSection && ScrollTrigger && !prefersReducedMotion) {
        
        // Header entrance reveal
        animateSectionHeader('#preview-word .v3-sec-header');

        // Frame laptop desktop elevation dengan 3D tilt & smooth spring
        gsap.from('.v3-desktop-frame', {
          scrollTrigger: {
            trigger: wordSection,
            start: 'top 75%',
            toggleActions: 'play none none reverse'
          },
          y: 65,
          opacity: 0,
          scale: 0.94,
          rotationX: 5,
          transformOrigin: 'center bottom',
          duration: 1.1,
          ease: 'power3.out'
        });

        // Parallax scrub halus pada lembar dokumen Word di dalam viewport desktop
        const docxSheet = document.querySelector('.v3-docx-landscape-sheet');
        if (docxSheet) {
          gsap.to(docxSheet, {
            scrollTrigger: {
              trigger: wordSection,
              start: 'top bottom',
              end: 'bottom top',
              scrub: 1
            },
            y: -30,
            ease: 'none'
          });
        }

        // Stagger baris tabel resmi Word bolak-balik
        gsap.from('.v3-docx-official-table tbody tr', {
          scrollTrigger: {
            trigger: '.v3-docx-official-table',
            start: 'top 82%',
            toggleActions: 'play none none reverse'
          },
          y: 24,
          opacity: 0,
          stagger: 0.14,
          duration: 0.7,
          ease: 'power2.out'
        });

        // Lembar pengesahan supervisor tanda tangan
        gsap.from('.v3-sign-box', {
          scrollTrigger: {
            trigger: '.v3-sheet-validation-row',
            start: 'top 85%',
            toggleActions: 'play none none reverse'
          },
          y: 20,
          opacity: 0,
          stagger: 0.18,
          duration: 0.7,
          ease: 'power2.out'
        });
      }

      // ======================================================================
      // 4. BRANKAS MEDIA VAULT 5TB & DANCING WAVEFORM BARS
      // ======================================================================
      const mediaSection = document.querySelector('.v3-media-section');
      if (mediaSection && ScrollTrigger && !prefersReducedMotion) {
        
        // Narasi sisi kiri Media Vault reveal berurutan
        const mediaLeftChildren = document.querySelectorAll('.v3-media-left > *');
        if (mediaLeftChildren.length > 0) {
          gsap.from(mediaLeftChildren, {
            scrollTrigger: {
              trigger: '.v3-media-left',
              start: 'top 82%',
              toggleActions: 'play none none reverse'
            },
            x: -40,
            opacity: 0,
            stagger: 0.14,
            duration: 0.85,
            ease: 'power3.out'
          });
        }

        // Animasi isi progress bar kapasitas 5TB
        const storageBarFill = document.querySelector('.v3-storage-bar-fill');
        if (storageBarFill) {
          gsap.from(storageBarFill, {
            scrollTrigger: {
              trigger: '.v3-storage-box',
              start: 'top 85%',
              toggleActions: 'play none none reverse'
            },
            scaleX: 0,
            transformOrigin: 'left center',
            duration: 1.4,
            ease: 'power3.out'
          });
        }

        // Animasi Live Audio Waveform Dance (Simulasi rekaman audio yang diputar)
        const waveformBars = document.querySelectorAll('.v3-waveform-visual span');
        if (waveformBars && waveformBars.length > 0) {
          waveformBars.forEach((bar, idx) => {
            gsap.to(bar, {
              scaleY: () => 0.25 + Math.random() * 0.85,
              duration: 0.35 + Math.random() * 0.45,
              repeat: -1,
              yoyo: true,
              ease: 'sine.inOut',
              delay: idx * 0.04
            });
          });
        }

        // Stagger kartu media player sisi kanan (Video & Audio) simetris tanpa offset horizontal
        gsap.from('.v3-media-card', {
          scrollTrigger: {
            trigger: '.v3-media-right',
            start: 'top 80%',
            toggleActions: 'play none none reverse'
          },
          y: 35,
          opacity: 0,
          scale: 0.96,
          stagger: 0.22,
          duration: 0.9,
          ease: 'power3.out'
        });

        // Parallax diferensial halus antara kartu video dan kartu audio
        const mediaCards = document.querySelectorAll('.v3-media-card');
        if (mediaCards.length >= 2) {
          gsap.to(mediaCards[0], {
            scrollTrigger: {
              trigger: mediaSection,
              start: 'top bottom',
              end: 'bottom top',
              scrub: 1.2
            },
            y: -20,
            ease: 'none'
          });
          gsap.to(mediaCards[1], {
            scrollTrigger: {
              trigger: mediaSection,
              start: 'top bottom',
              end: 'bottom top',
              scrub: 1.6
            },
            y: -42,
            ease: 'none'
          });
        }
      }

      // ======================================================================
      // 5. SEKSI 5 FITUR UTAMA (3D PERSPECTIVE UNROLL CASCADE SCROLL EFFECT)
      // ======================================================================
      const featuresSection = document.getElementById('fitur');
      if (featuresSection && ScrollTrigger && !prefersReducedMotion) {
        
        // Header entrance reveal
        animateSectionHeader('#fitur .v3-sec-header');

        // 1. Cascading 3D Perspective Roll-In dari atas ke bawah (Vertikal Murni, Tanpa Celah X)
        gsap.from('.v3-five-grid .v3-fitem-card', {
          scrollTrigger: {
            trigger: '.v3-five-grid',
            start: 'top 82%',
            toggleActions: 'play none none reverse'
          },
          y: 60,
          rotationX: 14,
          scale: 0.92,
          opacity: 0,
          stagger: 0.12,
          duration: 0.8,
          ease: 'power3.out',
          transformOrigin: 'center top'
        });

        // 2. Micro-Bounce pada Ikon Fitur saat Mendarat
        gsap.from('.v3-ficon-box', {
          scrollTrigger: {
            trigger: '.v3-five-grid',
            start: 'top 82%',
            toggleActions: 'play none none reverse'
          },
          scale: 0.65,
          opacity: 0,
          stagger: 0.12,
          duration: 0.55,
          delay: 0.15,
          ease: 'back.out(2.5)'
        });

        // 3. Pop & Micro-Rotate Badge Nomor (01 - 05)
        gsap.from('.v3-fnum-badge', {
          scrollTrigger: {
            trigger: '.v3-five-grid',
            start: 'top 82%',
            toggleActions: 'play none none reverse'
          },
          scale: 0.45,
          rotation: -15,
          opacity: 0,
          stagger: 0.1,
          duration: 0.65,
          ease: 'back.out(2)'
        });

        // 4. Subtle Continuous Scroll Parallax Vertikal (Floating Depth Tanpa Geser X)
        gsap.to('.v3-five-grid .v3-fitem-card:nth-child(odd):not(.v3-fitem-span)', {
          scrollTrigger: {
            trigger: featuresSection,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1.2
          },
          y: -20,
          ease: 'none'
        });

        gsap.to('.v3-five-grid .v3-fitem-card:nth-child(even)', {
          scrollTrigger: {
            trigger: featuresSection,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1.6
          },
          y: -35,
          ease: 'none'
        });

        // 6. Hover micro-animations pada icon box
        const featureCards = document.querySelectorAll('.v3-fitem-card');
        featureCards.forEach(card => {
          const icon = card.querySelector('.v3-ficon-box');
          if (icon) {
            card.addEventListener('mouseenter', () => {
              gsap.to(icon, {
                scale: 1.15,
                rotation: 8,
                duration: 0.3,
                ease: 'back.out(2)'
              });
            });
            card.addEventListener('mouseleave', () => {
              gsap.to(icon, {
                scale: 1,
                rotation: 0,
                duration: 0.4,
                ease: 'power2.out'
              });
            });
          }
        });
      }

      // ======================================================================
      // 6. FAQ ACCORDION SCROLL ENTRANCE
      // ======================================================================
      const faqSection = document.getElementById('faq');
      if (faqSection && ScrollTrigger && !prefersReducedMotion) {
        
        // Header entrance reveal
        animateSectionHeader('#faq .v3-sec-header');

        // Ripple stagger accordion item bolak-balik
        gsap.from('.v3-faq-item', {
          scrollTrigger: {
            trigger: '.v3-faq-accordion-box',
            start: 'top 85%',
            toggleActions: 'play none none reverse'
          },
          y: 30,
          opacity: 0,
          stagger: 0.12,
          duration: 0.65,
          ease: 'power2.out'
        });
      }

      // ======================================================================
      // 7. FOOTER CLEAN REVEAL
      // ======================================================================
      const footerSection = document.querySelector('.v3-clean-footer');
      if (footerSection && ScrollTrigger && !prefersReducedMotion) {
        gsap.from('.v3-clean-footer .v3-footer-flex > *', {
          scrollTrigger: {
            trigger: footerSection,
            start: 'top 92%',
            toggleActions: 'play none none reverse'
          },
          y: 25,
          opacity: 0,
          stagger: 0.15,
          duration: 0.75,
          ease: 'power2.out'
        });
      }

      // ======================================================================
      // 8. STACKING CARD OVERLAY EFFECT (APPLE / LINEAR STYLE)
      // ======================================================================
      if (ScrollTrigger && !prefersReducedMotion) {
        const stackPairs = [
          {
            prevContent: '.v3-hero-grid',
            nextSection: '#preview-word'
          },
          {
            prevContent: '#preview-word .v3-container',
            nextSection: '.v3-media-section'
          },
          {
            prevContent: '.v3-media-section .v3-container',
            nextSection: '#fitur'
          },
          {
            prevContent: '#fitur .v3-container',
            nextSection: '#faq'
          }
        ];

        stackPairs.forEach(({ prevContent, nextSection }) => {
          const prevEl = document.querySelector(prevContent);
          const nextSecEl = document.querySelector(nextSection);

          if (prevEl && nextSecEl) {
            gsap.to(prevEl, {
              scrollTrigger: {
                trigger: nextSecEl,
                start: 'top bottom',
                end: 'top 12%',
                scrub: true
              },
              scale: 0.965,
              opacity: 0.72,
              y: 28,
              transformOrigin: 'center top',
              ease: 'none'
            });
          }
        });
      }

    }, landingWrapper);

    LandingAnimations.isInitialized = true;
    console.info('[LandingAnimations] Berhasil menginisialisasi animasi GSAP & ScrollTrigger.');
  };

  /**
   * Membersihkan sesi animasi saat berpindah rute (Garbage Collection aman)
   */
  LandingAnimations.destroy = function () {
    const phoneCol = document.querySelector('.v3-hero-phone-col');
    if (phoneCol && LandingAnimations.mouseMoveHandler) {
      phoneCol.removeEventListener('mousemove', LandingAnimations.mouseMoveHandler);
      phoneCol.removeEventListener('mouseleave', LandingAnimations.mouseLeaveHandler);
    }
    LandingAnimations.mouseMoveHandler = null;
    LandingAnimations.mouseLeaveHandler = null;

    // Bersihkan auto-scroll tween dan event listener hover feed
    if (LandingAnimations.autoScrollTween) {
      LandingAnimations.autoScrollTween.kill();
      LandingAnimations.autoScrollTween = null;
    }

    const phoneScrollArea = document.querySelector('.v3-phone-scroll-area');
    if (phoneScrollArea && LandingAnimations.feedEnterHandler) {
      phoneScrollArea.removeEventListener('mouseenter', LandingAnimations.feedEnterHandler);
      phoneScrollArea.removeEventListener('mouseleave', LandingAnimations.feedLeaveHandler);
    }
    LandingAnimations.feedEnterHandler = null;
    LandingAnimations.feedLeaveHandler = null;

    if (LandingAnimations.ctx) {
      LandingAnimations.ctx.revert();
      LandingAnimations.ctx = null;
    }

    if (window.ScrollTrigger) {
      window.ScrollTrigger.refresh();
    }

    LandingAnimations.isInitialized = false;
  };

  // Ekspos ke global scope
  window.LandingAnimations = LandingAnimations;

})(window);
