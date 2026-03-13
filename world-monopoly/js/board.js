// ─── BOARD SYSTEM ────────────────────────────────────────────────────────────
// Membuat dan merender papan monopoli 10x10

// Definisi 32 tile board (termasuk corner)
// Board layout: 
//   Row 0: tiles 0-9 (bottom row, left to right)
//   Right col: tiles 10-19 (bottom to top)
//   Row 9: tiles 20-29 (top row, right to left)
//   Left col: tiles 30-31 (top to bottom) + back

const BOARD_TILES = [
  // Bottom row left to right (index 0-9)
  { type:'start',    name:'START',          icon:'🏁', special:true },   // 0 - corner
  { type:'country',  countryId:'indonesia', name:'Indonesia',    icon:'🇮🇩' }, // 1
  { type:'country',  countryId:'saudi',     name:'Saudi Arabia', icon:'🇸🇦' }, // 2
  { type:'community',name:'Community',      icon:'📦' },                // 3
  { type:'country',  countryId:'canada',    name:'Canada',       icon:'🇨🇦' }, // 4
  { type:'country',  countryId:'thailand',  name:'Thailand',     icon:'🇹🇭' }, // 5
  { type:'chance',   name:'Chance',         icon:'❓' },                // 6
  { type:'country',  countryId:'southkorea',name:'S. Korea',     icon:'🇰🇷' }, // 7
  { type:'tax',      name:'Pajak 150',      icon:'💸', amount:150 },    // 8
  { type:'jail',     name:'Penjara',        icon:'🔒', special:true },   // 9 - corner

  // Right col bottom to top (index 10-19)
  { type:'country',  countryId:'australia', name:'Australia',    icon:'🇦🇺' }, // 10
  { type:'country',  countryId:'egypt',     name:'Egypt',        icon:'🇪🇬' }, // 11
  { type:'community',name:'Community',      icon:'📦' },                // 12
  { type:'country',  countryId:'mexico',    name:'Mexico',       icon:'🇲🇽' }, // 13
  { type:'country',  countryId:'russia',    name:'Russia',       icon:'🇷🇺' }, // 14
  { type:'chance',   name:'Chance',         icon:'❓' },                // 15
  { type:'country',  countryId:'turkey',    name:'Turkey',       icon:'🇹🇷' }, // 16
  { type:'country',  countryId:'spain',     name:'Spain',        icon:'🇪🇸' }, // 17
  { type:'tax',      name:'Pajak 200',      icon:'💸', amount:200 },    // 18
  { type:'parking',  name:'Free Park',      icon:'🅿️', special:true }, // 19 - corner

  // Top row right to left (index 20-29)
  { type:'country',  countryId:'italy',     name:'Italy',        icon:'🇮🇹' }, // 20
  { type:'country',  countryId:'germany',   name:'Germany',      icon:'🇩🇪' }, // 21
  { type:'community',name:'Community',      icon:'📦' },                // 22
  { type:'country',  countryId:'indonesia', name:'Indonesia',    icon:'🇮🇩' }, // -- reuse slot
  { type:'country',  countryId:'brazil',    name:'Brazil',       icon:'🇧🇷' }, // 23
  { type:'chance',   name:'Chance',         icon:'❓' },                // 24
  { type:'country',  countryId:'india',     name:'India',        icon:'🇮🇳' }, // 25
  { type:'country',  countryId:'china',     name:'China',        icon:'🇨🇳' }, // 26
  { type:'country',  countryId:'uk',        name:'UK',           icon:'🇬🇧' }, // 27
  { type:'gotojail', name:'Go to Jail',     icon:'⛓️', special:true }, // 28 - corner

  // Left col top to bottom (index 29-31)
  { type:'country',  countryId:'japan',     name:'Japan',        icon:'🇯🇵' }, // 29
  { type:'country',  countryId:'france',    name:'France',       icon:'🇫🇷' }, // 30
  { type:'country',  countryId:'usa',       name:'USA',          icon:'🇺🇸' }, // 31
];

