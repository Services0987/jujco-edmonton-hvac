/* JUJCO - Distinct, top-notch typography & kinetic animations (vanilla).
   Every title family gets its OWN signature motion so the site never feels
   monotonous:
     .cs_hero_title     -> 3D split reveal + scroll parallax + hover glow (no crumble)
     .cs_section_title  -> split reveal (blur-in) + scroll-driven liquid skew
     .cs_page_title     -> clip-path mask wipe reveal
     .cs_cta_title      -> word-by-word rise reveal
   Gradient-filled section titles keep their CSS shimmer and still get the skew.
*/
(function () {
  'use strict';

  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;

  function qsa(sel) {
    return Array.prototype.slice.call(document.querySelectorAll(sel));
  }
  function visible(els) {
    return els.filter(function (t) { return t.offsetParent !== null; });
  }

  function splitToChars(el) {
    if (el.dataset.jujcoSplit === 'chars') return el.querySelectorAll('.jujco-char');
    var nodes = Array.prototype.slice.call(el.childNodes);
    var frag = document.createDocumentFragment();
    nodes.forEach(function (node) {
      if (node.nodeType === 3) {
        var text = node.nodeValue;
        for (var i = 0; i < text.length; i++) {
          var ch = text[i];
          if (ch === ' ') frag.appendChild(document.createTextNode(' '));
          else {
            var s = document.createElement('span');
            s.className = 'jujco-char';
            s.textContent = ch;
            frag.appendChild(s);
          }
        }
      } else if (node.nodeName === 'BR') frag.appendChild(document.createElement('br'));
      else frag.appendChild(node);
    });
    el.innerHTML = '';
    el.appendChild(frag);
    el.dataset.jujcoSplit = 'chars';
    return el.querySelectorAll('.jujco-char');
  }

  function splitToWords(el) {
    if (el.dataset.jujcoSplit === 'words') return el.querySelectorAll('.jujco-word');
    var text = el.textContent;
    el.innerHTML = '';
    text.split(/(\s+)/).forEach(function (w) {
      if (w === '') return;
      if (/^\s+$/.test(w)) { el.appendChild(document.createTextNode(w)); return; }
      var s = document.createElement('span');
      s.className = 'jujco-word';
      s.textContent = w;
      el.appendChild(s);
    });
    el.dataset.jujcoSplit = 'words';
    return el.querySelectorAll('.jujco-word');
  }

  /* Varied 3D entry directions so letters flip/bounce in differently (kinetic staggering) */
  var KINETIC = [
    'translateY(46px) rotateX(-85deg)',
    'translateY(-46px) rotateX(85deg)',
    'translateX(-50px) rotateY(-80deg)',
    'translateX(50px) rotateY(80deg)',
    'translateY(44px) rotate(-14deg) scale(.82)',
    'translateY(-50px) scale(1.18)'
  ];
  function kineticEntry(i) { return KINETIC[i % KINETIC.length]; }
  var KINETIC_RESET = 'translateY(0) rotateX(0) rotateY(0) rotate(0) scale(1)';

  function init() {
    var hero = visible(qsa('.cs_hero_title'));
    var allSection = visible(qsa('.cs_section_title'));
    var splitSection = allSection.filter(function (t) {
      return !t.closest('.cs_section_heading.cs_style_1');
    });
    var page = visible(qsa('.cs_page_title'));
    var cta = visible(qsa('.cs_cta_title'));

    var io = ('IntersectionObserver' in window)
      ? new IntersectionObserver(function (entries) {
          entries.forEach(function (en) {
            if (en.isIntersecting && en.target._jujcoReveal) {
              en.target._jujcoReveal();
              io.unobserve(en.target);
            }
          });
        }, { threshold: 0.25 })
      : null;

    function observe(el, revealFn) {
      el._jujcoReveal = revealFn;
      if (io) io.observe(el);
      else revealFn();
    }

    /* ---------- VARIANT A : HERO — 3D split reveal, no crumble ---------- */
    hero.forEach(function (t) {
      var chars = splitToChars(t);
      chars.forEach(function (c, i) {
        c.style.display = 'inline-block';
        c.style.transition = 'transform .8s cubic-bezier(.2,.7,.2,1), opacity .8s ease';
        c.style.transitionDelay = (i * 35) + 'ms';
        c.style.transformOrigin = '50% 100%';
        c.style.transform = kineticEntry(i);
        c.style.opacity = '0';
      });
      observe(t, function () {
        chars.forEach(function (c) {
          c.style.opacity = '1';
          c.style.transform = KINETIC_RESET;
        });
      });
      /* gentle hover glow replaces the old shatter/font-morph that crumbled */
      t.addEventListener('mouseenter', function () {
        t.style.textShadow = '0 0 22px rgba(255,85,0,.45)';
        t.style.transition = 'text-shadow .3s ease';
      });
      t.addEventListener('mouseleave', function () {
        t.style.textShadow = '';
      });
    });

    /* ---------- VARIANT B : SECTION — blur-in split reveal ---------- */
    splitSection.forEach(function (t) {
      var chars = splitToChars(t);
      chars.forEach(function (c, i) {
        c.style.display = 'inline-block';
        c.style.transition = 'transform .7s cubic-bezier(.2,.7,.2,1), opacity .7s ease, filter .7s ease';
        c.style.transitionDelay = (i * 22) + 'ms';
        c.style.transformOrigin = '0% 100%';
        c.style.transform = kineticEntry(i);
        c.style.filter = 'blur(8px)';
        c.style.opacity = '0';
      });
      observe(t, function () {
        chars.forEach(function (c) {
          c.style.opacity = '1';
          c.style.transform = KINETIC_RESET;
          c.style.filter = 'blur(0)';
        });
      });
    });

    /* ---------- VARIANT C : PAGE — clip-path mask wipe ---------- */
    page.forEach(function (t) {
      t.style.transition = 'clip-path 1s cubic-bezier(.7,0,.2,1), -webkit-clip-path 1s cubic-bezier(.7,0,.2,1), opacity 1s ease';
      t.style.webkitClipPath = 'inset(0 100% 0 0)';
      t.style.clipPath = 'inset(0 100% 0 0)';
      t.style.opacity = '0';
      observe(t, function () {
        t.style.webkitClipPath = 'inset(0 0% 0 0)';
        t.style.clipPath = 'inset(0 0% 0 0)';
        t.style.opacity = '1';
      });
    });

    /* ---------- VARIANT D : CTA — word-by-word rise ---------- */
    cta.forEach(function (t) {
      var words = splitToWords(t);
      words.forEach(function (w, i) {
        w.style.display = 'inline-block';
        w.style.transition = 'transform .6s cubic-bezier(.2,.7,.2,1), opacity .6s ease';
        w.style.transitionDelay = (i * 60) + 'ms';
        w.style.transform = 'translateY(22px) rotate(3deg)';
        w.style.opacity = '0';
      });
      observe(t, function () {
        words.forEach(function (w) {
          w.style.opacity = '1';
          w.style.transform = 'translateY(0) rotate(0)';
        });
      });
    });

    /* ---------- Scroll behaviours : hero parallax + section liquid skew ---------- */
    if (hero.length || allSection.length) {
      var ticking = false, lastY = window.pageYOffset, resetTimer = null;
      window.addEventListener('scroll', function () {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(function () {
          var y = window.pageYOffset;
          var vel = y - lastY;
          lastY = y;
          var skew = Math.max(-6, Math.min(6, vel * 0.22));
          hero.forEach(function (t) {
            var top = t.getBoundingClientRect().top;
            var p = Math.max(-16, Math.min(16, (top - window.innerHeight) * -0.035));
            t.style.transform = 'translateY(' + p.toFixed(1) + 'px)';
          });
          allSection.forEach(function (t) {
            t.style.transform = 'skewX(' + skew.toFixed(2) + 'deg)';
          });
          ticking = false;
        });
        clearTimeout(resetTimer);
        resetTimer = setTimeout(function () {
          allSection.forEach(function (t) { t.style.transform = 'skewX(0deg)'; });
        }, 140);
      }, { passive: true });
    }
    initFx();
  }

  /* ===================== NEW FX PACK (variety, vanilla, self-contained) ===================== */
  function initFx() {
    parallaxMouse();
    flyThrough();
    glitchLoop();
    drawPath();
    wipeReveal();
    bento();
    marquee();
  }

  function parallaxMouse() {
    var layers = qsa('[data-parallax]');
    if (!layers.length) return;
    var tx = 0, ty = 0, cx = 0, cy = 0, raf = null;
    window.addEventListener('mousemove', function (e) {
      tx = (e.clientX / window.innerWidth - 0.5);
      ty = (e.clientY / window.innerHeight - 0.5);
      if (!raf) raf = requestAnimationFrame(apply);
    }, { passive: true });
    function apply() {
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      layers.forEach(function (l) {
        var d = parseFloat(l.getAttribute('data-parallax')) || 14;
        l.style.transform = 'translate3d(' + (cx * d).toFixed(1) + 'px,' + (cy * d).toFixed(1) + 'px,0)';
      });
      if (Math.abs(tx - cx) > 0.002 || Math.abs(ty - cy) > 0.002) raf = requestAnimationFrame(apply);
      else raf = null;
    }
  }

  function flyThrough() {
    var els = qsa('[data-flythrough]');
    if (!els.length) return;
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var vh = window.innerHeight;
        els.forEach(function (el) {
          var r = el.getBoundingClientRect();
          var prog = (vh - r.top) / (vh + r.height);
          prog = Math.max(0, Math.min(1, prog));
          var z = (0.5 - prog) * 240;
          var sc = 1 + (0.5 - Math.abs(0.5 - prog)) * 0.22;
          el.style.transform = 'translateZ(' + z.toFixed(1) + 'px) scale(' + sc.toFixed(3) + ')';
        });
        ticking = false;
      });
    }, { passive: true });
  }

  function glitchLoop() {
    var els = qsa('[data-glitch]');
    if (!els.length) return;
    setInterval(function () {
      var el = els[Math.floor(Math.random() * els.length)];
      el.classList.add('is-glitching');
      setTimeout(function () { el.classList.remove('is-glitching'); }, 280 + Math.random() * 240);
    }, 2400);
  }

  function drawPath() {
    var paths = qsa('.jujco-draw-path');
    if (!paths.length) return;
    paths.forEach(function (p) {
      if (p.getTotalLength) {
        var len = p.getTotalLength();
        p.style.strokeDasharray = len;
        p.style.strokeDashoffset = len;
      }
    });
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        paths.forEach(function (p) {
          var holder = p.closest('.jujco-draw') || p.parentNode;
          var r = holder.getBoundingClientRect();
          var prog = (window.innerHeight - r.top) / (window.innerHeight * 0.85);
          prog = Math.max(0, Math.min(1, prog));
          var len = parseFloat(p.style.strokeDasharray) || 1000;
          p.style.strokeDashoffset = (len * (1 - prog)).toFixed(1);
        });
        ticking = false;
      });
    }, { passive: true });
  }

  function wipeReveal() {
    var els = qsa('.jujco-wipe');
    if (!els.length) return;
    if (!('IntersectionObserver' in window)) {
      els.forEach(function (e) { e.classList.add('in-view'); });
      return;
    }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in-view'); io.unobserve(e.target); }
      });
    }, { threshold: 0.25 });
    els.forEach(function (e) { io.observe(e); });
  }

  function bento() {
    var items = qsa('.jujco-bento__item');
    if (!items.length) return;
    var overlay = document.getElementById('jujcoBentoOverlay');
    items.forEach(function (it) {
      it.addEventListener('click', function () {
        if (!overlay) return;
        var img = it.querySelector('img');
        if (img) overlay.querySelector('img').src = img.src;
        overlay.classList.add('is-open');
      });
    });
    if (overlay) overlay.addEventListener('click', function () { overlay.classList.remove('is-open'); });
  }

  function marquee() {
    qsa('.jujco-marquee__track').forEach(function (tr) {
      tr.innerHTML = tr.innerHTML + tr.innerHTML;
    });
  }

  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();
