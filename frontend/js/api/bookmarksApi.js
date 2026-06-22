// Bookmarks API (auth required). Exposes window.QV.bookmarksApi.
(function () {
  'use strict';
  function client() {
    return window.QV.client;
  }

  window.QV = window.QV || {};
  window.QV.bookmarksApi = {
    async list() {
      return (await client().get('/bookmarks')).bookmarks;
    },
    async add(algorithmId) {
      return (await client().post('/bookmarks', { algorithmId: algorithmId })).bookmark;
    },
    async remove(algorithmId) {
      return client().del('/bookmarks/' + algorithmId);
    },
  };
})();