// Actual board: re-define to match exact 10x10 grid positions
// Positions 0..31 around the board
const BOARD = (() => {
  // We want 32 tiles: 4 corners + 7 tiles each side = 4 + 28 = 32
  return [
    // Bottom-left corner (0) → bottom row → bottom-right corner (8)
    { type:'start',    name:'START',          icon:'🏁',  special:true },              // 0
    { type:'country',  countryId:'indonesia', name:'Indonesia',    icon:'🇮🇩' },        // 1
    { type:'country',  countryId:'saudi',     name:'Saudi Arabia', icon:'🇸🇦' },        // 2
    { type:'community',name:'Community',      icon:'📦' },                              // 3
    { type:'country',  countryId:'canada',    name:'Canada',       icon:'🇨🇦' },        // 4
    { type:'country',  countryId:'thailand',  name:'Thailand',     icon:'🇹🇭' },        // 5
    { type:'chance',   name:'Chance',         icon:'❓' },                              // 6
    { type:'country',  countryId:'southkorea',name:'S.Korea',      icon:'🇰🇷' },        // 7
    { type:'jail',     name:'Penjara',        icon:'🔒',  special:true },               // 8

    // Right col bottom to top
    { type:'country',  countryId:'australia', name:'Australia',    icon:'🇦🇺' },        // 9
    { type:'country',  countryId:'egypt',     name:'Egypt',        icon:'🇪🇬' },        // 10
    { type:'community',name:'Community',      icon:'📦' },                              // 11
    { type:'country',  countryId:'mexico',    name:'Mexico',       icon:'🇲🇽' },        // 12
    { type:'country',  countryId:'russia',    name:'Russia',       icon:'🇷🇺' },        // 13
    { type:'chance',   name:'Chance',         icon:'❓' },                              // 14
    { type:'country',  countryId:'turkey',    name:'Turkey',       icon:'🇹🇷' },        // 15
    { type:'parking',  name:'Free Parking',   icon:'🅿️', special:true },              // 16

    // Top row right to left
    { type:'country',  countryId:'spain',     name:'Spain',        icon:'🇪🇸' },        // 17
    { type:'country',  countryId:'italy',     name:'Italy',        icon:'🇮🇹' },        // 18
    { type:'tax',      name:'Pajak 150',      icon:'💸',  amount:150 },                // 19
    { type:'country',  countryId:'germany',   name:'Germany',      icon:'🇩🇪' },        // 20
    { type:'country',  countryId:'brazil',    name:'Brazil',       icon:'🇧🇷' },        // 21
    { type:'community',name:'Community',      icon:'📦' },                              // 22
    { type:'country',  countryId:'india',     name:'India',        icon:'🇮🇳' },        // 23
    { type:'gotojail', name:'Go to Jail',     icon:'⛓️', special:true },              // 24

    // Left col top to bottom
    { type:'country',  countryId:'china',     name:'China',        icon:'🇨🇳' },        // 25
    { type:'country',  countryId:'uk',        name:'UK',           icon:'🇬🇧' },        // 26
    { type:'chance',   name:'Chance',         icon:'❓' },                              // 27
    { type:'country',  countryId:'japan',     name:'Japan',        icon:'🇯🇵' },        // 28
    { type:'country',  countryId:'france',    name:'France',       icon:'🇫🇷' },        // 29
    { type:'tax',      name:'Pajak 200',      icon:'💸',  amount:200 },                // 30
    { type:'country',  countryId:'usa',       name:'USA',          icon:'🇺🇸' },        // 31
  ];
})();

const BOARD_SIZE = BOARD.length; // 32

// ─── GRID MAPPING ──────────────────────────────────────────────────────────
// Maps board position (0..31) to CSS grid [row, col] (1-indexed, 10x10 grid)
function getBoardGridPos(pos) {
  // Bottom row (0..8): row=10, col=1..9
  if (pos <= 8)  return [10, pos + 1];
  // Right col (9..15): row=9..3, col=10
  if (pos <= 15) return [10 - (pos - 8), 10];
  // Top row (16..24): row=1 col=9..1
  if (pos <= 24) return [1, 10 - (pos - 16)];
  // Left col (25..31): row=2..8, col=1
  return [pos - 23, 1];
}

