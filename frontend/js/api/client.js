// Thin fetch wrapper: base URL, JWT bearer header, JSON parsing, error normalization.
// Exposes window.QV.client. No modules/build — loaded via a <script> tag.
(function () {
  'use strict';
  var TOKEN_KEY = 'qv_token';

  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }
  function setToken(token) {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  }
  function clearToken() {
    localStorage.removeItem(TOKEN_KEY);
  }

  async function request(method, path, body) {
    var base = (window.QV_CONFIG && window.QV_CONFIG.API_BASE_URL) || '';
    var headers = { 'Content-Type': 'application/json' };
    var token = getToken();
    if (token) headers['Authorization'] = 'Bearer ' + token;

    var res = await fetch(base + path, {
      method: method,
      headers: headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    var data = null;
    var text = await res.text();
    if (text) {
      try {
        data = JSON.parse(text);
      } catch (_e) {
        data = text;
      }
    }

    if (!res.ok) {
      var info = (data && data.error) || { code: 'HTTP_' + res.status, message: res.statusText };
      var err = new Error(info.message || 'Request failed');
      err.code = info.code;
      err.status = res.status;
      throw err;
    }
    return data;
  }

  window.QV = window.QV || {};
  window.QV.client = {
    get: function (p) {
      return request('GET', p);
    },
    post: function (p, b) {
      return request('POST', p, b);
    },
    put: function (p, b) {
      return request('PUT', p, b);
    },
    del: function (p) {
      return request('DELETE', p);
    },
    getToken: getToken,
    setToken: setToken,
    clearToken: clearToken,
    isAuthed: function () {
      return !!getToken();
    },
  };
})();
