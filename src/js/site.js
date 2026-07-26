/* Tradissea — comportamiento del sitio.
   Sin dependencias externas. Todo funciona también con JavaScript desactivado,
   salvo el menú móvil, el vídeo y el envío del formulario sin recargar. */
(function () {
  'use strict';

  var doc = document;
  var config = window.TRADISSEA || {};

  /* Marca que hay JavaScript: algunos efectos parten de un estado oculto y no
     deben aplicarse si el visitante navega sin él. */
  doc.documentElement.classList.add('js');

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

  var reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- Correo: se recompone en el navegador ----------
     En el HTML solo hay «paula (arroba) tradissea.com» partido en dos
     atributos, para que los rastreadores de spam no encuentren la dirección. */
  Array.prototype.forEach.call(doc.querySelectorAll('.mail-link'), function (link) {
    var address = link.dataset.user + '@' + link.dataset.domain;
    link.href = 'mailto:' + address;
    var slot = link.querySelector('.mail-text');
    if (slot) slot.textContent = address;
  });

  /* ---------- Eslogan escrito a máquina ----------
     La primera vez se escribe entero; después solo se borra y se reescribe la
     parte final que cambia («cultures» → «languages» → «translations»). */
  var typer = doc.querySelector('[data-typewriter]');
  if (typer) {
    var phrases = [];
    try { phrases = JSON.parse(typer.dataset.typewriter) || []; } catch (e) { phrases = []; }
    var slot = typer.querySelector('.type-text');

    if (slot && phrases.length > 1 && !reduceMotionQuery.matches) {
      /* Prefijo común a todas las frases: eso no se vuelve a escribir. */
      var stem = phrases[0];
      phrases.forEach(function (phrase) {
        var i = 0;
        while (i < stem.length && i < phrase.length && stem[i] === phrase[i]) i += 1;
        stem = stem.slice(0, i);
      });
      stem = stem.replace(/\S+$/, ''); // corta por la última palabra completa

      var index = 0;
      var shown = phrases[0].length;
      var erasing = true;

      var tick = function () {
        var current = phrases[index];
        slot.textContent = current.slice(0, shown);

        var wait = erasing ? 38 : 70;
        if (erasing && shown <= stem.length) {
          erasing = false;
          index = (index + 1) % phrases.length;
          wait = 260;
        } else if (!erasing && shown >= current.length) {
          erasing = true;
          wait = 2100;
        } else {
          shown += erasing ? -1 : 1;
        }
        setTimeout(tick, wait);
      };
      setTimeout(tick, 2200);
    }
  }

  /* ---------- Títulos que se escriben (con su errata y su corrección) ----------
     El texto real vive en un span oculto para lectores de pantalla; lo que se
     anima es una copia marcada como decorativa, así que sin JavaScript o con
     «reducir movimiento» el título se ve completo desde el principio. */
  var NEARBY = {
    a: 'sqz', b: 'vn', c: 'xv', d: 'sf', e: 'wr', f: 'dg', g: 'fh', h: 'gj', i: 'uo',
    j: 'hk', k: 'jl', l: 'kñ', m: 'n', n: 'mb', o: 'ip', p: 'oó', q: 'wa', r: 'et',
    s: 'ad', t: 'ry', u: 'yi', v: 'cb', w: 'qe', x: 'zc', y: 'tu', z: 'xs'
  };

  var typeInto = function (heading) {
    var slot = heading.querySelector('.type-in__text');
    if (!slot) return;
    var full = slot.textContent;
    var letters = full.split('');

    /* Se escoge una letra de la segunda mitad para equivocarse en ella. */
    var typoAt = -1;
    for (var i = Math.floor(full.length * 0.45); i < full.length - 1; i += 1) {
      if (NEARBY[full[i].toLowerCase()]) { typoAt = i; break; }
    }
    var wrong = '';
    if (typoAt > -1) {
      var options = NEARBY[full[typoAt].toLowerCase()];
      wrong = options[Math.floor(Math.random() * options.length)];
      if (full[typoAt] === full[typoAt].toUpperCase()) wrong = wrong.toUpperCase();
    }

    var escapeHtml = function (text) {
      return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    };

    heading.classList.add('is-typing');
    slot.textContent = '';
    var at = 0;

    /* Con la errata puesta, se siguen tecleando un par de letras antes de
       darse cuenta: entonces se borra hasta el fallo y se reescribe bien. */
    var typoRun = function () {
      var head = escapeHtml(full.slice(0, typoAt));
      var typo = '<span class="type-typo">' + escapeHtml(wrong) + '</span>';
      var extra = Math.min(2 + Math.floor(Math.random() * 2), full.length - typoAt - 1);
      var written = 0;

      var keepGoing = function () {
        slot.innerHTML = head + typo + escapeHtml(full.slice(typoAt + 1, typoAt + 1 + written));
        if (written < extra) {
          written += 1;
          setTimeout(keepGoing, 70 + Math.random() * 50);
          return;
        }
        /* Se para en seco al ver el error… */
        setTimeout(function () {
          var erase = function () {
            if (written > 0) {
              written -= 1;
              slot.innerHTML = head + typo + escapeHtml(full.slice(typoAt + 1, typoAt + 1 + written));
              setTimeout(erase, 55);
              return;
            }
            /* …y se corrige. */
            slot.textContent = full.slice(0, typoAt);
            setTimeout(function () {
              at = typoAt + 1;
              slot.textContent = full.slice(0, at);
              setTimeout(write, 90);
            }, 170);
          };
          erase();
        }, 520);
      };
      keepGoing();
    };

    var write = function () {
      if (at === typoAt) {
        typoRun();
        return;
      }
      at += 1;
      slot.textContent = full.slice(0, at);
      if (at < letters.length) {
        setTimeout(write, 45 + Math.random() * 45);
      } else {
        setTimeout(function () { heading.classList.remove('is-typing'); }, 900);
      }
    };
    setTimeout(write, 120);
  };

  /* ---------- El convoy recorre la línea de paradas ---------- */
  var runLine = function (wrap) {
    var track = wrap.querySelector('.line__track');
    var progress = wrap.querySelector('[data-line-progress]');
    var train = wrap.querySelector('[data-line-train]');
    var dots = wrap.querySelectorAll('.line__dot');
    var stops = wrap.querySelectorAll('.line__stop');
    if (!track || !train || !dots.length) return;

    wrap.classList.add('is-running');

    /* Posición de cada estación medida sobre el contenedor, no sobre la vía:
       la vía se recorta después y sus medidas ya no servirían. */
    var wrapBox = wrap.getBoundingClientRect();
    var first = dots[0].getBoundingClientRect();
    var lastDot = dots[dots.length - 1].getBoundingClientRect();
    var vertical = lastDot.top - first.top > Math.abs(lastDot.left - first.left);

    var origin = vertical
      ? first.top + first.height / 2 - wrapBox.top
      : first.left + first.width / 2 - wrapBox.left;

    var marks = [];
    Array.prototype.forEach.call(dots, function (dot) {
      var box = dot.getBoundingClientRect();
      var pos = vertical
        ? box.top + box.height / 2 - wrapBox.top
        : box.left + box.width / 2 - wrapBox.left;
      marks.push(pos - origin);
    });

    /* La vía empieza en la primera estación y acaba en la última. */
    var span = marks[marks.length - 1];
    if (vertical) {
      track.style.top = origin + 'px';
      track.style.bottom = 'auto';
      track.style.height = span + 'px';
    } else {
      track.style.left = origin + 'px';
      track.style.right = 'auto';
      track.style.width = span + 'px';
    }

    var perLeg = 1500;  // tiempo entre estaciones
    var dwell = 1000;   // parada en cada estación
    var frames = [];
    var times = [];
    var clock = 0;
    marks.forEach(function (pos, i) {
      if (i > 0) clock += perLeg;
      times.push(clock);
      frames.push({ offset: 0, at: clock, pos: pos });
      clock += dwell;
      frames.push({ offset: 0, at: clock, pos: pos });
    });
    var total = clock;

    var keyframes = frames.map(function (frame) {
      return vertical
        ? { top: frame.pos + 'px', offset: total ? frame.at / total : 0 }
        : { left: frame.pos + 'px', offset: total ? frame.at / total : 0 };
    });
    var fill = frames.map(function (frame) {
      return vertical
        ? { height: frame.pos + 'px', offset: total ? frame.at / total : 0 }
        : { width: frame.pos + 'px', offset: total ? frame.at / total : 0 };
    });

    if (typeof train.animate === 'function') {
      train.animate(keyframes, { duration: total, easing: 'ease-in-out', fill: 'forwards' });
      if (progress) progress.animate(fill, { duration: total, easing: 'ease-in-out', fill: 'forwards' });
    } else if (progress) {
      progress.style[vertical ? 'height' : 'width'] = '100%';
    }

    /* Cada estación se enciende cuando el convoy llega, y su texto queda
       destacado mientras el convoy está parado en ella. */
    Array.prototype.forEach.call(stops, function (stop, i) {
      setTimeout(function () {
        stop.classList.add('is-on', 'is-current');
      }, times[i] || 0);
      setTimeout(function () {
        stop.classList.remove('is-current');
      }, (times[i] || 0) + dwell + 420);
    });
  };

  var headings = doc.querySelectorAll('[data-type-in]');
  var lineWrap = doc.querySelector('[data-line]');

  if (!('IntersectionObserver' in window) || reduceMotionQuery.matches) {
    if (lineWrap) {
      Array.prototype.forEach.call(lineWrap.querySelectorAll('.line__stop'), function (stop) {
        stop.classList.add('is-on');
      });
      var staticProgress = lineWrap.querySelector('[data-line-progress]');
      if (staticProgress) staticProgress.style.width = '100%';
    }
  } else {
    var sceneObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          sceneObserver.unobserve(el);
          if (el.hasAttribute('data-line')) runLine(el);
          else typeInto(el);
        });
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.35 }
    );
    Array.prototype.forEach.call(headings, function (el) { sceneObserver.observe(el); });
    if (lineWrap) sceneObserver.observe(lineWrap);
  }

  /* ---------- El menú subraya la sección que se está leyendo ----------
     Se mira qué sección cruza una línea imaginaria a un tercio de la pantalla;
     es más estable que fiarse de cuánta parte de cada sección se ve, porque
     unas son mucho más largas que otras. */
  var spy = [];
  Array.prototype.forEach.call(doc.querySelectorAll('#primary-nav a[data-nav]'), function (link) {
    var target = link.getAttribute('href') || '';
    var id = target.indexOf('#') > -1 ? target.split('#')[1] : '';
    /* «Inicio» no es una sección: lo gestiona aparte homeLink. */
    var section = id && id !== 'main' && id !== 'top' ? doc.getElementById(id) : null;
    if (section) spy.push({ link: link, section: section });
  });
  var homeLink = doc.querySelector('#primary-nav a[data-nav="home"]');

  if (spy.length) {
    var mark = function (active) {
      spy.forEach(function (item) {
        if (item === active) item.link.setAttribute('aria-current', 'true');
        else item.link.removeAttribute('aria-current');
      });
      if (homeLink) {
        if (active) homeLink.removeAttribute('aria-current');
        else homeLink.setAttribute('aria-current', 'page');
      }
    };

    var updateSpy = function () {
      var line = window.scrollY + window.innerHeight * 0.34;
      var bottom = window.scrollY + window.innerHeight;
      var active = null;
      spy.forEach(function (item) {
        var top = item.section.getBoundingClientRect().top + window.scrollY;
        if (top <= line) active = item;
      });
      /* Al llegar al final de la página gana siempre la última sección. */
      if (bottom >= doc.documentElement.scrollHeight - 4) active = spy[spy.length - 1];
      mark(active);
    };

    var spyTicking = false;
    var onSpyScroll = function () {
      if (spyTicking) return;
      spyTicking = true;
      window.requestAnimationFrame(function () {
        spyTicking = false;
        updateSpy();
      });
    };
    updateSpy();
    window.addEventListener('scroll', onSpyScroll, { passive: true });
    window.addEventListener('resize', onSpyScroll, { passive: true });
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
    var reduceMotion = reduceMotionQuery;
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

  if (wave && splash && !reduceMotionQuery.matches) {
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

  /* ---------- La palabra del día ----------
     Juego de seis intentos para adivinar una palabra de cinco letras. La
     palabra del día sale de la fecha, así que es la misma para todo el mundo
     sin necesidad de servidor. */
  var gameRoot = doc.querySelector('[data-game]');

  if (gameRoot && config.game && config.game.words && config.game.words.length) {
    var G = config.game;
    var text = G.text || {};
    var LETTERS = 5;
    var TRIES = 6;

    var decode = function (encoded) {
      var key = 'tradissea';
      var raw = window.atob(encoded);
      var out = '';
      for (var i = 0; i < raw.length; i += 1) {
        out += String.fromCharCode(raw.charCodeAt(i) ^ key.charCodeAt(i % key.length));
      }
      return out;
    };

    /* Día del calendario en horario local, sin la hora. */
    var today = new Date();
    var stamp =
      today.getFullYear() +
      '-' +
      ('0' + (today.getMonth() + 1)).slice(-2) +
      '-' +
      ('0' + today.getDate()).slice(-2);
    var dayNumber = Math.floor(
      Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) / 86400000
    );
    var answer = decode(G.words[dayNumber % G.words.length]);

    var board = gameRoot.querySelector('[data-board]');
    var keyboard = gameRoot.querySelector('[data-keyboard]');
    var status = gameRoot.querySelector('[data-game-status]');
    var resultBox = gameRoot.querySelector('[data-game-result]');
    var resultTitle = gameRoot.querySelector('[data-result-title]');
    var resultText = gameRoot.querySelector('[data-result-text]');
    var codeBox = gameRoot.querySelector('[data-code-box]');
    var codeSlot = gameRoot.querySelector('[data-code]');
    var codeLink = gameRoot.querySelector('[data-code-link]');
    var copyBtn = gameRoot.querySelector('[data-copy]');

    var row = 0;
    var letters = ['', '', '', '', ''];
    var caret = 0;
    var checking = false;
    var finished = false;
    var known = {};   // palabras ya consultadas en el diccionario

    var storeKey = 'tradissea-word-' + (config.lang || 'es');
    var saved = null;
    try { saved = JSON.parse(localStorage.getItem(storeKey) || 'null'); } catch (e) { saved = null; }
    if (!saved || saved.day !== stamp) saved = { day: stamp, guesses: [], done: false, won: false };

    var announce = gameRoot.querySelector('[data-game-say]');
    /* Los avisos cortos se ven; el detalle de cada intento solo se anuncia
       para quien navega con lector de pantalla. */
    var say = function (message) {
      if (status) status.textContent = message || '';
    };
    var readOut = function (message) {
      if (announce) announce.textContent = message || '';
    };

    /* Código del día: lleva el descuento dentro y se puede comprobar a mano. */
    var makeCode = function () {
      var seed = stamp + answer + G.prefix;
      var sum = 0;
      for (var i = 0; i < seed.length; i += 1) sum = (sum * 31 + seed.charCodeAt(i)) % 1679616;
      var tail = sum.toString(36).toUpperCase();
      while (tail.length < 4) tail = '0' + tail;
      return (
        G.prefix +
        '-' + G.percent +
        '-' + stamp.slice(8, 10) + stamp.slice(5, 7) +
        '-' + tail.slice(-4)
      );
    };

    /* Compara el intento con la solución: primero los aciertos de posición y
       después las letras sueltas, sin repetir las ya consumidas. */
    var scoreOf = function (guess) {
      var marks = new Array(LETTERS).fill('off');
      var pool = {};
      var i;
      for (i = 0; i < LETTERS; i += 1) {
        if (guess[i] === answer[i]) marks[i] = 'ok';
        else pool[answer[i]] = (pool[answer[i]] || 0) + 1;
      }
      for (i = 0; i < LETTERS; i += 1) {
        if (marks[i] === 'ok') continue;
        if (pool[guess[i]]) {
          marks[i] = 'near';
          pool[guess[i]] -= 1;
        }
      }
      return marks;
    };

    var tileAt = function (r, c) {
      return board.querySelector('.tile[data-row="' + r + '"][data-col="' + c + '"]');
    };

    var paintRow = function (r, guess, marks, animate) {
      for (var i = 0; i < LETTERS; i += 1) {
        (function (index) {
          var tile = tileAt(r, index);
          if (!tile) return;
          var apply = function () {
            tile.querySelector('.tile__letter').textContent = guess[index];
            tile.classList.remove('is-filled');
            tile.classList.add('is-' + marks[index]);
          };
          if (animate && !reduceMotionQuery.matches) {
            setTimeout(function () {
              tile.classList.add('is-revealing');
              setTimeout(apply, 220);
              setTimeout(function () { tile.classList.remove('is-revealing'); }, 520);
            }, index * 160);
          } else {
            apply();
          }
          var key = keyboard.querySelector('.key[data-key="' + guess[index] + '"]');
          if (key) {
            var rank = { off: 0, near: 1, ok: 2 };
            var now = key.classList.contains('is-ok') ? 'ok' : key.classList.contains('is-near') ? 'near' : key.classList.contains('is-off') ? 'off' : null;
            if (now === null || rank[marks[index]] > rank[now]) {
              key.classList.remove('is-ok', 'is-near', 'is-off');
              key.classList.add('is-' + marks[index]);
            }
          }
        })(i);
      }
    };

    var drawCurrent = function () {
      /* El cursor solo puede estar en un sitio: se limpia todo el tablero antes
         de marcarlo, o al cambiar de fila se quedaría parpadeando en la
         anterior. */
      Array.prototype.forEach.call(board.querySelectorAll('.tile.is-caret'), function (tile) {
        tile.classList.remove('is-caret');
      });
      for (var i = 0; i < LETTERS; i += 1) {
        var tile = tileAt(row, i);
        if (!tile) continue;
        tile.querySelector('.tile__letter').textContent = letters[i] || '';
        tile.classList.toggle('is-filled', Boolean(letters[i]));
        tile.classList.toggle('is-caret', i === caret && !finished);
        var label = letters[i]
          ? String(text.cellFilled || '').replace('{n}', String(i + 1)).replace('{letter}', letters[i])
          : String(text.cellEmpty || '').replace('{n}', String(i + 1));
        tile.setAttribute('aria-label', label);
      }
    };

    /* Solo se puede escribir en la fila que toca. */
    var openRow = function () {
      Array.prototype.forEach.call(board.querySelectorAll('.tile'), function (tile) {
        tile.disabled = finished || Number(tile.dataset.row) !== row;
      });
      drawCurrent();
    };

    var wordOf = function () {
      return letters.join('');
    };

    var finish = function (won, animate) {
      finished = true;
      Array.prototype.forEach.call(board.querySelectorAll('.tile'), function (tile) {
        tile.disabled = true;
        tile.classList.remove('is-caret');
      });
      resultBox.hidden = false;
      resultTitle.textContent = won ? text.winTitle : text.loseTitle;
      var template = won ? text.winText : text.loseText;
      resultText.textContent = String(template || '').replace('{word}', answer);
      if (won) {
        var code = makeCode();
        codeBox.hidden = false;
        codeSlot.textContent = code;
        if (codeLink) {
          var base = codeLink.getAttribute('href').split('?')[0].split('#');
          codeLink.setAttribute('href', base[0] + '?code=' + encodeURIComponent(code) + (base[1] ? '#' + base[1] : ''));
        }
      }
      if (animate) {
        setTimeout(function () {
          resultBox.scrollIntoView({ block: 'nearest', behavior: reduceMotionQuery.matches ? 'auto' : 'smooth' });
        }, 900);
      }
    };

    /* ¿Existe la palabra? Se pregunta a Wikcionario, que cubre los tres
       idiomas. Si la consulta falla o tarda, se da por buena: nadie debería
       quedarse sin jugar por un problema de red. */
    var wordExists = function (word) {
      if (known[word] !== undefined) return Promise.resolve(known[word]);
      if (!window.fetch) return Promise.resolve(true);

      var lang = config.lang || 'es';
      var lower = word.toLowerCase();
      var capital = lower.charAt(0).toUpperCase() + lower.slice(1);
      var url =
        'https://' + lang + '.wiktionary.org/w/api.php?action=query&format=json&origin=*&titles=' +
        encodeURIComponent(lower + '|' + capital);

      var stop = null;
      var signal;
      if (window.AbortController) {
        var ctrl = new AbortController();
        signal = ctrl.signal;
        stop = setTimeout(function () { ctrl.abort(); }, 2500);
      }

      return fetch(url, { signal: signal })
        .then(function (res) { return res.ok ? res.json() : null; })
        .then(function (data) {
          if (stop) clearTimeout(stop);
          if (!data || !data.query || !data.query.pages) return true;
          var pages = data.query.pages;
          var exists = Object.keys(pages).some(function (id) { return !('missing' in pages[id]); });
          known[word] = exists;
          return exists;
        })
        .catch(function () {
          if (stop) clearTimeout(stop);
          return true;
        });
    };

    var shake = function () {
      var line = board.querySelectorAll('.board__row')[row];
      if (!line) return;
      line.classList.add('is-wrong');
      setTimeout(function () { line.classList.remove('is-wrong'); }, 400);
    };

    var submit = function () {
      if (finished || checking) return;
      var current = wordOf();
      if (current.length < LETTERS || letters.some(function (l) { return !l; })) {
        say(text.shortWord);
        shake();
        return;
      }

      /* Las palabras del juego no hace falta comprobarlas. */
      if (current !== answer) {
        checking = true;
        say(text.checking);
        wordExists(current).then(function (exists) {
          checking = false;
          if (!exists) {
            say(text.notAWord);
            shake();
            return;
          }
          say('');
          play(current);
        });
        return;
      }
      play(current);
    };

    var play = function (current) {
      var marks = scoreOf(current);
      paintRow(row, current, marks, true);
      saved.guesses.push(current);

      var summary = String(text.guessResult || '')
        .replace('{n}', String(row + 1))
        .replace('{word}', current.split('').join(' '))
        .replace(
          '{result}',
          marks
            .map(function (mark, i) {
              var name = (text.legend || []).filter(function (item) { return item.state === mark; })[0];
              return current[i] + ': ' + (name ? name.label : mark);
            })
            .join(', ')
        );
      readOut(summary);
      say('');

      var won = current === answer;
      row += 1;
      letters = ['', '', '', '', ''];
      caret = 0;
      openRow();

      if (won || row >= TRIES) {
        saved.done = true;
        saved.won = won;
        setTimeout(function () { finish(won, true); }, 900);
      }
      try { localStorage.setItem(storeKey, JSON.stringify(saved)); } catch (e) { /* sin almacenamiento */ }
    };

    var press = function (key) {
      if (finished || checking) return;
      if (key === 'ENTER') { submit(); return; }

      if (key === 'DEL') {
        /* Borra la letra del cursor o, si está vacío, la anterior. */
        if (letters[caret]) {
          letters[caret] = '';
        } else if (caret > 0) {
          caret -= 1;
          letters[caret] = '';
        }
        drawCurrent();
        return;
      }

      if (!/^[A-ZÑ]$/.test(key)) return;
      letters[caret] = key;
      /* Salta al siguiente hueco libre; si no queda ninguno, se queda donde está. */
      var next = caret + 1;
      while (next < LETTERS && letters[next]) next += 1;
      caret = next < LETTERS ? next : Math.min(caret + 1, LETTERS - 1);
      drawCurrent();
    };

    /* Al pulsar una casilla, el cursor se coloca ahí para cambiar esa letra. */
    board.addEventListener('click', function (ev) {
      var tile = ev.target.closest('.tile');
      if (!tile || tile.disabled || finished) return;
      if (Number(tile.dataset.row) !== row) return;
      caret = Number(tile.dataset.col);
      drawCurrent();
      tile.focus();
    });

    keyboard.addEventListener('click', function (ev) {
      var key = ev.target.closest('.key');
      if (key) press(key.dataset.key);
    });

    doc.addEventListener('keydown', function (ev) {
      if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
      if (ev.target.closest('input, textarea, select')) return;
      if (ev.key === 'Enter') { press('ENTER'); return; }
      if (ev.key === 'Backspace') { press('DEL'); return; }
      var letter = ev.key.toUpperCase();
      if (/^[A-ZÑ]$/.test(letter)) press(letter);
    });

    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        var code = codeSlot.textContent;
        var done = function () {
          copyBtn.textContent = copyBtn.dataset.done;
          setTimeout(function () { copyBtn.textContent = copyBtn.dataset.label; }, 2200);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(code).then(done, function () {});
        }
      });
    }

    /* Se recupera la partida del día si ya se había empezado. */
    if (saved.guesses.length) {
      saved.guesses.forEach(function (guess, index) {
        paintRow(index, guess, scoreOf(guess), false);
      });
      row = saved.guesses.length;
    }
    openRow();
    if (saved.done) {
      finish(saved.won, false);
      say(text.alreadyPlayed);
    }
  }

  /* ---------- Formulario de contacto ---------- */
  var form = doc.querySelector('form[data-contact-form]');
  if (form) {
    /* Si se llega desde el juego con un código, el mensaje ya viene escrito. */
    try {
      var codeParam = new URLSearchParams(window.location.search).get('code');
      if (codeParam && form.elements.message && !form.elements.message.value) {
        var intro = (config.formText && config.formText.codeIntro) || 'Código de descuento:';
        form.elements.message.value = intro + ' ' + codeParam + '\n\n';
        form.elements.message.focus({ preventScroll: true });
      }
    } catch (e) { /* URL sin parámetros */ }
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
      var mail = config.mail ? config.mail.u + '@' + config.mail.d : '';
      return 'mailto:' + mail +
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
