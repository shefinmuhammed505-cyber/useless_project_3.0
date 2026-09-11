(() => {
  if (window.gravityBrowserFlowLoaded) return;
  window.gravityBrowserFlowLoaded = true;

  // Elements that will float
  const SELECTOR = [
    "h1", "h2", "h3", "h4", "h5", "h6",
    "p", "li", "blockquote",
    "pre", "figure", "figcaption",
    "img", "video", "svg", "table",
    "article", "section", "aside",
    "main", "header", "footer", "a"
  ].join(",");

  // Elements that should NOT be affected
  const SKIP = [
    "#gravity-browser-flow",
    "script",
    "style",
    "noscript",
    "template",
    "input",
    "textarea",
    "select",
    "button",
    "[contenteditable=\"true\"]",
    "[data-gravity-flow-skip]"
  ].join(",");


  // ==============================
  // SETTINGS
  // ==============================

  const MAX_ITEMS = 180;

  // Lower = slower
  const SPEED = 0.008;

  // Maximum movement distance
  const FLOW_RANGE = 55;

  // Delay after scrolling stops
  const SCROLL_PAUSE_MS = 180;


  // ==============================
  // VARIABLES
  // ==============================

  let items = [];
  let rafId;
  let lastFrame = performance.now();

  let animationTime = 0;

  let scrolling = false;
  let scrollTimer;
  let scanTimer;


  // ==============================
  // CHECK IF ELEMENT CAN MOVE
  // ==============================

  function isUsable(element) {
    if (!element) return false;

    if (element.matches(SKIP)) return false;

    if (element.closest(SKIP)) return false;

    const style = getComputedStyle(element);

    const rect = element.getBoundingClientRect();

    return (
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      style.position !== "fixed" &&
      rect.width > 2 &&
      rect.height > 2 &&
      rect.bottom > -200 &&
      rect.top < innerHeight + 200
    );
  }


  // ==============================
  // COLLECT PAGE ELEMENTS
  // ==============================

  function collect() {

    const seen = new Set();

    const next = [];

    for (const element of document.querySelectorAll(SELECTOR)) {

      if (!isUsable(element)) continue;

      if (seen.has(element)) continue;

      seen.add(element);


      // Check if this element already exists
      const current = items.find(
        item => item.element === element
      );


      if (current) {

        // Keep existing movement settings
        next.push(current);

      } else {

        // Create unique movement settings
        next.push({

          element,

          // Save original transform
          originalTransform: element.style.transform,

          // Random starting position
          phase: Math.random() * Math.PI * 2,

          // Different movement strength
          amplitude:
            FLOW_RANGE *
            (0.45 + Math.random() * 0.75),

          // Different movement speed
          frequency:
            0.55 + Math.random() * 0.75,

          // Tiny continuous drift
          drift:
            (Math.random() - 0.5) * 0.16,

          // Individual vertical strength
          verticalStrength:
            0.45 + Math.random() * 0.8,

          // Individual horizontal strength
          horizontalStrength:
            0.55 + Math.random() * 0.8,

          // Random rotation amount
          rotationAmount:
            1 + Math.random() * 3

        });

        element.dataset.gravityFlow = "true";
      }


      if (next.length >= MAX_ITEMS) break;
    }


    // Restore elements that are no longer active
    for (const old of items) {

      if (!next.some(
        item => item.element === old.element
      )) {

        old.element.style.transform =
          old.originalTransform;

        delete old.element.dataset.gravityFlow;
      }
    }


    items = next;
  }


  // ==============================
  // ANIMATION
  // ==============================

  function animate(now) {

    const delta =
      Math.min(32, now - lastFrame);

    lastFrame = now;


    // Stop the animation clock while scrolling
    if (!scrolling) {
      animationTime += delta;
    }


    const t =
      animationTime * SPEED;


    for (const item of items) {

      const element = item.element;

      if (!element.isConnected) continue;


      // ==================================
      // HORIZONTAL OSCILLATION
      // ==================================

      const horizontalWave =
        Math.sin(
          item.phase +
          t * item.frequency
        ) *
        item.amplitude *
        item.horizontalStrength;


      // Second wave makes movement less predictable
      const horizontalWave2 =
        Math.cos(
          item.phase * 1.73 +
          t * 0.61
        ) *
        FLOW_RANGE *
        0.35;


      const x =
        horizontalWave +
        horizontalWave2;


      // ==================================
      // VERTICAL OSCILLATION
      // ==================================

      const verticalWave =
        Math.cos(
          item.phase * 0.83 +
          t * item.frequency * 0.82
        ) *
        item.amplitude *
        item.verticalStrength;


      // Second vertical wave
      const verticalWave2 =
        Math.sin(
          item.phase * 1.91 +
          t * 0.53
        ) *
        FLOW_RANGE *
        0.3;


      const y =
        verticalWave +
        verticalWave2;


      // ==================================
      // SMALL ROTATION
      // ==================================

      const rotation =
        Math.sin(
          item.phase +
          t * 0.7
        ) *
        item.rotationAmount;


      // ==================================
      // SMALL CONTINUOUS DRIFT
      // ==================================

      const drift =
        Math.sin(
          item.phase * 0.47 +
          t * 0.84
        ) *
        FLOW_RANGE *
        0.15;


      const finalX =
        x +
        drift +
        (animationTime *
          item.drift *
          SPEED *
          2);


      // ==================================
      // APPLY MOVEMENT
      // ==================================

      element.style.transform =
        `translate3d(
          ${finalX.toFixed(2)}px,
          ${y.toFixed(2)}px,
          0
        )
        rotate(${rotation.toFixed(2)}deg)
        ` +
        (
          item.originalTransform
            ? ` ${item.originalTransform}`
            : ""
        );
    }


    rafId =
      requestAnimationFrame(animate);
  }


  // ==============================
  // RESCAN PAGE
  // ==============================

  function scheduleCollect() {

    clearTimeout(scanTimer);

    scanTimer =
      setTimeout(
        collect,
        120
      );
  }


  // ==============================
  // START SYSTEM
  // ==============================

  function setup() {

    collect();

    rafId =
      requestAnimationFrame(
        animate
      );


    // ==============================
    // SCROLL DETECTION
    // ==============================

    window.addEventListener(
      "scroll",

      () => {

        scrolling = true;

        clearTimeout(
          scrollTimer
        );


        scrollTimer =
          setTimeout(
            () => {

              scrolling = false;

              scheduleCollect();

            },
            SCROLL_PAUSE_MS
          );
      },

      {
        passive: true
      }
    );


    // ==============================
    // WINDOW RESIZE
    // ==============================

    window.addEventListener(
      "resize",
      scheduleCollect,
      {
        passive: true
      }
    );


    // ==============================
    // DETECT NEW PAGE CONTENT
    // ==============================

    new MutationObserver(
      scheduleCollect
    ).observe(
      document.body,
      {
        childList: true,
        subtree: true
      }
    );
  }


  // ==============================
  // CHECK EXTENSION STATUS
  // ==============================

  chrome.storage.local.get(
    ["enabled"],

    result => {

      if (
        result.enabled !== false
      ) {
        setup();
      }

    }
  );

})();