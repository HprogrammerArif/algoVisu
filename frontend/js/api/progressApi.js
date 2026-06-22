// Progress API (auth required). Exposes window.QV.progressApi.
(function () {
  'use strict';
  function client() {
    return window.QV.client;
  }

  window.QV = window.QV || {};
  window.QV.progressApi = {
    async list() {
      return (await client().get('/progress')).progress;
    },
    async set(algorithmId, status) {
      return (await client().put('/progress/' + algorithmId, { status: status })).progress;
    },
  };
})();
