/* ============================================================
   MA GROWTH — main.js
   Intro em vídeo + grid cinético + typing + reveals + navegação
   Sem dependências externas.
   ============================================================ */

(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var isTouch = window.matchMedia("(hover: none)").matches;

  /* revela os itens da hero (usado ao fim do vídeo de intro, ou de imediato
     quando o vídeo é pulado / não roda) */
  function revealHero() {
    var items = document.querySelectorAll("#top [data-reveal]");
    for (var i = 0; i < items.length; i++) items[i].classList.add("is-visible");
  }

  /* true enquanto o vídeo de intro está tocando: pausa o grid cinético
     (module 1) pra dar o motor inteiro pro vídeo, sem disputa de CPU/GPU */
  var introActive = false;
  var startGrid = function () {}; // preenchido pelo module 1

  /* 0 a 1: o quanto o visitante já rolou dentro da hero. Usado pelo grid
     (module 1) pra "acender" a malha conforme a pessoa rola, criando a
     animação de scroll pedida — e volta a 0 assim que a hero sai da tela,
     pra não ficar queimado nas seções de baixo (module 5 escreve aqui). */
  var heroScrollProgress = 0;

  /* ==========================================================
     0. INTRO — vídeo cinematográfico de abertura
     Roda em toda visita. Some ao terminar, revelando a hero por
     baixo já em movimento (fade + subida).
     ========================================================== */

  (function introVideo() {
    var overlay = document.getElementById("intro");
    var video = document.getElementById("introVideo");
    var skipBtn = document.getElementById("introSkip");
    var soundBtn = document.getElementById("introSound");
    var playBtn = document.getElementById("introPlay");
    if (!overlay || !video) { revealHero(); return; }

    var canPlayMp4 = !!(video.canPlayType && video.canPlayType("video/mp4"));

    if (reduceMotion || !canPlayMp4) {
      overlay.hidden = true;
      revealHero();
      return;
    }

    /* recorte vertical dedicado pro celular: o corte central do vídeo
       original (16:9) fica apertado demais numa tela de celular */
    var isMobileViewport = window.matchMedia("(max-width: 640px)").matches;
    video.poster = isMobileViewport
      ? "assets/img/intro-poster-mobile.jpg"
      : "assets/img/intro-poster.jpg";
    video.src = isMobileViewport
      ? "assets/video/intro-mobile.mp4"
      : "assets/video/intro.mp4";

    introActive = true;
    document.documentElement.style.overflow = "hidden";

    var done = false;
    function finish() {
      if (done) return;
      done = true;
      overlay.classList.add("is-done");
      document.documentElement.style.overflow = "";
      introActive = false;
      startGrid();
      revealHero();
      video.pause();
      setTimeout(function () { overlay.hidden = true; }, 1000);
    }

    video.addEventListener("ended", finish);
    video.addEventListener("error", finish);
    skipBtn.addEventListener("click", finish);

    soundBtn.addEventListener("click", function () {
      video.muted = !video.muted;
      soundBtn.setAttribute("aria-pressed", String(!video.muted));
    });

    var playAttempt = video.play();
    if (playAttempt && typeof playAttempt.catch === "function") {
      playAttempt.catch(function () {
        if (!playBtn) return;
        playBtn.hidden = false;
        playBtn.addEventListener("click", function () {
          playBtn.hidden = true;
          video.play().catch(finish);
        }, { once: true });
      });
    }

    /* nunca prende o visitante atrás do vídeo: se nada acontecer, segue pro site */
    setTimeout(function () {
      if (video.paused && video.currentTime === 0) finish();
    }, 6000);
  })();

  /* ==========================================================
     1. KINETIC GRID — canvas de fundo
     Adaptado do componente KineticGrid, com intensidade
     bem reduzida: as linhas quase somem e só acendem perto
     do cursor. Objetivo: tecnológico, não poluído.
     ========================================================== */

  (function kineticGrid() {
    var canvas = document.getElementById("gridCanvas");
    if (!canvas) return;

    var ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    /* --- Ajustes de intensidade (o "volume" do efeito) ---
       Reduzido depois do vídeo de abertura: logo após um momento de
       alta atenção (o vídeo), menos estímulo simultâneo compete com
       o headline e o CTA (heurística de carga cognitiva / hierarquia
       visual, Nielsen Norman Group). */
    var CELL          = 74;    // espaçamento da malha: maior = mais limpo
    var INFLUENCE     = 200;   // raio de alcance do cursor
    var MAX_WARP      = 12;    // o quanto a malha deforma
    var LERP          = 0.085; // suavidade do cursor
    var DOT_SPACING   = 34;

    var LINE_BASE   = { r: 242, g: 242, b: 244, a: 0.026 }; // quase invisível
    var LINE_ACTIVE = { r: 255, g: 108, b: 116, a: 0.20  }; // acende suave
    var NODE_BASE   = { r: 242, g: 242, b: 244, a: 0.055 };
    var NODE_ACTIVE = { r: 255, g: 120, b: 128, a: 0.40  };
    var GLOW_RGB    = "227,6,19";

    var NODE_R_BASE   = 1.0;
    var NODE_R_ACTIVE = 2.0;

    var dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    var W = 0, H = 0;

    var mouse  = { x: -9999, y: -9999 };
    var target = { x: -9999, y: -9999 };
    var ripples = [];
    var raf = 0;
    var running = false;
    var idleFrames = 0;

    function resize() {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width  = Math.floor(W * dpr);
      canvas.height = Math.floor(H * dpr);
      canvas.style.width  = W + "px";
      canvas.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      idleFrames = 0;
    }

    function lerpN(a, b, t) { return a + (b - a) * t; }

    function lerpColor(base, active, t) {
      var r = Math.round(lerpN(base.r, active.r, t));
      var g = Math.round(lerpN(base.g, active.g, t));
      var b = Math.round(lerpN(base.b, active.b, t));
      var a = lerpN(base.a, active.a, t);
      return "rgba(" + r + "," + g + "," + b + "," + a.toFixed(3) + ")";
    }

    // Deforma um ponto da malha conforme cursor e ondas de clique.
    function warp(gx, gy, col, row, cols, rows) {
      // "prende" as bordas para a malha não descolar da tela
      var margin = 1.5;
      var colPin = Math.min(col / margin, (cols - 1 - col) / margin, 1);
      var rowPin = Math.min(row / margin, (rows - 1 - row) / margin, 1);
      var pin = colPin * colPin * rowPin * rowPin;

      var dx = gx - mouse.x;
      var dy = gy - mouse.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      var proximity = Math.max(0, 1 - dist / INFLUENCE) * pin;

      var rx = 0, ry = 0;
      for (var i = 0; i < ripples.length; i++) {
        var rp = ripples[i];
        var rdx = gx - rp.x, rdy = gy - rp.y;
        var rdist = Math.sqrt(rdx * rdx + rdy * rdy);
        var band = 60;
        var diff = rdist - rp.radius;
        if (Math.abs(diff) < band) {
          var strength = (1 - Math.abs(diff) / band) * rp.opacity * 11 * pin;
          var ang = Math.atan2(rdy, rdx);
          var sign = diff < 0 ? -1 : 1;
          rx += Math.cos(ang) * strength * sign * -1;
          ry += Math.sin(ang) * strength * sign * -1;
        }
      }

      if (dist < INFLUENCE && dist > 0 && pin > 0) {
        var t = dist / INFLUENCE;
        var eased = t < 0.01 ? 0 : (1 - t) * (1 - t) * Math.min(1, dist / 60);
        var amt = eased * MAX_WARP * pin;
        var a = Math.atan2(dy, dx);
        return {
          x: gx - Math.cos(a) * amt + rx,
          y: gy - Math.sin(a) * amt + ry,
          p: proximity
        };
      }
      return { x: gx + rx, y: gy + ry, p: proximity };
    }

    function draw(now) {
      ctx.clearRect(0, 0, W, H);

      // a malha "acende" sozinha conforme a pessoa rola a hero, além de
      // reagir ao cursor — é a animação de scroll pedida, usando o que já
      // existe em vez de mais um elemento novo pra pesar na página
      var scrollBoost = heroScrollProgress * 0.55;

      // textura de pontos estática — dá "profundidade" sem pesar
      ctx.fillStyle = "rgba(242,242,244,0.016)";
      for (var dx = DOT_SPACING / 2; dx < W; dx += DOT_SPACING) {
        for (var dy = DOT_SPACING / 2; dy < H; dy += DOT_SPACING) {
          ctx.fillRect(dx, dy, 1, 1);
        }
      }

      // atualiza ondas de clique
      for (var i = ripples.length - 1; i >= 0; i--) {
        var rp = ripples[i];
        var age = (now - rp.born) / 1000;
        rp.radius  = Math.max(0, age * 380);
        rp.opacity = Math.max(0, 1 - age * 1.35);
        if (rp.opacity <= 0) ripples.splice(i, 1);
      }

      var cols = Math.max(2, Math.ceil(W / CELL)) + 1;
      var rows = Math.max(2, Math.ceil(H / CELL)) + 1;
      var cw = W / (cols - 1);
      var ch = H / (rows - 1);

      var pts = [];
      for (var row = 0; row < rows; row++) {
        pts[row] = [];
        for (var col = 0; col < cols; col++) {
          pts[row][col] = warp(col * cw, row * ch, col, row, cols, rows);
        }
      }

      function segment(p1, p2) {
        var avg = (p1.p + p2.p) / 2;
        var t = Math.max(avg * avg * (3 - 2 * avg), scrollBoost); // smoothstep + boost de scroll
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = lerpColor(LINE_BASE, LINE_ACTIVE, t);
        ctx.lineWidth = lerpN(0.7, 1.15, t);
        ctx.stroke();
      }

      for (var r1 = 0; r1 < rows; r1++)
        for (var c1 = 0; c1 < cols - 1; c1++)
          segment(pts[r1][c1], pts[r1][c1 + 1]);

      for (var c2 = 0; c2 < cols; c2++)
        for (var r2 = 0; r2 < rows - 1; r2++)
          segment(pts[r2][c2], pts[r2 + 1][c2]);

      // nós das interseções
      for (var r3 = 0; r3 < rows; r3++) {
        for (var c3 = 0; c3 < cols; c3++) {
          var p = pts[r3][c3];
          var t3 = Math.max(p.p * p.p * (3 - 2 * p.p), scrollBoost);
          var rad = lerpN(NODE_R_BASE, NODE_R_ACTIVE, t3);

          if (t3 > 0.35) {
            var gr = rad + lerpN(0, 7, (t3 - 0.35) / 0.65);
            var grd = ctx.createRadialGradient(p.x, p.y, rad * 0.5, p.x, p.y, gr);
            grd.addColorStop(0, "rgba(" + GLOW_RGB + "," + (t3 * 0.10).toFixed(3) + ")");
            grd.addColorStop(1, "rgba(" + GLOW_RGB + ",0)");
            ctx.beginPath();
            ctx.arc(p.x, p.y, gr, 0, Math.PI * 2);
            ctx.fillStyle = grd;
            ctx.fill();
          }

          ctx.beginPath();
          ctx.arc(p.x, p.y, rad, 0, Math.PI * 2);
          ctx.fillStyle = lerpColor(NODE_BASE, NODE_ACTIVE, t3);
          ctx.fill();
        }
      }

      // anel das ondas de clique
      for (var k = 0; k < ripples.length; k++) {
        var rr = ripples[k];
        ctx.beginPath();
        ctx.arc(rr.x, rr.y, Math.max(0, rr.radius), 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(" + GLOW_RGB + "," + (rr.opacity * 0.16).toFixed(3) + ")";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    function frame(now) {
      var moved = Math.abs(target.x - mouse.x) + Math.abs(target.y - mouse.y);

      mouse.x = lerpN(mouse.x, target.x, LERP);
      mouse.y = lerpN(mouse.y, target.y, LERP);

      // Se nada está acontecendo, para de desenhar (economiza bateria).
      // Enquanto a hero está sendo rolada, o boost de scroll conta como
      // "acontecendo" pra malha continuar redesenhando e acompanhar o scroll.
      if (moved < 0.3 && ripples.length === 0 && heroScrollProgress === 0) {
        idleFrames++;
      } else {
        idleFrames = 0;
      }

      if (idleFrames < 3) draw(now);

      raf = requestAnimationFrame(frame);
    }

    function start() {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(frame);
    }
    function stop() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    }

    resize();
    window.addEventListener("resize", function () {
      dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      resize();
    });

    if (!isTouch) {
      window.addEventListener("mousemove", function (e) {
        target.x = e.clientX;
        target.y = e.clientY;
      }, { passive: true });

      window.addEventListener("mouseleave", function () {
        target.x = -9999; target.y = -9999;
      });
    }

    // Onda ao clicar/tocar em qualquer lugar
    window.addEventListener("click", function (e) {
      ripples.push({
        x: e.clientX, y: e.clientY,
        radius: 0, opacity: 1,
        born: performance.now()
      });
      idleFrames = 0;
    }, { passive: true });

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stop(); else if (!introActive) start();
    });

    // desenha um primeiro quadro e revela o canvas
    draw(performance.now());
    canvas.classList.add("is-ready");
    startGrid = start;
    if (!reduceMotion && !introActive) start();
  })();

  /* ==========================================================
     2. TYPING — headline que digita as três frases
     ========================================================== */

  /* Roda uma vez e assenta na última frase, sem ficar girando pra sempre.
     Um carrossel/texto que troca sozinho sem parar tira do visitante a
     chance de ler no próprio ritmo e prejudica a retenção da mensagem
     (Nielsen Norman Group, "Auto-Forwarding Carousels... Reduce
     Visibility"). Terminar parado em "ser escolhido." também aproveita
     o efeito de recência: a última coisa vista é a que mais fica. */
  (function typing() {
    var el = document.getElementById("heroTyped");
    if (!el) return;

    var phrases = ["ser visto.", "ser lembrado.", "ser escolhido."];

    if (reduceMotion) {
      el.textContent = phrases[phrases.length - 1];
      return;
    }

    var TYPE = 55;    // ms por caractere ao escrever
    var ERASE = 28;   // ms por caractere ao apagar
    var HOLD = 1700;  // pausa com a frase completa
    var GAP = 320;    // pausa antes de escrever a próxima

    var idx = 0, char = 0, erasing = false;

    function tick() {
      var full = phrases[idx];

      if (!erasing) {
        char++;
        el.textContent = full.slice(0, char);
        if (char === full.length) {
          erasing = true;
          return setTimeout(tick, HOLD);
        }
        return setTimeout(tick, TYPE);
      }

      char--;
      el.textContent = full.slice(0, char);
      if (char === 0) {
        erasing = false;
        idx = (idx + 1) % phrases.length;
        return setTimeout(tick, GAP);
      }
      return setTimeout(tick, ERASE);
    }

    setTimeout(tick, 700);
  })();

  /* ==========================================================
     3. NAV — fundo ao rolar, link ativo, menu mobile
     ========================================================== */

  var nav = document.getElementById("nav");
  var burger = document.getElementById("navBurger");
  var menu = document.getElementById("mobileMenu");

  function onScrollNav() {
    if (!nav) return;
    nav.classList.toggle("is-scrolled", window.scrollY > 30);
  }
  onScrollNav();
  window.addEventListener("scroll", onScrollNav, { passive: true });

  if (burger && menu) {
    var openMenu = function () {
      menu.hidden = false;
      // força reflow para a transição de opacidade rodar
      void menu.offsetWidth;
      menu.classList.add("is-open");
      burger.classList.add("is-open");
      burger.setAttribute("aria-expanded", "true");
      burger.setAttribute("aria-label", "Fechar menu");
      document.body.style.overflow = "hidden";
    };

    var closeMenu = function () {
      menu.classList.remove("is-open");
      burger.classList.remove("is-open");
      burger.setAttribute("aria-expanded", "false");
      burger.setAttribute("aria-label", "Abrir menu");
      document.body.style.overflow = "";
      setTimeout(function () {
        if (!menu.classList.contains("is-open")) menu.hidden = true;
      }, 350);
    };

    burger.addEventListener("click", function () {
      if (menu.classList.contains("is-open")) closeMenu(); else openMenu();
    });

    menu.addEventListener("click", function (e) {
      if (e.target.closest("a")) closeMenu();
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menu.classList.contains("is-open")) closeMenu();
    });
  }

  /* link ativo conforme a seção visível */
  (function activeLink() {
    var links = Array.prototype.slice.call(document.querySelectorAll(".nav__links a"));
    if (!links.length || !("IntersectionObserver" in window)) return;

    var sections = links
      .map(function (a) { return document.querySelector(a.getAttribute("href")); })
      .filter(Boolean);

    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (a) {
          a.classList.toggle("is-current", a.getAttribute("href") === "#" + entry.target.id);
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });

    sections.forEach(function (s) { obs.observe(s); });
  })();

  /* ==========================================================
     4. REVEAL — entrada dos elementos ao rolar
     ========================================================== */

  (function reveal() {
    /* a hero é revelada à parte, em sincronia com o fim do vídeo de intro */
    var items = Array.prototype.filter.call(
      document.querySelectorAll("[data-reveal]"),
      function (el) { return !el.closest("#top"); }
    );
    if (!items.length) return;

    if (!("IntersectionObserver" in window) || reduceMotion) {
      items.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }

    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });

    items.forEach(function (el) { obs.observe(el); });
  })();

  /* ==========================================================
     5. HERO — legendas e parallax durante o scroll
     ========================================================== */

  (function heroScroll() {
    var wrap = document.getElementById("heroWrap");
    var content = document.querySelector(".hero__content");
    var captions = document.querySelectorAll("#heroCaptions li");
    var cue = document.getElementById("heroScrollCue");
    if (!wrap) return;

    var ticking = false;

    function update() {
      var rect = wrap.getBoundingClientRect();
      var total = rect.height - window.innerHeight;
      var progress = total > 0 ? Math.min(Math.max(-rect.top / total, 0), 1) : 0;

      // acende o grid cinético conforme rola a hero; some assim que ela
      // sai de vista, pra não ficar queimado no resto da página
      heroScrollProgress = rect.bottom > 0 ? progress : 0;

      // o conteúdo sobe e some rápido — uma rolagem já basta pra sensação
      // de "saída", em vez de ir sumindo aos poucos por várias telas
      if (content && !reduceMotion) {
        var fade = Math.max(0, 1 - progress * 2.1);
        content.style.opacity = fade.toFixed(3);
        content.style.transform = "translateY(" + (-progress * 60).toFixed(1) + "px) scale(" +
                                  (1 - progress * 0.07).toFixed(4) + ")";
      }

      if (captions.length) {
        var slot = 1 / captions.length;
        var active = Math.min(captions.length - 1, Math.floor(progress / slot));
        for (var i = 0; i < captions.length; i++) {
          captions[i].classList.toggle(
            "is-active",
            i === active && progress > 0.04 && progress < 0.94
          );
        }
      }

      if (cue) cue.classList.toggle("is-hidden", progress > 0.04);

      ticking = false;
    }

    function onScroll() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
  })();

  /* ==========================================================
     6. CARDS — brilho que acompanha o cursor
     ========================================================== */

  if (!isTouch) {
    document.querySelectorAll(".card").forEach(function (card) {
      card.addEventListener("mousemove", function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty("--mx", (e.clientX - r.left) + "px");
        card.style.setProperty("--my", (e.clientY - r.top) + "px");
      }, { passive: true });
    });
  }

  /* ==========================================================
     7. SERVIÇOS — lista com prévia flutuante no hover
     ========================================================== */

  (function hoverShowcase() {
    var list = document.getElementById("hoverList");
    var ghost = document.getElementById("hoverGhost");
    if (!list || !ghost || isTouch) return;

    // move o ghost pra fora do container animado: um ancestral com
    // transform (mesmo a caminho de "none", em transição) vira o novo
    // containing block de todo position:fixed dentro dele, e o preview
    // acaba grudado no lugar errado da tela em vez de seguir o cursor
    document.body.appendChild(ghost);

    var items = list.querySelectorAll(".hoverlist__item");
    var mocks = ghost.querySelectorAll(".mock");

    items.forEach(function (item) {
      var key = item.getAttribute("data-mock");

      item.addEventListener("mouseenter", function () {
        mocks.forEach(function (m) {
          m.classList.toggle("is-active", m.classList.contains("mock--" + key));
        });
        ghost.classList.add("is-visible");
      });
    });

    list.addEventListener("mousemove", function (e) {
      ghost.style.left = e.clientX + "px";
      ghost.style.top = e.clientY + "px";
    }, { passive: true });

    list.addEventListener("mouseleave", function () {
      ghost.classList.remove("is-visible");
    });
  })();

  /* ==========================================================
     8. PRÉVIA EM TELA CHEIA — mockup de laptop com o vídeo do projeto
     Abre ao clicar no item "Sites & Landing Pages" da lista de serviços.
     ========================================================== */

  (function deviceModal() {
    var modal = document.getElementById("deviceModal");
    var closeBtn = document.getElementById("deviceModalClose");
    var video = document.getElementById("deviceModalVideo");
    var placeholder = document.getElementById("deviceModalPlaceholder");
    var soundBtn = document.getElementById("deviceModalSound");
    var phoneSoundBtn = document.getElementById("phoneSound");
    var panels = modal ? modal.querySelectorAll(".device-modal__panel") : [];
    var triggers = document.querySelectorAll(".hoverlist__item[data-device]");
    if (!modal || !triggers.length) return;

    var hasVideo = !!(video && video.getAttribute("src"));

    if (video) video.muted = false;

    function toggleSound(btn, mediaEl) {
      if (!btn || !mediaEl) return;
      mediaEl.muted = !mediaEl.muted;
      btn.setAttribute("aria-pressed", String(!mediaEl.muted));
    }

    if (soundBtn && video) {
      soundBtn.addEventListener("click", function () { toggleSound(soundBtn, video); });
    }

    if (phoneSoundBtn) {
      phoneSoundBtn.addEventListener("click", function () {
        var activeVideo = document.querySelector(".device-modal__phone-slide video");
        toggleSound(phoneSoundBtn, activeVideo);
      });
    }

    function showPanel(name) {
      panels.forEach(function (panel) {
        panel.hidden = panel.getAttribute("data-panel") !== name;
      });
    }

    var returnFocus;
    var niches = document.getElementById("socialNiches");
    var galleryButtons = niches.querySelectorAll(".niche-cover[aria-controls]");
    function showNiches() {
      niches.hidden = false;
      galleryButtons.forEach(function (button) {
        document.getElementById(button.getAttribute("aria-controls")).hidden = true;
        button.setAttribute("aria-expanded", "false");
      });
    }
    galleryButtons.forEach(function (button) {
      var gallery = document.getElementById(button.getAttribute("aria-controls"));
      button.addEventListener("click", function () {
        showNiches();
        niches.hidden = true;
        gallery.hidden = false;
        button.setAttribute("aria-expanded", "true");
        gallery.querySelector("h2").focus();
      });
      gallery.querySelector(".niche-back").addEventListener("click", function () {
        showNiches();
        button.focus();
      });
    });

    function open(deviceType) {
      returnFocus = document.activeElement;
      showNiches();
      showPanel(deviceType);
      modal.classList.add("is-open");
      modal.setAttribute("aria-hidden", "false");
      closeBtn.focus();
      document.documentElement.style.overflow = "hidden";
      if (deviceType === "mac" && hasVideo && video) video.play().catch(function () {});
    }

    function close() {
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
      document.documentElement.style.overflow = "";
      if (video) video.pause();
      if (returnFocus) returnFocus.focus();
    }

    triggers.forEach(function (trigger) {
      var deviceType = trigger.getAttribute("data-device");
      trigger.addEventListener("click", function () { open(deviceType); });
      trigger.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(deviceType); }
      });
    });

    if (closeBtn) closeBtn.addEventListener("click", close);

    modal.addEventListener("click", function (e) {
      if (e.target === modal) close();
    });

    document.addEventListener("keydown", function (e) {
      if (!modal.classList.contains("is-open")) return;
      if (e.key === "Escape") close();
      if (e.key === "Tab") {
        var focusable = Array.from(modal.querySelectorAll('button, a[href], [tabindex="0"]')).filter(function (el) { return !el.disabled && el.getClientRects().length; });
        var first = focusable[0], last = focusable[focusable.length - 1];
        if (e.shiftKey && (document.activeElement === first || !focusable.includes(document.activeElement))) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });

    if (placeholder) placeholder.hidden = hasVideo;

    var ctaButtons = modal.querySelectorAll(".device-modal__cta[data-service-target]");
    ctaButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var service = btn.getAttribute("data-service-target");
        close();

        var servicos = document.getElementById("servicos");
        var targetSelect = document.querySelector('.card__select[data-service="' + service + '"]');

        if (servicos) servicos.scrollIntoView({ behavior: "smooth", block: "start" });

        if (targetSelect) {
          setTimeout(function () {
            if (targetSelect.getAttribute("aria-pressed") !== "true") targetSelect.click();
            var card = targetSelect.closest(".card, .ecosystem");
            if (card) card.scrollIntoView({ behavior: "smooth", block: "center" });
          }, 450);
        }
      });
    });

    var phoneScreen = document.getElementById("phoneScreen");
    var phoneHint = document.getElementById("phoneHint");
    if (phoneScreen && phoneHint) {
      phoneScreen.addEventListener("scroll", function () {
        var atLast = phoneScreen.scrollTop >= phoneScreen.scrollHeight - phoneScreen.clientHeight - 4;
        phoneHint.classList.toggle("is-dismissed", atLast);
      }, { passive: true });
    }
  })();

  /* ==========================================================
     9. CARROSSEL DE POSTS — dentro do modal, painel "carousel"
     ========================================================== */

  (function postsCarousel() {
    var track = document.getElementById("carouselTrack");
    var dotsWrap = document.getElementById("carouselDots");
    var prevBtn = document.getElementById("carouselPrev");
    var nextBtn = document.getElementById("carouselNext");
    if (!track || !dotsWrap) return;

    var slides = track.querySelectorAll(".carousel__slide");
    var count = slides.length;
    var active = 0;

    for (var i = 0; i < count; i++) {
      (function (index) {
        var dot = document.createElement("button");
        dot.type = "button";
        dot.className = "carousel__dot";
        dot.setAttribute("aria-label", "Ir para o post " + (index + 1));
        dot.addEventListener("click", function () { goTo(index); });
        dotsWrap.appendChild(dot);
      })(i);
    }
    var dots = dotsWrap.querySelectorAll(".carousel__dot");

    function render() {
      slides.forEach(function (slide, index) {
        var raw = index - active;
        if (raw > count / 2) raw -= count;
        if (raw < -count / 2) raw += count;
        slide.style.setProperty("--offset", raw);
        slide.style.setProperty("--dist", Math.min(Math.abs(raw), 3));
        slide.setAttribute("data-active", raw === 0 ? "true" : "false");
      });
      dots.forEach(function (dot, index) { dot.classList.toggle("is-active", index === active); });
    }

    function goTo(index) {
      active = ((index % count) + count) % count;
      render();
    }

    if (prevBtn) prevBtn.addEventListener("click", function () { goTo(active - 1); });
    if (nextBtn) nextBtn.addEventListener("click", function () { goTo(active + 1); });

    render();
  })();

  /* ==========================================================
     9b. SLIDER ANTES/DEPOIS — comparação nas abas de identidade visual
     ========================================================== */

  (function compareSliders() {
    var sliders = document.querySelectorAll("[data-compare-slider]");
    if (!sliders.length) return;

    sliders.forEach(function (slider) {
      var dragging = false;

      function setPosFromClientX(clientX) {
        var rect = slider.getBoundingClientRect();
        var pct = ((clientX - rect.left) / rect.width) * 100;
        pct = Math.max(4, Math.min(96, pct));
        slider.style.setProperty("--pos", pct + "%");
      }

      function onMove(e) {
        if (!dragging) return;
        var clientX = e.touches ? e.touches[0].clientX : e.clientX;
        setPosFromClientX(clientX);
      }

      function stopDrag() {
        dragging = false;
      }

      slider.addEventListener("pointerdown", function (e) {
        dragging = true;
        setPosFromClientX(e.clientX);
      });
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", stopDrag);

      slider.addEventListener("touchstart", function (e) {
        dragging = true;
        setPosFromClientX(e.touches[0].clientX);
      }, { passive: true });
      slider.addEventListener("touchmove", onMove, { passive: true });
      slider.addEventListener("touchend", stopDrag);

      slider.addEventListener("keydown", function (e) {
        var current = parseFloat(getComputedStyle(slider).getPropertyValue("--pos")) || 50;
        if (e.key === "ArrowLeft") { slider.style.setProperty("--pos", Math.max(4, current - 5) + "%"); }
        if (e.key === "ArrowRight") { slider.style.setProperty("--pos", Math.min(96, current + 5) + "%"); }
      });
      slider.setAttribute("tabindex", "0");
      slider.setAttribute("role", "slider");
      slider.setAttribute("aria-label", "Arraste para comparar antes e depois");
      slider.setAttribute("aria-valuemin", "0");
      slider.setAttribute("aria-valuemax", "100");
    });
  })();

  /* ==========================================================
     10. ABAS DE IDENTIDADE VISUAL — dentro do modal, painel "tabs"
     ========================================================== */

  (function identityTabs() {
    var bar = document.getElementById("idTabsBar");
    var panelsWrap = document.getElementById("idTabsPanels");
    if (!bar || !panelsWrap) return;

    var buttons = bar.querySelectorAll(".id-tabs__btn");
    var panels = panelsWrap.querySelectorAll(".id-tabs__panel");

    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var key = btn.getAttribute("data-tab");
        buttons.forEach(function (b) {
          var active = b === btn;
          b.classList.toggle("is-active", active);
          b.setAttribute("aria-selected", String(active));
        });
        panels.forEach(function (panel) {
          panel.classList.toggle("is-active", panel.getAttribute("data-tab-panel") === key);
        });
      });
    });
  })();

  /* ==========================================================
     12. Ano no rodapé
     ========================================================== */

  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();


  /* ==========================================================
     13b. TYPE ONCE — títulos que digitam sozinhos ao entrar na tela
     (Ponto Cego, citação do Sobre, título do Contato). Roda uma vez
     só, sem loop — só a headline da hero (module 2) repete.
     ========================================================== */

  (function typeOnceHeadlines() {
    var targets = [
      { text: "O seu cliente não escolhe quem ele não lembra.", textId: "blindTyped", caretId: "blindCaret", speed: 26 },
      { text: "Cada peça do seu digital, feita para levar à venda.", textId: "servicosTyped", caretId: "servicosCaret", speed: 28 },
      { text: "Um pouco sobre mim.", textId: "sobreTyped", caretId: "sobreCaret", speed: 24 },
      { text: "Vamos conversar sobre o seu projeto?", textId: "ctaTyped", caretId: "ctaCaret", speed: 20 }
    ];

    targets.forEach(function (t) {
      var textEl = document.getElementById(t.textId);
      var caretEl = document.getElementById(t.caretId);
      if (!textEl) return;

      if (reduceMotion || !("IntersectionObserver" in window)) {
        textEl.textContent = t.text;
        if (caretEl) caretEl.classList.add("is-done");
        return;
      }

      var root = textEl.closest("[data-reveal]") || textEl;
      var started = false;

      function run() {
        if (started) return;
        started = true;
        var i = 0;
        (function tick() {
          i++;
          textEl.textContent = t.text.slice(0, i);
          if (i < t.text.length) {
            setTimeout(tick, t.speed);
          } else if (caretEl) {
            caretEl.classList.add("is-done");
          }
        })();
      }

      var obs = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            run();
            obs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.4 });

      obs.observe(root);
    });
  })();

  /* ==========================================================
     13c. SELEÇÃO DE SERVIÇOS — marca interesse e monta a
     mensagem do WhatsApp com o que a pessoa escolheu
     ========================================================== */

  (function servicesSelect() {
    var buttons = document.querySelectorAll(".card__select");
    var link = document.getElementById("servicesWhatsapp");
    if (!buttons.length || !link) return;

    var selected = [];
    var BASE_URL = "https://wa.me/5513988631429?text=";
    var DEFAULT_MSG = "Olá Matheus, vim pelo site e quero falar sobre um projeto.";

    function updateLink() {
      var msg = selected.length
        ? "Olá Matheus, vim pelo site e tenho interesse em: " + selected.join(", ") + ". Pode me passar mais detalhes?"
        : DEFAULT_MSG;
      link.href = BASE_URL + encodeURIComponent(msg);
    }

    buttons.forEach(function (btn) {
      var service = btn.getAttribute("data-service");
      var card = btn.closest(".card, .ecosystem");

      btn.addEventListener("click", function () {
        var isOn = btn.getAttribute("aria-pressed") === "true";
        btn.setAttribute("aria-pressed", String(!isOn));
        if (card) card.setAttribute("data-selected", String(!isOn));

        var idx = selected.indexOf(service);
        if (!isOn && idx === -1) selected.push(service);
        if (isOn && idx !== -1) selected.splice(idx, 1);

        updateLink();
      });
    });
  })();

  /* ==========================================================
     13. SCROLL-JACK DA HERO — a primeira rolagem leva direto
     pro "ponto cego", sem passar pelo parallax inteiro da hero
     ========================================================== */

  (function heroScrollJack() {
    var target = document.getElementById("problema");
    if (!target || reduceMotion) return;
    var done = false;

    function jack(e) {
      if (done) return;
      if (introActive || window.scrollY > 40) { cleanup(); return; }
      done = true;
      if (e.cancelable) e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      cleanup();
    }

    function onKey(e) {
      if (["ArrowDown", "PageDown", " "].indexOf(e.key) !== -1) jack(e);
    }

    function cleanup() {
      window.removeEventListener("wheel", jack);
      window.removeEventListener("touchmove", jack);
      window.removeEventListener("keydown", onKey);
    }

    window.addEventListener("wheel", jack, { passive: false });
    window.addEventListener("touchmove", jack, { passive: false });
    window.addEventListener("keydown", onKey);
  })();
})();