// ─── BOARD RENDERING ──────────────────────────────────────────────────────
const Board = {
  _tileElements: {},

  init() {
    this.render();
  },

  render() {
    const board = document.getElementById('monopoly-board');
    if (!board) return;

    // Clear
    board.innerHTML = '';

    // Center piece
    const center = document.createElement('div');
    center.className = 'board-center';
    center.style.gridRow = '2 / 10';
    center.style.gridColumn = '2 / 10';
    center.innerHTML = `
      <div class="board-center-globe">🌍</div>
      <div class="board-center-title">WORLD<br>MONOPOLY</div>
      <div style="font-size:.7rem;color:var(--text3);margin-top:4px;letter-spacing:1px;text-transform:uppercase">Kuasai Dunia</div>`;
    board.appendChild(center);

    // Render tiles
    BOARD.forEach((tile, pos) => {
      const [row, col] = getBoardGridPos(pos);
      const el = this._createTile(tile, pos);
      el.style.gridRow  = row;
      el.style.gridColumn = col;
      board.appendChild(el);
      this._tileElements[pos] = el;
    });
  },

  _createTile(tile, pos) {
    const el = document.createElement('div');
    el.className = `tile${tile.special ? ' tile-corner' : ''}`;
    el.dataset.pos = pos;

    // Color bar for countries
    const cd = tile.countryId ? getCountryById(tile.countryId) : null;
    const color = cd ? cd.color : null;

    let html = '';
    if (color) {
      html += `<div class="tile-color-bar" style="background:${color}"></div>`;
    }
    html += `<div class="tile-icon">${tile.icon}</div>`;
    html += `<div class="tile-name">${tile.name}</div>`;

    if (tile.type === 'country' && cd) {
      html += `<div class="tile-price">${cd.price}</div>`;
    } else if (tile.type === 'tax') {
      html += `<div class="tile-price">-${tile.amount}</div>`;
    }

    // Tooltip
    html += `<div class="tile-info" id="tile-info-${pos}">
      <div class="tile-info-name">${tile.name}</div>
      ${cd ? `<div class="tile-info-row">💰 Harga: ${cd.price}</div>
              <div class="tile-info-row">🏠 Denda dasar: ${cd.rent}</div>
              <div class="tile-info-row">📍 Landmark: ${cd.landmark}</div>` : ''}
      ${tile.type === 'tax' ? `<div class="tile-info-row">💸 Bayar: ${tile.amount}</div>` : ''}
    </div>`;

    el.innerHTML = html;

    // Click handler
    el.addEventListener('click', () => {
      if (window.GAME && typeof window.GAME.onTileClick === 'function') {
        window.GAME.onTileClick(pos, tile);
      }
    });

    return el;
  },

  // Update tile display (owner dot, houses)
  updateTile(pos, ownership) {
    const el = this._tileElements[pos];
    if (!el) return;

    // Remove old dots/houses
    el.querySelectorAll('.tile-owner-dot, .tile-houses').forEach(e => e.remove());

    if (ownership && ownership.ownerId) {
      // Owner color dot
      const dot = document.createElement('div');
      dot.className = 'tile-owner-dot';
      dot.style.background = ownership.ownerColor || '#fff';
      el.appendChild(dot);

      // Houses
      if (ownership.houses > 0) {
        const housesEl = document.createElement('div');
        housesEl.className = 'tile-houses';
        for (let i = 0; i < ownership.houses; i++) {
          const h = document.createElement('div');
          h.className = 'tile-house';
          housesEl.appendChild(h);
        }
        el.appendChild(housesEl);
      }
    }
  },

  // Update all tokens on board
  updateTokens(players) {
    // Remove all existing tokens
    document.querySelectorAll('.token-on-tile').forEach(t => t.remove());

    // Group players by position
    const byPos = {};
    players.forEach(p => {
      if (p.bankrupt) return;
      if (!byPos[p.position]) byPos[p.position] = [];
      byPos[p.position].push(p);
    });

    // Place tokens
    Object.entries(byPos).forEach(([pos, pList]) => {
      const el = this._tileElements[parseInt(pos)];
      if (!el) return;
      pList.forEach((p, idx) => {
        const token = document.createElement('div');
        token.className = 'token-on-tile';
        token.style.background = p.color;
        token.style.zIndex = 10 + idx;
        // Offset multiple tokens
        token.style.top  = (4 + idx * 10) + 'px';
        token.style.right = (4 + idx * 8) + 'px';
        token.textContent = p.token;
        token.title = p.username;
        el.appendChild(token);
      });
    });
  },

  // Highlight a tile briefly (landing effect)
  highlight(pos) {
    const el = this._tileElements[pos];
    if (!el) return;
    el.style.boxShadow = '0 0 0 3px var(--primary), 0 0 20px rgba(59,130,246,.6)';
    el.style.zIndex = '20';
    setTimeout(() => {
      el.style.boxShadow = '';
      el.style.zIndex    = '';
    }, 1200);
  },
};
