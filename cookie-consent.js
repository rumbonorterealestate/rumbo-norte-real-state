/* =============================================
   COOKIE CONSENT — LSSI / RGPD compliance
   ============================================= */
(function () {
  'use strict';

  var STORAGE_KEY = 'rn_cookie_consent';

  function getConsent() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }

  function setConsent(value) {
    try { localStorage.setItem(STORAGE_KEY, value); } catch (e) { /* silent */ }
  }

  function activateBlockedResources() {
    document.querySelectorAll('[data-cookie-src]').forEach(function (el) {
      el.src = el.getAttribute('data-cookie-src');
      el.removeAttribute('data-cookie-src');
    });
    // Remove any map placeholder
    document.querySelectorAll('.mapa-cookie-placeholder').forEach(function (el) {
      el.remove();
    });
  }

  function showMapPlaceholders() {
    document.querySelectorAll('[data-cookie-src]').forEach(function (el) {
      if (el.closest('.mapa-iframe') && !el.closest('.mapa-iframe').querySelector('.mapa-cookie-placeholder')) {
        el.style.display = 'none';
        var placeholder = document.createElement('div');
        placeholder.className = 'mapa-cookie-placeholder';
        placeholder.innerHTML =
          '<p>Para ver el mapa, acepta las cookies de terceros.</p>' +
          '<button class="btn-cookie-accept-map">Aceptar cookies</button>';
        el.parentNode.appendChild(placeholder);
        placeholder.querySelector('.btn-cookie-accept-map').addEventListener('click', function () {
          setConsent('accepted');
          activateBlockedResources();
          removeBanner();
        });
      }
    });
  }

  function createBanner() {
    var banner = document.createElement('div');
    banner.id = 'cookieConsent';
    banner.className = 'cookie-banner';
    banner.innerHTML =
      '<div class="cookie-banner-inner">' +
        '<div class="cookie-banner-text">' +
          '<p>Utilizamos cookies propias y de terceros para mejorar tu experiencia. ' +
          'Puedes aceptar todas, rechazar las no esenciales o consultar nuestra ' +
          '<a href="politica-cookies.html">política de cookies</a>.</p>' +
        '</div>' +
        '<div class="cookie-banner-actions">' +
          '<button class="cookie-btn cookie-btn--reject" id="cookieReject">Rechazar no esenciales</button>' +
          '<button class="cookie-btn cookie-btn--accept" id="cookieAccept">Aceptar todas</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(banner);

    document.getElementById('cookieAccept').addEventListener('click', function () {
      setConsent('accepted');
      activateBlockedResources();
      removeBanner();
    });

    document.getElementById('cookieReject').addEventListener('click', function () {
      setConsent('rejected');
      showMapPlaceholders();
      removeBanner();
    });

    // Animate in
    requestAnimationFrame(function () {
      banner.classList.add('cookie-banner--visible');
    });
  }

  function removeBanner() {
    var banner = document.getElementById('cookieConsent');
    if (banner) {
      banner.classList.remove('cookie-banner--visible');
      setTimeout(function () { banner.remove(); }, 350);
    }
  }

  // --- Init ---
  var consent = getConsent();

  if (consent === 'accepted') {
    activateBlockedResources();
  } else if (consent === 'rejected') {
    showMapPlaceholders();
  } else {
    createBanner();
  }
})();
