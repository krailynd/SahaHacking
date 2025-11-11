(function () {
  'use strict';

  let searchIndex = null;
  let searchTimeout = null;

  // Helper - parse query param
  function getQueryParam(name) {
    name = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
      results = regex.exec(window.location.href);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
  }

  // Attach submit handler to header search forms (.tp-search-form)
  document.addEventListener('DOMContentLoaded', function () {
    var searchForms = document.querySelectorAll('.tp-search-form');
    searchForms.forEach(function (form) {
      // if form contains an input and button
      var input = form.querySelector('input[type="text"], input[type="search"]');
      var btn = form.querySelector('button');
      if (!input) return;

      // on submit (click or enter) redirect to search-results.html?q={term}
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var q = input.value.trim();
        if (!q) {
          // polite inline validation: focus and show small temporary message
          input.focus();
          var old = input.placeholder;
          input.placeholder = 'Escribe algo para buscar...';
          setTimeout(function () { input.placeholder = old; }, 1500);
          return;
        }
        var dest = (location.pathname.indexOf('/sahahacking/') !== -1) ? '/sahahacking/search-results.html' : '/search-results.html';
        // If site is deployed at root of sahahacking folder, we want relative path
        // Use relative link: './search-results.html'
        dest = './search-results.html?q=' + encodeURIComponent(q);
        window.location.href = dest;
      });

      // Also handle click on search icon buttons (some markup uses <a>)
      if (btn) {
        btn.addEventListener('click', function (e) {
          e.preventDefault();
          form.dispatchEvent(new Event('submit', {cancelable: true}));
        });
      }
    });

    // If on search-results page, perform client-side search
    if (document.body.classList.contains('search-results-page')) {
      var query = getQueryParam('q') || '';
      var resultsContainer = document.getElementById('search-results');
      var searchHeadline = document.getElementById('search-query');
      if (searchHeadline) searchHeadline.textContent = query;

      if (!query) {
        if (resultsContainer) resultsContainer.innerHTML = '<p class="no-results">Por favor ingresa un término de búsqueda.</p>';
        return;
      }

      // Fetch index
      fetch('./assets/js/search-index.json', {cache: 'no-store'})
        .then(function (r) { if (!r.ok) throw new Error('No se pudo cargar el índice de búsqueda'); return r.json(); })
        .then(function (index) {
          var qLower = query.toLowerCase();
          var matches = index.filter(function (item) {
            return (item.title && item.title.toLowerCase().indexOf(qLower) !== -1)
              || (item.excerpt && item.excerpt.toLowerCase().indexOf(qLower) !== -1)
              || (item.content && item.content.toLowerCase().indexOf(qLower) !== -1)
              || (item.tags && item.tags.join(' ').toLowerCase().indexOf(qLower) !== -1);
          });

          // simple fuzzy: also include items where all words appear
          if (matches.length === 0) {
            var words = qLower.split(/\s+/).filter(Boolean);
            matches = index.filter(function (item) {
              var hay = (item.title||'') + ' ' + (item.excerpt||'') + ' ' + (item.content||'');
              hay = hay.toLowerCase();
              return words.every(function (w) { return hay.indexOf(w) !== -1; });
            });
          }

          if (!resultsContainer) return;

          if (matches.length === 0) {
            // show 404-like helpful panel
            resultsContainer.innerHTML = '\n              <div class="tp-404-area text-center">\n                <h2>No se encontraron resultados para "' + escapeHtml(query) + '"</h2>\n                <p>Prueba con otras palabras clave o revisa la ortografía.</p>\n                <div style="margin-top:18px">\n                  <a href="./index.html" class="tp-btn">Volver al Inicio</a>\n                  <button id="search-again" class="tp-btn tp-btn-yellow" style="margin-left:8px">Buscar de nuevo</button>\n                </div>\n                <div style="margin-top:18px;color:#666;font-size:14px">Si crees que esto es un error, contacta al administrador.</div>\n              </div>';
            var again = document.getElementById('search-again');
            if (again) {
              again.addEventListener('click', function () {
                var newQ = prompt('Buscar otra vez:', query) || '';
                if (newQ) window.location.href = './search-results.html?q=' + encodeURIComponent(newQ);
              });
            }
            return;
          }

          // build results list
          var out = '<div class="search-list">';
          matches.forEach(function (m) {
            out += '<article class="search-item" style="margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid #eee">';
            out += '<h3 style="margin:0 0 6px;font-size:18px"><a href="' + (m.url || '#') + '" style="color:#0b6efd;text-decoration:none">' + escapeHtml(m.title) + '</a></h3>';
            if (m.excerpt) out += '<p style="margin:4px 0;color:#555">' + escapeHtml(m.excerpt) + '</p>';
            out += '<div style="font-size:13px;color:#888">URL: <a href="' + (m.url || '#') + '">' + (m.url || '') + '</a></div>';
            out += '</article>';
          });
          out += '</div>';
          resultsContainer.innerHTML = out;
        })
        .catch(function (err) {
          if (resultsContainer) resultsContainer.innerHTML = '<div class="tp-404-area text-center"><h2>Error al buscar</h2><p>' + escapeHtml(err.message) + '</p></div>';
        });
    }
  });

  function escapeHtml(text) {
    var map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return String(text).replace(/[&<>\"']/g, function(m) { return map[m]; });
  }
})();
