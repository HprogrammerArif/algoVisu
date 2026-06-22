// React to #<slug> changes after boot. The initial hash is handled in bootCatalog().
(function () {
  'use strict';
  window.addEventListener('hashchange', function () {
    try {
      var slug = (location.hash || '').replace(/^#/, '').trim();
      if (
        slug &&
        typeof selectAlgorithm === 'function' &&
        Array.isArray(catalog) &&
        catalog.some(function (a) { return a.slug === slug; })
      ) {
        selectAlgorithm(slug);
      }
    } catch (_e) {
      /* never break on a bad hash */
    }
  });
})();
