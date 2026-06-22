// Shared light/dark theme controller. No build step — global under window.QV.
(function () {
  'use strict';
  var KEY = 'qv_theme';
  function preferred() {
    var saved = localStorage.getItem(KEY);
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches
      ? 'light'
      : 'dark';
  }
  function apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    var btns = document.querySelectorAll('[data-theme-toggle]');
    for (var i = 0; i < btns.length; i++) {
      btns[i].textContent = theme === 'dark' ? '☀ LIGHT' : '☾ DARK';
      btns[i].setAttribute('aria-label', 'Switch to ' + (theme === 'dark' ? 'light' : 'dark') + ' theme');
    }
  }
  function set(theme) {
    localStorage.setItem(KEY, theme);
    apply(theme);
  }
  window.QV = window.QV || {};
  window.QV.theme = {
    get: preferred,
    set: set,
    toggle: function () { set(preferred() === 'dark' ? 'light' : 'dark'); },
  };
  // Apply ASAP (script is loaded in <head>); wire up toggles after DOM is ready.
  apply(preferred());
  document.addEventListener('DOMContentLoaded', function () {
    apply(preferred());
    var btns = document.querySelectorAll('[data-theme-toggle]');
    for (var i = 0; i < btns.length; i++) {
      btns[i].addEventListener('click', function () { window.QV.theme.toggle(); });
    }
  });
})();
