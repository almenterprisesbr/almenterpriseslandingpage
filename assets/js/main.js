(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Nav: solid on scroll + mobile burger ---------- */

  var nav = document.getElementById("nav");
  var burger = document.getElementById("navBurger");
  var navLinks = document.querySelector(".nav__links");

  function updateNavState() {
    if (window.scrollY > 40) {
      nav.classList.add("is-scrolled");
    } else {
      nav.classList.remove("is-scrolled");
    }
  }
  updateNavState();
  window.addEventListener("scroll", updateNavState, { passive: true });

  if (burger && navLinks) {
    burger.addEventListener("click", function () {
      var open = navLinks.classList.toggle("is-open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  /* ---------- Hero scroll captions ---------- */

  var heroWrap = document.getElementById("heroWrap");
  var captionItems = document.querySelectorAll("#heroCaptions li");
  var scrollCue = document.getElementById("heroScrollCue");

  function updateHeroScroll() {
    if (!heroWrap) return;

    var rect = heroWrap.getBoundingClientRect();
    var total = rect.height - window.innerHeight;
    var progress = total > 0 ? Math.min(Math.max(-rect.top / total, 0), 1) : 0;

    if (captionItems.length) {
      var slot = 1 / captionItems.length;
      var activeIndex = Math.min(
        captionItems.length - 1,
        Math.floor(progress / slot)
      );
      captionItems.forEach(function (item, i) {
        item.classList.toggle("is-active", i === activeIndex && progress > 0.02 && progress < 0.98);
      });
    }

    if (scrollCue) {
      scrollCue.classList.toggle("is-hidden", progress > 0.05);
    }
  }

  updateHeroScroll();
  window.addEventListener("scroll", updateHeroScroll, { passive: true });
  window.addEventListener("resize", updateHeroScroll);

  /* ---------- Hero background: quiet particle field (placeholder for the future video) ---------- */

  var canvas = document.getElementById("heroCanvas");

  if (canvas && !reduceMotion) {
    var ctx = canvas.getContext("2d");
    var particles = [];
    var width, height, dpr;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      var count = Math.round((width * height) / 22000);
      particles = [];
      for (var i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          r: Math.random() * 1.4 + 0.4,
          vy: Math.random() * 0.12 + 0.03,
          drift: Math.random() * 0.3 - 0.15,
          alpha: Math.random() * 0.5 + 0.15,
          red: Math.random() < 0.18
        });
      }
    }

    function tick() {
      ctx.clearRect(0, 0, width, height);
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.y -= p.vy;
        p.x += p.drift * 0.02;
        if (p.y < -4) { p.y = height + 4; p.x = Math.random() * width; }
        if (p.x < -4) p.x = width + 4;
        if (p.x > width + 4) p.x = -4;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.red
          ? "rgba(226, 18, 42, " + p.alpha + ")"
          : "rgba(245, 244, 242, " + (p.alpha * 0.6) + ")";
        ctx.fill();
      }
      requestAnimationFrame(tick);
    }

    resize();
    window.addEventListener("resize", resize);
    requestAnimationFrame(tick);
  }
})();
