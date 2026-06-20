// Auth API: register, login (stores JWT), me, logout. Exposes window.QV.authApi.
(function () {
  'use strict';
  function client() {
    return window.QV.client;
  }

  window.QV = window.QV || {};
  window.QV.authApi = {
    async register(fullName, email, password) {
      return client().post('/auth/register', { fullName: fullName, email: email, password: password });
    },
    async login(email, password) {
      var res = await client().post('/auth/login', { email: email, password: password });
      if (res && res.token) client().setToken(res.token);
      return res;
    },
    async me() {
      return client().get('/auth/me');
    },
    logout() {
      client().clearToken();
    },
  };
})();
