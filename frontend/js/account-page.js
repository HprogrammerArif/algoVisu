// Account & DB-catalog page logic. Exercises the whole backend (auth, catalog,
// bookmarks, progress) through the QV.* API clients. Vanilla JS, no build.
(function () {
  'use strict';

  // slug -> client visualizer id (for "Open in Visualizer" deep links)
  var VISUALIZER_LINKS = {
    'bubble-sort': 'bubble',
    'selection-sort': 'selection',
    'insertion-sort': 'insertion',
    'linear-search': 'linearsearch',
    'binary-search': 'binarysearch',
    'breadth-first-search': 'bfs',
  };

  var state = {
    user: null,
    activeCategory: 'all',
    search: '',
    bookmarkedIds: new Set(),
    detail: null,
  };

  function $(id) {
    return document.getElementById(id);
  }

  function toast(message, kind) {
    var area = $('toast-area');
    var t = document.createElement('div');
    t.className = 'toast ' + (kind === 'err' ? 'err' : 'ok');
    t.textContent = message;
    area.appendChild(t);
    setTimeout(function () {
      t.remove();
    }, 3500);
  }

  function errMessage(e) {
    return (e && e.message) || 'Request failed';
  }

  // ---- Auth ----------------------------------------------------------------

  function renderAuth() {
    var loggedIn = !!state.user;
    $('auth-logged-out').classList.toggle('hidden', loggedIn);
    $('auth-logged-in').classList.toggle('hidden', !loggedIn);
    $('my-account').classList.toggle('hidden', !loggedIn);
    if (loggedIn) {
      $('auth-user-info').textContent =
        'Logged in as ' + state.user.fullName + ' (' + state.user.role + ')';
    }
  }

  async function restoreSession() {
    if (!QV.client.isAuthed()) {
      renderAuth();
      return;
    }
    try {
      var res = await QV.authApi.me();
      state.user = res.user;
      renderAuth();
      await loadMyAccount();
    } catch (_e) {
      QV.client.clearToken();
      state.user = null;
      renderAuth();
    }
  }

  async function doLogin() {
    try {
      var res = await QV.authApi.login($('login-email').value, $('login-password').value);
      state.user = res.user;
      renderAuth();
      toast('Welcome back, ' + res.user.fullName);
      await loadMyAccount();
      if (state.detail) await renderDetail(state.detail); // refresh bookmark/progress controls
    } catch (e) {
      toast(errMessage(e), 'err');
    }
  }

  async function doRegister() {
    try {
      await QV.authApi.register(
        $('register-fullname').value,
        $('register-email').value,
        $('register-password').value,
      );
      toast('Account created — please log in.');
      $('register-box').classList.add('hidden');
      $('login-box').classList.remove('hidden');
    } catch (e) {
      toast(errMessage(e), 'err');
    }
  }

  function doLogout() {
    QV.authApi.logout();
    state.user = null;
    state.bookmarkedIds = new Set();
    renderAuth();
    if (state.detail) renderDetail(state.detail);
    toast('Logged out.');
  }

  // ---- Catalog -------------------------------------------------------------

  async function loadCategories() {
    try {
      var cats = await QV.algorithmsApi.listCategories();
      var box = $('category-pills');
      box.innerHTML = '';
      var all = [{ slug: 'all', name: 'ALL' }].concat(cats);
      all.forEach(function (c) {
        var pill = document.createElement('span');
        pill.className = 'acct-pill' + (c.slug === state.activeCategory ? ' active' : '');
        pill.textContent = c.name;
        pill.addEventListener('click', function () {
          state.activeCategory = c.slug;
          loadCategories();
          loadAlgorithms();
        });
        box.appendChild(pill);
      });
    } catch (e) {
      toast('Categories: ' + errMessage(e), 'err');
    }
  }

  async function loadAlgorithms() {
    var list = $('algo-list');
    list.innerHTML = '<p class="acct-muted">Loading…</p>';
    try {
      var filters = {};
      if (state.activeCategory && state.activeCategory !== 'all') filters.category = state.activeCategory;
      if (state.search) filters.search = state.search;
      var algos = await QV.algorithmsApi.list(filters);
      list.innerHTML = '';
      if (!algos.length) {
        list.innerHTML = '<p class="acct-muted">No algorithms.</p>';
        return;
      }
      algos.forEach(function (a) {
        var item = document.createElement('div');
        item.className = 'acct-item';
        var row = document.createElement('div');
        row.className = 'acct-row';
        var nm = document.createElement('span');
        nm.className = 'nm';
        nm.textContent = a.name;
        var badge = document.createElement('span');
        badge.className = 'acct-muted';
        badge.textContent = a.category + ' · ' + (a.difficulty || '—');
        row.appendChild(nm);
        row.appendChild(badge);
        item.appendChild(row);
        item.addEventListener('click', function () {
          loadDetail(a.slug);
        });
        list.appendChild(item);
      });
    } catch (e) {
      list.innerHTML = '<p class="acct-muted">Failed to load.</p>';
      toast('Algorithms: ' + errMessage(e), 'err');
    }
  }

  async function loadDetail(slug) {
    try {
      var algo = await QV.algorithmsApi.detail(slug);
      state.detail = algo;
      await renderDetail(algo);
    } catch (e) {
      toast('Detail: ' + errMessage(e), 'err');
    }
  }

  async function renderDetail(algo) {
    $('detail-empty').classList.add('hidden');
    var body = $('detail-body');
    body.classList.remove('hidden');
    body.innerHTML = '';

    var h = document.createElement('div');
    var title = document.createElement('div');
    title.className = 'acct-row';
    var nm = document.createElement('span');
    nm.className = 'nm';
    nm.style.fontSize = '16px';
    nm.textContent = algo.name;
    var meta = document.createElement('span');
    meta.className = 'acct-muted';
    meta.textContent = algo.category + ' · ' + (algo.difficulty || '—') + ' · ' + algo.visualizerType;
    title.appendChild(nm);
    title.appendChild(meta);
    h.appendChild(title);

    var desc = document.createElement('p');
    desc.className = 'acct-muted';
    desc.style.margin = '8px 0';
    desc.textContent = algo.description || '';
    h.appendChild(desc);

    // Complexity table
    var table = document.createElement('table');
    table.className = 'cplx-table';
    var tc = algo.timeComplexities || {};
    table.innerHTML =
      '<tr><th>Best</th><th>Average</th><th>Worst</th><th>Space</th></tr>' +
      '<tr><td>' + (tc.best || '—') + '</td><td>' + (tc.average || '—') +
      '</td><td>' + (tc.worst || '—') + '</td><td>' + (algo.spaceComplexity || '—') + '</td></tr>';
    h.appendChild(table);

    // Code tabs
    if (algo.codeSnippets && algo.codeSnippets.length) {
      var tabs = document.createElement('div');
      var pre = document.createElement('pre');
      pre.className = 'code';
      algo.codeSnippets.forEach(function (s, idx) {
        var tab = document.createElement('span');
        tab.className = 'code-tab' + (idx === 0 ? ' active' : '');
        tab.textContent = s.language;
        tab.addEventListener('click', function () {
          tabs.querySelectorAll('.code-tab').forEach(function (t) {
            t.classList.remove('active');
          });
          tab.classList.add('active');
          pre.textContent = s.code;
        });
        tabs.appendChild(tab);
      });
      pre.textContent = algo.codeSnippets[0].code;
      h.appendChild(tabs);
      h.appendChild(pre);
    }

    // Deep link to the visualizer
    if (VISUALIZER_LINKS[algo.slug]) {
      var link = document.createElement('a');
      link.className = 'acct-link';
      link.href = 'index.html#' + VISUALIZER_LINKS[algo.slug];
      link.textContent = '▶ Open in Visualizer';
      h.appendChild(link);
    }

    // Logged-in controls: bookmark + progress
    if (state.user) {
      var controls = document.createElement('div');
      controls.className = 'acct-row';
      controls.style.marginTop = '12px';

      var bmBtn = document.createElement('button');
      var isBm = state.bookmarkedIds.has(algo.id);
      bmBtn.className = 'acct-btn' + (isBm ? ' pink' : '');
      bmBtn.textContent = isBm ? '★ Bookmarked' : '☆ Bookmark';
      bmBtn.addEventListener('click', function () {
        toggleBookmark(algo);
      });

      var sel = document.createElement('select');
      sel.className = 'acct-field';
      sel.style.width = 'auto';
      ['not_started', 'in_progress', 'completed'].forEach(function (st) {
        var o = document.createElement('option');
        o.value = st;
        o.textContent = st.replace('_', ' ');
        sel.appendChild(o);
      });
      sel.addEventListener('change', function () {
        setProgress(algo, sel.value);
      });

      controls.appendChild(bmBtn);
      controls.appendChild(sel);
      h.appendChild(controls);
    }

    body.appendChild(h);
  }

  async function toggleBookmark(algo) {
    try {
      if (state.bookmarkedIds.has(algo.id)) {
        await QV.bookmarksApi.remove(algo.id);
        state.bookmarkedIds.delete(algo.id);
        toast('Removed bookmark');
      } else {
        await QV.bookmarksApi.add(algo.id);
        state.bookmarkedIds.add(algo.id);
        toast('Bookmarked ' + algo.name);
      }
      await renderDetail(algo);
      await loadMyAccount();
    } catch (e) {
      toast(errMessage(e), 'err');
    }
  }

  async function setProgress(algo, status) {
    try {
      await QV.progressApi.set(algo.id, status);
      toast('Progress: ' + status.replace('_', ' '));
      await loadMyAccount();
    } catch (e) {
      toast(errMessage(e), 'err');
    }
  }

  async function loadMyAccount() {
    try {
      var bms = await QV.bookmarksApi.list();
      state.bookmarkedIds = new Set(bms.map(function (b) { return b.algorithmId; }));
      renderList('bookmark-list', bms, function (b) {
        return b.name + ' (' + b.slug + ')';
      });
      var prog = await QV.progressApi.list();
      renderList('progress-list', prog, function (p) {
        return p.name + ' — ' + p.status.replace('_', ' ');
      });
    } catch (e) {
      toast('Account: ' + errMessage(e), 'err');
    }
  }

  function renderList(containerId, items, labeller) {
    var box = $(containerId);
    box.innerHTML = '';
    if (!items.length) {
      box.innerHTML = '<p class="acct-muted">None yet.</p>';
      return;
    }
    items.forEach(function (it) {
      var row = document.createElement('div');
      row.className = 'acct-muted';
      row.style.padding = '4px 0';
      row.textContent = '• ' + labeller(it);
      box.appendChild(row);
    });
  }

  // ---- Boot ----------------------------------------------------------------

  async function checkApi() {
    try {
      await QV.client.get('/health');
      $('api-status').textContent = 'API: online';
      $('api-status').style.color = 'var(--neon-green, #39ff14)';
      return true;
    } catch (_e) {
      $('api-status').textContent = 'API: offline — start the backend';
      $('api-status').style.color = 'var(--neon-pink, #ff2e97)';
      return false;
    }
  }

  function wireStaticEvents() {
    $('btn-login').addEventListener('click', doLogin);
    $('btn-register').addEventListener('click', doRegister);
    $('btn-logout').addEventListener('click', doLogout);
    $('show-register').addEventListener('click', function (e) {
      e.preventDefault();
      $('login-box').classList.add('hidden');
      $('register-box').classList.remove('hidden');
    });
    $('show-login').addEventListener('click', function (e) {
      e.preventDefault();
      $('register-box').classList.add('hidden');
      $('login-box').classList.remove('hidden');
    });
    var searchEl = $('catalog-search');
    var timer = null;
    searchEl.addEventListener('input', function (e) {
      state.search = e.target.value;
      clearTimeout(timer);
      timer = setTimeout(loadAlgorithms, 250);
    });
  }

  document.addEventListener('DOMContentLoaded', async function () {
    wireStaticEvents();
    var online = await checkApi();
    if (!online) return;
    await restoreSession();
    await loadCategories();
    await loadAlgorithms();
  });
})();
