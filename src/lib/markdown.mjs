/* Mini conversor de Markdown a HTML.
   Cubre lo que usan las páginas legales: títulos, párrafos, listas,
   tablas, negrita, cursiva y enlaces. Sin dependencias externas. */

const escapeHtml = (str) =>
  str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function inline(text) {
  let out = escapeHtml(text);
  out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, label, href) => {
    const external = /^https?:\/\//.test(href) && !href.includes('tradissea.com');
    const attrs = external ? ' target="_blank" rel="noopener noreferrer"' : '';
    return `<a href="${href}"${attrs}>${label}</a>`;
  });
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/(^|[\s(])\*([^*\n]+)\*/g, '$1<em>$2</em>');
  return out;
}

function isTableRow(line) {
  return line.trim().startsWith('|') && line.trim().endsWith('|');
}

function tableCells(line) {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim());
}

export function markdownToHtml(source) {
  const lines = source.replace(/\r\n/g, '\n').split('\n');
  const html = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) { i += 1; continue; }

    // Títulos
    const heading = /^(#{2,4})\s+(.*)$/.exec(line);
    if (heading) {
      const level = heading[1].length;
      html.push(`<h${level}>${inline(heading[2].trim())}</h${level}>`);
      i += 1;
      continue;
    }

    // Tablas
    if (isTableRow(line) && isTableRow(lines[i + 1] || '') && /^[\s|:-]+$/.test(lines[i + 1])) {
      const head = tableCells(line);
      i += 2;
      const rows = [];
      while (i < lines.length && isTableRow(lines[i])) {
        rows.push(tableCells(lines[i]));
        i += 1;
      }
      html.push(
        '<div class="table-scroll"><table><thead><tr>' +
          head.map((cell) => `<th scope="col">${inline(cell)}</th>`).join('') +
          '</tr></thead><tbody>' +
          rows
            .map((row) => `<tr>${row.map((cell) => `<td>${inline(cell)}</td>`).join('')}</tr>`)
            .join('') +
          '</tbody></table></div>'
      );
      continue;
    }

    // Listas
    if (/^[-*]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        items.push(inline(lines[i].replace(/^[-*]\s+/, '').trim()));
        i += 1;
      }
      html.push(`<ul>${items.map((item) => `<li>${item}</li>`).join('')}</ul>`);
      continue;
    }

    // Citas
    if (/^>\s?/.test(line)) {
      const parts = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        parts.push(lines[i].replace(/^>\s?/, ''));
        i += 1;
      }
      html.push(`<blockquote><p>${inline(parts.join(' '))}</p></blockquote>`);
      continue;
    }

    // Párrafo
    const paragraph = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^(#{2,4})\s/.test(lines[i]) &&
      !/^[-*]\s+/.test(lines[i]) &&
      !/^>\s?/.test(lines[i]) &&
      !isTableRow(lines[i])
    ) {
      paragraph.push(lines[i].trim());
      i += 1;
    }
    html.push(`<p>${inline(paragraph.join(' '))}</p>`);
  }

  return html.join('\n');
}
