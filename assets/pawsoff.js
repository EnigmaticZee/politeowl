/* Paws Off page: a small keyboard you can lock, like the app does.
   Type in the note, press the big key, and your letters bounce off. Type "unlock" to get them back.
   Nothing typed here is stored or sent anywhere. */
(function () {
  'use strict';
  var desk = document.getElementById('desk');
  if (!desk) return;
  var $ = function (id) { return document.getElementById(id); };
  var note = $('deskNote'), kb = $('kb'), wrap = kb.parentNode, walkLayer = $('kbWalk'), key = $('lockKey');
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var PAW = key.querySelector('svg').outerHTML;
  var S = { locked: false, paw: false, total: 0, buf: '', held: new Set(), back: 0 };

  // chip, title, words underneath, key legend, key label
  var WORDS = {
    rest: ['Watching for paws', window.matchMedia && matchMedia('(pointer: coarse)').matches ? 'Tap to lock.' : 'Click to lock.', 'It locks by itself when a cat walks on the keys. Lock it yourself to clean or step away.', 'Lock', 'Lock the keyboard'],
    you: ['Locked by you', 'Paws off.', 'Nothing gets typed until you type “unlock” or press the key again.', 'Unlock', 'Unlock the keyboard'],
    paw: ['Locked by a paw', 'Caught a paw.', 'Something walked across your keyboard, so it’s locked now. Type “unlock” or press the key when you’re back.', 'Unlock', 'Unlock the keyboard']
  };

  // The keyboard: [code, label, width]. An empty code is a spacer.
  var letters = function (s) { return s.split('').map(function (c) { return ['Key' + c, c]; }); };
  var rows = [
    letters('QWERTYUIOP'),
    [['', '', 0.5]].concat(letters('ASDFGHJKL'), [['', '', 0.5]]),
    [['ShiftLeft', '⇧', 1.5]].concat(letters('ZXCVBNM'), [['Backspace', '⌫', 1.5]]),
    [['Comma', ',', 1.2], ['Space', 'space', 5.6], ['Period', '.', 1.2], ['Enter', 'return', 2]]
  ];
  var keyEl = {};
  rows.forEach(function (row) {
    var r = document.createElement('div');
    r.className = 'r';
    row.forEach(function (k) {
      var el = document.createElement('span');
      el.className = !k[0] ? 'k gap' : k[1].length > 1 ? 'k wide' : 'k';
      el.textContent = k[1];
      el.style.flexGrow = k[2] || 1;
      if (k[0]) { el.setAttribute('data-code', k[0]); keyEl[k[0]] = el; }
      r.appendChild(el);
    });
    kb.appendChild(r);
  });
  var charFor = function (code) {
    if (code.indexOf('Key') === 0) return code.slice(3).toLowerCase();
    return { Space: ' ', Comma: ',', Period: '.' }[code];
  };
  var codeFor = function (ch) {
    var c = (ch || '').toUpperCase();
    return /^[A-Z]$/.test(c) ? 'Key' + c : { ' ': 'Space', ',': 'Comma', '.': 'Period' }[c] || '';
  };
  var press = function (code, on) { var k = keyEl[code]; if (k) k.classList.toggle('down', on); };
  var later = function (fn, ms) { return setTimeout(fn, ms); };

  function render() {
    var w = WORDS[S.locked ? (S.paw ? 'paw' : 'you') : 'rest'];
    desk.classList.toggle('locked', S.locked);
    $('deskChip').querySelector('span').textContent = w[0];
    $('deskTitle').textContent = !S.locked && Date.now() - S.back < 2400 ? 'Welcome back.' : w[1];
    $('deskSub').textContent = w[2];
    $('lockLeg').textContent = w[3];
    key.setAttribute('aria-label', w[4]);
    key.setAttribute('aria-pressed', S.locked ? 'true' : 'false');
    $('deskCount').textContent = S.total.toLocaleString() + (S.total === 1 ? ' key caught' : ' keys caught');
    $('kbHeldText').textContent = S.paw ? 'Caught a paw · type unlock' : 'Locked · type unlock to get your keys back';
  }

  function lock(byPaw, keys) {
    if (S.locked) return;
    S.locked = true; S.paw = !!byPaw; S.buf = ''; S.held.clear();
    S.total += keys || 0;
    render();
  }
  function unlock() {
    if (!S.locked) return;
    S.locked = false; S.paw = false; S.buf = ''; S.back = Date.now();
    render();
    if (!reduce) { key.classList.remove('pop'); void key.offsetWidth; key.classList.add('pop'); }
    later(render, 2500);
  }

  // A key pressed while locked: counted, maybe part of the unlock word, and it hops off the keyboard.
  function bounce(code, label) {
    if (reduce) return;
    var k = keyEl[code], box = kb.getBoundingClientRect();
    var b = document.createElement('span'), s = document.createElement('s');
    b.className = 'bounce';
    s.textContent = label || '•';
    b.appendChild(s);
    if (k) { var r = k.getBoundingClientRect(); b.style.left = r.left - box.left + r.width / 2 + 'px'; b.style.top = r.top - box.top - 6 + 'px'; }
    else { b.style.left = '50%'; b.style.top = '10px'; }
    wrap.appendChild(b);
    later(function () { b.remove(); }, 820);
  }
  function caught(code, ch) {
    S.total++;
    if (ch) {
      S.buf = (S.buf + ch.toLowerCase()).slice(-6);
      if (S.buf === 'unlock') { unlock(); return; }
    }
    bounce(code, ch && ch.trim() ? ch : keyEl[code] ? keyEl[code].textContent : '');
    render();
  }

  // Your own keyboard, while you're typing in the note
  note.addEventListener('keydown', function (e) {
    press(e.code, true);
    if (S.locked) {
      if (e.key === 'Tab' || e.key === 'Escape') return;
      if (e.key === 'Unidentified' || e.key === 'Process') return; // phone keyboards: handled below
      e.preventDefault();
      if (!e.repeat && !e.metaKey && !e.ctrlKey) caught(e.code, e.key.length === 1 ? e.key : '');
      return;
    }
    if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
    if (e.key.length === 1) {
      // Four keys held down at once looks like a paw, not a person.
      S.held.add(e.code);
      if (S.held.size >= 4) { e.preventDefault(); lock(true, S.held.size); }
    }
  });
  note.addEventListener('keyup', function (e) { S.held.delete(e.code); press(e.code, false); });
  note.addEventListener('blur', function () {
    S.held.clear();
    Object.keys(keyEl).forEach(function (c) { keyEl[c].classList.remove('down'); });
  });
  note.addEventListener('beforeinput', function (e) {
    if (!S.locked) return;
    e.preventDefault();
    if (e.data) e.data.split('').forEach(function (ch) { caught(codeFor(ch), ch); });
  });

  // Tapping the drawn keys types too (that's how it works on phones)
  kb.addEventListener('pointerdown', function (e) {
    var k = e.target.closest('.k');
    if (!k || !k.getAttribute('data-code')) return;
    e.preventDefault();
    var code = k.getAttribute('data-code'), ch = charFor(code);
    press(code, true);
    later(function () { press(code, false); }, 130);
    if (S.locked) { caught(code, ch || ''); return; }
    if (code === 'Backspace') note.value = note.value.slice(0, -1);
    else if (code === 'Enter') note.value += '\n';
    else if (ch !== undefined) note.value += ch;
    note.scrollTop = note.scrollHeight;
    if (e.pointerType === 'mouse') note.focus({ preventScroll: true });
  });

  key.addEventListener('click', function (e) {
    if (S.locked) unlock(); else lock(false, 0);
    if (e.detail > 0 && !matchMedia('(pointer: coarse)').matches) note.focus({ preventScroll: true });
  });

  // A cat strolls across the keys. After a few steps, Paws Off notices and locks.
  var walking = false;
  $('catBtn').addEventListener('click', function () {
    if (walking) return;
    walking = true;
    if (S.locked) unlock();
    walkLayer.innerHTML = '';
    var path = [['KeyA', 'KeyS'], ['KeyE', 'KeyR'], ['KeyD', 'KeyF', 'KeyG'], ['KeyT', 'KeyY'], ['KeyH', 'KeyJ'], ['KeyU', 'KeyI'], ['KeyK', 'KeyL'], ['KeyO', 'KeyP']];
    var box = kb.getBoundingClientRect(), i = 0;
    (function step() {
      if (i >= path.length) {
        later(function () {
          [].forEach.call(walkLayer.children, function (p) { p.classList.remove('on'); });
          later(function () { walkLayer.innerHTML = ''; walking = false; }, 400);
        }, 900);
        return;
      }
      var keys = path[i], r = keyEl[keys[0]].getBoundingClientRect();
      var holder = document.createElement('span');
      holder.innerHTML = PAW;
      var p = holder.firstChild;
      p.style.left = r.left - box.left + r.width * 0.25 + 'px';
      p.style.top = r.top - box.top - 4 + 'px';
      p.style.setProperty('--r', (i % 2 ? 22 : -8) + 'deg');
      walkLayer.appendChild(p);
      requestAnimationFrame(function () { p.classList.add('on'); });
      keys.forEach(function (c) { press(c, true); });
      if (!S.locked) {
        note.value += keys.map(charFor).join('') + (i % 3 === 2 ? ' ' : '');
        note.scrollTop = note.scrollHeight;
        if (i === 2) later(function () { lock(true, 7); }, 120);
      } else {
        keys.forEach(function (c) { caught(c, charFor(c)); });
      }
      later(function () { keys.forEach(function (c) { press(c, false); }); }, reduce ? 40 : 200);
      i++;
      later(step, reduce ? 90 : 260);
    })();
  });

  render();
})();
