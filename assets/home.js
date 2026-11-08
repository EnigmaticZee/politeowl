/* Polite Owl — home page: the page plays with you.
   Physics by matter-js 0.19.0 (cdnjs). Everything degrades to a calm static page
   when the library is missing or the visitor prefers reduced motion. */
(function () {
  'use strict';

  var root = document.documentElement;
  var mq = function (q) { return !!(window.matchMedia && window.matchMedia(q).matches); };
  var reduce = mq('(prefers-reduced-motion: reduce)');
  var fine = mq('(hover: hover) and (pointer: fine)');
  var slice = function (l) { return Array.prototype.slice.call(l); };
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return slice((c || document).querySelectorAll(s)); };
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function rand(a, b) { return a + Math.random() * (b - a); }
  function now() { return performance.now(); }
  function noop() {}
  function debounce(fn, ms) { var t; return function () { clearTimeout(t); t = setTimeout(fn, ms); }; }

  /* ---------- shared state ---------- */
  var hush = { on: false, pinned: false, hover: false };
  function timeScale() { return hush.on ? 0.16 : 1; }
  function setHush(on) { if (hush.on === on) return; hush.on = on; root.classList.toggle('hush', on); }

  var ptr = { x: -9999, y: -9999, vx: 0, vy: 0, t: 0 };
  window.addEventListener('pointermove', function (e) {
    var t = now(), dt = t - ptr.t;
    if (ptr.t && dt > 0 && dt < 120) {
      ptr.vx = lerp(ptr.vx, (e.clientX - ptr.x) / dt * 1000, 0.5);
      ptr.vy = lerp(ptr.vy, (e.clientY - ptr.y) / dt * 1000, 0.5);
    } else { ptr.vx = 0; ptr.vy = 0; }
    ptr.x = e.clientX; ptr.y = e.clientY; ptr.t = t;
  }, { passive: true });

  /* ---------- one requestAnimationFrame loop for everything ---------- */
  var Loop = (function () {
    var tasks = [], raf = 0, last = 0;
    function frame(t) {
      raf = 0;
      var dt = last ? Math.min(50, t - last) : 16.7;
      last = t;
      var any = false;
      for (var i = 0; i < tasks.length; i++) {
        if (tasks[i].active()) { any = true; tasks[i].fn(dt, t); }
      }
      if (any && !document.hidden) raf = requestAnimationFrame(frame); else last = 0;
    }
    return {
      add: function (fn, active) { tasks.push({ fn: fn, active: active }); },
      wake: function () { if (!raf && !document.hidden && !reduce) raf = requestAnimationFrame(frame); }
    };
  })();
  document.addEventListener('visibilitychange', function () { if (!document.hidden) Loop.wake(); });

  /* ---------- sparkles: a cursor trail and little bursts ---------- */
  var Fx = (function () {
    var cv = $('#fx');
    if (!cv || reduce || !cv.getContext) { if (cv) cv.parentNode.removeChild(cv); return { burst: noop }; }
    var ctx = cv.getContext('2d'), dpr = Math.min(2, window.devicePixelRatio || 1);
    var parts = [], colors = ['#F2A23A', '#7C5CF5', '#FF7A59', '#3CCB8F'], lastSpawn = 0, dirty = false;
    function size() { cv.width = Math.round(innerWidth * dpr); cv.height = Math.round(innerHeight * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    size(); window.addEventListener('resize', debounce(size, 100));
    function add(x, y, vx, vy, life, s, c) {
      if (parts.length > 180) parts.shift();
      parts.push({ x: x, y: y, vx: vx, vy: vy, life: life, age: 0, s: s, c: c, r: rand(0, 6.28), vr: rand(-5, 5) });
      Loop.wake();
    }
    function sparkle(x, y, r, rot) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.beginPath();
      ctx.moveTo(0, -r); ctx.quadraticCurveTo(0, 0, r, 0); ctx.quadraticCurveTo(0, 0, 0, r);
      ctx.quadraticCurveTo(0, 0, -r, 0); ctx.quadraticCurveTo(0, 0, 0, -r);
      ctx.fill(); ctx.restore();
    }
    Loop.add(function (dtMs) {
      var dt = dtMs / 1000 * timeScale();
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      for (var i = parts.length - 1; i >= 0; i--) {
        var p = parts[i];
        p.age += dt * 1000;
        if (p.age >= p.life) { parts.splice(i, 1); continue; }
        p.vy += 300 * dt; p.vx *= 0.985; p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt;
        var k = p.age / p.life;
        ctx.globalAlpha = (1 - k) * (k < 0.08 ? k / 0.08 : 1);
        ctx.fillStyle = p.c;
        sparkle(p.x, p.y, p.s * (1 - k * 0.45), p.r);
      }
      ctx.globalAlpha = 1;
      dirty = parts.length > 0;
    }, function () { return parts.length > 0 || dirty; });
    if (fine) window.addEventListener('pointermove', function (e) {
      if (hush.on) return;
      var t = now();
      if (Math.hypot(ptr.vx, ptr.vy) < 500 || t - lastSpawn < 36) return;
      lastSpawn = t;
      add(e.clientX + rand(-3, 3), e.clientY + rand(-3, 3), -ptr.vx * 0.04 + rand(-20, 20), -ptr.vy * 0.04 + rand(-40, 0),
        rand(420, 760), rand(2.5, 4.5), colors[(Math.random() * colors.length) | 0]);
    }, { passive: true });
    return {
      burst: function (x, y, n) {
        n = n || 12;
        for (var i = 0; i < n; i++) {
          var a = rand(0, Math.PI * 2), s = rand(110, 300);
          add(x, y, Math.cos(a) * s, Math.sin(a) * s - 90, rand(650, 1100), rand(4, 7.5), colors[i % colors.length]);
        }
      }
    };
  })();

  /* ---------- hero: the owl on its crib mobile ---------- */
  var hero = $('#hero');
  var heroVis = true;
  var Toys = null;

  var Owl = (function () {
    var moon = $('#moon');
    if (!hero || !moon) return null;
    var hit = $('.owl-hit', moon), owlMove = $('#owlMove'), owlMask = $('#owlMoveMask');
    var eyeL = $('#eyeL'), eyeR = $('#eyeR'), pupilL = $('#pupilL'), pupilR = $('#pupilR');
    var ringL = $('.ring', eyeL), ringR = $('.ring', eyeR), eyesOpen = $('#eyesOpen'), happy = $('#happy');
    var bubble = $('#owlBubble');
    var phrases = ['Oh, hello.', 'How do you do?', 'After you.', 'Thank you kindly.', 'Lovely to see you.', 'Most kind.'];
    var phraseI = 0;

    function orn(el, vb, hitPt, hitR, k, c, phase, amp) {
      return { el: el, vb: vb, hitPt: hitPt, hitR: hitR, k: k, c: c, phase: phase, amp: amp, th: 0, om: 0, last: 9, g: null };
    }
    // vb = [viewBox x, viewBox y, viewBox width]; the pivot is the top centre of each element
    var mo = orn(moon, [0, -150, 200], [100, 92], 76, 4.6, 0.3, 0, 0.018);
    var orns = [mo];
    var sa = $('.orn-star-a'), sb = $('.orn-star-b');
    if (sa) orns.push(orn(sa, [0, 0, 40], [20, 274], 30, 7.5, 0.34, 1.7, 0.035));
    if (sb) orns.push(orn(sb, [0, 0, 40], [20, 174], 30, 9, 0.38, 3.1, 0.04));

    function measure() {
      orns.forEach(function (o) {
        var el = o.el, L = el.offsetLeft, T = el.offsetTop, Wd = el.offsetWidth;
        o.g = { L: L, T: T, s: Wd / o.vb[2], px: L + Wd / 2, py: T };
      });
    }
    // viewBox point of ornament o -> hero-local px, including the current swing
    function pt(o, ux, uy) {
      var g = o.g, x = g.L + (ux - o.vb[0]) * g.s, y = g.T + (uy - o.vb[1]) * g.s;
      var c = Math.cos(o.th), s = Math.sin(o.th), dx = x - g.px, dy = y - g.py;
      return { x: g.px + dx * c - dy * s, y: g.py + dx * s + dy * c };
    }

    var st = { tilt: 0, hop: 0, hopV: 0, blinkAt: -1e9, nextBlink: now() + 1600, happyUntil: 0, happy: false,
      plx: 0, ply: 0, prx: 0, pry: 0, look: null, idle: null, nextIdle: now() + 2500, lastT: '', blinkS: 1, bubbleUntil: 0, pupils: '' };
    var drag = null, suppress = false, lastBump = 0, lastPtrT = 0;

    function placeBubble() {
      var p = pt(mo, 50, 30);
      bubble.style.transform = 'translate(' + p.x.toFixed(1) + 'px,' + p.y.toFixed(1) + 'px) translate(-100%,-100%)';
    }
    function say(text, ms) {
      if (!bubble) return;
      bubble.textContent = text;
      placeBubble();
      bubble.classList.add('on');
      st.bubbleUntil = now() + (ms || 1900);
      clearTimeout(say.t);
      say.t = setTimeout(function () { bubble.classList.remove('on'); }, (ms || 1900) + 60);
      Loop.wake();
    }
    function react() {
      st.hopV = -270; st.happyUntil = now() + 1400;
      mo.om += rand(-0.55, 0.55);
      say(phrases[phraseI++ % phrases.length]);
      var r = hero.getBoundingClientRect(), h = pt(mo, 100, 46);
      Fx.burst(r.left + h.x, r.top + h.y, 14);
      if (reduce) {
        happy.setAttribute('opacity', '1'); eyesOpen.setAttribute('opacity', '0');
        setTimeout(function () { happy.setAttribute('opacity', '0'); eyesOpen.setAttribute('opacity', '1'); }, 1400);
      }
      Loop.wake();
    }

    hit.addEventListener('pointerdown', function (e) {
      suppress = false;
      if (reduce || (e.pointerType === 'mouse' && e.button !== 0)) return;
      drag = { id: e.pointerId, x0: e.clientX, y0: e.clientY, moved: false, target: null };
      try { hit.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
    });
    hit.addEventListener('pointermove', function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      if (!drag.moved && Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) > 6) drag.moved = true;
      if (drag.moved) {
        var r = hero.getBoundingClientRect();
        drag.target = clamp(-Math.atan2(e.clientX - (r.left + mo.g.px), e.clientY - (r.top + mo.g.py)), -0.75, 0.75);
        Loop.wake();
      }
    });
    function endDrag(e) { if (!drag || (e && e.pointerId !== drag.id)) return; if (drag.moved) suppress = true; drag = null; }
    hit.addEventListener('pointerup', endDrag);
    hit.addEventListener('pointercancel', endDrag);
    hit.addEventListener('lostpointercapture', endDrag);
    hit.addEventListener('click', function (e) { if (suppress) { suppress = false; e.preventDefault(); return; } react(); });

    // the owl turns its head towards whatever you're about to press
    $$('[data-owl-look]').forEach(function (el) {
      var line = el.getAttribute('data-owl-say');
      function on() {
        st.look = el;
        if (line && fine && now() - (el._said || -1e9) > 9000) { el._said = now(); say(line, 1500); }
        Loop.wake();
      }
      function off() { if (st.look === el) st.look = null; }
      el.addEventListener('pointerenter', on); el.addEventListener('pointerleave', off);
      el.addEventListener('focus', on); el.addEventListener('blur', off);
    });

    function frame(dtMs, t) {
      var dt = dtMs / 1000 * timeScale();
      // reads first
      var hr = hero.getBoundingClientRect(), rl = ringL.getBoundingClientRect(), rr = ringR.getBoundingClientRect();

      // a quick swipe across an ornament gives it a push
      if (ptr.t !== lastPtrT) {
        lastPtrT = ptr.t;
        if (Math.abs(ptr.vx) > 120 && !drag) {
          orns.forEach(function (o) {
            var c = pt(o, o.hitPt[0], o.hitPt[1]);
            if (Math.hypot(ptr.x - (hr.left + c.x), ptr.y - (hr.top + c.y)) < o.hitR * o.g.s) {
              o.om += clamp(-ptr.vx * 0.00022, -0.14, 0.14) * (o === mo ? 1 : 1.9);
            }
          });
        }
      }
      // pendulums
      var tt = t / 1000;
      orns.forEach(function (o) {
        var breeze = o.amp * (Math.sin(tt * 0.8 + o.phase) + 0.5 * Math.sin(tt * 1.9 + o.phase * 1.7));
        if (o === mo && drag && drag.target !== null) o.om = (drag.target - o.th) * 16;
        else o.om += (-o.k * (Math.sin(o.th) - breeze) - o.c * o.om) * dt;
        o.th = clamp(o.th + o.om * dt, -0.8, 0.8);
        if (Math.abs(o.th - o.last) > 0.0004) { o.last = o.th; o.el.style.transform = 'rotate(' + o.th.toFixed(4) + 'rad)'; }
      });

      // where to look
      var tx = null, ty = null, dragged = Toys && Toys.dragged();
      if (dragged) { tx = hr.left + dragged.x; ty = hr.top + dragged.y; }
      else if (st.look) { var lr = st.look.getBoundingClientRect(); tx = lr.left + lr.width / 2; ty = lr.top + lr.height / 2; }
      else if (ptr.t && t - ptr.t < 3500) { tx = ptr.x; ty = ptr.y; }
      else if (t > st.nextIdle) { st.nextIdle = t + rand(1500, 3600); st.idle = Math.random() < 0.35 ? null : { x: rand(-1, 1), y: rand(-0.4, 0.7) }; }
      var rot = mo.th + (st.tilt - 4) * Math.PI / 180;
      function aim(r) {
        var cx = r.left + r.width / 2, cy = r.top + r.height / 2, dx, dy, m;
        if (tx === null) { if (!st.idle) return [0, 0]; dx = st.idle.x; dy = st.idle.y; m = 5.5 * Math.min(1, Math.hypot(dx, dy)); }
        else { dx = tx - cx; dy = ty - cy; m = 6 * Math.min(1, Math.hypot(dx, dy) / 140); }
        var d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d, c = Math.cos(-rot), s = Math.sin(-rot);
        return [(ux * c - uy * s) * m, (ux * s + uy * c) * m];
      }
      var aL = aim(rl), aR = aim(rr);
      st.plx = lerp(st.plx, aL[0], 0.22); st.ply = lerp(st.ply, aL[1], 0.22);
      st.prx = lerp(st.prx, aR[0], 0.22); st.pry = lerp(st.pry, aR[1], 0.22);
      var pk = st.plx.toFixed(2) + st.ply.toFixed(2) + st.prx.toFixed(2) + st.pry.toFixed(2);
      if (pk !== st.pupils) {
        st.pupils = pk;
        pupilL.setAttribute('cx', (78 + st.plx).toFixed(2)); pupilL.setAttribute('cy', (96 + st.ply).toFixed(2));
        pupilR.setAttribute('cx', (122 + st.prx).toFixed(2)); pupilR.setAttribute('cy', (96 + st.pry).toFixed(2));
      }

      // head tilt + hop
      var tiltT = 0;
      if (tx !== null) {
        var ox = (rl.left + rr.right) / 2;
        tiltT = st.look ? (tx < ox ? -11 : 11) : clamp((tx - ox) / 45, -7, 7);
      }
      st.tilt = lerp(st.tilt, tiltT, 1 - Math.pow(0.9, dtMs / 16.7));
      st.hopV += (-160 * st.hop - 14 * st.hopV) * dt; st.hop += st.hopV * dt;
      var tr = 'translate(0 ' + st.hop.toFixed(2) + ') rotate(' + st.tilt.toFixed(2) + ' 100 168)';
      if (tr !== st.lastT) { st.lastT = tr; owlMove.setAttribute('transform', tr); owlMask.setAttribute('transform', tr); }

      // blink (sometimes twice), or happy eyes after a hello
      var happyOn = t < st.happyUntil;
      if (!happyOn && t > st.nextBlink) { st.blinkAt = t; st.nextBlink = t + (Math.random() < 0.2 ? 280 : rand(2200, 5200)); }
      var p = (t - st.blinkAt) / 170, s = p >= 0 && p < 1 ? 1 - Math.sin(p * Math.PI) * 0.92 : 1;
      if (s !== st.blinkS) {
        st.blinkS = s;
        var sc = ' scale(1 ' + s.toFixed(3) + ') ';
        eyeL.setAttribute('transform', 'translate(78 96)' + sc + 'translate(-78 -96)');
        eyeR.setAttribute('transform', 'translate(122 96)' + sc + 'translate(-122 -96)');
      }
      if (happyOn !== st.happy) { st.happy = happyOn; happy.setAttribute('opacity', happyOn ? '1' : '0'); eyesOpen.setAttribute('opacity', happyOn ? '0' : '1'); }

      if (bubble.classList.contains('on')) placeBubble();
    }

    measure();
    if (!reduce) { mo.th = -0.32; orns.forEach(function (o, i) { if (i) o.th = i === 1 ? 0.25 : -0.3; }); }
    window.addEventListener('resize', debounce(measure, 120));
    Loop.add(frame, function () { return heroVis; });

    return {
      measure: measure,
      say: say,
      sensor: function () { var c = pt(mo, 100, 92); return { x: c.x, y: c.y, r: 70 * mo.g.s }; },
      bump: function (vx, vy) {
        var push = Math.abs(vx) > 1 ? vx : (Math.random() - 0.5) * Math.abs(vy);
        mo.om += clamp(-push * 0.05, -0.7, 0.7);
        st.blinkAt = now();
        if (now() - lastBump > 6000 && Math.hypot(vx, vy) > 4) { lastBump = now(); say(Math.random() < 0.5 ? 'Oh!' : 'Steady on.', 1200); }
        Loop.wake();
      },
      shaken: function () { mo.om += rand(-0.7, 0.7); say('Steady on!', 1300); },
      tidied: function () { say('Ah, much better.', 1600); }
    };
  })();

  if ('IntersectionObserver' in window && hero) {
    new IntersectionObserver(function (es) { heroVis = es[0].isIntersecting; if (heroVis) Loop.wake(); }).observe(hero);
  }

  /* ---------- hero: the apps are toys ---------- */
  Toys = (function () {
    var wrap = $('#toys'), copy = $('#heroCopy');
    if (!wrap || !hero || !copy) return null;
    var M = window.Matter;
    var physics = !!(M && M.Engine && M.Bodies) && !reduce;
    var items = $$('.toy', wrap).map(function (el) {
      return { el: el, inner: $('.toy-body', el), shape: el.getAttribute('data-shape'), rel: parseFloat(el.getAttribute('data-size')) || 1,
        app: el.getAttribute('data-app'), price: el.getAttribute('data-price'), cat: el.getAttribute('data-cat'),
        desk: el.hasAttribute('data-desktop'), soon: el.classList.contains('soon'), body: null, w: 0, lx: NaN, ly: NaN, la: NaN, on: true, dragged: false };
    });
    var W = 0, H = 0, S = 0, engine = null, world = null, statics = [], sensor = null, tidyAnim = null, drag = null, acc = 0;
    var STEP = 1000 / 60, FLOOR = 22;

    function measure() {
      W = hero.clientWidth;
      S = clamp(W * 0.066, 54, 96);
      items.forEach(function (it) {
        it.on = !(it.desk && W < 700);
        it.el.classList.toggle('off', !it.on);
        it.w = Math.round(S * it.rel);
        it.el.style.setProperty('--w', it.w + 'px');
      });
    }
    function copyRect() {
      var h = hero.getBoundingClientRect(), r = copy.getBoundingClientRect();
      return { left: r.left - h.left, right: r.right - h.left, top: r.top - h.top, bottom: r.bottom - h.top };
    }
    // make sure there is always a floor below the copy for the toys to live on
    function ensureHeight() {
      hero.style.minHeight = '';
      var r = copyRect(), need = Math.ceil(r.bottom + (W < 700 ? S * 2.5 : S * 1.5) + 24 + FLOOR);
      if (hero.clientHeight < need) hero.style.minHeight = need + 'px';
      H = hero.clientHeight;
    }
    function rank(it) { return it.app ? 0 : it.soon ? 1 : 2 + (1 - it.rel); }
    // neat rows along the floor: used for "Tidy up", resizes and the static version
    function layout() {
      var list = items.filter(function (i) { return i.on; }).sort(function (a, b) { return rank(a) - rank(b); });
      // rows are right-aligned so they sit under the owl and clear of the corner badge
      var pad = W >= 900 ? 40 : 14, gap = W >= 700 ? 16 : 9, x = pad, base = H - FLOOR - 1, rowH = 0, out = [], row = [];
      function flush() {
        if (!row.length) return;
        var shift = (W - pad) - (row[row.length - 1].x + row[row.length - 1].it.w / 2);
        row.forEach(function (p) { p.x += shift; out.push(p); });
        row = [];
      }
      list.forEach(function (it) {
        if (x + it.w > W - pad && x > pad) { flush(); base -= rowH + 8; x = pad; rowH = 0; }
        row.push({ it: it, x: x + it.w / 2, y: base - it.w / 2 });
        x += it.w + gap; rowH = Math.max(rowH, it.w);
      });
      flush();
      return out;
    }
    function draw(it, x, y, a) {
      if (Math.abs(x - it.lx) < 0.05 && Math.abs(y - it.ly) < 0.05 && Math.abs(a - it.la) < 0.0005) return;
      it.lx = x; it.ly = y; it.la = a;
      it.el.style.transform = 'translate3d(' + (x - it.w / 2).toFixed(1) + 'px,' + (y - it.w / 2).toFixed(1) + 'px,0)';
      it.inner.style.transform = 'rotate(' + a.toFixed(4) + 'rad)';
    }
    function placeStatic() {
      items.forEach(function (it) { it.lx = NaN; });
      layout().forEach(function (p) { draw(p.it, p.x, p.y, 0); p.it.el.classList.add('live'); });
    }
    function dimFor(price, cat) {
      items.forEach(function (it) {
        if (!it.app && !it.soon) return;
        var ok = it.soon ? (price === 'all' && cat === 'all') : (price === 'all' || it.price === price) && (cat === 'all' || it.cat === cat);
        it.el.classList.toggle('dim', !ok);
        it.match = ok;
      });
    }

    measure(); ensureHeight();

    // shared click behaviour: app toys open their page unless they were dragged
    items.forEach(function (it) {
      it.el.addEventListener('dragstart', function (e) { e.preventDefault(); });
      it.el.addEventListener('click', function (e) {
        if (it.dragged || !it.app) e.preventDefault();
        if (!it.app && !it.dragged) poke(it);
        it.dragged = false;
      });
    });
    function poke(it) {
      var r = it.el.getBoundingClientRect();
      Fx.burst(r.left + r.width / 2, r.top + r.height / 2, 7);
      if (it.body) {
        M.Sleeping.set(it.body, false);
        M.Body.setVelocity(it.body, { x: rand(-4, 4), y: -rand(8, 11) });
        M.Body.setAngularVelocity(it.body, rand(-0.3, 0.3));
        Loop.wake();
      } else if (!reduce) {
        it.el.classList.remove('poke'); void it.el.offsetWidth; it.el.classList.add('poke');
      }
    }

    if (!physics) {
      placeStatic();
      window.addEventListener('resize', debounce(function () { measure(); ensureHeight(); placeStatic(); if (Owl) Owl.measure(); }, 150));
      return {
        dragged: function () { return null; },
        tidy: noop,
        shake: function () { items.forEach(function (it) { if (it.on && !reduce) { it.el.classList.remove('poke'); void it.el.offsetWidth; it.el.classList.add('poke'); } }); },
        filter: dimFor
      };
    }

    engine = M.Engine.create({ enableSleeping: true });
    world = engine.world;
    engine.gravity.y = 1.1;
    engine.positionIterations = 8;
    engine.velocityIterations = 6;

    function buildStatics() {
      statics.forEach(function (b) { M.Composite.remove(world, b); });
      if (sensor) M.Composite.remove(world, sensor);
      var t = 400, r = copyRect(), opt = { isStatic: true, friction: 0.3, restitution: 0.2 };
      // the copy block is a solid wall that reaches up out of view, so nothing can rest on top of the text
      var x2 = (W - r.right < 120) ? W + 100 : r.right + 6, y2 = r.bottom + 6;
      statics = [
        M.Bodies.rectangle(W / 2, H - FLOOR + t / 2, W * 3, t, opt),
        M.Bodies.rectangle(-t / 2, H / 2 - 1000, t, H + 4000, opt),
        M.Bodies.rectangle(W + t / 2, H / 2 - 1000, t, H + 4000, opt),
        M.Bodies.rectangle(W / 2, -2400 - t / 2, W * 3, t, opt),
        M.Bodies.rectangle((x2 - 100) / 2, (y2 - 2200) / 2, x2 + 100, y2 + 2200, Object.assign({ chamfer: { radius: 18 } }, opt))
      ];
      var sp = Owl ? Owl.sensor() : { x: -999, y: -999, r: 10 };
      sensor = M.Bodies.circle(sp.x, sp.y, sp.r, { isStatic: true, isSensor: true });
      M.Composite.add(world, statics.concat([sensor]));
    }
    function makeBody(it, x, y, angle) {
      var o = { restitution: it.shape === 'circle' ? 0.5 : 0.3, friction: 0.14, frictionStatic: 0.4, frictionAir: 0.014,
        density: it.shape === 'circle' ? 0.0011 : 0.0016 };
      var b = it.shape === 'circle'
        ? M.Bodies.circle(x, y, it.w / 2, o, 26)
        : M.Bodies.rectangle(x, y, it.w, it.w, Object.assign({ chamfer: { radius: it.w * 0.26 } }, o));
      b.plugin = b.plugin || {};
      b.plugin.toy = it;
      M.Body.setAngle(b, angle);
      it.body = b;
      M.Composite.add(world, b);
    }
    function removeBodies() {
      items.forEach(function (it) { if (it.body) { M.Composite.remove(world, it.body); it.body = null; } });
    }

    // first arrival: on desktop the apps rain down past the owl; on phones they drop onto the floor
    function spawn() {
      var r = copyRect(), desk = W >= 900;
      var list = items.filter(function (i) { return i.on; });
      if (desk) {
        list.sort(function () { return Math.random() - 0.5; });
        var x0 = Math.max(r.right + 60, W * 0.56), x1 = W - 50, y = -S;
        list.forEach(function (it, i) {
          var x = clamp(lerp(x0, x1, ((i * 0.618) % 1)) + rand(-20, 20), it.w / 2 + 4, W - it.w / 2 - 4);
          y -= it.w + 26;
          makeBody(it, x, y, rand(-0.6, 0.6));
          M.Body.setVelocity(it.body, { x: rand(-7, -0.5), y: 0 });
          M.Body.setAngularVelocity(it.body, rand(-0.05, 0.05));
          it.el.classList.add('live');
        });
      } else {
        layout().forEach(function (p, i) {
          var it = p.it;
          setTimeout(function () {
            if (it.body) return;
            makeBody(it, p.x + rand(-6, 6), p.y - 40 - rand(0, 30), rand(-0.35, 0.35));
            it.el.classList.add('live');
            Loop.wake();
          }, 250 + i * 90);
        });
      }
      Loop.wake();
    }

    M.Events.on(engine, 'collisionStart', function (ev) {
      for (var i = 0; i < ev.pairs.length; i++) {
        var p = ev.pairs[i], other = p.bodyA === sensor ? p.bodyB : p.bodyB === sensor ? p.bodyA : null;
        if (other && other.plugin && other.plugin.toy && Owl) Owl.bump(other.velocity.x, other.velocity.y);
      }
    });

    function local(e) { var h = hero.getBoundingClientRect(); return { x: e.clientX - h.left, y: e.clientY - h.top }; }
    items.forEach(function (it) {
      var el = it.el;
      el.addEventListener('pointerdown', function (e) {
        if (!it.body || (e.pointerType === 'mouse' && e.button !== 0)) return;
        e.preventDefault();
        if (tidyAnim) finishTidy(true);
        var p = local(e), b = it.body;
        M.Sleeping.set(b, false);
        drag = { it: it, id: e.pointerId, x0: e.clientX, y0: e.clientY, t0: now(), moved: false,
          c: M.Constraint.create({ pointA: p, bodyB: b, pointB: { x: p.x - b.position.x, y: p.y - b.position.y }, stiffness: 0.16, damping: 0.06, length: 0 }) };
        M.Composite.add(world, drag.c);
        it.dragged = false;
        el.classList.add('grabbed');
        try { el.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
        Loop.wake();
      });
      el.addEventListener('pointermove', function (e) {
        if (!drag || drag.it !== it || e.pointerId !== drag.id) return;
        drag.c.pointA = local(e);
        if (!drag.moved && Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) > 6) drag.moved = true;
      });
      function release(e) {
        if (!drag || drag.it !== it || (e && e.pointerId !== drag.id)) return;
        M.Composite.remove(world, drag.c);
        it.dragged = drag.moved;
        el.classList.remove('grabbed');
        drag = null;
      }
      el.addEventListener('pointerup', release);
      el.addEventListener('pointercancel', release);
      el.addEventListener('lostpointercapture', release);
    });

    function easeBack(p) { var c1 = 1.4, c3 = c1 + 1; return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2); }
    function tidy() {
      if (tidyAnim) finishTidy(true);
      if (drag) { M.Composite.remove(world, drag.c); drag.it.el.classList.remove('grabbed'); drag = null; }
      tidyAnim = { t0: now(), list: layout().map(function (p, i) {
        var b = p.it.body; if (!b) return null;
        M.Body.setStatic(b, true);
        var a = b.angle;
        return { b: b, fx: b.position.x, fy: b.position.y, fa: a, tx: p.x, ty: p.y, ta: Math.round(a / (Math.PI * 2)) * Math.PI * 2, d: i * 45 };
      }).filter(Boolean) };
      Loop.wake();
    }
    function stepTidy() {
      var t = now(), done = true;
      tidyAnim.list.forEach(function (q) {
        var p = clamp((t - tidyAnim.t0 - q.d) / 760, 0, 1), e = easeBack(p);
        if (p < 1) done = false;
        M.Body.setPosition(q.b, { x: lerp(q.fx, q.tx, e), y: lerp(q.fy, q.ty, e) - Math.sin(p * Math.PI) * 70 });
        M.Body.setAngle(q.b, lerp(q.fa, q.ta, e));
      });
      if (done) finishTidy(false);
    }
    function finishTidy(silent) {
      if (!tidyAnim) return;
      tidyAnim.list.forEach(function (q) {
        M.Body.setPosition(q.b, { x: q.tx, y: q.ty }); M.Body.setAngle(q.b, q.ta);
        M.Body.setStatic(q.b, false);
        M.Body.setVelocity(q.b, { x: 0, y: 0 }); M.Body.setAngularVelocity(q.b, 0);
      });
      tidyAnim = null;
      if (!silent && Owl) Owl.tidied();
    }
    function shake() {
      if (tidyAnim) finishTidy(true);
      var vmax = Math.sqrt(2 * 0.3 * H * 0.6);
      items.forEach(function (it) {
        var b = it.body; if (!b) return;
        M.Sleeping.set(b, false);
        M.Body.setVelocity(b, { x: rand(-10, 10), y: -rand(0.55, 1) * vmax });
        M.Body.setAngularVelocity(b, rand(-0.4, 0.4));
      });
      if (Owl) Owl.shaken();
      Loop.wake();
    }

    function frame(dtMs) {
      engine.timing.timeScale = timeScale();
      acc = Math.min(acc + dtMs, STEP * 3);
      while (acc >= STEP) { M.Engine.update(engine, STEP); acc -= STEP; }
      if (sensor && Owl) { var s = Owl.sensor(); M.Body.setPosition(sensor, { x: s.x, y: s.y }); }
      if (tidyAnim) stepTidy();
      for (var i = 0; i < items.length; i++) {
        var it = items[i], b = it.body;
        if (!b) continue;
        var v = b.velocity, sp = Math.hypot(v.x, v.y);
        if (sp > 36) M.Body.setVelocity(b, { x: v.x / sp * 36, y: v.y / sp * 36 });
        if (b.position.y > H + 300 || b.position.x < -300 || b.position.x > W + 300) {
          M.Body.setPosition(b, { x: W * 0.8, y: -it.w }); M.Body.setVelocity(b, { x: 0, y: 0 });
        }
        draw(it, b.position.x, b.position.y, b.angle);
      }
    }
    Loop.add(frame, function () { return heroVis; });

    var started = false;
    function start() {
      if (started) return; started = true;
      measure(); ensureHeight(); if (Owl) Owl.measure(); buildStatics(); spawn();
    }
    var fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    Promise.race([fontsReady, new Promise(function (r) { setTimeout(r, 1500); })]).then(function () { setTimeout(start, 120); });

    window.addEventListener('resize', debounce(function () {
      if (!started) return;
      var oldW = W;
      measure(); ensureHeight(); if (Owl) Owl.measure(); buildStatics();
      if (Math.abs(oldW - W) > 2) {
        // size changed: rebuild the toys in a tidy row rather than rescaling mid-air
        if (tidyAnim) finishTidy(true);
        removeBodies();
        layout().forEach(function (p) { makeBody(p.it, p.x, p.y, 0); p.it.el.classList.add('live'); });
        items.forEach(function (it) { if (!it.on && it.body) { M.Composite.remove(world, it.body); it.body = null; } });
      }
      Loop.wake();
    }, 160));

    return {
      dragged: function () { return drag && drag.it.body ? { x: drag.it.body.position.x, y: drag.it.body.position.y } : null; },
      tidy: tidy,
      shake: shake,
      filter: function (price, cat) {
        dimFor(price, cat);
        items.forEach(function (it) {
          var b = it.body; if (!b || (!it.app && !it.soon) || tidyAnim) return;
          M.Sleeping.set(b, false);
          if (it.match) M.Body.setVelocity(b, { x: rand(-1.5, 1.5), y: -rand(6, 9) });
          else M.Body.setVelocity(b, { x: b.position.x < W / 2 ? -7 : 7, y: -2 });
        });
        Loop.wake();
      }
    };
  })();

  var tidyBtn = $('#tidyBtn'), shakeBtn = $('#shakeBtn');
  if (reduce || !Toys) { var bar = $('.toybar'); if (bar) bar.style.display = 'none'; }
  if (tidyBtn && Toys) tidyBtn.addEventListener('click', function () { Toys.tidy(); });
  if (shakeBtn && Toys) shakeBtn.addEventListener('click', function () { Toys.shake(); });

  /* ---------- magnetic buttons ---------- */
  if (fine && !reduce) $$('.magnetic').forEach(function (b) {
    b.addEventListener('pointermove', function (e) {
      var r = b.getBoundingClientRect();
      b.style.setProperty('--mx', ((e.clientX - (r.left + r.width / 2)) * 0.2).toFixed(1) + 'px');
      b.style.setProperty('--my', ((e.clientY - (r.top + r.height / 2)) * 0.3).toFixed(1) + 'px');
    });
    b.addEventListener('pointerleave', function () { b.style.setProperty('--mx', '0px'); b.style.setProperty('--my', '0px'); });
  });

  /* ---------- the shelf: filters that feel physical ---------- */
  (function shelf() {
    var grid = $('#grid'), filters = $('#filters');
    if (!grid || !filters) return;
    var cards = $$('.card[data-price]', grid), soon = $('[data-soon]', grid);
    var all = soon ? cards.concat([soon]) : cards.slice();
    var count = $('#count'), empty = $('#empty'), reset = $('#reset');
    var buttons = $$('[data-filter]', filters);
    var segInd = $('.seg-ind', filters), chipInd = $('.chip-ind', filters), chipsWrap = $('.chips-wrap', filters);
    var state = { price: 'all', cat: 'all' }, anims = [], leavingNow = [], gen = 0;
    var params = new URLSearchParams(location.search);
    ['price', 'cat'].forEach(function (k) {
      var v = params.get(k);
      if (v && $('[data-filter="' + k + '"][data-value="' + v + '"]', filters)) state[k] = v;
    });

    function wants(c) {
      if (c === soon) return state.price === 'all' && state.cat === 'all';
      return (state.price === 'all' || c.getAttribute('data-price') === state.price) &&
             (state.cat === 'all' || c.getAttribute('data-cat') === state.cat);
    }
    function placeInd(ind, group, animate) {
      var btn = $('[data-filter="' + group + '"][aria-pressed="true"]', filters);
      if (!ind || !btn) return;
      var L = btn.offsetLeft, Wd = btn.offsetWidth, oL = ind._l, oW = ind._w;
      ind.style.left = L + 'px'; ind.style.width = Wd + 'px';
      ind.style.top = btn.offsetTop + 'px'; ind.style.height = btn.offsetHeight + 'px';
      if (animate && !reduce && ind.animate && oW != null && (oL !== L || oW !== Wd)) {
        var minL = Math.min(oL, L), maxR = Math.max(oL + oW, L + Wd);
        ind.animate([
          { left: oL + 'px', width: oW + 'px' },
          { left: minL + 'px', width: (maxR - minL) + 'px', offset: 0.42 },
          { left: L + 'px', width: Wd + 'px' }
        ], { duration: 580, easing: 'cubic-bezier(.3,.8,.3,1)' });
      }
      ind._l = L; ind._w = Wd;
      if (group === 'cat' && chipsWrap && chipsWrap.scrollWidth > chipsWrap.clientWidth) {
        var target = clamp(L - (chipsWrap.clientWidth - Wd) / 2, 0, chipsWrap.scrollWidth - chipsWrap.clientWidth);
        if (chipsWrap.scrollTo) chipsWrap.scrollTo({ left: target, behavior: animate && !reduce ? 'smooth' : 'auto' });
      }
    }
    function clearLeaving(c) {
      if (c.getAnimations) c.getAnimations().forEach(function (a) { a.cancel(); });
      ['position', 'left', 'top', 'width', 'height', 'pointer-events', 'z-index'].forEach(function (p) { c.style.removeProperty(p); });
      c.hidden = true;
    }
    function settle() {
      anims.forEach(function (a) { try { a.cancel(); } catch (_) { /* ignore */ } });
      anims = [];
      leavingNow.forEach(clearLeaving);
      leavingNow = [];
    }
    function apply(animate) {
      settle();
      var unf = state.price === 'all' && state.cat === 'all';
      var shown = cards.filter(wants).length;
      var visBefore = all.filter(function (c) { return !c.hidden; });
      var leaving = visBefore.filter(function (c) { return !wants(c); });
      var entering = all.filter(function (c) { return c.hidden && wants(c); });
      var staying = visBefore.filter(wants);

      if (!animate || reduce || !grid.animate) {
        all.forEach(function (c) { c.hidden = !wants(c); });
      } else {
        var g = grid.getBoundingClientRect(), before = new Map(), h0 = grid.offsetHeight;
        visBefore.forEach(function (c) { before.set(c, c.getBoundingClientRect()); });
        leaving.forEach(function (c) {
          var r = before.get(c);
          c.style.position = 'absolute'; c.style.left = (r.left - g.left) + 'px'; c.style.top = (r.top - g.top) + 'px';
          c.style.width = r.width + 'px'; c.style.height = r.height + 'px'; c.style.pointerEvents = 'none'; c.style.zIndex = '0';
        });
        entering.forEach(function (c) { c.hidden = false; c.classList.add('in'); });
        var h1 = grid.offsetHeight;
        staying.forEach(function (c) {
          var a = before.get(c), b = c.getBoundingClientRect(), dx = a.left - b.left, dy = a.top - b.top;
          if (Math.abs(dx) + Math.abs(dy) < 1) return;
          anims.push(c.animate([{ transform: 'translate(' + dx + 'px,' + dy + 'px)' }, { transform: 'none' }],
            { duration: 780, easing: 'cubic-bezier(.34,1.32,.64,1)' }));
        });
        leaving.forEach(function (c, i) {
          var dir = i % 2 ? 1 : -1;
          anims.push(c.animate([
            { transform: 'none', opacity: 1 },
            { transform: 'translate(' + (dir * 20) + 'px,-14px) rotate(' + (dir * 4) + 'deg)', opacity: 1, offset: 0.2 },
            { transform: 'translate(' + (dir * 50) + 'px,240px) rotate(' + (dir * 18) + 'deg)', opacity: 0 }
          ], { duration: 640, delay: i * 50, easing: 'cubic-bezier(.45,0,.8,.5)', fill: 'forwards' }));
        });
        leavingNow = leaving;
        entering.forEach(function (c, i) {
          var tilt = (i % 2 ? 1 : -1) * 6;
          anims.push(c.animate([
            { transform: 'translateY(-110px) rotate(' + tilt + 'deg)', opacity: 0 },
            { transform: 'translateY(10px) rotate(' + (-tilt / 4) + 'deg)', opacity: 1, offset: 0.6 },
            { transform: 'translateY(-4px) rotate(0deg)', offset: 0.82 },
            { transform: 'none', opacity: 1 }
          ], { duration: 820, delay: 150 + i * 90, easing: 'cubic-bezier(.3,.7,.4,1)', fill: 'backwards' }));
        });
        if (h0 !== h1) anims.push(grid.animate([{ height: h0 + 'px' }, { height: h1 + 'px' }], { duration: 640, easing: 'cubic-bezier(.2,.8,.2,1)' }));
        var my = ++gen;
        setTimeout(function () { if (my !== gen) return; leavingNow.forEach(clearLeaving); leavingNow = []; anims = []; }, 1000);
      }

      // the count and the empty shelf speak about whichever kind is picked
      var picked = $('[data-filter="cat"][data-value="' + state.cat + '"]', filters);
      var noun = ((picked && picked.getAttribute('data-noun')) || count.getAttribute('data-noun') || 'thing|things').split('|');
      count.textContent = shown + ' ' + (shown === 1 ? noun[0] : noun[1]);
      if (animate && !reduce && count.animate) count.animate([{ transform: 'translateY(8px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 450, easing: 'cubic-bezier(.2,.8,.2,1)' });
      var wasHidden = empty.hidden;
      empty.hidden = shown !== 0;
      if (!empty.hidden && wasHidden && animate && !reduce && empty.animate) {
        empty.animate([{ transform: 'translateY(30px) scale(.96)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 700, delay: 250, easing: 'cubic-bezier(.34,1.4,.64,1)', fill: 'backwards' });
      }
      buttons.forEach(function (b) { b.setAttribute('aria-pressed', String(state[b.getAttribute('data-filter')] === b.getAttribute('data-value'))); });
      placeInd(segInd, 'price', animate); placeInd(chipInd, 'cat', animate);
      if (animate) {
        var q = new URLSearchParams();
        if (state.price !== 'all') q.set('price', state.price);
        if (state.cat !== 'all') q.set('cat', state.cat);
        var qs = q.toString();
        history.replaceState(null, '', location.pathname + (qs ? '?' + qs : '') + '#apps');
      }
      if (Toys) Toys.filter(state.price, state.cat);
    }

    buttons.forEach(function (b) {
      b.addEventListener('click', function () {
        var k = b.getAttribute('data-filter'), v = b.getAttribute('data-value');
        if (state[k] === v) return;
        state[k] = v; apply(true);
      });
    });
    reset.addEventListener('click', function () { state.price = 'all'; state.cat = 'all'; apply(true); });
    apply(false);
    filters.classList.add('ready');
    var replace = function () { placeInd(segInd, 'price', false); placeInd(chipInd, 'cat', false); };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(replace);
    window.addEventListener('resize', debounce(replace, 120));

    // cards lean towards the pointer and light up in their own colour
    if (fine && !reduce) all.forEach(function (card) {
      var inner = $('.card-in', card);
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect(), px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
        inner.style.transition = 'transform .25s cubic-bezier(.2,.8,.2,1), box-shadow .45s';
        inner.style.transform = 'translateY(-6px) rotateX(' + (-py * 8).toFixed(2) + 'deg) rotateY(' + (px * 10).toFixed(2) + 'deg)';
        inner.style.setProperty('--gx', ((px + 0.5) * 100).toFixed(1) + '%');
        inner.style.setProperty('--gy', ((py + 0.5) * 100).toFixed(1) + '%');
      });
      card.addEventListener('pointerleave', function () { inner.style.transition = ''; inner.style.transform = ''; });
    });
  })();

  /* ---------- the promise: three little toys ---------- */
  (function promise() {
    // 1. Quiet by design: hushes the whole page
    var quiet = $('.p-quiet'), hushBtn = $('#hushBtn'), hushTag = $('#hushTag');
    if (quiet && hushBtn && hushTag) {
      var idle = fine ? 'Hover to hush · click to keep it' : 'Tap to hush';
      var render = function () {
        var on = hush.pinned || hush.hover;
        quiet.classList.toggle('hushed', on);
        hushBtn.setAttribute('aria-pressed', String(hush.pinned));
        hushTag.textContent = hush.pinned ? 'Hushed · tap again to undo' : on ? 'Shh… the whole page slowed down' : idle;
        setHush(on);
      };
      hushTag.textContent = idle;
      if (fine) {
        quiet.addEventListener('pointerenter', function () { hush.hover = true; render(); });
        quiet.addEventListener('pointerleave', function () { hush.hover = false; render(); });
      }
      hushBtn.addEventListener('click', function () { hush.pinned = !hush.pinned; render(); });
    }

    // 2. Your data stays yours: a lock that clunks shut
    var lockCard = $('.p-lock'), lockBtn = $('#lockBtn'), lockTag = $('#lockTag');
    if (lockCard && lockBtn && lockTag) {
      var lockIdle = fine ? 'Click to lock' : 'Tap to lock';
      lockTag.textContent = lockIdle;
      lockBtn.addEventListener('click', function () {
        var on = !lockCard.classList.contains('locked');
        lockCard.classList.toggle('locked', on);
        lockBtn.setAttribute('aria-pressed', String(on));
        lockTag.textContent = on ? 'Locked tight' : lockIdle;
        lockCard.classList.remove('clunk');
        if (on) {
          void lockCard.offsetWidth;
          lockCard.classList.add('clunk');
          var r = $('.lock', lockCard).getBoundingClientRect();
          Fx.burst(r.left + r.width / 2, r.top + r.height * 0.6, 10);
        }
      });
    }

    // 3. Fair prices, no tricks: a balance you can tip
    var fair = $('.p-fair');
    if (!fair) return;
    var stage = $('.stage', fair), beam = $('#beam'), panL = $('#panL'), panR = $('#panR');
    var coinsL = $('.coins', panL), coinsR = $('.coins', panR), fairTag = $('#fairTag');
    var n = { l: 0, r: 0 }, ang = 0, av = 0, tilt = 0, vis = false, last = '';
    var fairIdle = fine ? 'Click a side to add a coin' : 'Tap a side to add a coin';
    fairTag.textContent = fairIdle;
    function target() { return clamp((n.r - n.l) * 5, -18, 18) + tilt; }
    function place() {
      var key = ang.toFixed(2);
      if (key === last) return; last = key;
      var a = ang * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
      beam.setAttribute('transform', 'rotate(' + key + ' 120 44)');
      panL.setAttribute('transform', 'translate(' + (120 - 82 * c).toFixed(2) + ' ' + (44 - 82 * s).toFixed(2) + ')');
      panR.setAttribute('transform', 'translate(' + (120 + 82 * c).toFixed(2) + ' ' + (44 + 82 * s).toFixed(2) + ')');
    }
    function tag() {
      fairTag.textContent = (n.l === n.r && n.l > 0) ? 'Perfectly fair' : n.l > n.r ? 'A bit pricey' : n.r > n.l ? 'Great value' : fairIdle;
    }
    function empty() {
      [coinsL, coinsR].forEach(function (g) { g.classList.add('spill'); });
      setTimeout(function () {
        [coinsL, coinsR].forEach(function (g) { while (g.firstChild) g.removeChild(g.firstChild); g.classList.remove('spill'); });
        n.l = 0; n.r = 0; tag(); if (reduce) { ang = 0; last = ''; place(); } Loop.wake();
      }, reduce ? 0 : 520);
    }
    function addCoin(side) {
      if (n[side] >= 6) { empty(); return; }
      n[side]++;
      var g = side === 'l' ? coinsL : coinsR, k = n[side];
      var coin = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      coin.setAttribute('class', 'coin');
      var e = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
      e.setAttribute('cx', rand(-5, 5).toFixed(1)); e.setAttribute('cy', (39.4 - (k - 1) * 5.4).toFixed(1));
      e.setAttribute('rx', '12'); e.setAttribute('ry', '4.6');
      coin.appendChild(e); g.appendChild(coin);
      av += side === 'l' ? -30 : 30;
      tag();
      if (reduce) { ang = target(); place(); }
      Loop.wake();
    }
    $('#addFree').addEventListener('click', function () { addCoin('l'); });
    $('#addFair').addEventListener('click', function () { addCoin('r'); });
    if (fine) {
      stage.addEventListener('pointermove', function (e) { var r = stage.getBoundingClientRect(); tilt = ((e.clientX - r.left) / r.width - 0.5) * 14; Loop.wake(); });
      stage.addEventListener('pointerleave', function () { tilt = 0; Loop.wake(); });
    }
    Loop.add(function (dtMs) {
      var dt = Math.min(0.05, dtMs / 1000) * timeScale();
      av += (-(ang - target()) * 80 - av * 7) * dt;
      ang += av * dt;
      place();
    }, function () { return vis && (Math.abs(ang - target()) > 0.02 || Math.abs(av) > 0.02); });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { vis = es[0].isIntersecting; if (vis) Loop.wake(); }).observe(fair);
  })();

  /* ---------- the peeking owl ---------- */
  var Peeker = (function () {
    var el = $('#peeker');
    if (!el) return null;
    var owl = $('.peek-owl', el), bub = $('.peek-bubble', el), pl = $('#peekPL'), pr = $('#peekPR'), rings = $$('.pring', el), tm = 0;
    function hide() { el.classList.remove('on'); }
    function peek(text, ms) {
      if (hush.on) return;
      bub.textContent = text;
      el.classList.add('on');
      clearTimeout(tm); tm = setTimeout(hide, ms || 2600);
    }
    owl.addEventListener('click', function () { bub.textContent = 'Oh! Pardon me.'; clearTimeout(tm); tm = setTimeout(hide, 900); });
    if (fine) window.addEventListener('pointermove', function () {
      if (!el.classList.contains('on')) return;
      [[pl, rings[0], 78], [pr, rings[1], 122]].forEach(function (q) {
        var r = q[1].getBoundingClientRect(), dx = ptr.x - (r.left + r.width / 2), dy = ptr.y - (r.top + r.height / 2), d = Math.hypot(dx, dy) || 1, m = 6 * Math.min(1, d / 120);
        q[0].setAttribute('cx', (q[2] + dx / d * m).toFixed(1)); q[0].setAttribute('cy', (96 + dy / d * m).toFixed(1));
      });
    }, { passive: true });
    if ('IntersectionObserver' in window) {
      var said = {};
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (en) {
          var k = en.target.id;
          if (en.isIntersecting && !said[k]) { said[k] = true; setTimeout(function () { peek(en.target.getAttribute('data-peek')); }, 450); }
        });
      }, { rootMargin: '-35% 0px -35% 0px' });
      $$('[data-peek]').forEach(function (s) { io.observe(s); });
    }
    return { peek: peek };
  })();

  /* ---------- the night sky in the footer ---------- */
  (function sky() {
    var sk = $('#sky'), cv = $('#skyCanvas'), clearBtn = $('#skyClear');
    if (!sk || !cv || !cv.getContext) return;
    var ctx = cv.getContext('2d'), dpr = Math.min(2, window.devicePixelRatio || 1), w = 0, h = 0, stars = [], lit = [], vis = false, hoverS = null, grow = 1;
    function gen() {
      stars = [];
      var n = clamp(Math.round(w * h / 6500), 30, 110);
      for (var i = 0; i < n; i++) stars.push({ fx: Math.random(), fy: Math.random(), r: rand(0.5, 1.5), b: rand(0.2, 0.65), ph: rand(0, 6.28), sp: rand(0.5, 1.4), lit: false });
    }
    function draw(t) {
      ctx.clearRect(0, 0, w, h);
      if (lit.length > 1) {
        ctx.lineWidth = 1.3; ctx.strokeStyle = 'rgba(242,162,58,.65)'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.beginPath(); ctx.moveTo(lit[0].fx * w, lit[0].fy * h);
        for (var i = 1; i < lit.length; i++) {
          var a = lit[i - 1], b = lit[i], k = i === lit.length - 1 ? grow : 1;
          ctx.lineTo(lerp(a.fx * w, b.fx * w, k), lerp(a.fy * h, b.fy * h, k));
        }
        ctx.stroke();
      }
      var tt = t / 1000 * (hush.on ? 0.2 : 1);
      for (var j = 0; j < stars.length; j++) {
        var s = stars[j], x = s.fx * w, y = s.fy * h;
        if (s.lit) {
          var gr = ctx.createRadialGradient(x, y, 0, x, y, 18);
          gr.addColorStop(0, 'rgba(255,200,120,.6)'); gr.addColorStop(1, 'rgba(255,200,120,0)');
          ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, 18, 0, 6.283); ctx.fill();
          ctx.fillStyle = '#FFE6BC'; ctx.beginPath(); ctx.arc(x, y, 2.7, 0, 6.283); ctx.fill();
        } else {
          var al = reduce ? s.b : clamp(s.b + Math.sin(tt * s.sp + s.ph) * 0.22, 0.06, 0.95);
          ctx.fillStyle = 'rgba(255,255,255,' + al.toFixed(3) + ')';
          ctx.beginPath(); ctx.arc(x, y, s.r * (s === hoverS ? 2.4 : 1), 0, 6.283); ctx.fill();
        }
      }
    }
    function size() {
      w = sk.clientWidth; h = sk.clientHeight;
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!stars.length) gen();
      draw(now());
    }
    function at(e) { var r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
    function nearest(p) {
      var best = null, bd = 22;
      stars.forEach(function (s) { var d = Math.hypot(s.fx * w - p.x, s.fy * h - p.y); if (d < bd) { bd = d; best = s; } });
      return best;
    }
    sk.addEventListener('click', function (e) {
      if (e.target.closest && e.target.closest('button, a')) return;
      var p = at(e), s = nearest(p);
      if (!s) { s = { fx: p.x / w, fy: p.y / h, r: 1.2, b: 0.5, ph: 0, sp: 1, lit: false }; stars.push(s); }
      if (s.lit) { s.lit = false; lit.splice(lit.indexOf(s), 1); }
      else { s.lit = true; lit.push(s); grow = reduce ? 1 : 0; Fx.burst(e.clientX, e.clientY, 6); }
      clearBtn.hidden = lit.length === 0;
      if (lit.length === 5 && Peeker) Peeker.peek('Rather lovely.', 2200);
      if (reduce) draw(0); else Loop.wake();
    });
    if (fine) sk.addEventListener('pointermove', function (e) {
      var s = nearest(at(e));
      if (s !== hoverS) { hoverS = s; sk.style.cursor = s ? 'pointer' : 'crosshair'; if (reduce) draw(0); }
    });
    clearBtn.addEventListener('click', function () {
      lit.forEach(function (s) { s.lit = false; }); lit = []; clearBtn.hidden = true;
      if (reduce) draw(0); else Loop.wake();
    });
    Loop.add(function (dt, t) { if (grow < 1) grow = Math.min(1, grow + dt / 420); draw(t); }, function () { return vis; });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { vis = es[0].isIntersecting; if (vis) Loop.wake(); }).observe(sk);
    if ('ResizeObserver' in window) new ResizeObserver(debounce(size, 60)).observe(sk); else window.addEventListener('resize', debounce(size, 120));
    size();
  })();

  /* ---------- why us: build it yourself, or just use it ---------- */
  (function why() {
    var diy = $('.path-diy'), mine = $('.path-owl');
    if (!diy || !mine) return;
    var list = $('#prompts'), num = $('#tokenNum'), diyBtn = $('#diyBtn'), diyTag = $('#diyTag'), owlBtn = $('#owlBtn'), owlTag = $('#owlTag');
    var lines = ['Make me an app that tidies my tabs', 'Make it look nicer', 'No, not like that', 'Why is the button gone?', 'It worked yesterday…', 'Please just fix it', 'Fix the fix', 'OK, start over'];
    var next = 4, tokens = 18240, shown = tokens, acc = 0, vis = false;
    var fmt = function (n) { return Math.round(n).toLocaleString('en-US'); };
    var verb = fine ? 'Click' : 'Tap';
    if (diyTag) diyTag.textContent = verb + ' to try again';
    if (owlTag) owlTag.textContent = verb + ' to open';

    // the bench: another prompt, another few thousand tokens
    function prompt(big) {
      var li = document.createElement('li');
      li.textContent = lines[next % lines.length]; next++;
      list.appendChild(li);
      var live = slice(list.children).filter(function (x) { return !x.classList.contains('out'); });
      if (live.length > 3) {
        var old = live[0]; old.classList.add('out');
        setTimeout(function () { if (old.parentNode) old.parentNode.removeChild(old); }, reduce ? 0 : 380);
      }
      tokens += big ? rand(3800, 6400) : rand(600, 2400);
      if (reduce) { shown = tokens; num.textContent = fmt(tokens); }
      diy.classList.remove('jolt'); void diy.offsetWidth; diy.classList.add('jolt');
      Loop.wake();
    }
    if (diyBtn) diyBtn.addEventListener('click', function () { prompt(true); });
    Loop.add(function (dt) {
      acc += dt * timeScale();
      if (acc > 2400) { acc = 0; prompt(false); }
      if (Math.abs(tokens - shown) > 0.5) { shown += (tokens - shown) * (1 - Math.exp(-dt / 220)); num.textContent = fmt(shown); }
    }, function () { return vis && !reduce; });

    // the Polite Owl way: it opens, ticks itself off, and someone says hello
    function play() { mine.classList.remove('play'); void mine.offsetWidth; mine.classList.add('play'); }
    if (owlBtn) owlBtn.addEventListener('click', function () { play(); if (owlTag) owlTag.textContent = verb + ' to open it again'; });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { vis = es[0].isIntersecting; if (vis) Loop.wake(); }).observe(diy);
      var once = new IntersectionObserver(function (es) {
        if (es[0].isIntersecting) { play(); once.disconnect(); }
      }, { threshold: 0.6 });
      once.observe(mine);
    }
  })();

  /* ---------- light, dark, or whatever your device prefers ---------- */
  (function theme() {
    var btn = $('#themeBtn'), meta = $('meta[name="theme-color"]');
    var mqd = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    var order = ['auto', 'light', 'dark'];
    var names = { auto: 'Auto', light: 'Light', dark: 'Dark' };
    var lines = { auto: 'As your device likes it.', light: 'Lights on.', dark: 'Lights off.' };
    function pref() { var p = root.getAttribute('data-theme-pref'); return order.indexOf(p) >= 0 ? p : 'auto'; }
    function apply(p) {
      var dark = p === 'dark' || (p === 'auto' && !!(mqd && mqd.matches));
      root.setAttribute('data-theme-pref', p);
      root.setAttribute('data-theme', dark ? 'dark' : 'light');
      if (meta) meta.setAttribute('content', dark ? '#0D1124' : '#EEF0F5');
      if (btn) {
        var next = order[(order.indexOf(p) + 1) % order.length];
        btn.setAttribute('aria-label', 'Theme: ' + names[p] + '. Switch to ' + names[next] + '.');
        btn.setAttribute('title', 'Theme: ' + names[p]);
      }
    }
    // a circle of the new theme grows out of the switch where the browser can; colours ease across elsewhere
    function change(p, x, y) {
      if (reduce) { apply(p); return; }
      if (document.startViewTransition) {
        root.style.setProperty('--vt-x', x + 'px'); root.style.setProperty('--vt-y', y + 'px');
        document.startViewTransition(function () { apply(p); });
        return;
      }
      root.classList.add('theme-anim'); apply(p);
      clearTimeout(change.t); change.t = setTimeout(function () { root.classList.remove('theme-anim'); }, 650);
    }
    if (btn) btn.addEventListener('click', function () {
      var p = order[(order.indexOf(pref()) + 1) % order.length], r = btn.getBoundingClientRect();
      try { localStorage.setItem('po-theme', p); } catch (e) { /* private mode: just this visit */ }
      change(p, r.left + r.width / 2, r.top + r.height / 2);
      if (Peeker) Peeker.peek(lines[p], 1700);
    });
    if (mqd) {
      var follow = function () { if (pref() === 'auto') { root.classList.add('theme-anim'); apply('auto'); setTimeout(function () { root.classList.remove('theme-anim'); }, 650); } };
      if (mqd.addEventListener) mqd.addEventListener('change', follow); else if (mqd.addListener) mqd.addListener(follow);
    }
    // another tab changed it: follow along
    window.addEventListener('storage', function (e) { if (e.key === 'po-theme') apply(order.indexOf(e.newValue) >= 0 ? e.newValue : 'auto'); });
    apply(pref());
  })();

  /* ---------- the buy bar that follows you down an app page ---------- */
  (function buybar() {
    // shown once the price has scrolled away, tucked away again at the footer
    var bar = $('#buybar'), panel = $('#buy'), foot = $('.foot');
    if (!bar || !panel || !('IntersectionObserver' in window)) return;
    var past = false, atFoot = false;
    function show() { var on = past && !atFoot; bar.classList.toggle('on', on); root.classList.toggle('buybar-on', on); }
    new IntersectionObserver(function (es) {
      var e = es[es.length - 1]; past = !e.isIntersecting && e.boundingClientRect.top < 0; show();
    }).observe(panel);
    if (foot) new IntersectionObserver(function (es) {
      atFoot = es[es.length - 1].isIntersecting; show();
    }, { rootMargin: '0px 0px -80px 0px' }).observe(foot);
  })();

  /* ---------- reveal on scroll ---------- */
  (function reveal() {
    var els = $$('[data-reveal]');
    if (reduce || !('IntersectionObserver' in window)) { els.forEach(function (el) { el.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target, sib = el.parentNode ? slice(el.parentNode.children).indexOf(el) : 0;
        var d = (el.matches('.card, .pcard') ? Math.max(0, sib) * 90 : 0);
        el.style.transitionDelay = d + 'ms';
        el.classList.add('in');
        io.unobserve(el);
        setTimeout(function () { el.style.transitionDelay = ''; }, 1300 + d);
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (el) { io.observe(el); });
  })();

  Loop.wake();
  window.__pg = true;
})();
