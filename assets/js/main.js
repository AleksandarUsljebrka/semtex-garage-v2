/**
 * Semtex Garage, interactions.
 * Everything works without GSAP/Lenis (CDN down, old browser): content is
 * visible and usable, only the scroll-driven motion is missing.
 */
(function () {
  'use strict';

  var doc = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var hasGsap = !!(window.gsap && window.ScrollTrigger);
  var animate = hasGsap && !reduce;
  var lenis = null;

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };

  var year = $('[data-year]');
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- smooth scroll ---------- */
  if (animate) {
    gsap.registerPlugin(ScrollTrigger);
    doc.classList.add('anim');
    if (window.Lenis) {
      lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
    }
  }

  function scrollToHash(hash) {
    var target = hash === '#top' ? 0 : $(hash);
    if (target === null) return false;
    if (lenis) lenis.scrollTo(target, { duration: 1.4 });
    else if (target === 0) window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    else target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    return true;
  }

  /* ---------- header + menu ---------- */
  var header = $('[data-header]');
  var menuBtn = $('[data-menu-btn]');
  var menu = $('[data-menu]');
  var menuOpen = false;

  function setMenu(open) {
    menuOpen = open;
    menu.hidden = !open;
    menuBtn.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
    if (lenis) open ? lenis.stop() : lenis.start();
    header.classList.remove('is-hidden');
  }
  menuBtn.addEventListener('click', function () { setMenu(!menuOpen); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menuOpen) { setMenu(false); menuBtn.focus(); } });

  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var hash = a.getAttribute('href');
    if (hash.length < 2) return;
    if (menuOpen) setMenu(false);
    if (scrollToHash(hash)) e.preventDefault();
  });

  var lastY = window.scrollY;
  function onScroll() {
    var y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 40);
    if (!menuOpen) {
      if (y > 480 && y - lastY > 6) header.classList.add('is-hidden');
      else if (lastY - y > 6 || y < 200) header.classList.remove('is-hidden');
    }
    lastY = y;
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- before / after ---------- */
  var cmp = $('[data-compare]');
  var setPos = function () {};
  if (cmp) {
    var frame = $('.compare__frame', cmp);
    var range = $('[data-compare-range]', cmp);
    var imgBefore = $('[data-before]', cmp);
    var imgAfter = $('[data-after]', cmp);
    var dragging = false;
    var hint = null;

    setPos = function (p) {
      p = clamp(p, 0, 100);
      cmp.style.setProperty('--pos', p + '%');
      range.value = p;
    };
    var fromEvent = function (e) {
      var r = frame.getBoundingClientRect();
      setPos((e.clientX - r.left) / r.width * 100);
    };

    frame.addEventListener('pointerdown', function (e) {
      if (hint) { hint.kill(); hint = null; }
      dragging = true;
      cmp.classList.add('is-dragging');
      frame.setPointerCapture(e.pointerId);
      fromEvent(e);
    });
    frame.addEventListener('pointermove', function (e) { if (dragging) fromEvent(e); });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (t) {
      frame.addEventListener(t, function () { dragging = false; cmp.classList.remove('is-dragging'); });
    });
    range.addEventListener('input', function () { setPos(parseFloat(range.value)); });

    // switching cases
    var cases = $$('[data-case]');
    var busy = false;
    cases.forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (busy || btn.classList.contains('is-active')) return;
        busy = true;
        cases.forEach(function (b) { b.classList.toggle('is-active', b === btn); b.setAttribute('aria-pressed', String(b === btn)); });
        var slug = btn.getAttribute('data-case');
        var car = btn.getAttribute('data-car');
        cmp.classList.add('is-switching');
        setTimeout(function () {
          var base = 'assets/img/radovi/' + slug;
          imgBefore.srcset = base + '-pre-sm.webp 760w, ' + base + '-pre.webp 1400w';
          imgBefore.src = base + '-pre.webp';
          imgBefore.alt = car + ', far pre reparacije';
          imgAfter.srcset = base + '-posle-sm.webp 760w, ' + base + '-posle.webp 1400w';
          imgAfter.src = base + '-posle.webp';
          imgAfter.alt = car + ', far posle reparacije';
          var dec = function (img) { return img.decode ? img.decode().catch(function () {}) : Promise.resolve(); };
          Promise.all([dec(imgBefore), dec(imgAfter)]).then(function () {
            setPos(50);
            cmp.classList.remove('is-switching');
            busy = false;
          });
        }, 320);
      });
    });
    cases.forEach(function (b) { b.setAttribute('aria-pressed', String(b.classList.contains('is-active'))); });

    // one sweep the first time the slider comes into view, so people see it moves
    if (animate) {
      ScrollTrigger.create({
        trigger: cmp, start: 'top 65%', once: true,
        onEnter: function () {
          var o = { p: 50 };
          hint = gsap.timeline({ onUpdate: function () { setPos(o.p); } })
            .to(o, { p: 18, duration: .9, ease: 'power3.inOut' })
            .to(o, { p: 82, duration: 1.2, ease: 'power3.inOut' })
            .to(o, { p: 50, duration: .9, ease: 'power3.inOut' });
        }
      });
    }
  }

  /* ---------- services: picture follows the cursor ---------- */
  var svc = $('[data-svc]');
  var preview = $('[data-svc-preview]');
  if (svc && preview && finePointer) {
    var pImg = $('[data-svc-preview-img]');
    var inner = $('.svc-preview__inner', preview);
    var tx = 0, ty = 0, cx = 0, cy = 0, running = false;
    var loop = function () {
      var dx = tx - cx, dy = ty - cy;
      cx += dx * 0.16; cy += dy * 0.16;
      preview.style.left = cx + 'px';
      preview.style.top = cy + 'px';
      inner.style.transform = 'rotate(' + clamp(dx * 0.04, -8, 8) + 'deg)';
      if (running) requestAnimationFrame(loop);
    };
    svc.addEventListener('mousemove', function (e) { tx = e.clientX; ty = e.clientY; });
    $$('.svc__row', svc).forEach(function (row) {
      row.addEventListener('mouseenter', function (e) {
        var src = row.getAttribute('data-img');
        if (pImg.getAttribute('src') !== src) pImg.src = src;
        if (!running) { cx = tx = e.clientX; cy = ty = e.clientY; running = true; loop(); }
        preview.classList.add('is-on');
      });
    });
    svc.addEventListener('mouseleave', function () { preview.classList.remove('is-on'); running = false; });
    // preload so the first hover is instant
    $$('.svc__row', svc).forEach(function (row) { var i = new Image(); i.src = row.getAttribute('data-img'); });
  }

  /* ---------- reviews ---------- */
  var quotes = $('[data-quotes]');
  if (quotes) {
    var items = $$('.quote__item', quotes);
    var counter = $('[data-quote-current]', quotes);
    var qi = 0, timer = null, inView = false;
    var show = function (n) {
      qi = (n + items.length) % items.length;
      items.forEach(function (it, i) { it.classList.toggle('is-active', i === qi); });
      counter.textContent = String(qi + 1).padStart(2, '0');
    };
    var schedule = function () {
      clearInterval(timer);
      if (inView && !reduce) timer = setInterval(function () { show(qi + 1); }, 7000);
    };
    $('[data-quote-prev]', quotes).addEventListener('click', function () { show(qi - 1); schedule(); });
    $('[data-quote-next]', quotes).addEventListener('click', function () { show(qi + 1); schedule(); });
    quotes.addEventListener('mouseenter', function () { clearInterval(timer); });
    quotes.addEventListener('mouseleave', schedule);
    new IntersectionObserver(function (en) { inView = en[0].isIntersecting; schedule(); }, { threshold: .3 }).observe(quotes);
  }

  /* ---------- contact: a beam that follows the pointer ---------- */
  var contact = $('[data-contact]');
  if (contact && finePointer && !reduce) {
    var lx = 0.7, ly = 0.3, gx = 0.7, gy = 0.3, lit = false;
    var step = function () {
      lx += (gx - lx) * 0.08; ly += (gy - ly) * 0.08;
      contact.style.setProperty('--x', (lx * 100).toFixed(2) + '%');
      contact.style.setProperty('--y', (ly * 100).toFixed(2) + '%');
      if (lit) requestAnimationFrame(step);
    };
    contact.addEventListener('pointermove', function (e) {
      var r = contact.getBoundingClientRect();
      gx = (e.clientX - r.left) / r.width; gy = (e.clientY - r.top) / r.height;
      if (!lit) { lit = true; step(); }
    });
    contact.addEventListener('pointerleave', function () { lit = false; });
  }

  if (!animate) return;

  /* =================== GSAP from here on =================== */

  // headings and copy rise in
  gsap.set('[data-reveal]', { autoAlpha: 0, y: 28 });
  ScrollTrigger.batch('[data-reveal]', {
    start: 'top 88%', once: true,
    onEnter: function (els) { gsap.to(els, { autoAlpha: 1, y: 0, duration: 1.2, ease: 'expo.out', stagger: .08 }); }
  });

  // big titles built from masked lines
  $$('.contact__title').forEach(function (t) {
    var lines = $$('[data-reveal-line]', t);
    gsap.set(lines, { yPercent: 108 });
    ScrollTrigger.create({
      trigger: t, start: 'top 82%', once: true,
      onEnter: function () { gsap.to(lines, { yPercent: 0, duration: 1.4, ease: 'expo.out', stagger: .09 }); }
    });
  });

  // hero: photo sinks and slows, copy lifts away
  gsap.to('[data-hero-media]', {
    yPercent: 16, scale: 1.06, ease: 'none',
    scrollTrigger: { trigger: '[data-hero]', start: 'top top', end: 'bottom top', scrub: true }
  });
  gsap.to('[data-hero-fx]', {
    yPercent: -10, autoAlpha: 0, ease: 'none',
    scrollTrigger: { trigger: '[data-hero]', start: '30% top', end: '85% top', scrub: true }
  });

  // manifest: words light up as you read
  var mText = $('[data-words]');
  if (mText) {
    var words = mText.textContent.trim().split(/\s+/);
    mText.setAttribute('aria-label', mText.textContent.trim());
    mText.innerHTML = words.map(function (w) { return '<span class="w" aria-hidden="true">' + w + '</span>'; }).join(' ');
    gsap.fromTo($$('.w', mText), { opacity: .14 }, {
      opacity: 1, ease: 'none', stagger: .1,
      scrollTrigger: { trigger: mText, start: 'top 78%', end: 'bottom 42%', scrub: true }
    });
  }

  // process: horizontal track on wide screens
  var mm = gsap.matchMedia();
  mm.add('(min-width: 1024px)', function () {
    var track = $('[data-process-track]');
    var bar = $('[data-process-bar]');
    var dist = function () { return Math.max(0, track.scrollWidth - window.innerWidth); };
    gsap.to(track, {
      x: function () { return -dist(); }, ease: 'none',
      scrollTrigger: {
        trigger: '[data-process]', pin: '[data-process-pin]', start: 'top top',
        end: function () { return '+=' + dist(); }, scrub: 1, invalidateOnRefresh: true,
        onUpdate: function (self) { bar.style.transform = 'scaleX(' + self.progress + ')'; }
      }
    });
  });

  // gallery: tiles drift at different speeds
  $$('[data-speed]').forEach(function (tile) {
    var s = parseFloat(tile.getAttribute('data-speed')) || 0;
    gsap.fromTo(tile, { y: function () { return -s * window.innerHeight; } }, {
      y: function () { return s * window.innerHeight; }, ease: 'none',
      scrollTrigger: { trigger: tile, start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true }
    });
  });

  // maker photo: colour comes back as it scrolls in
  var mp = $('[data-maker-photo] img');
  if (mp) {
    gsap.fromTo(mp, { yPercent: -10, filter: 'grayscale(1) contrast(1.1) brightness(.8)' }, {
      yPercent: 0, filter: 'grayscale(0) contrast(1.02) brightness(1)', ease: 'none',
      scrollTrigger: { trigger: mp.parentNode, start: 'top 85%', end: 'center 40%', scrub: true }
    });
  }

  // rating counts up
  $$('[data-count]').forEach(function (el) {
    var to = parseFloat(el.getAttribute('data-count'));
    var dec = parseInt(el.getAttribute('data-decimals') || '0', 10);
    var o = { v: 0 };
    ScrollTrigger.create({
      trigger: el, start: 'top 85%', once: true,
      onEnter: function () {
        gsap.to(o, { v: to, duration: 1.8, ease: 'expo.out', onUpdate: function () { el.textContent = o.v.toFixed(dec).replace('.', ','); } });
      }
    });
  });

  // images finishing loading change layout heights
  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