/* ==========================================================
   VÍDEOS/ANÚNCIOS — interface estilo TikTok/Reels
   Abas por nicho (UGC · Produto · Anúncio) + feed que rola para ver o próximo
   ========================================================== */
(function () {
  var feed = document.getElementById("vidFeed");
  var tabs = document.getElementById("vidTabs");
  var swipe = document.getElementById("vidSwipe");
  var sound = document.getElementById("vidSound");
  var upBtn = document.getElementById("vidUp");
  var downBtn = document.getElementById("vidDown");
  var stage = document.getElementById("vidStage");
  if (!feed || !tabs || !swipe || !sound || !stage) return;

  var modal = document.getElementById("deviceModal");
  var panel = document.getElementById("panelPhone");
  var EDIT = !!window.VID_EDIT; /* só a página de prévia liga o modo edição */

  /* ===== EDITE AQUI ==========================================
     Um bloco { ... } por vídeo:
       src    → caminho do arquivo em assets/video/portfolio/  (ex.: "assets/video/portfolio/ugc-01.mp4")
                deixe "" para mostrar "Vídeo em breve"
       poster → (opcional) imagem de capa
       handle → o @ que aparece no vídeo
       desc   → a descrição
     Formato 9:16 ou 16:9: o site reconhece sozinho.
     ========================================================== */
  var VIDEOS = {
    ugc: [
      { src: "", poster: "", handle: "@almenterprises", desc: "Descrição do vídeo UGC. Edite aqui! #ugc #ia" },
      { src: "", poster: "", handle: "@almenterprises", desc: "Segundo vídeo UGC #ugc #conteudo" },
      { src: "", poster: "", handle: "@almenterprises", desc: "Terceiro vídeo UGC #ugc #ia" }
    ],
    produto: [
      { src: "", poster: "", handle: "@almenterprises", desc: "Vídeo de produto #produto #ia" },
      { src: "", poster: "", handle: "@almenterprises", desc: "Outro vídeo de produto #produto" },
      { src: "", poster: "", handle: "@almenterprises", desc: "Mais um produto #produto #ia" }
    ],
    anuncio: [
      { src: "", poster: "", handle: "@almenterprises", desc: "Anúncio comercial para o seu negócio #anuncio #ia" },
      { src: "", poster: "", handle: "@almenterprises", desc: "Outro anúncio comercial #anuncio" },
      { src: "", poster: "", handle: "@almenterprises", desc: "Mais um anúncio #anuncio #ia" }
    ],
    motion: [
      { src: "", poster: "", handle: "@almenterprises", desc: "Motion graphics para o seu negócio #motiongraphics #ia" },
      { src: "", poster: "", handle: "@almenterprises", desc: "Outro motion graphics #motiongraphics" },
      { src: "", poster: "", handle: "@almenterprises", desc: "Mais um motion #motiongraphics #ia" }
    ]
  };
  /* ===== FIM DA ÁREA DE EDIÇÃO ================================= */

  function svg(p, fill) { return '<svg viewBox="0 0 24 24" width="30" height="30" fill="' + (fill ? "currentColor" : "none") + '" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + "</svg>"; }
  var ICON = {
    heart: svg('<path d="M12 21s-7.5-4.8-9.6-9.5C.9 8.1 2.8 4.5 6.2 4.5c2 0 3.6 1.1 4.6 2.7h2.4c1-1.6 2.6-2.7 4.6-2.7 3.4 0 5.3 3.6 3.8 7C19.5 16.2 12 21 12 21z"/>', true),
    comment: svg('<path d="M4 4h16a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H9.5L4 21.5V5a1 1 0 0 1 0-1z"/>', true),
    share: svg('<path d="M14 3l8 8-8 8v-5c-5.5 0-9 1.6-11.500 5.500C3.500 11.500 7.500 8 14 8V3z"/>', true),
    play: svg('<path d="M8 5v14l11-7z"/>', true),
    pause: svg('<path d="M7 5h3.500v14H7zM13.500 5H17v14h-3.500z"/>', true),
    volOff: svg('<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M17 9l5 6M22 9l-5 6"/>'),
    volOn: svg('<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16.500 8.500a5 5 0 0 1 0 7M19 6a8.500 8.500 0 0 1 0 12"/>')
  };
  sound.innerHTML = ICON.volOff;
  sound.firstChild.setAttribute("width", "20");
  sound.firstChild.setAttribute("height", "20");

  var current = "ugc", muted = true, active = 0, ticking = false, slides = [];
  function noop() {}
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function isOpen() { return !modal || (modal.classList.contains("is-open") && panel && !panel.hidden); }
  function load(v) { if (!v.getAttribute("src") && v.dataset.src) { v.preload = "metadata"; v.src = v.dataset.src; } }

  function slideHTML(v) {
    var ce = EDIT ? ' contenteditable="true" spellcheck="false"' : "";
    var ed = EDIT ? " is-editable" : "";
    var handle = v.handle || "@usuario";
    var attach = '<label class="vid-attach">' + (EDIT ? "Anexar vídeo" : "") + '<input type="file" accept="video/*"></label>';
    return '<div class="vid-slide">' +
      '<div class="vid-media' + (v.src ? " has-video" : "") + '">' +
        '<video playsinline muted loop preload="none"' + (v.poster ? ' poster="' + esc(v.poster) + '"' : "") + (v.src ? ' data-src="' + esc(v.src) + '"' : "") + "></video>" +
        '<div class="vid-empty"><span>Vídeo em breve</span>' + (EDIT ? attach : "") + "</div>" +
        '<div class="vid-flash"></div>' +
      "</div>" +
      (EDIT ? '<label class="vid-attach vid-swap">Trocar vídeo<input type="file" accept="video/*"></label>' : "") +
      '<div class="vid-shade"></div>' +
      '<div class="vid-rail" aria-hidden="true">' +
        '<div class="vid-avatar">' + esc(handle.replace("@", "").charAt(0).toUpperCase() || "A") + "</div>" +
        '<div class="vid-act">' + ICON.heart + "<span>12,4 mil</span></div>" +
        '<div class="vid-act">' + ICON.comment + "<span>238</span></div>" +
        '<div class="vid-act">' + ICON.share + "<span>Enviar</span></div>" +
      "</div>" +
      '<div class="vid-info">' +
        '<div class="vid-handle' + ed + '"' + ce + ">" + esc(handle) + "</div>" +
        '<p class="vid-desc' + ed + '"' + ce + ">" + esc(v.desc || "") + "</p>" +
        '<div class="vid-music">&#9835; som original</div>' +
        '<button type="button" class="vid-cta" data-service-target="Vídeos/Anúncios com IA">Quero algo semelhante &rarr;</button>' +
      "</div>" +
      '<div class="vid-progress"><i></i></div>' +
    "</div>";
  }

  function bind(slide) {
    var media = slide.querySelector(".vid-media");
    var v = slide.querySelector("video");
    var flash = slide.querySelector(".vid-flash");
    var bar = slide.querySelector(".vid-progress i");
    v.addEventListener("loadedmetadata", function () { media.classList.toggle("is-wide", v.videoWidth > v.videoHeight); });
    v.addEventListener("timeupdate", function () { if (v.duration) bar.style.width = (v.currentTime / v.duration * 100) + "%"; });
    media.addEventListener("click", function (e) {
      if (e.target.closest("label") || !v.getAttribute("src")) return;
      var play = v.paused;
      if (play) v.play().catch(noop); else v.pause();
      flash.innerHTML = play ? ICON.play : ICON.pause;
      flash.classList.remove("is-on"); void flash.offsetWidth; flash.classList.add("is-on");
    });
    slide.querySelectorAll('input[type="file"]').forEach(function (inp) {
      inp.addEventListener("change", function () {
        var f = inp.files && inp.files[0];
        if (!f) return;
        v.removeAttribute("data-src");
        v.src = URL.createObjectURL(f);
        media.classList.add("has-video");
        sync();
      });
    });
  }

  function more() { tabs.classList.toggle("has-more", tabs.scrollLeft + tabs.clientWidth < tabs.scrollWidth - 4); }
  function sync() {
    more();
    var open = isOpen();
    slides.forEach(function (s, i) {
      var v = s.querySelector("video");
      if (open && (i === active || i === active + 1)) load(v);
      if (open && i === active && v.getAttribute("src")) { v.muted = muted; v.play().catch(noop); }
      else v.pause();
    });
  }
  function arrows() {
    if (upBtn) upBtn.disabled = active <= 0;
    if (downBtn) downBtn.disabled = active >= slides.length - 1;
  }
  function go(n) {
    var t = Math.max(0, Math.min(slides.length - 1, active + n));
    feed.scrollTo({ top: t * feed.clientHeight, behavior: "smooth" });
  }
  function render(niche) {
    current = niche;
    feed.innerHTML = VIDEOS[niche].map(slideHTML).join("");
    slides = [].slice.call(feed.querySelectorAll(".vid-slide"));
    slides.forEach(bind);
    feed.scrollTop = 0;
    active = 0;
    swipe.classList.toggle("is-gone", slides.length < 2);
    tabs.querySelectorAll("button").forEach(function (b) {
      var on = b.dataset.niche === niche;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", on);
    });
    var on = tabs.querySelector(".is-active");
    if (on) tabs.scrollTo({ left: on.offsetLeft - (tabs.clientWidth - on.offsetWidth) / 2, behavior: "smooth" });
    arrows();
    sync();
  }

  tabs.addEventListener("scroll", more, { passive: true });
  window.addEventListener("resize", more);
  tabs.addEventListener("click", function (e) { var b = e.target.closest("button"); if (b && b.dataset.niche !== current) render(b.dataset.niche); });
  feed.addEventListener("scroll", function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      if (feed.scrollTop > 24) swipe.classList.add("is-gone");
      var i = Math.round(feed.scrollTop / (feed.clientHeight || 1));
      if (i !== active) { active = i; arrows(); sync(); }
    });
  }, { passive: true });
  if (upBtn) upBtn.addEventListener("click", function () { go(-1); });
  if (downBtn) downBtn.addEventListener("click", function () { go(1); });
  document.addEventListener("keydown", function (e) {
    if (!isOpen() || (e.target.isContentEditable)) return;
    if (e.key === "ArrowDown") { e.preventDefault(); go(1); }
    if (e.key === "ArrowUp") { e.preventDefault(); go(-1); }
  });
  sound.addEventListener("click", function () {
    muted = !muted;
    sound.innerHTML = muted ? ICON.volOff : ICON.volOn;
    sound.firstChild.setAttribute("width", "20"); sound.firstChild.setAttribute("height", "20");
    sound.setAttribute("aria-pressed", String(!muted));
    sound.setAttribute("aria-label", muted ? "Ligar o som" : "Desligar o som");
    slides.forEach(function (s) { s.querySelector("video").muted = muted; });
  });

  /* botão "Quero algo semelhante": fecha o player e leva ao formulário de serviços */
  feed.addEventListener("click", function (e) {
    var b = e.target.closest(".vid-cta");
    if (!b) return;
    var closeBtn = document.getElementById("deviceModalClose");
    if (closeBtn) closeBtn.click();
    var service = b.getAttribute("data-service-target");
    var servicos = document.getElementById("servicos");
    var sel = document.querySelector('.card__select[data-service="' + service + '"]');
    if (servicos) servicos.scrollIntoView({ behavior: "smooth", block: "start" });
    if (sel) setTimeout(function () {
      if (sel.getAttribute("aria-pressed") !== "true") sel.click();
      var card = sel.closest(".card, .ecosystem");
      if (card) card.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 450);
  });

  /* toca só quando o player está aberto; pausa tudo ao fechar */
  if (modal) new MutationObserver(sync).observe(modal, { attributes: true, attributeFilter: ["class"] });
  if (panel) new MutationObserver(sync).observe(panel, { attributes: true, attributeFilter: ["hidden"] });

  if (EDIT) stage.insertAdjacentHTML("beforeend", '<div class="vid-edit-badge">Modo edição</div>');
  render("ugc");
})();
