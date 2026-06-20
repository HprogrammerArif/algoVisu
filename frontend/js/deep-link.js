// Optional deep-link: if the page is opened as index.html#<algoId>, select that
// algorithm once the engine has initialized. Purely additive and defensive — does
// nothing unless a matching hash is present.
(function () {
  'use strict';
  document.addEventListener('DOMContentLoaded', function () {
    try {
      var id = (location.hash || '').replace(/^#/, '').trim();
      if (!id) return;
      if (typeof ALGO_DATABASE !== 'undefined' && ALGO_DATABASE[id] && typeof selectAlgorithm === 'function') {
        selectAlgorithm(id);
      }
    } catch (_e) {
      /* never let a deep link break the app */
    }
  });
})();
