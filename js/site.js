/* falaq.site v2 — interactions.
   Everything here is progressive: the page reads fine with this file blocked.
   One passive scroll listener drives the nav progress rule and the setlist rail via rAF. */
(function () {
  'use strict';
  var reduce = false;
  try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- stagger indexes for chained reveals ---------- */
  $$('.chain, .ladder').forEach(function (g) {
    Array.prototype.forEach.call(g.children, function (c, i) { c.style.setProperty('--i', i); });
  });

  /* ---------- count-up (final values are already in the html) ---------- */
  function countUp(el) {
    if (reduce || el.dataset.done) return;
    el.dataset.done = '1';
    var to = parseFloat(el.getAttribute('data-count')), pre = el.getAttribute('data-pre') || '', suf = el.getAttribute('data-suf') || '';
    var fin = el.textContent, t0 = null, dur = 900;
    function step(ts) {
      if (t0 === null) t0 = ts;
      var p = Math.min(1, (ts - t0) / dur), v = Math.round(to * (1 - Math.pow(1 - p, 3)));
      el.textContent = pre + (to >= 1000 ? v.toLocaleString('en-IN') : v) + suf;
      if (p < 1) requestAnimationFrame(step); else el.textContent = fin;
    }
    requestAnimationFrame(step);
  }

  /* ---------- reveals: content is visible at rest, this only adds the entrance ---------- */
  var hasIO = 'IntersectionObserver' in window;
  if (hasIO) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        if (e.target.hasAttribute('data-count')) countUp(e.target);
        if (e.target.id === 'apf') walkFlow();
        io.unobserve(e.target);
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -6% 0px' });
    $$('.rv, .ladder, .chain, .eq, [data-count], #apf').forEach(function (el) { io.observe(el); });
  }

  /* ---------- nav: active section, progress rule, mobile sheet ---------- */
  var pill = $('.pill'), menuBtn = $('.menu-btn'), sheet = $('#sheet');
  var navLinks = $$('.nav-links a, .sheet a');
  if (hasIO) {
    var navIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        navLinks.forEach(function (a) {
          if (a.getAttribute('href') === '#' + e.target.id) a.setAttribute('aria-current', 'true');
          else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-42% 0px -52% 0px' });
    ['setlist', 'built', 'brain', 'holes', 'off', 'hi'].forEach(function (id) { var s = document.getElementById(id); if (s) navIO.observe(s); });
  }

  function setMenu(open, returnFocus) {
    if (!menuBtn || !sheet) return;
    menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    $('.menu-l', menuBtn).textContent = open ? 'close' : 'menu';
    sheet.hidden = !open;
    if (open) { var first = $('a', sheet); if (first) first.focus(); }
    else if (returnFocus) menuBtn.focus();
  }
  if (menuBtn) {
    menuBtn.addEventListener('click', function () { setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'); });
    $$('a', sheet).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menuBtn.getAttribute('aria-expanded') === 'true') setMenu(false, true);
    });
    document.addEventListener('click', function (e) {
      if (menuBtn.getAttribute('aria-expanded') === 'true' && !sheet.contains(e.target) && !menuBtn.contains(e.target)) setMenu(false);
    });
    var mq = window.matchMedia('(min-width: 901px)');
    var onMq = function () { if (mq.matches) setMenu(false); };
    if (mq.addEventListener) mq.addEventListener('change', onMq); else if (mq.addListener) mq.addListener(onMq);
  }

  /* ---------- scroll-linked: progress rule + setlist rail (one rAF per frame at most) ---------- */
  var timeline = $('#timeline'), tls = $$('.tl'), ticking = false;
  function onFrame() {
    ticking = false;
    var doc = document.documentElement, max = doc.scrollHeight - window.innerHeight;
    if (pill) pill.style.setProperty('--p', max > 0 ? Math.min(1, window.scrollY / max).toFixed(4) : 0);
    if (timeline && !reduce) {
      var r = timeline.getBoundingClientRect(), mark = window.innerHeight * 0.6;
      var f = Math.max(0, Math.min(1, (mark - r.top) / r.height));
      timeline.style.setProperty('--fill', f.toFixed(4));
      tls.forEach(function (li) { li.classList.toggle('lit', li.getBoundingClientRect().top < mark); });
    }
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(onFrame); } }
  if (timeline && reduce) { timeline.style.setProperty('--fill', 1); tls.forEach(function (li) { li.classList.add('lit'); }); }
  else if (timeline) timeline.style.setProperty('--fill', 0);
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  onFrame();

  /* ---------- the falaq mixer ---------- */
  var xf = $('#xf'), box = $('#mixbox'), dA = $('#deckA'), dB = $('#deckB'), out = $('#mixout');
  var mixes = [
    [15, 'full analyst', 'sql, snowflake, longitudinal timelines and cohort logic. give me three messy healthcare databases and a quiet afternoon, and i\'ll find where the story breaks.'],
    [40, 'mostly analyst', 'numbers tell you where people drop off, never why. a retention curve is just hundreds of human decisions stacked on top of each other.'],
    [60, 'the mix', 'use data to spot where the system leaks. use human instinct to figure out what brings people back. then build the fix. that\'s the whole set.'],
    [85, 'mostly operator', 'audience personas, community building with cn clan, and scaling cosa nostra live\'s average reach from 250k to 2.2m in four months.'],
    [101, 'full operator', 'artists, sponsors, unit economics and crowds: 11 live shows on the ground and ₹38 lakh in revenue, run end to end.']
  ];
  function lights(id, n) { $$('#' + id + ' i').forEach(function (c, i) { c.classList.toggle('lit', i < n); }); }
  var lastName = '';
  function mix(v) {
    box.style.setProperty('--m', v);
    var a = (100 - v) / 100, b = v / 100;
    if (!reduce) {
      dA.style.transform = 'scale(' + (0.94 + a * 0.1).toFixed(3) + ') rotate(' + (-2 * a).toFixed(2) + 'deg)';
      dB.style.transform = 'scale(' + (0.94 + b * 0.1).toFixed(3) + ') rotate(' + (2 * b).toFixed(2) + 'deg)';
    }
    lights('mA', Math.round(a * 8)); lights('mB', Math.round(b * 8));
    var m = mixes[mixes.length - 1];
    for (var k = 0; k < mixes.length; k++) { if (v < mixes[k][0]) { m = mixes[k]; break; } }
    if (m[1] !== lastName) {
      lastName = m[1];
      out.textContent = '';
      var tag = document.createElement('b'); tag.textContent = m[1];
      out.appendChild(tag); out.appendChild(document.createTextNode(m[2]));
      xf.setAttribute('aria-valuetext', m[1]);
    }
  }
  if (xf && box) { xf.addEventListener('input', function () { mix(+xf.value); }); mix(+xf.value); }

  /* ---------- applypilot: walk one job through the flow once, when it scrolls in ---------- */
  function walkFlow() {
    if (reduce) return;
    var steps = $$('#apf li'), i = 0;
    var t = setInterval(function () {
      steps.forEach(function (s, j) { s.classList.toggle('step', j === i && !s.classList.contains('audit') && !s.classList.contains('you')); });
      i++;
      if (i > steps.length) { clearInterval(t); steps.forEach(function (s) { s.classList.remove('step'); }); }
    }, 420);
  }

  /* ---------- brain: browser tabs synced with the list ---------- */
  var btabs = $$('.b-tabs [role="tab"]'), barts = $$('.b-art'), blis = $$('.blf li');
  var bcap = $('#bcap'), bview = $('#bview');
  var bcaps = ['i start with people.', 'i notice, connect, then act.', 'i zoom out.', 'i build when something bugs me.', 'i try to break my own ideas first.'];
  var bcur = 1, bauto = null;
  function bshow(k, focus) {
    bcur = k;
    btabs.forEach(function (t) {
      var on = +t.dataset.k === k;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      if (on && focus) t.focus();
    });
    barts.forEach(function (a) {
      var on = +a.dataset.k === k;
      if (on) a.removeAttribute('hidden'); else a.setAttribute('hidden', '');
      a.classList.remove('on');
      if (on) { void a.getBoundingClientRect(); a.classList.add('on'); }
    });
    blis.forEach(function (l) { l.classList.toggle('on', +l.dataset.k === k); });
    bcap.textContent = bcaps[k - 1];
    bview.setAttribute('aria-labelledby', 'bt' + k);
  }
  function bstop() { if (bauto) { clearInterval(bauto); bauto = null; } }
  btabs.forEach(function (t) {
    t.addEventListener('click', function () { bstop(); bshow(+t.dataset.k); });
    t.addEventListener('keydown', function (e) {
      var n = null;
      if (e.key === 'ArrowRight') n = bcur % 5 + 1;
      if (e.key === 'ArrowLeft') n = bcur === 1 ? 5 : bcur - 1;
      if (e.key === 'Home') n = 1;
      if (e.key === 'End') n = 5;
      if (n === null) return;
      e.preventDefault(); bstop(); bshow(n, true);
    });
  });
  blis.forEach(function (l) { l.addEventListener('mouseenter', function () { bstop(); bshow(+l.dataset.k); }); });
  if (blis.length) blis[0].classList.add('on');
  if (!reduce && hasIO && bview) {
    var bio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting && !bauto && bio) { bauto = setInterval(function () { bshow(bcur % 5 + 1); }, 3200); }
        else if (!e.isIntersecting && bauto) { clearInterval(bauto); bauto = null; }
      });
    }, { threshold: 0.5 });
    bio.observe(bview);
    btabs.concat(blis).forEach(function (el) { el.addEventListener('click', function () { if (bio) { bio.disconnect(); bio = null; } }); });
  }

  /* ---------- idea pressure test: one real question per phase ---------- */
  var grill = $('[data-grill]');
  if (grill) {
    var GQ = [
      ['phase 1 · the guru test', '"do you personally face this problem?"', 'how badly does it frustrate you, on a scale of 1–10? give a specific example of the last time it bothered you.', 'scored in: hormozi test + the itch test'],
      ['phase 2 · the founder test', '"if you could not make any money from this for 2 years but could keep building it, would you?"', 'why or why not?', 'scored in: the obsession test'],
      ['phase 3 · the reality test', '"how will your first 100 customers find you?"', 'be specific. don\'t say "social media" or "word of mouth". tell me the actual channel, and the actual thing you\'d do in week one.', 'scored in: the distribution test']
    ];
    var gbtns = $$('[data-g]', grill), gq = $('.grill-q', grill);
    gbtns.forEach(function (b) {
      b.addEventListener('click', function () {
        var i = +b.dataset.g;
        gbtns.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        $('.grill-k', gq).textContent = GQ[i][0];
        $('.grill-text', gq).textContent = GQ[i][1];
        $('.grill-sub', gq).textContent = GQ[i][2];
        $('.grill-feeds', gq).textContent = GQ[i][3];
        gq.classList.remove('swap'); void gq.offsetWidth; gq.classList.add('swap');
      });
    });
  }

  /* ---------- copy email ---------- */
  var btn = $('#copy'), addr = $('#addr'), msg = $('#copied');
  function selectAddr() {
    try { var rg = document.createRange(); rg.selectNodeContents(addr); var s = window.getSelection(); s.removeAllRanges(); s.addRange(rg); } catch (e) {}
  }
  if (btn) btn.addEventListener('click', function () {
    var text = addr.textContent.trim();
    try {
      navigator.clipboard.writeText(text).then(function () { msg.textContent = 'copied. talk soon.'; btn.textContent = 'copied ✓'; setTimeout(function () { btn.textContent = 'copy email'; }, 2200); },
        function () { selectAddr(); msg.textContent = 'selected. press copy on your keyboard.'; });
    } catch (e) { selectAddr(); msg.textContent = 'selected. press copy on your keyboard.'; }
  });

  /* ---------- encore: a small burst, then back to the top ---------- */
  var encore = $('#encore'), top = $('#top');
  if (encore) encore.addEventListener('click', function (e) {
    e.preventDefault();
    if (top) { top.setAttribute('tabindex', '-1'); }
    var go = function () {
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
      if (top) top.focus({ preventScroll: true });
    };
    if (reduce) { go(); return; }
    var b = document.createElement('span'); b.className = 'burst';
    var r = encore.getBoundingClientRect(), host = encore.parentNode.getBoundingClientRect();
    b.style.left = (r.left - host.left + r.width / 2) + 'px'; b.style.top = (r.top - host.top + r.height / 2) + 'px';
    var cols = ['var(--sun)', 'var(--tang)', 'var(--mint-soft)', 'var(--sky)', 'var(--pop-card)'];
    for (var i = 0; i < 14; i++) {
      var p = document.createElement('i'), ang = (Math.PI * 2 * i) / 14, dist = 60 + Math.random() * 50;
      p.style.setProperty('--x', Math.round(Math.cos(ang) * dist) + 'px');
      p.style.setProperty('--y', Math.round(Math.sin(ang) * dist - 20) + 'px');
      p.style.setProperty('--r', Math.round(Math.random() * 360) + 'deg');
      p.style.setProperty('--c', cols[i % cols.length]);
      b.appendChild(p);
    }
    encore.parentNode.appendChild(b);
    setTimeout(function () { b.remove(); }, 900);
    setTimeout(go, 380);
  });
})();
