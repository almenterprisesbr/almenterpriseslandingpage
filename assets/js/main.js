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
      document.querySelectorAll("[data-reveal], .step"),
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

      // o conteúdo sobe levemente e some — sensação de profundidade
      if (content && !reduceMotion) {
        var fade = Math.max(0, 1 - progress * 1.55);
        content.style.opacity = fade.toFixed(3);
        content.style.transform = "translateY(" + (-progress * 46).toFixed(1) + "px) scale(" +
                                  (1 - progress * 0.045).toFixed(4) + ")";
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
     8. GALERIA DE POSTS — pilha que abre em leque
     ========================================================== */

  (function postGallery() {
    var folder = document.getElementById("postFolder");
    var trigger = document.getElementById("folderTrigger");
    if (!folder || !trigger) return;

    trigger.addEventListener("click", function () {
      var open = folder.classList.toggle("is-open");
      trigger.setAttribute("aria-expanded", String(open));
    });
  })();

  /* ==========================================================
     9. FERRAMENTAS — carrossel de ícones das ferramentas usadas
     ========================================================== */

  (function toolsMarquee() {
    var track = document.getElementById("toolsTrack");
    if (!track) return;

    var TOOLS = [
      { name: "Photoshop", text: "Ps" },
      { name: "Illustrator", text: "Ai" },
      { name: "CapCut", svg: '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.1" y2="15.9"/><line x1="14.5" y1="14.5" x2="20" y2="20"/><line x1="8.1" y1="8.1" x2="12" y2="12"/>' },
      { name: "TikTok", svg: '<path d="M9 18V5l10-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="16" cy="16" r="3"/>' },
      { name: "WhatsApp", svg: '<path fill="currentColor" stroke="none" d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.87.5 3.63 1.4 5.15L2 22l5.09-1.5a9.87 9.87 0 0 0 4.95 1.33h.01c5.46 0 9.91-4.45 9.91-9.92 0-2.65-1.03-5.14-2.9-7.01A9.86 9.86 0 0 0 12.04 2zm0 18.06h-.01a8.2 8.2 0 0 1-4.18-1.14l-.3-.18-3.02.89.9-2.94-.2-.31a8.22 8.22 0 0 1-1.26-4.39c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.83 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.55-3.7 8.24-8.25 8.24z"/>' },
      { name: "Facebook", text: "f" },
      { name: "Lovable", svg: '<path d="M12 21s-7-4.35-9.5-8.5C1 9 2.5 5.5 6 5c2-.3 3.5.8 4.5 2 1-1.2 2.5-2.3 4.5-2 3.5.5 5 4 3.5 7.5C19 16.65 12 21 12 21z"/>' },
      { name: "Supabase", svg: '<path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z"/>' },
      { name: "ChatGPT", svg: '<path d="M12 2v20M4.2 7l15.6 10M4.2 17L19.8 7"/>' },
      { name: "Gemini", svg: '<path d="M12 3c.5 4 2.5 6 6.5 6.5-4 .5-6 2.5-6.5 6.5-.5-4-2.5-6-6.5-6.5C9.5 9 11.5 7 12 3z"/>' },
      { name: "Flow", svg: '<path d="M3 12c2-4 4-4 6 0s4 4 6 0 4-4 6 0"/>' },
      { name: "Claude", svg: '<path d="M12 3v4M12 17v4M4.2 7l3 2M16.8 15l3 2M3 12h4M17 12h4M4.2 17l3-2M16.8 9l3-2"/>' },
      { name: "Claude Code", svg: '<path d="M8 5 3 12l5 7M16 5l5 7-5 7"/>' },
      { name: "Instagram", svg: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>' },
      { name: "Telegram", svg: '<path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4 20-7z"/>' },
      { name: "YouTube", svg: '<rect x="2" y="6" width="20" height="12" rx="4"/><path fill="currentColor" stroke="none" d="M10 9l6 3-6 3z"/>' },
      { name: "YT Shorts", svg: '<rect x="6" y="2" width="12" height="20" rx="5"/><path fill="currentColor" stroke="none" d="M13 6 9 13h3l-1 5 5-8h-3l1-4z"/>' },
      { name: "Shopee", svg: '<path d="M6 8h12l-1 12a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L6 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>' },
      { name: "Mercado Livre", svg: '<circle cx="9" cy="20" r="1.5" fill="currentColor" stroke="none"/><circle cx="18" cy="20" r="1.5" fill="currentColor" stroke="none"/><path d="M2 3h2l2.4 12.2a2 2 0 0 0 2 1.6h8.6a2 2 0 0 0 2-1.6L21 7H6"/>' }
    ];

    function buildChip(tool) {
      var chip = document.createElement("div");
      chip.className = "tool-chip";

      var icon = document.createElement("div");
      icon.className = "tool-chip__icon";
      if (tool.text) {
        icon.textContent = tool.text;
      } else {
        icon.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" ' +
          'stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + tool.svg + "</svg>";
      }

      var name = document.createElement("span");
      name.className = "tool-chip__name";
      name.textContent = tool.name;

      chip.appendChild(icon);
      chip.appendChild(name);
      return chip;
    }

    for (var g = 0; g < 2; g++) {
      var group = document.createElement("div");
      group.className = "marquee__group";
      TOOLS.forEach(function (tool) { group.appendChild(buildChip(tool)); });
      track.appendChild(group);
    }
  })();

  /* ==========================================================
     10. Ano no rodapé
     ========================================================== */

  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
})();
