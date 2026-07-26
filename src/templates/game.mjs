/* Página «La palabra del día»: un juego de adivinar una palabra de cinco
   letras que desbloquea un código de descuento. Vive fuera de la portada. */
import { esc, prefixFor } from './layout.mjs';

const ROWS = 6;
const COLS = 5;

/* Teclado sin caracteres con tilde: las palabras del juego tampoco los llevan. */
const KEY_ROWS = ['QWERTYUIOP', 'ASDFGHJKLÑ', 'ZXCVBNM'];

export function gamePage({ site, t, depth, paths }) {
  const p = prefixFor(depth);
  const g = t.game;

  const board = Array.from({ length: ROWS }, (_, row) => {
    const cells = Array.from(
      { length: COLS },
      (_, col) =>
        `<button class="tile" type="button" data-row="${row}" data-col="${col}" disabled aria-label="${esc(
          g.cellEmpty.replace('{n}', String(col + 1))
        )}"><span class="tile__letter"></span></button>`
    ).join('');
    return `<div class="board__row" role="group" aria-label="${esc(
      g.rowLabel.replace('{n}', String(row + 1))
    )}">${cells}</div>`;
  }).join('\n      ');

  const keyboard = KEY_ROWS.map((row, index) => {
    const keys = row
      .split('')
      .map((key) => `<button class="key" type="button" data-key="${key}">${key}</button>`)
      .join('');
    const enter =
      index === 2
        ? `<button class="key key--wide" type="button" data-key="ENTER">${esc(g.enter)}</button>`
        : '';
    const del =
      index === 2
        ? `<button class="key key--wide" type="button" data-key="DEL" aria-label="${esc(g.delete)}">⌫</button>`
        : '';
    return `<div class="keyboard__row">${enter}${keys}${del}</div>`;
  }).join('\n      ');

  const legend = g.legend
    .map(
      (item) => `<li class="legend__item">
        <span class="tile tile--sample is-${esc(item.state)}" aria-hidden="true"><span class="tile__letter">A</span></span>
        <span><strong>${esc(item.label)}</strong> ${esc(item.text)}</span>
      </li>`
    )
    .join('\n        ');

  return `
<section class="page-header">
  <div class="wrap">
    <p class="eyebrow">${esc(g.eyebrow)}</p>
    <h1>${esc(g.heading)}</h1>
    <p class="lead">${esc(g.lead)}</p>
  </div>
</section>

<section class="section section--tight">
  <div class="wrap game-layout">
    <div class="game" data-game>
      <div class="board" data-board aria-label="${esc(g.board)}">
      ${board}
      </div>

      <p class="game__status" data-game-status role="status"></p>
      <p class="visually-hidden" data-game-say aria-live="polite"></p>
      <p class="game__note">${esc(g.checkNote)}</p>

      <div class="keyboard" data-keyboard aria-label="${esc(g.keyboard)}">
      ${keyboard}
      </div>

      <div class="game__result" data-game-result hidden>
        <h2 data-result-title></h2>
        <p data-result-text></p>
        <div class="code" data-code-box hidden>
          <p class="code__label">${esc(g.codeLabel)}</p>
          <p class="code__value" data-code></p>
          <div class="btn-row">
            <button class="btn btn--ghost" type="button" data-copy data-label="${esc(g.copy)}" data-done="${esc(
    g.copied
  )}">${esc(g.copy)}</button>
            <a class="btn btn--primary" href="${p}${paths.home}#${esc(t.anchors.contact)}" data-code-link>${esc(
    g.useButton
  )}</a>
          </div>
          <p class="code__use">${esc(g.useText)}</p>
        </div>
      </div>
    </div>

    <aside class="game-aside">
      <div class="game-card">
        <h2 class="h-sub">${esc(g.howTitle)}</h2>
        <ol class="game-steps">
          ${g.how.map((step) => `<li>${esc(step)}</li>`).join('\n          ')}
        </ol>
      </div>

      <div class="game-card">
        <h2 class="h-sub">${esc(g.legendTitle)}</h2>
        <ul class="legend">
        ${legend}
        </ul>
      </div>

      <div class="game-card game-card--terms">
        <h2 class="h-sub">${esc(g.termsTitle)}</h2>
        <ul class="game-terms">
          ${g.terms.map((term) => `<li>${esc(term)}</li>`).join('\n          ')}
        </ul>
      </div>
    </aside>
  </div>
</section>
`;
}
