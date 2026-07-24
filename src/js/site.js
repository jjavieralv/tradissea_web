/* Tradissea — comportamiento del sitio.
   Sin dependencias externas. Todo funciona también con JavaScript desactivado,
   salvo el menú móvil, el vídeo y el envío del formulario sin recargar. */
(function () {
  'use strict';

  var doc = document;
  var config = window.TRADISSEA || {};

  /* ---------- Recordar el idioma elegido ---------- */
  try {
    if (config.lang) localStorage.setItem('tradissea-lang', config.lang);
  } catch (e) { /* almacenamiento no disponible */ }

  /* ---------- Banner de aviso: botón de pausa ---------- */
  var announce = doc.querySelector('[data-announce]');
  if (announce) {
    var announceBtn = announce.querySelector('[data-announce-toggle]');
    if (announceBtn) {
      announceBtn.addEventListener('click', function () {
        var paused = announce.classList.toggle('is-paused');
        announceBtn.setAttribute(
          'aria-label',
          paused ? announceBtn.dataset.labelPlay : announceBtn.dataset.labelPause
        );
      });
    }
  }

  /* ---------- Cabecera con sombra al hacer scroll ---------- */
  var header = doc.querySelector('.site-header');
  if (header) {
    var onScroll = function () {
      header.classList.toggle('is-stuck', window.scrollY > 8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- Menú móvil ---------- */
  var toggle = doc.querySelector('.nav-toggle');
  var nav = doc.getElementById('primary-nav');
  if (toggle && nav) {
    var setOpen = function (open) {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? toggle.dataset.labelClose : toggle.dataset.labelOpen);
      nav.classList.toggle('is-open', open);
    };
    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });
    nav.addEventListener('click', function (ev) {
      if (ev.target.closest('a')) setOpen(false);
    });
    doc.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
        toggle.focus();
      }
    });
    var mq = window.matchMedia('(min-width: 901px)');
    mq.addEventListener('change', function (ev) { if (ev.matches) setOpen(false); });
  }

  /* ---------- Servicios: la tarjeta gira y se amplía ----------
     Sin JavaScript las tarjetas siguen funcionando como desplegables;
     aquí sustituimos ese desplegable por una ventana ampliada. */
  var serviceCards = doc.querySelectorAll('[data-service-card]');
  var serviceDialog = doc.querySelector('[data-service-dialog]');

  if (serviceCards.length && serviceDialog && typeof serviceDialog.showModal === 'function') {
    var panel = serviceDialog.querySelector('[data-service-panel]');
    var slotIcon = serviceDialog.querySelector('[data-service-dialog-icon]');
    var slotTitle = serviceDialog.querySelector('[data-service-dialog-title]');
    var slotBody = serviceDialog.querySelector('[data-service-dialog-body]');
    var scroller = serviceDialog.querySelector('[data-service-scroll]');
    var closeBtn = serviceDialog.querySelector('[data-service-close]');
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    var canAnimate = typeof panel.animate === 'function';
    var openCard = null;

    var flipOpen = function (card) {
      if (!canAnimate || reduceMotion.matches) return;
      var from = card.getBoundingClientRect();
      var to = panel.getBoundingClientRect();
      if (!to.width || !to.height) return;
      var dx = from.left + from.width / 2 - (to.left + to.width / 2);
      var dy = from.top + from.height / 2 - (to.top + to.height / 2);
      var sx = Math.max(from.width / to.width, 0.15);
      var sy = Math.max(from.height / to.height, 0.15);

      panel.animate(
        [
          {
            transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + sx + ',' + sy + ') rotateY(-92deg)',
            opacity: 0.2
          },
          {
            transform:
              'translate(' + dx * 0.3 + 'px,' + dy * 0.3 + 'px) scale(' +
              (sx + (1 - sx) * 0.72) + ',' + (sy + (1 - sy) * 0.72) + ') rotateY(-16deg)',
            opacity: 1,
            offset: 0.58
          },
          { transform: 'none', opacity: 1 }
        ],
        { duration: 520, easing: 'cubic-bezier(.22,.75,.28,1)' }
      );
    };

    var openService = function (card) {
      openCard = card;
      var icon = card.querySelector('.card-icon');
      var title = card.querySelector('h3');
      var store = card.querySelector('.card__store');
      slotIcon.innerHTML = icon ? icon.innerHTML : '';
      slotTitle.textContent = title ? title.textContent : '';
      slotBody.innerHTML = store ? store.innerHTML : '';
      serviceDialog.showModal();
      if (scroller) scroller.scrollTop = 0;
      panel.focus({ preventScroll: true });
      flipOpen(card);
    };

    var closeService = function () {
      if (!canAnimate || reduceMotion.matches || !openCard) {
        serviceDialog.close();
        return;
      }
      var card = openCard;
      var from = card.getBoundingClientRect();
      var to = panel.getBoundingClientRect();
      var dx = from.left + from.width / 2 - (to.left + to.width / 2);
      var dy = from.top + from.height / 2 - (to.top + to.height / 2);
      var sx = Math.max(from.width / to.width, 0.15);
      var sy = Math.max(from.height / to.height, 0.15);

      serviceDialog.setAttribute('data-closing', '');
      var animation = panel.animate(
        [
          { transform: 'none', opacity: 1 },
          {
            transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + sx + ',' + sy + ') rotateY(80deg)',
            opacity: 0
          }
        ],
        { duration: 260, easing: 'cubic-bezier(.5,.05,.75,.4)' }
      );
      animation.onfinish = function () {
        serviceDialog.removeAttribute('data-closing');
        serviceDialog.close();
      };
    };

    Array.prototype.forEach.call(serviceCards, function (card) {
      var disclosure = card.querySelector('.card__disclosure');
      if (!disclosure) return;
      var summary = disclosure.querySelector('summary');
      var body = disclosure.querySelector('.details-body');
      if (!summary || !body) return;

      var button = doc.createElement('button');
      button.type = 'button';
      button.className = 'card__more';
      button.innerHTML = summary.innerHTML;
      button.setAttribute('aria-haspopup', 'dialog');

      var store = doc.createElement('div');
      store.className = 'card__store';
      store.appendChild(body);

      disclosure.replaceWith(button);
      card.appendChild(store);

      button.addEventListener('click', function (ev) {
        ev.stopPropagation();
        openService(card);
      });
      card.addEventListener('click', function (ev) {
        if (ev.target.closest('a, button')) return;
        var selection = window.getSelection ? String(window.getSelection()) : '';
        if (selection.length > 2) return; // se estaba seleccionando texto
        openService(card);
      });
    });

    closeBtn.addEventListener('click', closeService);
    serviceDialog.addEventListener('cancel', function (ev) {
      ev.preventDefault();
      closeService();
    });
    serviceDialog.addEventListener('click', function (ev) {
      if (ev.target === serviceDialog) closeService();
    });
    serviceDialog.addEventListener('close', function () {
      if (openCard) {
        var trigger = openCard.querySelector('.card__more');
        if (trigger) trigger.focus({ preventScroll: true });
      }
      openCard = null;
    });
  }

  /* ---------- Vídeo: no se conecta a YouTube hasta pulsar play ---------- */
  var videoBtn = doc.querySelector('.video-play');
  if (videoBtn) {
    videoBtn.addEventListener('click', function () {
      var wrap = videoBtn.closest('.video-wrap');
      var id = wrap.dataset.videoId;
      if (!id) return;
      var frame = doc.createElement('iframe');
      frame.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) +
        '?autoplay=1&rel=0&modestbranding=1';
      frame.title = videoBtn.getAttribute('aria-label') || 'YouTube';
      frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      frame.setAttribute('allowfullscreen', '');
      frame.setAttribute('loading', 'lazy');
      wrap.innerHTML = '';
      wrap.appendChild(frame);
      frame.focus();
    });
  }

  /* ---------- El mar del pie: salpica al pasar por encima ---------- */
  var wave = doc.querySelector('[data-wave]');
  var splash = wave && wave.querySelector('[data-wave-splash]');

  if (wave && splash && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var TONES = ['#ffffff', '#c9efff', '#84cce4', '#a8e0f5'];
    /* Los tres signos del patrón de Tradissea. «scale» compensa el tamaño de
       cada dibujo: la eszett ocupa toda la caja tipográfica y la virgulilla o
       el apóstrofo son mucho menores, así que se agrandan para que todos
       salten con la misma presencia. */
    var MARKS = [
      { glyph: '~', scale: 2.5, font: "'Bodoni Moda', " },
      { glyph: 'ß', scale: 1 },
      { glyph: '’', scale: 3.3 }
    ];
    /* Los colores se reparten al azar entre los signos: así ninguno queda
       siempre del tono que peor se ve sobre el agua. */
    var MARK_TONES = ['#00807e', '#eeb01a', '#2b95c4', '#2f3d3d'];
    var lastDrop = 0;
    var stirTimer = null;
    var rand = function (min, max) {
      return min + Math.random() * (max - min);
    };

    var makeDrops = function (ratio, count) {
      var fragment = doc.createDocumentFragment();
      ratio = Math.min(0.97, Math.max(0.03, ratio));
      for (var i = 0; i < count; i += 1) {
        var drop = doc.createElement('span');
        var inner = doc.createElement('i');
        /* Uno de cada tres saltos es un signo de la marca. */
        var isMark = Math.random() < 0.34;

        drop.className = 'drop ' + (isMark ? 'drop--mark' : 'drop--bubble');
        drop.style.setProperty('--x', (ratio * 100).toFixed(2) + '%');
        var driftMin = ratio < 0.1 ? 0 : -38;
        var driftMax = ratio > 0.9 ? 0 : 38;
        drop.style.setProperty('--dx', rand(driftMin, driftMax).toFixed(1) + 'px');
        drop.style.setProperty('--from', (isMark ? rand(40, 56) : rand(30, 48)).toFixed(0) + '%');

        if (isMark) {
          var mark = MARKS[Math.floor(Math.random() * MARKS.length)];
          inner.textContent = mark.glyph;
          inner.style.setProperty('--size', (rand(15, 34) * mark.scale).toFixed(1) + 'px');
          inner.style.setProperty('--tone', MARK_TONES[Math.floor(Math.random() * MARK_TONES.length)]);
          inner.style.setProperty('--spin', rand(-220, 220).toFixed(0) + 'deg');
          if (mark.font) inner.style.setProperty('--mark-font', mark.font + "'Prata', serif");
          drop.style.setProperty('--dy', rand(-52, -115).toFixed(1) + 'px');
          drop.style.setProperty('--dur', rand(1000, 1700).toFixed(0) + 'ms');
        } else {
          inner.style.setProperty('--size', rand(4, 15).toFixed(1) + 'px');
          inner.style.setProperty('--tone', TONES[Math.floor(Math.random() * TONES.length)]);
          drop.style.setProperty('--dy', rand(-24, -66).toFixed(1) + 'px');
          drop.style.setProperty('--dur', rand(650, 1250).toFixed(0) + 'ms');
        }

        drop.appendChild(inner);
        drop.addEventListener('animationend', function () {
          if (this.parentNode) this.parentNode.removeChild(this);
        });
        fragment.appendChild(drop);
      }
      var ripple = doc.createElement('span');
      ripple.className = 'ripple';
      ripple.style.setProperty('--x', (ratio * 100).toFixed(2) + '%');
      ripple.style.setProperty('--from', '40%');
      ripple.addEventListener('animationend', function () {
        if (this.parentNode) this.parentNode.removeChild(this);
      });
      fragment.appendChild(ripple);

      splash.appendChild(fragment);
      if (splash.childElementCount > 70) splash.removeChild(splash.firstElementChild);
    };

    var stir = function () {
      wave.classList.add('is-stirred');
      clearTimeout(stirTimer);
      stirTimer = setTimeout(function () {
        wave.classList.remove('is-stirred');
      }, 900);
    };

    wave.addEventListener('pointermove', function (ev) {
      var now = Date.now();
      if (now - lastDrop < 90) return;
      lastDrop = now;
      var bounds = wave.getBoundingClientRect();
      makeDrops((ev.clientX - bounds.left) / bounds.width, 2 + Math.floor(Math.random() * 3));
      stir();
    });

    wave.addEventListener('pointerdown', function (ev) {
      var bounds = wave.getBoundingClientRect();
      makeDrops((ev.clientX - bounds.left) / bounds.width, 8);
      stir();
    });

    /* Salpica sola al llegar al final de la página (así también se ve en el
       móvil) y detiene el oleaje mientras el mar no está en pantalla. */
    if ('IntersectionObserver' in window) {
      var breaking = false;
      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            wave.classList.toggle('is-offscreen', !entry.isIntersecting);
            /* Se trae la Bodoni de las virgulillas al acercarse el mar, para
               que el primer salto ya salga con su tipografía. */
            if (entry.isIntersecting && doc.fonts && doc.fonts.load) {
              doc.fonts.load("16px 'Bodoni Moda'", '~').catch(function () {});
            }
            if (entry.intersectionRatio < 0.55 || breaking) return;
            breaking = true;
            stir();
            for (var i = 0; i < 9; i += 1) {
              (function (index) {
                setTimeout(function () {
                  makeDrops(0.08 + index * 0.105 + (Math.random() * 0.05 - 0.025), 2);
                }, index * 110);
              })(i);
            }
            setTimeout(function () { breaking = false; }, 4000);
          });
        },
        { threshold: [0, 0.55] }
      );
      observer.observe(wave);
    }
  }

  /* ---------- Formulario de contacto ---------- */
  var form = doc.querySelector('form[data-contact-form]');
  if (form) {
    var status = form.querySelector('.form-status');
    var submit = form.querySelector('button[type="submit"]');
    var t = config.formText || {};

    var showError = function (field, message) {
      var box = form.querySelector('#' + field.id + '-error');
      field.setAttribute('aria-invalid', 'true');
      if (box) box.textContent = message;
    };
    var clearError = function (field) {
      var box = form.querySelector('#' + field.id + '-error');
      field.removeAttribute('aria-invalid');
      if (box) box.textContent = '';
    };

    form.addEventListener('input', function (ev) {
      if (ev.target.id) clearError(ev.target);
    });

    var validate = function () {
      var ok = true;
      var first = null;
      var name = form.elements.name;
      var email = form.elements.email;
      var message = form.elements.message;
      var consent = form.elements.consent;

      [name, email, message, consent].forEach(function (f) { if (f) clearError(f); });

      if (name && !name.value.trim()) { showError(name, t.invalidName || ''); ok = false; first = first || name; }
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) {
        showError(email, t.invalidEmail || ''); ok = false; first = first || email;
      }
      if (message && message.value.trim().length < 5) {
        showError(message, t.invalidMessage || ''); ok = false; first = first || message;
      }
      if (consent && !consent.checked) {
        showError(consent, t.invalidConsent || ''); ok = false; first = first || consent;
      }
      if (first) first.focus();
      return ok;
    };

    var setStatus = function (state, title, text) {
      if (!status) return;
      status.dataset.state = state;
      status.innerHTML = '';
      var strong = doc.createElement('strong');
      strong.textContent = title;
      var span = doc.createElement('span');
      span.textContent = text;
      status.appendChild(strong);
      status.appendChild(span);
    };

    var buildMailto = function (data) {
      var lines = [];
      if (data.name) lines.push(data.name);
      if (data.company) lines.push(data.company);
      if (data.service) lines.push(data.service);
      lines.push('');
      lines.push(data.message || '');
      lines.push('');
      lines.push(data.email || '');
      return 'mailto:' + (config.email || '') +
        '?subject=' + encodeURIComponent((config.mailSubject || 'Web') + ' — ' + (data.name || '')) +
        '&body=' + encodeURIComponent(lines.join('\n'));
    };

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      if (form.elements.website && form.elements.website.value) return; // trampa antispam
      if (!validate()) return;

      var data = {};
      new FormData(form).forEach(function (value, key) {
        if (key !== 'website' && key !== 'consent') data[key] = value;
      });
      data.language = config.lang || '';

      var endpoint = config.formEndpoint;
      if (!endpoint) {
        window.location.href = buildMailto(data);
        setStatus('ok', t.successTitle || '', t.mailtoNotice || '');
        return;
      }

      var original = submit ? submit.textContent : '';
      if (submit) { submit.disabled = true; submit.textContent = t.sending || original; }

      fetch(endpoint, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(function (res) {
        if (!res.ok) throw new Error('bad status');
        form.reset();
        setStatus('ok', t.successTitle || '', t.success || '');
      }).catch(function () {
        setStatus('error', t.errorTitle || '', t.error || '');
      }).then(function () {
        if (submit) { submit.disabled = false; submit.textContent = original; }
        if (status) status.focus();
      });
    });
  }
})();
