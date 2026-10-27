// Pictures for lessons and hints: dot arrays split into colored groups, and the
// fact-family triangle that ties × and ÷ together.
const GROUP = ['#ff7eb6', '#9b7bff', '#3fc6a0', '#ffb347'];
const GROUP_TEXT = ['#d23c7c', '#6a4fd6', '#16916f', '#c97a12'];

export function pictureSVG(p) {
  if (!p || p.kind === 'empty') return emptySVG();
  const { rows, cols, parts = [rows], labels = [], fade = false } = p;
  const gap = Math.max(rows, cols) > 7 ? 22 : 28;
  const r = gap * 0.36;
  const hasLabels = labels.some((l) => l !== '' && l != null);
  const labelW = hasLabels ? 92 : 0;
  const w = cols * gap + labelW + 8;
  const ht = rows * gap + 8;
  let out = '';
  let row = 0;
  parts.forEach((n, gi) => {
    const faded = fade && gi === parts.length - 1;
    const color = faded ? '#ddd5ee' : GROUP[gi % GROUP.length];
    for (let k = 0; k < n; k++, row++) {
      for (let c = 0; c < cols; c++) {
        out += `<circle cx="${4 + c * gap + gap / 2}" cy="${4 + row * gap + gap / 2}" r="${r}" fill="${color}"${faded ? ' stroke="#b7acd0" stroke-width="1.5" stroke-dasharray="3 2"' : ''}/>`;
      }
    }
    if (hasLabels) {
      const y0 = 4 + (row - n) * gap + 4;
      const y1 = 4 + row * gap - 4;
      const x = 4 + cols * gap + 6;
      out += `<path d="M${x} ${y0} q7 0 7 7 V${y1 - 7} q0 7 -7 7" fill="none" stroke="${faded ? '#b7acd0' : color}" stroke-width="3" stroke-linecap="round"/>`;
      if (labels[gi] !== '' && labels[gi] != null) {
        out += `<text x="${x + 16}" y="${(y0 + y1) / 2 + 8}" font-size="24" font-weight="600" fill="${faded ? '#9a8fb5' : GROUP_TEXT[gi % GROUP.length]}">${labels[gi]}</text>`;
      }
    }
  });
  return `<svg class="picture" viewBox="0 0 ${w} ${ht}" role="img" aria-label="${rows} rows of ${cols} dots">${out}</svg>`;
}

function emptySVG() {
  return `<svg class="picture" viewBox="0 0 220 120" role="img" aria-label="an empty basket">
    <path d="M30 50 h160 l-18 56 h-124 z" fill="#fff7fd" stroke="#c9b6ff" stroke-width="5" stroke-linejoin="round" stroke-dasharray="10 8"/>
    <text x="110" y="92" text-anchor="middle" font-size="26" font-weight="600" fill="#9a8fb5">empty!</text>
  </svg>`;
}

export function triangleSVG(a, b, p) {
  const num = (x, y, n, fill) => `<circle cx="${x}" cy="${y}" r="27" fill="${fill}"/><text x="${x}" y="${y + 10}" text-anchor="middle" font-size="28" font-weight="700" fill="#fff">${n}</text>`;
  return `<svg class="picture triangle" viewBox="0 0 210 180" role="img" aria-label="fact family ${a}, ${b} and ${p}">
    <path d="M105 30 L178 150 L32 150 Z" fill="#fff7fd" stroke="#d9c9ff" stroke-width="7" stroke-linejoin="round"/>
    <text x="105" y="122" text-anchor="middle" font-size="26" font-weight="600" fill="#8a76b8">× ÷</text>
    ${num(105, 32, p, '#ff7eb6')}${num(36, 148, a, '#9b7bff')}${num(174, 148, b, '#3fc6a0')}
  </svg>`;
}
