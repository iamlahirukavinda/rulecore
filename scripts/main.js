/**
 * RuleCore landing page interactions
 * - Mobile nav toggle
 * - Features drag/scroll carousel + dots
 * - Policy tabs
 * - Tax card active state
 * - Use-case card hover / touch reveal
 */

(function () {
  "use strict";

  /* ---------- Mobile navigation ---------- */
  const menuBtn = document.getElementById("menu-toggle");
  const mobileNav = document.getElementById("mobile-nav");

  if (menuBtn && mobileNav) {
    menuBtn.addEventListener("click", () => {
      const open = mobileNav.classList.toggle("open");
      menuBtn.setAttribute("aria-expanded", String(open));
      menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });

    mobileNav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        mobileNav.classList.remove("open");
        menuBtn.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------- Features carousel (full-bleed endless loop) ---------- */
  const featuresCarousel = document.getElementById("features-carousel");
  const featuresViewport = featuresCarousel
    ? featuresCarousel.querySelector(".features-carousel-viewport")
    : null;
  const featuresTrack = document.getElementById("features-track");
  const featureDots = Array.from(document.querySelectorAll("[data-carousel-dot]"));
  const originalFeatureCards = featuresTrack
    ? Array.from(featuresTrack.querySelectorAll("[data-feature-slide]"))
    : [];

  if (featuresCarousel && featuresViewport && featuresTrack && originalFeatureCards.length) {
    const FEATURE_COUNT = originalFeatureCards.length;
    const AUTO_MS = 4000;
    let activeIndex = 0;
    let trackIndex = FEATURE_COUNT;
    let autoTimer = null;
    let isJumping = false;
    let isDragging = false;
    let startX = 0;
    let currentTranslate = 0;
    let dragStartTranslate = 0;
    let moved = false;

    // Triple the cards for seamless infinite scrolling
    const beforeFrag = document.createDocumentFragment();
    const afterFrag = document.createDocumentFragment();

    originalFeatureCards.forEach((card) => {
      const before = card.cloneNode(true);
      const after = card.cloneNode(true);
      before.classList.add("feature-card-clone");
      after.classList.add("feature-card-clone");
      before.removeAttribute("data-feature-slide");
      after.removeAttribute("data-feature-slide");
      beforeFrag.appendChild(before);
      afterFrag.appendChild(after);
    });

    featuresTrack.insertBefore(beforeFrag, featuresTrack.firstChild);
    featuresTrack.appendChild(afterFrag);

    const allFeatureCards = Array.from(featuresTrack.querySelectorAll(".feature-card"));

    function clearFeatureTimer() {
      if (autoTimer) {
        window.clearTimeout(autoTimer);
        autoTimer = null;
      }
    }

    function getStep() {
      const card = allFeatureCards[0];
      if (!card) return 0;
      const styles = getComputedStyle(featuresTrack);
      const gap = parseFloat(styles.columnGap || styles.gap) || 16;
      return card.offsetWidth + gap;
    }

    function setTranslate(value, animate) {
      currentTranslate = value;
      featuresTrack.style.transition = animate
        ? "transform 0.55s cubic-bezier(0.4, 0, 0.2, 1)"
        : "none";
      featuresTrack.style.transform = `translateX(${value}px)`;
    }

    function syncDots() {
      if (!featureDots.length) return;
      let activeDot = 0;
      if (activeIndex >= FEATURE_COUNT - 1) activeDot = Math.min(2, featureDots.length - 1);
      else if (activeIndex >= 1) activeDot = Math.min(1, featureDots.length - 1);

      featureDots.forEach((dot, i) => {
        dot.classList.toggle("active", i === activeDot);
      });
    }

    function goToFeature(index, { animate = true } = {}) {
      if (isJumping) return;

      activeIndex = ((index % FEATURE_COUNT) + FEATURE_COUNT) % FEATURE_COUNT;
      trackIndex = FEATURE_COUNT + activeIndex;

      const step = getStep();
      setTranslate(-(trackIndex * step), animate);
      syncDots();
      scheduleFeatureAdvance();
    }

    function advanceFeature() {
      if (isJumping || isDragging) return;

      activeIndex = (activeIndex + 1) % FEATURE_COUNT;
      trackIndex += 1;

      const step = getStep();
      setTranslate(-(trackIndex * step), true);
      syncDots();
      scheduleFeatureAdvance();
    }

    function scheduleFeatureAdvance() {
      clearFeatureTimer();
      autoTimer = window.setTimeout(advanceFeature, AUTO_MS);
    }

    function normalizeLoop() {
      if (trackIndex >= FEATURE_COUNT * 2) {
        isJumping = true;
        trackIndex = FEATURE_COUNT + (trackIndex % FEATURE_COUNT);
        activeIndex = trackIndex - FEATURE_COUNT;
        setTranslate(-(trackIndex * getStep()), false);
        void featuresTrack.offsetWidth;
        isJumping = false;
      } else if (trackIndex < FEATURE_COUNT) {
        isJumping = true;
        trackIndex = FEATURE_COUNT + (trackIndex % FEATURE_COUNT);
        activeIndex = trackIndex - FEATURE_COUNT;
        setTranslate(-(trackIndex * getStep()), false);
        void featuresTrack.offsetWidth;
        isJumping = false;
      }
    }

    featuresTrack.addEventListener("transitionend", (event) => {
      if (event.propertyName !== "transform" || isJumping) return;
      normalizeLoop();
    });

    function onPointerDown(clientX) {
      isDragging = true;
      moved = false;
      startX = clientX;
      dragStartTranslate = currentTranslate;
      clearFeatureTimer();
      featuresViewport.classList.add("is-dragging");
      featuresTrack.classList.add("is-dragging");
    }

    function onPointerMove(clientX) {
      if (!isDragging) return;
      const delta = clientX - startX;
      if (Math.abs(delta) > 4) moved = true;
      setTranslate(dragStartTranslate + delta, false);
    }

    function onPointerUp() {
      if (!isDragging) return;
      isDragging = false;
      featuresViewport.classList.remove("is-dragging");
      featuresTrack.classList.remove("is-dragging");

      const step = getStep();
      const nearest = Math.round(-currentTranslate / step);
      trackIndex = nearest;
      activeIndex = ((trackIndex % FEATURE_COUNT) + FEATURE_COUNT) % FEATURE_COUNT;

      setTranslate(-(trackIndex * step), true);
      syncDots();
      scheduleFeatureAdvance();

      window.setTimeout(() => {
        normalizeLoop();
      }, 560);
    }

    featuresViewport.addEventListener("mousedown", (e) => {
      e.preventDefault();
      onPointerDown(e.clientX);
    });

    window.addEventListener("mousemove", (e) => onPointerMove(e.clientX));
    window.addEventListener("mouseup", onPointerUp);

    featuresViewport.addEventListener(
      "touchstart",
      (e) => {
        if (!e.touches[0]) return;
        onPointerDown(e.touches[0].clientX);
      },
      { passive: true }
    );

    featuresViewport.addEventListener(
      "touchmove",
      (e) => {
        if (!e.touches[0]) return;
        onPointerMove(e.touches[0].clientX);
      },
      { passive: true }
    );

    featuresViewport.addEventListener("touchend", onPointerUp);

    featuresViewport.addEventListener(
      "click",
      (e) => {
        if (moved) {
          e.preventDefault();
          e.stopPropagation();
        }
      },
      true
    );

    featureDots.forEach((dot, i) => {
      dot.addEventListener("click", () => {
        const targets = [0, Math.min(1, FEATURE_COUNT - 1), FEATURE_COUNT - 1];
        goToFeature(targets[i] ?? 0);
      });
    });

    window.addEventListener("resize", () => {
      setTranslate(-(trackIndex * getStep()), false);
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        clearFeatureTimer();
        return;
      }
      scheduleFeatureAdvance();
    });

    // Start in the middle set so we can loop both directions
    setTranslate(-(FEATURE_COUNT * getStep()), false);
    syncDots();
    scheduleFeatureAdvance();
  }

  /* ---------- Policy carousel + tabs ---------- */
  const policyTablist = document.getElementById("policy-tablist");
  const policyTabs = policyTablist
    ? Array.from(policyTablist.querySelectorAll("[data-policy-tab]"))
    : [];
  const policyTrack = document.getElementById("policy-carousel-track");
  const policyViewport = policyTrack
    ? policyTrack.closest(".policy-carousel-viewport")
    : null;
  const policySlides = policyTrack
    ? Array.from(policyTrack.querySelectorAll("[data-policy-slide]"))
    : [];

  if (policyTabs.length && policyTrack && policyViewport && policySlides.length) {
    const SLIDE_DURATION = 6000;
    const SLIDE_COUNT = policySlides.length;
    let activeIndex = 0;
    let trackIndex = 1;
    let autoTimer = null;
    let cycleId = 0;
    let isJumping = false;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // Clone last/first slides for seamless infinite loop peeks
    const firstClone = policySlides[0].cloneNode(true);
    const lastClone = policySlides[SLIDE_COUNT - 1].cloneNode(true);
    firstClone.classList.add("policy-slide-clone");
    lastClone.classList.add("policy-slide-clone");
    firstClone.removeAttribute("data-policy-slide");
    lastClone.removeAttribute("data-policy-slide");
    policyTrack.insertBefore(lastClone, policySlides[0]);
    policyTrack.appendChild(firstClone);

    const allSlides = Array.from(policyTrack.querySelectorAll(".policy-slide"));

    function clearAutoTimer() {
      if (autoTimer) {
        window.clearTimeout(autoTimer);
        autoTimer = null;
      }
    }

    function resetProgressBar(bar) {
      if (!bar) return;
      bar.style.animation = "none";
      bar.style.width = "0";
    }

    function startProgressBar(tab) {
      const bar = tab?.querySelector(".policy-tab-progress");
      if (!bar) return null;

      resetProgressBar(bar);
      bar.getBoundingClientRect();

      if (prefersReducedMotion) {
        bar.style.width = "100%";
      } else {
        bar.style.animation = `policy-tab-fill ${SLIDE_DURATION}ms linear forwards`;
      }

      return bar;
    }

    function updateSlideMetrics() {
      const viewportWidth = policyViewport.offsetWidth;
      const peek = viewportWidth < 768 ? 20 : 72;
      const slideWidth = Math.min(1296, Math.max(280, viewportWidth - peek * 2));
      policyViewport.style.setProperty("--policy-slide-width", `${slideWidth}px`);
    }

    function updateCarouselPosition(animate = true) {
      const slide = allSlides[trackIndex];
      if (!slide) return;

      if (!animate) {
        policyTrack.style.transition = "none";
      }

      const viewportWidth = policyViewport.offsetWidth;
      const slideWidth = slide.offsetWidth;
      const slideLeft = slide.offsetLeft;
      const centerOffset = slideLeft + slideWidth / 2 - viewportWidth / 2;

      policyTrack.style.transform = `translateX(-${Math.max(0, centerOffset)}px)`;

      if (!animate) {
        void policyTrack.offsetWidth;
        policyTrack.style.transition = "";
      }
    }

    function syncSlideStates() {
      allSlides.forEach((slide, i) => {
        slide.classList.toggle("is-active", i === trackIndex);
      });

      policySlides.forEach((slide, i) => {
        slide.setAttribute("aria-hidden", String(i !== activeIndex));
      });
    }

    function syncTabsAndProgress(currentCycle, userInitiated = false) {
      policyTabs.forEach((tab, i) => {
        const active = i === activeIndex;
        tab.classList.toggle("active", active);
        tab.setAttribute("aria-selected", String(active));
        if (!active) resetProgressBar(tab.querySelector(".policy-tab-progress"));
      });

      const activeTab = policyTabs[activeIndex];
      if (!activeTab) return;

      const bar = startProgressBar(activeTab);
      bindProgressAdvance(bar, currentCycle);
      scheduleAdvance(currentCycle);

      if (userInitiated) {
        activeTab.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }

    function jumpWithoutAnimation(nextTrackIndex) {
      isJumping = true;
      trackIndex = nextTrackIndex;
      updateCarouselPosition(false);
      syncSlideStates();
      isJumping = false;
    }

    function advanceToNextSlide() {
      if (isJumping) return;

      const nextActive = (activeIndex + 1) % SLIDE_COUNT;

      if (activeIndex === SLIDE_COUNT - 1) {
        activeIndex = nextActive;
        trackIndex = allSlides.length - 1;
        syncSlideStates();
        syncTabsAndProgress(++cycleId);
        updateCarouselPosition(true);
        return;
      }

      activeIndex = nextActive;
      trackIndex += 1;
      syncSlideStates();
      syncTabsAndProgress(++cycleId);
      updateCarouselPosition(true);
    }

    function scheduleAdvance(currentCycle) {
      clearAutoTimer();

      autoTimer = window.setTimeout(() => {
        if (currentCycle !== cycleId || isJumping) return;
        advanceToNextSlide();
      }, SLIDE_DURATION);
    }

    function bindProgressAdvance(bar, currentCycle) {
      if (!bar || prefersReducedMotion) return;

      bar.addEventListener(
        "animationend",
        (event) => {
          if (event.target !== bar || currentCycle !== cycleId || isJumping) return;
          clearAutoTimer();
          advanceToNextSlide();
        },
        { once: true }
      );
    }

    function goToSlide(index, { userInitiated = false } = {}) {
      if (isJumping) return;

      cycleId += 1;
      const currentCycle = cycleId;
      clearAutoTimer();

      activeIndex = ((index % SLIDE_COUNT) + SLIDE_COUNT) % SLIDE_COUNT;
      trackIndex = activeIndex + 1;

      syncSlideStates();
      syncTabsAndProgress(currentCycle, userInitiated);
      updateCarouselPosition(true);
    }

    policyTrack.addEventListener("transitionend", (event) => {
      if (event.propertyName !== "transform" || isJumping) return;

      if (trackIndex === allSlides.length - 1) {
        jumpWithoutAnimation(1);
      } else if (trackIndex === 0) {
        jumpWithoutAnimation(SLIDE_COUNT);
      }
    });

    policyTabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const index = Number(tab.dataset.policyTab);
        if (Number.isNaN(index) || index === activeIndex) return;
        goToSlide(index, { userInitiated: true });
      });
    });

    window.addEventListener("resize", () => {
      updateSlideMetrics();
      window.requestAnimationFrame(() => updateCarouselPosition(false));
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        clearAutoTimer();
        return;
      }
      goToSlide(activeIndex);
    });

    updateSlideMetrics();
    syncSlideStates();
    goToSlide(0);
  }

  /* ---------- Use-case cards (touch / keyboard reveal) ---------- */
  const usecaseCards = Array.from(document.querySelectorAll(".usecase-card"));
  const canHoverFine = window.matchMedia("(hover: hover) and (pointer: fine)");

  if (usecaseCards.length) {
    function clearUsecaseActive(except) {
      usecaseCards.forEach((card) => {
        if (card !== except) card.classList.remove("is-active");
      });
    }

    usecaseCards.forEach((card) => {
      card.addEventListener("click", () => {
        if (canHoverFine.matches) return;
        const willOpen = !card.classList.contains("is-active");
        clearUsecaseActive(willOpen ? card : null);
        card.classList.toggle("is-active", willOpen);
      });

      card.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        const willOpen = !card.classList.contains("is-active");
        clearUsecaseActive(willOpen ? card : null);
        card.classList.toggle("is-active", willOpen);
      });
    });

    document.addEventListener("click", (event) => {
      if (canHoverFine.matches) return;
      if (event.target.closest(".usecase-card")) return;
      clearUsecaseActive(null);
    });
  }
})();
