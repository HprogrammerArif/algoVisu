// Catalog API: categories, algorithm list (with filters), algorithm detail.
// Exposes window.QV.algorithmsApi.
(function () {
  'use strict';
  function client() {
    return window.QV.client;
  }
  function queryString(params) {
    var pairs = Object.keys(params || {})
      .filter(function (k) {
        return params[k] != null && params[k] !== '';
      })
      .map(function (k) {
        return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]);
      });
    return pairs.length ? '?' + pairs.join('&') : '';
  }

  window.QV = window.QV || {};
  window.QV.algorithmsApi = {
    async listCategories() {
      return (await client().get('/categories')).categories;
    },
    async list(filters) {
      return (await client().get('/algorithms' + queryString(filters))).algorithms;
    },
    async detail(slug) {
      return (await client().get('/algorithms/' + encodeURIComponent(slug))).algorithm;
    },
  };
})();
