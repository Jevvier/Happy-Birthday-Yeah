(function () {
  'use strict';
  var $ = function (s) { return document.querySelector(s) };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)) };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var NAME = 'Chelsea Elfriani'; /* ganti di sini kalau namanya perlu diubah */
  var TARGET = new Date('2026-10-26T00:00:00+07:00').getTime();
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d } catch (e) { return d } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true } catch (e) { return false } }
  };
  var rand = function (a, b) { return a + Math.random() * (b - a) };
  var pick = function (arr) { return arr[Math.floor(Math.random() * arr.length)] };
  function replay(el, cls) { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls) }

  /* toast */
  var toastT;
  function toast(t) { var el = $('#toast'); el.textContent = t; el.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(function () { el.classList.remove('show') }, 2600) }

  /* suara */
  var actx = null, muted = false;
  function ac() {
    if (!actx) { try { actx = new (window.AudioContext || window.webkitAudioContext)() } catch (e) { actx = null } }
    if (actx && actx.state === 'suspended') { try { actx.resume() } catch (e) { } }
    return actx;
  }
  function tone(f, d, type, slide, vol, delay) {
    if (muted) return; var a = ac(); if (!a) return;
    var t = a.currentTime + (delay || 0), o = a.createOscillator(), g = a.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, f + slide), t + d);
    g.gain.setValueAtTime(vol || .12, t); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + d + .02);
  }
  function noise(d, vol) {
    if (muted) return; var a = ac(); if (!a) return;
    var n = Math.floor(a.sampleRate * d), b = a.createBuffer(1, n, a.sampleRate), data = b.getChannelData(0);
    for (var i = 0; i < n; i++)data[i] = (Math.random() * 2 - 1) * (1 - i / n);
    var s = a.createBufferSource(); s.buffer = b;
    var f = a.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 900;
    var g = a.createGain(); g.gain.value = vol || .06;
    s.connect(f); f.connect(g); g.connect(a.destination); s.start();
  }
  var sfx = {
    pop: function () { tone(520, .09, 'triangle', -380, .14); noise(.07, .06) },
    chirp: function () { var f = rand(1000, 1400); tone(f, .07, 'square', 350, .05); tone(f * 1.2, .08, 'square', 300, .05, .1) },
    boing: function () { tone(220, .3, 'sine', 420, .14) },
    tada: function () { [523, 659, 784, 1047].forEach(function (f, i) { tone(f, .22, 'triangle', 0, .12, i * .09) }) },
    puff: function () { noise(.28, .05) }
  };
  $('#snd').addEventListener('click', function () {
    muted = !muted; this.setAttribute('aria-pressed', String(muted));
    this.setAttribute('aria-label', muted ? 'Nyalakan suara' : 'Matikan suara');
    if (!muted) sfx.pop();
  });

  /* konfeti, bintang, dan jejak kursor */
  var cv = $('#fx'), g2 = cv.getContext('2d'), W = 0, H = 0, parts = [], trail = [], raf = 0;
  var COL = ['#FF5C5C', '#3DB5F5', '#48D6A0', '#FFFFFF', '#FF9A1F', '#FF8FD2', '#7B5CFF'];
  var TR = ['#FF5C5C', '#FF9A1F', '#FFE14D', '#48D6A0', '#3DB5F5', '#7B5CFF', '#FF8FD2'];
  function fit() { var d = Math.min(window.devicePixelRatio || 1, 2); W = window.innerWidth; H = window.innerHeight; cv.width = W * d; cv.height = H * d; g2.setTransform(d, 0, 0, d, 0, 0) }
  fit(); window.addEventListener('resize', fit);
  function mk(x, y, vx, vy, life, small) {
    parts.push({ x: x, y: y, vx: vx, vy: vy, g: .28, w: small ? 4 : rand(6, 13), h: small ? 4 : rand(4, 10), r: rand(0, 6.28), vr: rand(-.2, .2), c: pick(COL), t: 0, life: life || rand(80, 130), round: small || Math.random() < .3 });
  }
  function star(x, y, vx, vy) {
    parts.push({ x: x, y: y, vx: vx, vy: vy, g: .03, w: rand(8, 13), r: rand(0, 6.28), vr: rand(-.1, .1), c: pick(TR), t: 0, life: rand(28, 40), star: true });
  }
  function drawStar(p) {
    var s = p.w / 2, k = s * .4; g2.beginPath();
    for (var i = 0; i < 8; i++) { var a = i * Math.PI / 4 - Math.PI / 2, rr = i % 2 ? k : s; g2.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) }
    g2.closePath(); g2.lineWidth = 2; g2.lineJoin = 'round'; g2.strokeStyle = '#3A2600'; g2.stroke(); g2.fill();
  }
  function drawSpark(p) {
    var s = p.w / 2, k = s * .22; g2.beginPath();
    for (var i = 0; i < 8; i++) { var a = i * Math.PI / 4 - Math.PI / 2, rr = i % 2 ? k : s; g2.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) }
    g2.closePath(); g2.fill();
  }
  function glit() {
    if (reduce || document.hidden || parts.length > 80) return;
    parts.push({ x: rand(0, W), y: -10, vx: rand(-.25, .25), vy: rand(.5, 1.3), g: 0, w: rand(6, 12), r: rand(0, 6.28), vr: rand(-.03, .03), c: pick(['#FFFFFF', '#FFF3B0', '#FFE27A', '#FFFFFF']), ph: rand(0, 6.28), t: 0, life: Math.ceil((H + 30) / 1) + 60, glit: true });
    loop();
  }
  var ambientT = 0;
  function startAmbient() { if (!ambientT && !reduce) ambientT = setInterval(glit, 260) }
  function firework(x, y) {
    var col = pick(['#FFD34D', '#FF5C5C', '#3DB5F5', '#48D6A0', '#FF8FD2', '#FFFFFF']), n = 36;
    for (var i = 0; i < n; i++) {
      var a = i / n * 6.283 + rand(-.05, .05), sp = rand(3, 6.5);
      parts.push({ x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: .07, w: rand(5, 8), h: 5, r: 0, vr: 0, c: i % 3 ? col : '#FFFFFF', t: 0, life: rand(50, 75), round: true, fw: true });
    }
    loop();
  }
  function fireworks(n) {
    if (reduce) return;
    for (var i = 0; i < n; i++)setTimeout(function () { firework(rand(W * .12, W * .88), rand(H * .12, H * .5)) }, i * 450);
  }
  function drawTrail(now) {
    trail = trail.filter(function (p) { return now - p.t < 320 });
    var n = trail.length; if (n < 2) return;
    g2.lineCap = 'round'; g2.lineJoin = 'round';
    for (var pass = 0; pass < 2; pass++) {
      for (var i = 1; i < n; i++) {
        var a = trail[i - 1], b = trail[i], w = 2.5 + 6 * (i / n);
        g2.beginPath(); g2.moveTo(a.x, a.y); g2.lineTo(b.x, b.y);
        g2.lineWidth = pass === 0 ? w + 3 : w;
        g2.strokeStyle = pass === 0 ? '#3A2600' : TR[Math.floor(b.c / 3) % TR.length];
        g2.stroke();
      }
    }
  }
  function loop() {
    if (raf) return;
    var step = function () {
      var now = performance.now();
      g2.clearRect(0, 0, W, H);
      drawTrail(now);
      parts = parts.filter(function (p) { return p.t < p.life });
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i]; p.t++;
        if (p.glit) { p.x += p.vx + Math.sin(p.t / 18 + p.ph) * .35; p.y += p.vy; p.r += p.vr }
        else { var fr = p.fw ? .965 : .985; p.vy += p.g; p.vx *= fr; p.vy *= fr; p.x += p.vx; p.y += p.vy; p.r += p.vr }
        g2.globalAlpha = p.glit ? Math.min(1, (p.life - p.t) / 25) * (.35 + .65 * Math.abs(Math.sin(p.t / 9 + p.ph))) : Math.min(1, (p.life - p.t) / 25);
        g2.save(); g2.translate(p.x, p.y); g2.rotate(p.r); g2.fillStyle = p.c;
        if (p.glit) drawSpark(p);
        else if (p.star) drawStar(p);
        else if (p.round) { g2.beginPath(); g2.arc(0, 0, p.w / 2.2, 0, 6.283); g2.fill() }
        else g2.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        g2.restore();
      }
      g2.globalAlpha = 1;
      if (parts.length || trail.length) raf = requestAnimationFrame(step); else { raf = 0; g2.clearRect(0, 0, W, H) }
    };
    raf = requestAnimationFrame(step);
  }
  function burst(x, y, n, power) {
    n = n || 70; power = power || 9; if (reduce) n = Math.min(n, 10);
    for (var i = 0; i < n; i++) { var a = rand(0, 6.283), p = rand(2, power); mk(x, y, Math.cos(a) * p, Math.sin(a) * p - 4) }
    loop();
  }
  function rain(ms) {
    if (reduce) return; var end = performance.now() + (ms || 3500);
    var t = setInterval(function () {
      if (performance.now() > end) { clearInterval(t); return }
      for (var i = 0; i < 6; i++)mk(rand(0, W), -10, rand(-1, 1), rand(1, 3), rand(140, 200));
      loop();
    }, 120);
  }
  function burstAt(el, n) { var r = el.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2, n) }
  window.addEventListener('pointermove', function (e) { look(e.clientX, e.clientY) }, { passive: true });

  /* Piyo si anak ayam */
  var chick = $('#chick'), pupils = $('#pupils'), bubble = $('#bubble'), taps = 0;
  function look(x, y) {
    var r = chick.getBoundingClientRect(); if (!r.width) return;
    var dx = x - (r.left + r.width / 2), dy = y - (r.top + r.height * .5), d = Math.hypot(dx, dy) || 1, m = Math.min(1, d / 200) * 5;
    pupils.setAttribute('transform', 'translate(' + (dx / d * m).toFixed(2) + ',' + (dy / d * m).toFixed(2) + ')');
  }
  function say(t) { bubble.textContent = t; replay(bubble, 'show') }
  function daysLeft() { return Math.floor((TARGET - Date.now()) / 864e5) }
  function phrases() {
    if (curPhase === 'before') {
      var d = daysLeft();
      return ['Piyo! Jangan lupa tanggal 26 ya!', d >= 1 ? 'Tinggal ' + d + ' hari lagi lho!' : 'Tinggal beberapa jam lagi!', 'Colek aku lagi dong', 'Topi pestanya sudah kupasang', 'Ssst, ada kejutan di bawah', 'Ayo scroll, ada kue dan foto-foto!', 'Letuskan balonnya, seru lho'];
    }
    return ['SELAMAT ULANG TAHUN! Piyo piyo!', 'Hari ini kamu rajanya!', 'Tiup lilinnya dong', 'Kuenya jangan lupa dibagi ya', 'Aku sudah nunggu dari tadi'];
  }
  $('#chickBtn').addEventListener('click', function (e) {
    taps++; ac(); sfx.chirp();
    replay(chick, 'hop'); chick.classList.remove('flap'); void chick.offsetWidth; chick.classList.add('flap');
    var r = chick.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height * .3, 16, 6);
    if (taps % 10 === 0) { replay(chick, 'spin'); say('Aduh pusing... piyo~') } else say(pick(phrases()));
  });

  /* balon */
  (function () {
    var box = $('#balloons'), cols = ['#FF5C5C', '#3DB5F5', '#48D6A0', '#FF8FD2', '#7B5CFF', '#FF9A1F', '#FFFFFF'];
    for (var i = 0; i < 7; i++) {
      var b = document.createElement('div'); b.className = 'balloon';
      b.style.left = (4 + i * 13.5) + '%';
      b.style.setProperty('--c', cols[i % cols.length]);
      b.style.setProperty('--d', (11 + Math.random() * 7).toFixed(1) + 's');
      b.style.setProperty('--dl', '-' + (Math.random() * 12).toFixed(1) + 's');
      b.style.setProperty('--top', (8 + Math.random() * 50).toFixed(0) + '%');
      b.addEventListener('pointerdown', function (e) {
        var el = e.currentTarget; if (el.classList.contains('popped')) return;
        ac(); burstAt(el, 28); sfx.pop(); el.classList.add('popped'); say(pick(['Dooor! Aku kaget, piyo!', 'Satu balon pecah!', 'Yah, balonnya pecah']));
        setTimeout(function () { el.classList.remove('popped') }, 3500);
      });
      box.appendChild(b);
    }
  })();

  /* teks judul */
  function split(el, text) {
    el.textContent = ''; var n = 0;
    text.split(' ').forEach(function (word, wi) {
      if (wi) el.appendChild(document.createTextNode(' '));
      var w = document.createElement('span'); w.className = 'w';
      word.split('').forEach(function (ch) {
        var s = document.createElement('span'); s.className = 'ch'; s.setAttribute('aria-hidden', 'true');
        s.style.setProperty('--n', n++); s.textContent = ch; w.appendChild(s);
      });
      el.appendChild(w);
    });
  }
  function setTitle(l1, l2) { split($('#l1'), l1); split($('#l2'), l2); $('#h1').setAttribute('aria-label', l1 + ' ' + l2) }

  /* fase: sebelum, hari-H, sesudah */
  var preview = false, curPhase = '';
  function phase() {
    if (preview) return 'today';
    var n = Date.now(); return n < TARGET ? 'before' : (n < TARGET + 864e5 ? 'today' : 'after');
  }
  var dateLabel = '26 Oktober 2026';
  try { dateLabel = new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' }).format(new Date(TARGET)) } catch (e) { }
  $('#date').textContent = dateLabel;
  function buildTrack(txt) {
    var seg = (txt + ' ✦ ').repeat(6), tr = $('#track'); tr.innerHTML = '';
    for (var i = 0; i < 2; i++) { var s = document.createElement('span'); s.textContent = seg; tr.appendChild(s) }
  }
  function applyPhase() {
    var ph = phase(), changed = ph !== curPhase; curPhase = ph; document.body.dataset.phase = ph;
    var today = ph !== 'before';
    $('#tag').textContent = ph === 'before' ? 'Hitung mundur dimulai' : ph === 'today' ? 'Hari ini hari kamu' : 'Pestanya belum selesai';
    setTitle(ph === 'before' ? 'Sebentar lagi ulang tahun' : 'Selamat ulang tahun', NAME + '!');
    $('#sub').textContent = ph === 'before'
      ? 'Kejutannya baru bisa dibuka tanggal 26. Sambil menunggu, colek Piyo dan letuskan balon-balonnya ya.'
      : ph === 'today'
        ? 'Hari ini semua boleh dimanja. Tiup lilinnya, buka kotak kejutannya, lalu baca ucapan dari orang-orang yang sayang kamu.'
        : 'Hari ulang tahunnya sudah lewat, tapi kuenya masih boleh ditiup lagi. Silakan main sepuasnya.';
    $('#count').hidden = today; $('#todayBanner').hidden = !today;
    buildTrack(today ? 'SELAMAT ULANG TAHUN' : 'SEBENTAR LAGI ✦ ' + dateLabel.toUpperCase());
    if (window.__gift) window.__gift.sync(today);
    $('#previewBtn').textContent = preview ? 'Kembali ke hitung mundur' : 'Intip hari-H';
    if (changed && today) setTimeout(function () { rain(3200); fireworks(6) }, 500);
    if (changed) say(today ? 'SELAMAT ULANG TAHUN! Piyo piyo!' : 'Piyo! Colek aku dong!');
  }
  var last = {};
  function put(id, v) { var el = $('#' + id), s = String(v).padStart(2, '0'); if (last[id] !== s) { last[id] = s; el.textContent = s; if (id === 'cdS' && !reduce) replay(el, 'tick') } }
  function tick() {
    if (phase() !== curPhase) applyPhase();
    if (curPhase !== 'before') return;
    var s = Math.max(0, Math.floor((TARGET - Date.now()) / 1000));
    var d = Math.floor(s / 86400); s %= 86400; var h = Math.floor(s / 3600); s %= 3600; var m = Math.floor(s / 60); s %= 60;
    put('cdD', d); put('cdH', h); put('cdM', m); put('cdS', s);
  }
  $('#previewBtn').addEventListener('click', function () { preview = !preview; applyPhase(); tick() });

  /* tombol lompat */
  $$('[data-go]').forEach(function (el) {
    el.addEventListener('click', function (e) {
      e.preventDefault(); var t = $(el.getAttribute('data-go'));
      if (t) t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    });
  });

  /* kursor tebal dengan cincin, jejak pita warna-warni, dan bintang */
  (function () {
    var fine = window.matchMedia('(hover:hover) and (pointer:fine)');
    if (!fine.matches) return;
    var root = document.documentElement;
    var cur = document.createElement('div'); cur.id = 'cur'; cur.setAttribute('aria-hidden', 'true');
    cur.innerHTML = '<div class="cur-r"><i class="cur-ring"></i></div><div class="cur-d"><i class="cur-dot"></i></div>';
    document.body.appendChild(cur);
    var ring = cur.querySelector('.cur-r'), dot = cur.querySelector('.cur-d');
    var x = -100, y = -100, rx = -100, ry = -100, run = false, seen = false, ci = 0, lastStar = 0;
    var HOT = 'a,button,[role="button"],.candle,.balloon,.pol,label,.key,summary,select';
    function frame() {
      rx += (x - rx) * .24; ry += (y - ry) * .24;
      ring.style.transform = 'translate3d(' + rx.toFixed(1) + 'px,' + ry.toFixed(1) + 'px,0)';
      if (Math.abs(x - rx) > .3 || Math.abs(y - ry) > .3) requestAnimationFrame(frame); else run = false;
    }
    function kick() { if (!run) { run = true; requestAnimationFrame(frame) } }
    document.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      x = e.clientX; y = e.clientY;
      dot.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
      if (!seen) { seen = true; rx = x; ry = y; root.classList.add('cur-on') }
      root.classList.remove('cur-out');
      var t = e.target && e.target.closest ? e.target : null;
      if (t) {
        cur.classList.toggle('hot', !!t.closest(HOT));
        root.classList.toggle('cur-text', !!t.closest('textarea,input[type="text"]'));
      }
      kick();
      if (!reduce) {
        var now = performance.now();
        trail.push({ x: x, y: y, t: now, c: ci++ });
        if (trail.length > 30) trail.shift();
        if (now - lastStar > 160) { lastStar = now; star(x + rand(-6, 6), y + rand(-6, 6), rand(-1.2, 1.2), rand(-1.6, -.2)) }
        loop();
      }
    }, { passive: true });
    document.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse') return;
      cur.classList.add('down');
      if (reduce) return;
      var r = document.createElement('div'); r.className = 'cur-ripple'; r.style.left = e.clientX + 'px'; r.style.top = e.clientY + 'px';
      document.body.appendChild(r); setTimeout(function () { r.remove() }, 600);
      for (var i = 0; i < 3; i++)star(e.clientX, e.clientY, rand(-3, 3), rand(-4, -1));
      loop();
    });
    document.addEventListener('pointerup', function () { cur.classList.remove('down') });
    root.addEventListener('mouseleave', function () { root.classList.add('cur-out') });
    root.addEventListener('mouseenter', function () { root.classList.remove('cur-out') });
  })();

  /* ===== MUSIK =====
     DAFTAR LAGU: taruh file mp3 di folder "musik" dengan nama persis seperti di bawah.
     Lagu yang filenya tidak ada otomatis disembunyikan dari daftar.
     Kalau tidak ada satu pun file, yang diputar adalah musik kotak "Selamat Ulang Tahun" bawaan.
     Mau ganti lagu? Ubah judul (t) dan nama file (f), tambah atau hapus baris sesukamu. */
  var TRACKS = [
    { t: '22', a: 'Taylor Swift', f: 'musik/22.mp3' },
    { t: 'Shake It Off', a: 'Taylor Swift', f: 'musik/shake-it-off.mp3' },
    { t: 'Paper Rings', a: 'Taylor Swift', f: 'musik/paper-rings.mp3' },
    { t: 'Cruel Summer', a: 'Taylor Swift', f: 'musik/cruel-summer.mp3' },
    { t: 'Love Story', a: 'Taylor Swift', f: 'musik/love-story.mp3' },
    { t: 'Lover', a: 'Taylor Swift', f: 'musik/lover.mp3' },
    { t: 'Enchanted', a: 'Taylor Swift', f: 'musik/enchanted.mp3' },
    { t: 'Today Was a Fairytale', a: 'Taylor Swift', f: 'musik/today-was-a-fairytale.mp3' }
  ];
  /* ===== akhir daftar lagu ===== */

  var BUILTIN = { t: 'Selamat Ulang Tahun', a: 'Musik kotak bawaan', synth: true };
  var mp = $('#mp'), mPlay = $('#mpPlay'), mTitle = $('#mpTitle'), mSub = $('#mpSub'), mList = $('#mpList'), mPanel = $('#mpPanel');
  var mVol = store.get('kk_vol', .7), mOn = store.get('kk_musik', true) !== false;
  if (typeof mVol !== 'number' || mVol < 0 || mVol > 1) mVol = .7;
  var mPlaying = false, mIdx = 0, mItems = [BUILTIN], probeP = null, pendingAuto = false;
  var audio = new Audio(); audio.preload = 'auto'; audio.volume = mVol;
  $('#mpVol').value = Math.round(mVol * 100);

  /* cek file lagu mana yang benar-benar ada */
  function checkTrack(t) {
    return new Promise(function (res) {
      var done = false;
      function fin(ok) { if (done) return; done = true; t.ok = ok; res() }
      function viaAudio() {
        var a = new Audio(); a.preload = 'metadata';
        a.addEventListener('loadedmetadata', function () { fin(true) });
        a.addEventListener('error', function () { fin(false) });
        setTimeout(function () { fin(false) }, 4000);
        a.src = t.f;
      }
      if (window.fetch && /^https?:$/.test(location.protocol)) {
        fetch(t.f, { method: 'HEAD' }).then(function (r) {
          if (r.status === 405) { viaAudio(); return }
          var ct = r.headers.get('content-type') || '';
          fin(r.ok && ct.indexOf('text/html') < 0);
        }).catch(viaAudio);
      } else viaAudio();
    });
  }
  function probe() {
    if (!probeP) probeP = Promise.all(TRACKS.map(checkTrack)).then(buildItems);
    return probeP;
  }
  function buildItems() {
    var f = TRACKS.filter(function (t) { return t.ok });
    var cur = mItems[mIdx], wasSynth = mPlaying && cur && cur.synth;
    mItems = f.length ? f : [BUILTIN];
    var k = mItems.indexOf(cur); mIdx = k < 0 ? 0 : k;
    renderList(); setUI();
    if (wasSynth && k < 0) playItem(0);
  }

  /* musik kotak bawaan: melodi tradisional Selamat Ulang Tahun (domain publik) */
  var SPB = .54;
  var MEL = [[392, .75], [392, .25], [440, 1], [392, 1], [523.25, 1], [493.88, 2], [392, .75], [392, .25], [440, 1], [392, 1], [587.33, 1], [523.25, 2], [392, .75], [392, .25], [783.99, 1], [659.25, 1], [523.25, 1], [493.88, 1], [440, 1], [698.46, .75], [698.46, .25], [659.25, 1], [523.25, 1], [587.33, 1], [523.25, 3]];
  var CHO = { C: [130.81, 261.63, 329.63, 392], G: [98, 246.94, 293.66, 392], F: [87.31, 220, 261.63, 349.23] };
  var BARS = ['C', 'G', 'G', 'C', 'C', 'F', 'C', 'C'];
  var LEN = 28, EV = [];
  (function () {
    var b = 0;
    MEL.forEach(function (n) { EV.push({ b: b, f: n[0], d: n[1], k: 'm' }); b += n[1] });
    BARS.forEach(function (c, i) {
      var s = 1 + i * 3, ch = CHO[c];
      EV.push({ b: s, f: ch[0], d: 1, k: 'b' });
      EV.push({ b: s + 1, f: ch[1], d: 1, k: 'c' }, { b: s + 1, f: ch[2], d: 1, k: 'c' }, { b: s + 1, f: ch[3], d: 1, k: 'c' });
      EV.push({ b: s + 2, f: ch[1], d: 1, k: 'c' }, { b: s + 2, f: ch[2], d: 1, k: 'c' }, { b: s + 2, f: ch[3], d: 1, k: 'c' });
    });
    EV.sort(function (a, b) { return a.b - b.b });
  })();
  var synth = { gain: null, timer: null, i: 0, t0: 0 };
  function mnote(f, t, d, vol, type) {
    var a = actx; if (!a || !synth.gain) return;
    var o = a.createOscillator(), g = a.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + .012); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    o.connect(g); g.connect(synth.gain); o.start(t); o.stop(t + d + .05);
  }
  function playEv(e, t) {
    if (e.k === 'm') { mnote(e.f, t, Math.max(.7, e.d * SPB * 1.7), .32, 'sine'); mnote(e.f * 2, t, .4, .08, 'sine'); mnote(e.f * 3, t, .2, .03, 'sine') }
    else if (e.k === 'b') mnote(e.f, t, SPB * 1.5, .34, 'triangle');
    else mnote(e.f, t, SPB * .9, .09, 'triangle');
  }
  function pump() {
    var a = actx; if (!a || synth.timer === null) return;
    while (true) {
      var e = EV[synth.i], t = synth.t0 + e.b * SPB;
      if (t > a.currentTime + .6) break;
      if (t >= a.currentTime - .05) playEv(e, t);
      synth.i++;
      if (synth.i >= EV.length) { synth.i = 0; synth.t0 += LEN * SPB }
    }
  }
  function startSynth() {
    var a = ac(); if (!a) return false;
    if (!synth.gain) { synth.gain = a.createGain(); synth.gain.connect(a.destination) }
    synth.gain.gain.value = mVol * .55;
    stopSynth();
    synth.i = 0; synth.t0 = a.currentTime + .15;
    synth.timer = setInterval(pump, 100); pump();
    if (a.resume) a.resume().then(function () {
      if (a.state !== 'running' && synth.timer !== null) { stopSynth(); mPlaying = false; pendingAuto = true; setUI() }
    });
    return true;
  }
  function stopSynth() { if (synth.timer !== null) { clearInterval(synth.timer); synth.timer = null } }

  /* pemutar */
  function ico(n) {
    var m = {
      prev: '<path d="M6 5v14M19 5L9 12l10 7z" fill="#3A2600" stroke="#3A2600" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>',
      next: '<path d="M18 5v14M5 5l10 7-10 7z" fill="#3A2600" stroke="#3A2600" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>'
    };
    return '<svg viewBox="0 0 24 24" aria-hidden="true">' + m[n] + '</svg>';
  }
  $('#mpPrev').innerHTML = ico('prev'); $('#mpNext').innerHTML = ico('next');
  function renderList() {
    mList.innerHTML = '';
    mItems.forEach(function (it, i) {
      var li = document.createElement('li'), b = document.createElement('button');
      b.type = 'button'; b.className = 'mp-item';
      if (i === mIdx) b.setAttribute('aria-current', 'true');
      var t = document.createElement('b'); t.textContent = it.t;
      var a = document.createElement('span'); a.textContent = it.a;
      b.appendChild(t); b.appendChild(a);
      b.addEventListener('click', function () { mOn = true; store.set('kk_musik', true); playItem(i) });
      li.appendChild(b); mList.appendChild(li);
    });
  }
  function setUI() {
    var it = mItems[mIdx] || BUILTIN;
    mp.classList.toggle('playing', mPlaying);
    mPlay.setAttribute('aria-pressed', String(mPlaying));
    mPlay.setAttribute('aria-label', mPlaying ? 'Jeda musik' : 'Putar musik');
    mTitle.textContent = it.t;
    mSub.textContent = mPlaying ? it.a : (mOn ? 'Ketuk piringan untuk memutar' : 'Musik mati. Ketuk untuk menyalakan');
  }
  function stopAll() { audio.pause(); stopSynth() }
  function playItem(i) {
    var n = mItems.length; mIdx = ((i % n) + n) % n;
    var it = mItems[mIdx]; stopAll();
    if (it.synth) { mPlaying = startSynth(); setUI(); renderList(); return }
    audio.src = it.f; audio.volume = mVol;
    mPlaying = true; setUI(); renderList();
    var pr = audio.play();
    if (pr && pr.catch) pr.catch(function () { mPlaying = false; pendingAuto = true; setUI() });
  }
  function resume() {
    var it = mItems[mIdx];
    if (!it) { playItem(0); return }
    if (it.synth || !audio.currentSrc || audio.currentSrc.indexOf(it.f) < 0) { playItem(mIdx); return }
    mPlaying = true; setUI();
    var pr = audio.play();
    if (pr && pr.catch) pr.catch(function () { mPlaying = false; pendingAuto = true; setUI() });
  }
  function toggleMusic() {
    ac();
    if (mPlaying) { stopAll(); mPlaying = false; mOn = false; store.set('kk_musik', false); pendingAuto = false; setUI(); return }
    mOn = true; store.set('kk_musik', true); pendingAuto = false; resume();
  }
  audio.addEventListener('ended', function () { playItem(mIdx + 1) });
  audio.addEventListener('error', function () {
    var it = mItems[mIdx]; if (!it || it.synth) return;
    it.ok = false; buildItems(); playItem(0);
  });
  mPlay.addEventListener('click', toggleMusic);
  $('#mpPrev').addEventListener('click', function () { ac(); mOn = true; store.set('kk_musik', true); playItem(mIdx - 1) });
  $('#mpNext').addEventListener('click', function () { ac(); mOn = true; store.set('kk_musik', true); playItem(mIdx + 1) });
  $('#mpOpen').addEventListener('click', function () { mPanel.hidden = !mPanel.hidden; $('#mpOpen').setAttribute('aria-expanded', String(!mPanel.hidden)) });
  $('#mpClose').addEventListener('click', function () { mPanel.hidden = true; $('#mpOpen').setAttribute('aria-expanded', 'false') });
  $('#mpVol').addEventListener('input', function () {
    mVol = this.value / 100; audio.volume = mVol;
    if (synth.gain) synth.gain.gain.value = mVol * .55;
    store.set('kk_vol', mVol);
  });
  /* kalau browser menahan putar otomatis, putar saat pengunjung mengetuk apa saja */
  document.addEventListener('pointerdown', function (e) {
    if (!pendingAuto || !mOn || mPlaying || mp.hidden) return;
    if (e.target.closest && e.target.closest('#mp')) return;
    pendingAuto = false; ac(); resume();
  });
  function startMusic() {
    mp.hidden = false; renderList(); setUI();
    Promise.race([probe(), new Promise(function (r) { setTimeout(r, 3000) })]).then(function () {
      buildItems();
      if (mOn) { ac(); playItem(0) }
    });
  }
  probe();

  /* gerbang kode rahasia: 26 Oktober 2006 ditulis 261006 */
  var PASS = '261006'; /* ganti di sini kalau kodenya perlu diubah */
  var gate = $('#gate'), appEl = $('#app'), gDots = $$('.gdot'), gBox = $('#gdots'), gMsg = $('#gMsg');
  var entry = '', wrong = 0, busy = false, gateOn = true;
  function drawDots() { gDots.forEach(function (d, i) { d.classList.toggle('on', i < entry.length) }) }
  (function () {
    var pad = $('#keypad'), keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '<'];
    keys.forEach(function (k) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'key';
      if (k === '') { b.className = 'key ghost'; b.tabIndex = -1; b.setAttribute('aria-hidden', 'true') }
      else if (k === '<') { b.className = 'key fn'; b.textContent = 'Hapus'; b.setAttribute('aria-label', 'Hapus angka terakhir'); b.addEventListener('click', back) }
      else { b.textContent = k; b.addEventListener('click', function () { press(k) }) }
      pad.appendChild(b);
    });
  })();
  function press(d) {
    if (!gateOn || busy || entry.length >= PASS.length) return;
    ac(); tone(480 + entry.length * 70, .09, 'triangle', 120, .1);
    entry += d; drawDots();
    if (entry.length === PASS.length) check();
  }
  function back() {
    if (!gateOn || busy || !entry.length) return;
    entry = entry.slice(0, -1); drawDots(); sfx.puff();
  }
  function check() {
    busy = true;
    if (entry === PASS) {
      gate.classList.add('ok');
      gMsg.textContent = 'Yeay! Selamat datang, Chelsea!';
      sfx.tada();
      var r = $('.lockbox').getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2, 80);
      setTimeout(unlock, 1100);
    } else {
      wrong++;
      gBox.classList.remove('bad'); void gBox.offsetWidth; gBox.classList.add('bad');
      sfx.boing();
      gMsg.textContent = pick(['Belum tepat, coba lagi ya.', 'Hmm, bukan itu. Ingat-ingat lagi!', 'Hampir! Coba sekali lagi.']);
      if (wrong >= 3) showHint();
      setTimeout(function () { entry = ''; drawDots(); gBox.classList.remove('bad'); busy = false }, 700);
    }
  }
  function showHint() { $('#gHint').hidden = false; $('#gHintBtn').hidden = true }
  $('#gHintBtn').addEventListener('click', showHint);
  function unlock() {
    gate.classList.add('open');
    appEl.removeAttribute('inert');
    setTimeout(function () {
      gate.hidden = true; gateOn = false;
      applyPhase();
      burst(window.innerWidth / 2, window.innerHeight * .35, 90); rain(2600); fireworks(5); startAmbient(); startMusic();
      say('Halo Chelsea! Piyo kangen kamu.');
      window.scrollTo(0, 0);
    }, reduce ? 50 : 980);
  }
  document.addEventListener('keydown', function (e) {
    if (!gateOn) return;
    if (/^[0-9]$/.test(e.key)) { e.preventDefault(); press(e.key) }
    else if (e.key === 'Backspace') { e.preventDefault(); back() }
  });
  var firstKey = $('.key'); if (firstKey) setTimeout(function () { try { firstKey.focus({ preventScroll: true }) } catch (e) { } }, 50);

  /* kue dan lilin */
  var cakeEl = $('#cake'), candles = $$('.candle'), lit = candles.length, blowBtn = $('#blow'), cutBtn = $('#cut'), cakeMsg = $('#cakeMsg'), sliced = false, FIRST = NAME.split(' ')[0];
  function snuff(c) {
    if (c.classList.contains('out') || c.classList.contains('bend')) return;
    ac(); c.classList.add('bend'); lit--;
    c._t = setTimeout(function () { c.classList.remove('bend'); c.classList.add('out'); sfx.puff() }, reduce ? 0 : 300);
    if (lit === 0) setTimeout(allOut, reduce ? 0 : 700);
    else cakeMsg.textContent = 'Tinggal ' + lit + ' lilin lagi. Tiup terus!';
  }
  function allOut() {
    if (lit !== 0) return;
    cakeEl.classList.add('dark'); cutBtn.hidden = false;
    blowBtn.textContent = 'Nyalakan lagi';
    cakeMsg.textContent = 'Hore! Semua lilin padam. Semoga permohonanmu terkabul. Sekarang waktunya potong kue!';
    burstAt(cakeEl, 90); sfx.tada();
    var w = $('#wish').value.trim();
    if (w) {
      var r = cakeEl.getBoundingClientRect(), f = document.createElement('div');
      f.className = 'wishfloat'; f.textContent = w; f.style.left = (r.left + r.width / 2) + 'px'; f.style.top = (r.top + 20) + 'px';
      document.body.appendChild(f); setTimeout(function () { f.remove() }, 3300);
      $('#wish').value = '';
    }
    say('Permohonanmu sudah terbang ke langit, piyo!');
  }
  function uncut() { sliced = false; cakeEl.classList.remove('cut'); cutBtn.textContent = 'Potong kue' }
  function relight() {
    candles.forEach(function (c) { clearTimeout(c._t); c.classList.remove('out', 'bend') }); lit = candles.length;
    uncut(); cutBtn.hidden = true; cakeEl.classList.remove('dark');
    blowBtn.textContent = 'Tiup lilin'; cakeMsg.textContent = 'Lima lilin menyala lagi. Ayo tiup bareng-bareng!'; sfx.pop();
  }
  function doCut() {
    if (sliced) { uncut(); cakeMsg.textContent = 'Kuenya utuh lagi. Mau potong lagi?'; sfx.pop(); return }
    sliced = true; ac(); cakeEl.classList.add('cut'); cutBtn.textContent = 'Kue utuh lagi';
    tone(760, .28, 'sawtooth', -540, .04);
    setTimeout(function () {
      burstAt(cakeEl, 70); sfx.tada();
      cakeMsg.textContent = 'Potongan pertama buat ' + FIRST + '! Sisanya dibagi ya.';
      say('Aku mau potongan yang ada cerinya, piyo!');
    }, reduce ? 0 : 900);
  }
  candles.forEach(function (c) {
    c.addEventListener('click', function () { snuff(c) });
    c.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); snuff(c) } });
  });
  blowBtn.addEventListener('click', function () {
    if (lit === 0) { relight(); return }
    ac(); noise(.7, .07);
    cakeEl.classList.remove('wind'); void cakeEl.getBoundingClientRect(); cakeEl.classList.add('wind');
    candles.forEach(function (c, i) { setTimeout(function () { snuff(c) }, 300 + i * 120) });
  });
  cutBtn.addEventListener('click', doCut);
  cakeEl.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('.candle')) return;
    cakeEl.classList.remove('wob'); void cakeEl.getBoundingClientRect(); cakeEl.classList.add('wob'); sfx.boing();
  });
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (x) { if (x.isIntersecting) { cakeEl.classList.add('build'); io.disconnect() } });
    }, { threshold: .4 });
    io.observe(cakeEl);
  }

  /* kotak kejutan */
  var gift = $('#gift'), giftMsg = $('#giftMsg'), letter = $('#letter'), giftOpen = false, giftToday = false, giftBusy = false, giftT = [];
  function later(fn, ms) { giftT.push(setTimeout(fn, reduce ? 0 : ms)) }
  function closeGift() {
    giftT.forEach(clearTimeout); giftT = []; giftOpen = false; giftBusy = false;
    gift.classList.remove('shaking', 'open'); letter.hidden = true; giftMsg.textContent = 'Siap dibuka! Ketuk kotaknya.';
  }
  window.__gift = {
    sync: function (today) {
      giftToday = today; gift.setAttribute('data-locked', String(!today));
      if (!today) { if (giftOpen || giftBusy) closeGift(); giftMsg.textContent = 'Terkunci sampai 26 Oktober' }
      else if (!giftOpen && !giftBusy) giftMsg.textContent = 'Siap dibuka! Ketuk kotaknya.';
    }
  };
  gift.addEventListener('click', function () {
    ac();
    if (giftBusy) return;
    if (!giftToday) {
      replay(gift, 'shake'); sfx.boing();
      var d = daysLeft();
      giftMsg.textContent = 'Belum boleh dibuka! Sabar ' + (d >= 1 ? d + ' hari' : 'beberapa jam') + ' lagi ya.';
      say('Eits, belum boleh! Tunggu tanggal 26.'); return;
    }
    if (giftOpen) { closeGift(); sfx.pop(); return }
    giftBusy = true; gift.classList.add('shaking'); giftMsg.textContent = 'Wah, kotaknya bergoyang-goyang...';
    noise(.9, .05); tone(120, .9, 'sawtooth', 60, .04);
    later(function () {
      gift.classList.remove('shaking'); gift.classList.add('open'); giftOpen = true; giftBusy = false;
      sfx.pop(); burstAt(gift, 130); rain(2600); later(sfx.tada, 120);
      giftMsg.textContent = 'Kejutan! Ada surat kecil untukmu. Ketuk lagi untuk menutup.';
    }, 1000);
    later(function () { letter.hidden = false }, 2000);
  });

  /* dinding foto */
  /* ===== DAFTAR FOTO (ganti di sini) =====
     src = lokasi file foto, cap = tulisan di bawah foto.
     Taruh fotomu di folder "foto", lalu sesuaikan nama file di bawah.
     Kalau file tidak ditemukan, kotaknya tampil kosong dengan tulisan "Pasang fotomu".
     Jumlah foto bebas, paling rapi kalau kelipatan 12 (12, 24, 36). */
  var PHOTOS = [
    { src: 'foto/c1.jpg', cap: 'Malu-malu Pose' },
    { src: 'foto/c2.jpg', cap: 'Senyum Terooss' },
    { src: 'foto/c3.jpg', cap: 'Senyum Manis' },
    { src: 'foto/c4.jpg', cap: 'Jalan-jalan' },
    { src: 'foto/c5.jpg', cap: 'Selfie dadakan' },
    { src: 'foto/c6.jpg', cap: 'Si Paling Olahraga' },
    { src: 'foto/c7.jpg', cap: 'Kalcer Banget' },
    { src: 'foto/c8.jpg', cap: 'Trio Family' },
    { src: 'foto/c9.jpg', cap: 'Pose Imut' },
    { src: 'foto/c10.jpg', cap: 'Pose Andalan' },
    { src: 'foto/c11.jpg', cap: 'Bestie' },
    { src: 'foto/c12.jpg', cap: 'Messy Hair Pose' }
  ];
  /* ===== akhir daftar foto ===== */
  var broken = {};
  var BGS = ['#FFE88A', '#FFD1DC', '#C9ECFF', '#C8F4E2', '#FFD9A8', '#E6DAFF'];
  var TILTS = [-3, 2, -1.5, 3, 2.5, -2, 1.5, -3, -1, 3, -2.5, 2];
  var CAM = '<svg viewBox="0 0 48 48" fill="none" stroke="#3A2600" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true"><rect x="5" y="14" width="38" height="26" rx="6" fill="#FFFBEA"/><path d="M16 14l3-6h10l3 6"/><circle cx="24" cy="27" r="8" fill="#FFD92E"/></svg>';
  var mine = store.get('kk_foto', {});
  function src(i) { return mine[i] || (broken[i] ? '' : PHOTOS[i].src) }
  function paint(i) {
    var btn = $('#pol' + i), s = src(i), pic = btn.querySelector('.pic');
    pic.innerHTML = '';
    if (s) {
      var im = document.createElement('img');
      im.onerror = function () { if (!mine[i]) { broken[i] = true; paint(i) } };
      im.src = s; im.alt = PHOTOS[i].cap; im.loading = 'lazy'; pic.appendChild(im);
      btn.setAttribute('aria-label', 'Perbesar foto: ' + PHOTOS[i].cap);
    }
    else { pic.innerHTML = '<span class="ph">' + CAM + '<span>Pasang fotomu</span></span>'; btn.setAttribute('aria-label', 'Pasang foto untuk: ' + PHOTOS[i].cap) }
  }
  (function () {
    var ul = $('#wall');
    PHOTOS.forEach(function (p, i) {
      var li = document.createElement('li'), b = document.createElement('button');
      b.type = 'button'; b.className = 'pol'; b.id = 'pol' + i; b.style.setProperty('--r', TILTS[i % TILTS.length] + 'deg');
      b.innerHTML = '<span class="pic"></span><span class="cap"></span>';
      b.querySelector('.pic').style.setProperty('--bg', BGS[i % BGS.length]);
      b.querySelector('.cap').textContent = p.cap;
      b.addEventListener('click', function () { onTile(i) });
      li.appendChild(b); ul.appendChild(li); paint(i);
    });
  })();
  var fileEl = $('#file'), target = 0;
  function onTile(i) { ac(); target = i; if (src(i)) openLb(i); else fileEl.click() }
  function readImage(file) {
    return new Promise(function (res, rej) {
      var fr = new FileReader(); fr.onerror = rej;
      fr.onload = function () {
        var im = new Image(); im.onerror = rej;
        im.onload = function () {
          var k = Math.min(1, 900 / Math.max(im.width, im.height)), c = document.createElement('canvas');
          c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
          c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); res(c.toDataURL('image/jpeg', .8));
        };
        im.src = fr.result;
      };
      fr.readAsDataURL(file);
    });
  }
  fileEl.addEventListener('change', function () {
    var f = fileEl.files && fileEl.files[0]; fileEl.value = ''; if (!f) return;
    var i = target;
    readImage(f).then(function (url) {
      mine[i] = url;
      if (!store.set('kk_foto', mine)) { delete mine[i]; toast('Penyimpanan penuh. Coba foto yang lebih kecil.'); return }
      paint(i); sfx.tada(); burstAt($('#pol' + i), 40); toast('Foto terpasang!');
      if (!$('#lb').hidden) showLb(i);
    }).catch(function () { toast('Fotonya tidak bisa dibuka. Coba file lain.') });
  });

  /* lightbox */
  var lb = $('#lb'), lbList = [], lbPos = 0, lbFrom = null;
  function showLb(i) {
    lbList = PHOTOS.map(function (p, k) { return k }).filter(function (k) { return src(k) });
    lbPos = Math.max(0, lbList.indexOf(i)); target = i;
    $('#lbImg').src = src(i); $('#lbImg').alt = PHOTOS[i].cap; $('#lbCap').textContent = PHOTOS[i].cap;
    var many = lbList.length > 1; $('#lbPrev').hidden = !many; $('#lbNext').hidden = !many;
    $('#lbDel').hidden = !mine[i];
  }
  function openLb(i) { lbFrom = document.activeElement; lb.hidden = false; showLb(i); $('#lbX').focus() }
  function closeLb() { lb.hidden = true; if (lbFrom && lbFrom.focus) lbFrom.focus() }
  function stepLb(d) { if (lbList.length < 2) return; lbPos = (lbPos + d + lbList.length) % lbList.length; showLb(lbList[lbPos]) }
  $('#lbX').addEventListener('click', closeLb);
  lb.addEventListener('click', function (e) { if (e.target === lb) closeLb() });
  $('#lbPrev').addEventListener('click', function () { stepLb(-1) });
  $('#lbNext').addEventListener('click', function () { stepLb(1) });
  $('#lbChange').addEventListener('click', function () { fileEl.click() });
  $('#lbDel').addEventListener('click', function () {
    delete mine[target]; store.set('kk_foto', mine); paint(target);
    if (src(target)) showLb(target); else { closeLb(); toast('Foto dihapus') }
  });
  document.addEventListener('keydown', function (e) {
    if (lb.hidden) return;
    if (e.key === 'Escape') closeLb(); else if (e.key === 'ArrowLeft') stepLb(-1); else if (e.key === 'ArrowRight') stepLb(1);
  });

  /* buku ucapan */
  var SEED = [
    { from: 'Jvr', st: '🌟', text: 'Happy Birtday yeahh! Makasih sudah jadi orang yang selalu bahagia di dalam keadaan apapun, bahkan pas lagi ga mood sekalipun. Semoga semua yang kamu cita-citakan pelan-pelan jadi kenyataan, AMINNN.' },
    { from: 'Kubil', st: '🎂', text: 'Terimakasi, uda selalu usahain yang terbaik, happy birthday.' },
    { from: 'Your Mother', st: '🌻', text: 'Terangilah setiap langkah dan keputusan yang akan di ambil ke depannya. Berikanlah kemudahan dalam setiap pembelajarannya, kelancaran dalam menggapai cita-cita, serta jadikanlah pribadi yang tangguh, mandiri, dan bermanfaat bagi orang-orang di sekitarnya, AMINNN.' },
    { from: 'Piyo', st: '🐥', text: 'Piyo piyo! Selamat ulang tahun dan selamat bertambah usia yeah, sudah yeah hari ini jangan sedih lagi kan ada aku disini dan kamu harus bahagia pokonya ! Btw aku sudah pakai topi paling bagus buat kamu nihh.' }
  ];
  var mineW = store.get('kk_ucapan', []);
  var book = $('#book'), spread = $('#spread'), cur = 0, per = 2, pages = 1;
  var mq = window.matchMedia('(min-width:720px)');
  function allWishes() { return SEED.concat(mineW) }
  function pageEl(w, n, idx) {
    var a = document.createElement('article');
    if (!w) {
      a.className = 'page empty';
      a.textContent = 'Halaman ini masih kosong. Tulis ucapanmu di formulir bawah, nanti muncul di sini.';
      return a;
    }
    a.className = 'page';
    var top = document.createElement('div'); top.className = 'pg-top';
    var st = document.createElement('span'); st.className = 'stk-big'; st.textContent = w.st || '💛';
    var no = document.createElement('span'); no.textContent = 'Ucapan ' + n;
    top.appendChild(st); top.appendChild(no);
    var tx = document.createElement('p'); tx.className = 'wish-text'; tx.textContent = w.text;
    var fr = document.createElement('p'); fr.className = 'wish-from'; fr.textContent = '— ' + w.from;
    var foot = document.createElement('div'); foot.className = 'wish-foot';
    if (idx >= SEED.length) {
      var del = document.createElement('button'); del.type = 'button'; del.className = 'del-btn'; del.textContent = 'Hapus';
      del.setAttribute('aria-label', 'Hapus ucapan ini');
      var armT;
      del.addEventListener('click', function () {
        if (!del.classList.contains('armed')) {
          del.classList.add('armed'); del.textContent = 'Yakin hapus?';
          clearTimeout(armT); armT = setTimeout(function () { del.classList.remove('armed'); del.textContent = 'Hapus' }, 3000);
          return;
        }
        mineW.splice(idx - SEED.length, 1); store.set('kk_ucapan', mineW);
        sfx.puff(); renderBook(); toast('Ucapan dihapus');
      });
      foot.appendChild(del);
    }
    foot.appendChild(fr);
    a.appendChild(top); a.appendChild(tx); a.appendChild(foot);
    return a;
  }
  function renderBook() {
    per = mq.matches ? 2 : 1; book.classList.toggle('one', per === 1);
    var all = allWishes(); pages = Math.max(1, Math.ceil(all.length / per)); cur = Math.min(cur, pages - 1);
    spread.innerHTML = '';
    for (var k = 0; k < per; k++) { var idx = cur * per + k; spread.appendChild(pageEl(all[idx], idx + 1, idx)) }
    $('#pginfo').textContent = (cur + 1) + ' / ' + pages;
    $('#prev').disabled = cur === 0; $('#next').disabled = cur >= pages - 1;
  }
  function openBook() { if (book.getAttribute('data-open') !== 'true') { book.setAttribute('data-open', 'true'); sfx.pop() } }
  function flip(d) {
    openBook();
    var n = cur + d; if (n < 0 || n >= pages) return;
    if (reduce || !spread.animate) { cur = n; renderBook(); return }
    var deg = d > 0 ? -14 : 14;
    spread.animate([{ transform: 'perspective(1200px) rotateY(0)', opacity: 1 }, { transform: 'perspective(1200px) rotateY(' + deg + 'deg)', opacity: 0 }], { duration: 170, easing: 'ease-in' }).finished.then(function () {
      cur = n; renderBook(); sfx.chirp();
      spread.animate([{ transform: 'perspective(1200px) rotateY(' + (-deg) + 'deg)', opacity: 0 }, { transform: 'perspective(1200px) rotateY(0)', opacity: 1 }], { duration: 200, easing: 'ease-out' });
    }).catch(function () { cur = n; renderBook() });
  }
  $('#cover').addEventListener('click', function () { ac(); openBook() });
  $('#prev').addEventListener('click', function () { ac(); flip(-1) });
  $('#next').addEventListener('click', function () { ac(); flip(1) });
  if (mq.addEventListener) mq.addEventListener('change', renderBook); else if (mq.addListener) mq.addListener(renderBook);

  var msg = $('#msg'), chc = $('#chCount');
  msg.addEventListener('input', function () { chc.textContent = msg.value.length + ' / 300' });
  $('#wishForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var text = msg.value.trim();
    if (!text) { msg.focus(); toast('Tulis dulu ucapannya ya'); return }
    var from = $('#fromName').value.trim().slice(0, 28) || 'Seseorang yang sayang kamu';
    var chosen = document.querySelector('input[name="stk"]:checked');
    mineW.push({ from: from, text: text.slice(0, 300), st: chosen ? chosen.value : '💛' });
    if (!store.set('kk_ucapan', mineW)) toast('Ucapan tampil di sini, tapi belum bisa disimpan di perangkat ini.');
    var idx = allWishes().length - 1; per = mq.matches ? 2 : 1; cur = Math.floor(idx / per);
    renderBook(); openBook();
    msg.value = ''; chc.textContent = '0 / 300';
    ac(); sfx.tada();
    var bk = $('#book'); bk.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
    setTimeout(function () { burstAt(bk, 80) }, reduce ? 0 : 500);
    toast('Ucapanmu sudah menempel di buku!');
  });

  /* mulai */
  renderBook();
  applyPhase();
  tick();
  setInterval(tick, 1000);
})();
