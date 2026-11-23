/**
 * Hero: headlights switch on, then the headline slides in.
 * The photo is never changed; light layers are screened over it (main.css, "lights sequence").
 *   .lights.is-playing  sequence runs (pure CSS keyframes)
 *   .lights.is-done     lights on, static
 *   .hero.is-in         headline and copy visible
 * Works without GSAP. With prefers-reduced-motion everything is simply on.
 */
(function () {
  'use strict';

  var lights = document.querySelector('[data-lights]');
  var hero = document.querySelector('[data-hero]');
  if (!lights || !hero) return;

  var showText = function () { hero.classList.add('is-in'); };
  var fallback = setTimeout(showText, 3500); // never leave the headline hidden

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    lights.classList.add('is-done');
    showText();
    return;
  }

  function ready(img) {
    var loaded = img.complete && img.naturalWidth
      ? Promise.resolve()
      : new Promise(function (r) { img.addEventListener('load', r, { once: true }); img.addEventListener('error', r, { once: true }); });
    return loaded.then(function () {
      if (!img.decode) return;
      return Promise.race([img.decode().catch(function () {}), new Promise(function (r) { setTimeout(r, 1200); })]);
    });
  }

  function visible() {
    if (!document.hidden) return Promise.resolve();
    return new Promise(function (r) {
      document.addEventListener('visibilitychange', function on() {
        if (document.hidden) return;
        document.removeEventListener('visibilitychange', on);
        r();
      });
    });
  }

  Promise.all(Array.prototype.map.call(lights.querySelectorAll('img'), ready))
    .then(visible)
    .then(function () {
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          lights.classList.add('is-playing');
          // headline comes in while the beam is still spreading over the floor
          setTimeout(function () { clearTimeout(fallback); showText(); }, 1350);
          setTimeout(function () {
            lights.classList.add('is-done');
            lights.classList.remove('is-playing');
          }, 3000);
        });
      });
    });
})();
