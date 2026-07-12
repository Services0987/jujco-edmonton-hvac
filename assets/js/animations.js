/* =============================================================================
   JUJCO — animations.js
   Vanilla controller for animations.css. No dependencies.
   Triggers: data-anim, data-split, data-type, data-count, data-tilt,
             data-spotlight, data-marquee, data-parallax-speed, [data-anim-live]
   Respects prefers-reduced-motion.
   ========================================================================== */
(function () {
  'use strict';

  var docEl = document.documentElement;
  docEl.classList.add('js');

  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var MOBILE = !!(window.matchMedia && window.matchMedia('(max-width: 767px)').matches);
  var STAGGER = MOBILE ? 14 : 30;

  function qsa(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function num(v, d) { var n = parseFloat(v); return isNaN(n) ? d : n; }

  /* ---------------------------------------------------------------- helpers */
  function applyAnimVars(el) {
    var d = el.getAttribute('data-anim-duration');
    var delay = el.getAttribute('data-anim-delay');
    var ease = el.getAttribute('data-anim-ease');
    if (d !== null) el.style.setProperty('--anim-duration', d + (/%$/.test(d) ? '' : 's'));
    if (delay !== null) el.style.setProperty('--anim-delay', delay + (/%$/.test(delay) ? '' : 's'));
    if (ease !== null) el.style.setProperty('--anim-ease', ease);
  }

  /* ----------------------------------------------------- scroll reveal core */
  var revealSel = '[data-anim], [data-split], .img-fade, .reveal-mask, .reveal-wipe, ' +
                  '.reveal-curtain, .reveal-circle, .reveal-diamond, .reveal-blind, .reveal-window';

  function initReveal() {
    /* NOTE: per-element effect + timing variety is now owned entirely by
       randomiseAllEffects() (called in init() BEFORE this runs), so we must
       NOT remap data-anim here — doing so would overwrite the randomness and
       make section titles fall back into a predictable fixed cycle. We only
       build the observer. */

    var els = qsa(revealSel);
    if (!els.length) return;

    if (reduceMotion || !('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('in'); if (el.hasAttribute('data-split')) playSplit(el); });
      return;
    }

    /* Re-trigger on BOTH scroll directions. As an element enters view we add
       .in (its bespoke entrance); as it leaves (top OR bottom) we swap to .out
       (a distinct, gentler exit) so the motion is never "the same thing in
       reverse" and the page keeps breathing as the visitor scrolls up/down.
       An element only plays once if it carries data-anim-once="true". */
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var el = en.target;
        var once = el.getAttribute('data-anim-once') === 'true' ||
                   el.getAttribute('data-once') === 'true';
        if (en.isIntersecting) {
          if (el.hasAttribute('data-anim')) applyAnimVars(el);
          el.classList.remove('out');
          el.classList.add('in');
          if (el.hasAttribute('data-split')) playSplit(el);
          if (once) io.unobserve(el);
        } else {
          if (once) return;
          el.classList.remove('in');
          el.classList.add('out');
        }
      });
    }, { threshold: 0, rootMargin: '0px 0px -6% 0px' });

    els.forEach(function (el) { io.observe(el); });
  }

  /* ----------------------------------------------------- split typography */
  var SPLIT_FX = {
    fade: 'unitFade', slide: 'unitSlide', scale: 'unitScale', rotate: 'unitRotate',
    flip: 'unitFlip', blur: 'unitBlur', glow: 'unitGlow', bounce: 'unitBounce'
  };

  /* Auto text-animation variety. Applied to text elements that jujco-anim2.js
     does NOT already handle (it covers hero / section / page / cta titles by
     class). This stops the site feeling like every heading uses one effect and
     spreads the big text-animation list (letters, words, lines, live glow/wave)
     across the many real texts on the site. */
  var AUTO_SPLIT = [
    { sel: '.cs_service_card_title, .cs_card_title, .cs_post_title, .cs_team_title, .cs_project_title, .cs_price_title, .cs_award_title, .cs_feature_title, .cs_iconbox_title, .cs_testimonial_title, .cs_process_title',
      type: 'chars', fx: ['slide', 'scale', 'rotate', 'bounce', 'flip', 'blur'] },
    { sel: '.jujco-stats__num', type: 'chars', fx: ['glow'], live: 'glow' },
    { sel: '.cs_faq_question, .cs_accordion_head, .cs_accordian_head, .cs_faq_head', type: 'words', fx: ['slide', 'scale', 'rotate', 'flip', 'blur'] },
    { sel: '.cs_section_subtitle, .cs_subtitle', type: 'words', fx: ['slide', 'rotate', 'scale', 'blur'] }
  ];
  var _autoIdx = {};
  function autoIndex(key, len) { _autoIdx[key] = (_autoIdx[key] || 0); var i = _autoIdx[key] % len; _autoIdx[key]++; return i; }

  function wrapUnits(el, type) {
    var text = el.textContent;
    el.textContent = '';
    var units = [];
    if (type === 'chars') {
      /* Group each WORD in a nowrap wrapper holding the animated letter
         spans. Without this, every letter is its own inline-block and the
         browser may break a word mid-word on narrow screens — letters
         spill onto the next line instead of the whole word wrapping. */
      text.split(/(\s+)/).forEach(function (tok) {
        if (tok === '') return;
        if (/^\s+$/.test(tok)) { el.appendChild(document.createTextNode(tok)); return; }
        var word = document.createElement('span');
        word.className = 'anim-word';
        tok.split('').forEach(function (ch) {
          var s = document.createElement('span');
          s.className = 'anim-unit';
          s.textContent = ch;
          word.appendChild(s); units.push(s);
        });
        el.appendChild(word);
      });
    } else if (type === 'words') {
      text.split(/(\s+)/).forEach(function (w) {
        if (w === '') return;
        if (/^\s+$/.test(w)) { el.appendChild(document.createTextNode(w)); return; }
        var s = document.createElement('span');
        s.className = 'anim-unit';
        s.textContent = w;
        el.appendChild(s); units.push(s);
      });
    } else if (type === 'lines') {
      // wrap words, then group by vertical offset into line spans
      var wordSpans = [];
      text.split(/(\s+)/).forEach(function (w) {
        if (w === '') return;
        if (/^\s+$/.test(w)) { el.appendChild(document.createTextNode(w)); return; }
        var s = document.createElement('span');
        s.className = 'anim-char'; s.textContent = w;
        el.appendChild(s); wordSpans.push(s);
      });
      var lines = [], cur = null, top = null;
      wordSpans.forEach(function (s) {
        var t = s.offsetTop;
        if (top === null || Math.abs(t - top) > 4) { cur = []; lines.push(cur); top = t; }
        cur.push(s);
      });
      el.textContent = '';
      lines.forEach(function (group) {
        var line = document.createElement('span');
        line.className = 'anim-unit anim-line';
        group.forEach(function (s, i) {
          line.appendChild(s);
          if (i < group.length - 1) line.appendChild(document.createTextNode(' '));
        });
        el.appendChild(line); units.push(line);
      });
    }
    return units;
  }

  function playSplit(el) {
    var units = el._splitUnits;
    if (!units || !units.length) return;
    if (reduceMotion) { units.forEach(function (u) { u.style.opacity = 1; }); return; }

    /* Continuous (looping) character motion requested via data-anim-live.
       The looping keyframes do not set opacity, so force it visible first. */
    var live = el.getAttribute('data-anim-live');
    if (live) {
      var LIVE_FX = {
        wave: 'charWave', jitter: 'charJitter', shake: 'charShake',
        glow: 'charGlow', flip: 'charFlip'
      };
      var liveFx = LIVE_FX[live] || 'charWave';
      var ldur = num(el.getAttribute('data-split-duration'), 1800);
      var lea = el.getAttribute('data-split-ease') || 'ease-in-out';
      var lstagger = num(el.getAttribute('data-split-stagger'), 75);
      var ldir = (live === 'glow') ? 'alternate infinite' : 'infinite';
      units.forEach(function (u, i) {
        u.style.opacity = 1;
        u.style.animation = liveFx + ' ' + ldur + 'ms ' + lea + ' ' + ldir;
        u.style.animationDelay = (i * lstagger) + 'ms';
      });
      return;
    }

    var fx = SPLIT_FX[el.getAttribute('data-split-effect') || 'fade'] || 'unitFade';
    var dur = num(el.getAttribute('data-split-duration'), 600);
    var stagger = num(el.getAttribute('data-split-stagger'), STAGGER);
    var ease = el.getAttribute('data-split-ease') || 'cubic-bezier(0.22,0.61,0.36,1)';
    units.forEach(function (u, i) {
      u.style.animation = fx + ' ' + dur + 'ms ' + ease + ' both';
      u.style.animationDelay = (i * stagger) + 'ms';
    });
  }

  function initSplit() {
    /* Explicit splits (hand-authored in markup). */
    qsa('[data-split]').forEach(function (el) {
      el._splitUnits = wrapUnits(el, el.getAttribute('data-split') || 'chars');
    });
    /* Auto-assigned text-animation variety across the site's real text. */
    AUTO_SPLIT.forEach(function (rule) {
      qsa(rule.sel).forEach(function (el) {
        if (el.hasAttribute('data-split') || el.hasAttribute('data-anim')) return;
        var fx = rule.fx[autoIndex(rule.sel, rule.fx.length)];
        el.setAttribute('data-split', rule.type);
        el.setAttribute('data-split-effect', fx);
        if (rule.live) el.setAttribute('data-anim-live', rule.live);
        el._splitUnits = wrapUnits(el, rule.type);
      });
    });
  }

  /* ----------------------------------------------------- typewriter */
  function initType() {
    qsa('[data-type]').forEach(function (el) {
      var text = el.getAttribute('data-type') || el.textContent;
      var speed = num(el.getAttribute('data-type-speed'), 55);
      var cursor = el.getAttribute('data-type-cursor') || '';
      var loop = el.getAttribute('data-type-loop') === 'true';
      if (reduceMotion) { el.textContent = text; return; }
      el.textContent = '';
      var cur = document.createElement('span');
      cur.className = 'type-cursor';
      cur.textContent = cursor;
      cur.style.cssText = 'display:inline-block;width:0.6em;animation:caretBlink 1s steps(1) infinite;';
      var i = 0;
      function tick() {
        if (i <= text.length) {
          el.textContent = text.slice(0, i);
          el.appendChild(cur);
          i++;
          setTimeout(tick, speed + Math.random() * speed * 0.4);
        } else if (loop) {
          setTimeout(function () {
            var j = text.length;
            function back() {
              if (j >= 0) { el.textContent = text.slice(0, j); el.appendChild(cur); j--; setTimeout(back, speed * 0.6); }
              else { i = 0; tick(); }
            }
            back();
          }, 1400);
        }
      }
      tick();
    });
  }

  /* ----------------------------------------------------- counters */
  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
  function initCounters() {
    qsa('[data-count-to]').forEach(function (el) {
      var to = num(el.getAttribute('data-count-to'), 0);
      var from = num(el.getAttribute('data-count-from'), 0);
      var dur = num(el.getAttribute('data-count-duration'), 1800);
      var pre = el.getAttribute('data-count-prefix') || '';
      var suf = el.getAttribute('data-count-suffix') || '';
      var dec = num(el.getAttribute('data-count-decimals'), 0);
      function fmt(v) {
        return pre + (dec ? v.toFixed(dec) : Math.round(v).toLocaleString()) + suf;
      }
      if (reduceMotion) { el.textContent = fmt(to); return; }
      var start = null;
      function step(ts) {
        if (start === null) start = ts;
        var p = Math.min((ts - start) / dur, 1);
        el.textContent = fmt(from + (to - from) * easeOutCubic(p));
        if (p < 1) requestAnimationFrame(step);
      }
      if ('IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (es) {
          es.forEach(function (e) { if (e.isIntersecting) { requestAnimationFrame(step); io.unobserve(e.target); } });
        }, { threshold: 0.5 });
        io.observe(el);
      } else { requestAnimationFrame(step); }
    });
  }

  /* ----------------------------------------------------- mouse tilt */
  function initTilt() {
    if (reduceMotion) return;
    qsa('[data-tilt]').forEach(function (el) {
      var max = num(el.getAttribute('data-tilt-max'), 12);
      var scale = num(el.getAttribute('data-tilt-scale'), 1.04);
      el.style.transformStyle = 'preserve-3d';
      el.style.transition = 'transform 0.15s ease-out';
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = 'perspective(800px) rotateY(' + (px * max) + 'deg) rotateX(' + (-py * max) + 'deg) scale(' + scale + ')';
      });
      el.addEventListener('mouseleave', function () { el.style.transform = ''; });
    });
  }

  /* ----------------------------------------------------- magnetic buttons
     Buttons / call-to-action nudge toward the cursor for a premium, tactile
     feel. Transform is driven inline and reset on leave, so it never fights the
     reveal system (buttons aren't reveal targets). */
  function initMagnetic() {
    if (reduceMotion) return;
    qsa('.cs_btn, .cs_emergency_btn').forEach(function (el) {
      var strength = num(el.getAttribute('data-magnetic'), 0.35);
      el.style.transition = el.style.transition || 'transform 0.2s ease-out';
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        var mx = e.clientX - (r.left + r.width / 2);
        var my = e.clientY - (r.top + r.height / 2);
        el.style.transform = 'translate(' + (mx * strength) + 'px,' + (my * strength) + 'px)';
      });
      el.addEventListener('mouseleave', function () { el.style.transform = ''; });
    });
  }

  /* ----------------------------------------------------- spotlight */
  function initSpotlight() {
    if (reduceMotion) return;
    qsa('[data-spotlight]').forEach(function (el) {
      el.style.position = el.style.position || 'relative';
      var glow = document.createElement('span');
      glow.style.cssText = 'position:absolute;inset:0;pointer-events:none;opacity:0;transition:opacity .3s;' +
        'background:radial-gradient(220px circle at var(--mx,50%) var(--my,50%), rgba(255,85,0,0.18), transparent 60%);';
      el.appendChild(glow);
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        el.style.setProperty('--my', (e.clientY - r.top) + 'px');
        glow.style.opacity = '1';
      });
      el.addEventListener('mouseleave', function () { glow.style.opacity = '0'; });
    });
  }

  /* ----------------------------------------------------- marquee */
  function initMarquee() {
    qsa('[data-marquee]').forEach(function (el) {
      if (el.querySelector('.marquee__track')) return;
      var track = document.createElement('div');
      track.className = 'marquee__track';
      track.innerHTML = el.innerHTML;
      el.innerHTML = '';
      el.classList.add('marquee');
      el.appendChild(track.cloneNode(true));
      el.appendChild(track);
    });
  }

  /* ----------------------------------------------------- scroll parallax */
  function initParallax() {
    if (reduceMotion) return;
    var els = qsa('[data-parallax-speed]');
    if (!els.length) return;
    var ticking = false;
    function update() {
      var vh = window.innerHeight;
      els.forEach(function (el) {
        var r = el.getBoundingClientRect();
        var prog = (r.top + r.height / 2 - vh / 2) / vh; // -0.5..0.5 ish
        var sp = num(el.getAttribute('data-parallax-speed'), 0.15);
        var axis = el.getAttribute('data-parallax-axis') || 'y';
        var val = (prog * sp * 100).toFixed(1) + 'px';
        el.style.transform = axis === 'x' ? 'translateX(' + val + ')' : 'translateY(' + val + ')';
      });
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  /* ----------------------------------------------------- image reveals
     Spread varied ENTRANCE animations across the site's real imagery (team
     photos, blog thumbs, service detail shots, the home image strip). We target
     the <img> itself (never a wrapper that already owns a transform — e.g. the
     parallax strip item or an .img-zoom hover) so nothing fights for the same
     transform property. Each image gets a DIFFERENT effect, cycled by index, so
     the gallery never looks like one repeated move. Re-trigger (in/out) is
     handled by the shared observer in initReveal() once these carry data-anim. */
  function initImageReveals() {
    if (reduceMotion) return;
    /* Vertical / scale / rotate only — no horizontal slides, so we never
       introduce a sideways scrollbar. */
    var IMG_FX = ['scale-in', 'zoom-in', 'rotate-in', 'flip-in', 'pop-in',
      'elastic-in', 'blur-in', 'bounce-in', 'rise-up', 'fold-in'];
    var groups = [
      '.cs_team_member_thumb img',
      '.cs_post_thumb img',
      '.cs_service_details img',
      '.jujco-imgstrip__item img'
    ];
    var idx = 0;
    groups.forEach(function (sel) {
      qsa(sel).forEach(function (img) {
        if (img.hasAttribute('data-anim') || img.hasAttribute('data-split')) return;
        img.setAttribute('data-anim', IMG_FX[idx % IMG_FX.length]);
        idx++;
      });
    });
  }

  /* ----------------------------------------------------- scroll progress bar
     A thin, hue-shifting bar pinned to the very top that fills left→right with
     the page scroll position. Gives real-time, scroll-linked feedback so the
     visitor always feels attached to where they are on the page. */
  function initProgress() {
    if (reduceMotion) return;
    if (document.querySelector('.jujco-scroll-progress')) return;
    var bar = document.createElement('div');
    bar.className = 'jujco-scroll-progress';
    bar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bar);
    var ticking = false;
    function update() {
      var doc = document.documentElement;
      var max = (doc.scrollHeight - doc.clientHeight) || 1;
      var ratio = Math.min(Math.max(doc.scrollTop / max, 0), 1);
      bar.style.transform = 'scaleX(' + ratio + ')';
      ticking = false;
    }
    function onScroll() {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    update();
  }

  /* ----------------------------------------------------- live char effects */
  function initLive() {
    // [data-anim-live] already handled by CSS; nothing to do here but ensure
    // the splitter has run if combined with data-split (handled in initSplit).
  }

  /* ----------------------------------------------------- cursor glow (global) */
  function initCursorGlow() {
    var host = document.querySelector('[data-cursor-glow]');
    if (!host || reduceMotion) return;
    var dot = document.createElement('div');
    dot.style.cssText = 'position:fixed;width:18px;height:18px;border-radius:50%;pointer-events:none;' +
      'background:rgba(255,85,0,0.35);transform:translate(-50%,-50%);z-index:9999;mix-blend-mode:screen;transition:opacity .3s;';
    document.body.appendChild(dot);
    var x = 0, y = 0, cx = 0, cy = 0, raf = null;
    window.addEventListener('mousemove', function (e) { x = e.clientX; y = e.clientY; if (!raf) raf = requestAnimationFrame(loop); }, { passive: true });
    document.addEventListener('mouseleave', function () { dot.style.opacity = '0'; });
    document.addEventListener('mouseenter', function () { dot.style.opacity = '1'; });
    function loop() {
      cx += (x - cx) * 0.18; cy += (y - cy) * 0.18;
      dot.style.left = cx + 'px'; dot.style.top = cy + 'px';
      if (Math.abs(x - cx) > 0.5 || Math.abs(y - cy) > 0.5) raf = requestAnimationFrame(loop);
      else raf = null;
    }
  }

  /* ----------------------------------------------------- site-wide randomiser
   Called before initReveal so every element already has its final effect, duration
   and stagger baked in. Picks different effects for adjacent elements to keep the
   flow exciting rather than repetitive. */
  function randomiseAllEffects() {
    if (reduceMotion) return;
    /* Large pools covering every effect type from your master list.
       Weighted toward VISUALLY DISTINCT moves (rotation, 3D flip, blur, skew)
       so the page never reads as "everything just fades up".
       NOTE: glow / neon / jitter / shake / wave are DELIBERATELY excluded here —
       they apply brightness/drop-shadow to the whole element and read as an
       unwanted highlight on plain text. They live only in the split-text /
       live pools where a letter-level glow is the intended effect. */
    var BLOCK_FX = ['fade-up','fade-down','fade-left','fade-right','slide-up','slide-down',
      'slide-left','slide-right','scale-in','scale-out','zoom-in','zoom-out','rotate-in',
      'flip-in','bounce-in','pop-in','elastic-in','blur-in','skew-in','fold-in',
      'drop-in','rise-up','float-in','expand','compress',
      'spin-in','swing-in','jelly-in','zoom-spin','drop-rotate','rise-rotate','blur-zoom',
      'skew-drop','flip-left','flip-right'];
    /* On phones, drop any effect that moves content sideways — horizontal
       slides/flips would push elements off the narrow viewport and cause
       cutoff / a sideways scrollbar. Vertical + rotational moves stay. */
    var FX_POOL = MOBILE
      ? BLOCK_FX.filter(function (f) {
          return !/^(slide-left|slide-right|fade-left|fade-right|flip-left|flip-right)$/.test(f);
        })
      : BLOCK_FX;
    var SPLIT_FX = ['fade','slide','scale','rotate','flip','blur','bounce'];
    var LIVE_FX = ['wave','jitter','shake','glow','flip'];
    var DURATIONS = [400,500,600,700,800,900,1000,1100,1200,1300,1400,1500];
    var STAGGERS = [12,18,24,30,36,42,50,60,70,80,90,100];
    
    // Track effects used in the last 300px so we don't repeat nearby
    var used = {};
    function avoidRepeat(sel) {
      var y = sel.getBoundingClientRect().top;
      // Clean stale entries
      Object.keys(used).forEach(function(k){
        if (used[k] < y-300) delete used[k];
      });
      // Pick a unique effect not used nearby
      var effect = FX_POOL[Math.floor(Math.random()*FX_POOL.length)];
      while (used[effect] && used[effect] > y-300) {
        effect = FX_POOL[Math.floor(Math.random()*FX_POOL.length)];
      }
      used[effect] = y;
      return effect;
    }
    
    /* ---- 1) All generic data-anim elements ---- */
    qsa('[data-anim]').forEach(function(el){
      var effect = avoidRepeat(el);
      el.setAttribute('data-anim', effect);
      // Randomise timing/duration unless already set
      if (!el.hasAttribute('data-anim-duration'))
        el.setAttribute('data-anim-duration', DURATIONS[Math.floor(Math.random()*DURATIONS.length)]/1000+'s');
      if (!el.hasAttribute('data-anim-delay'))
        el.setAttribute('data-anim-delay', (Math.random()*0.6).toFixed(3)+'s');
    });
    
    /* ---- 2) Section headings (already handled in initReveal but we expand the pool) ---- */
    qsa('.cs_section_heading.cs_style_1 .cs_section_title').forEach(function(el){
      if (el.hasAttribute('data-anim') || el.hasAttribute('data-split')) return;
      el.setAttribute('data-anim', avoidRepeat(el));
      if (!el.hasAttribute('data-anim-duration'))
        el.setAttribute('data-anim-duration', DURATIONS[Math.floor(Math.random()*DURATIONS.length)]/1000+'s');
    });
    
    /* ---- 3) Split typography elements ---- */
    qsa('.cs_service_card_title, .cs_card_title, .cs_post_title, .cs_team_title, .cs_project_title, .cs_price_title, .cs_award_title, .cs_feature_title, .cs_iconbox_title, .cs_testimonial_title, .cs_process_title, .cs_faq_question, .cs_accordion_head, .cs_accordian_head, .cs_faq_head, .cs_section_subtitle, .cs_subtitle').forEach(function(el){
      if (el.hasAttribute('data-split') || el.hasAttribute('data-anim')) return;
      var effect = SPLIT_FX[Math.floor(Math.random()*SPLIT_FX.length)];
      el.setAttribute('data-split','chars');
      el.setAttribute('data-split-effect',effect);
      el.setAttribute('data-split-duration',DURATIONS[Math.floor(Math.random()*DURATIONS.length)]+'ms');
      el.setAttribute('data-split-stagger',STAGGERS[Math.floor(Math.random()*STAGGERS.length)]+'ms');
      el._splitUnits = wrapUnits(el,'chars');
    });

    /* ---- 4) Premium 3D hover-tilt on cards. Uses data-tilt (hover-only,
       never hides content) so the card's OWN inner text/image reveals keep
       playing — this avoids the double-reveal bug where a hiding [data-anim]
       on the whole card swallowed the text animation. ---- */
    qsa('.cs_service_card, .cs_post, .cs_team, .cs_project, .cs_price, .cs_award, .cs_feature, .cs_iconbox, .cs_testimonial, .cs_process, .cs_card').forEach(function(el){
      if (el.hasAttribute('data-tilt')) return;
      el.setAttribute('data-tilt', '');
      el.setAttribute('data-tilt-max', '10');
    });
  }

  /* ----------------------------------------------------- bootstrap */
  function init() {
    /* 1) Apply wide, per‑element randomness BEFORE the observer grabs them. */
    randomiseAllEffects();
    /* 2) Tag the site imagery with varied data-anim effects BEFORE the observer
          is built, so the reveal system picks them up automatically.
       3) Split text FIRST so the observer (initReveal) and the reduced-motion
          fallback both have el._splitUnits ready before any playSplit() runs. */
    initImageReveals();
    initSplit();
    initReveal();
    initType();
    initCounters();
    initTilt();
    initMagnetic();
    initSpotlight();
    initMarquee();
    initParallax();
    initProgress();
    initLive();
    initCursorGlow();
  }

  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();

/* caret blink keyframe injected so typewriter works without extra CSS */
(function () {
  if (document.getElementById('jujco-caret-kf')) return;
  var s = document.createElement('style');
  s.id = 'jujco-caret-kf';
  s.textContent = '@keyframes caretBlink{0%,100%{opacity:1}50%{opacity:0}}';
  document.head.appendChild(s);
})();
