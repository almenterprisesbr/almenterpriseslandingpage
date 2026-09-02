(function () {
  "use strict";

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
})();
