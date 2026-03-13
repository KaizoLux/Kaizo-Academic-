// ─── PLAYER SYSTEM ───────────────────────────────────────────────────────────
// Mengelola status dan data pemain

const PLAYER_COLORS  = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b'];
const PLAYER_EMOJIS  = ['🔵', '🔴', '🟢', '🟡'];
const PLAYER_TOKENS  = ['🚀', '🏎️', '✈️', '🚢'];
const PLAYER_START_MONEY = 5000;

// Buat object player baru
function createPlayer(id, username, token, colorIdx, startMoney) {
  return {
    id,
    username,
    token:    token || PLAYER_TOKENS[colorIdx] || '🚀',
    color:    PLAYER_COLORS[colorIdx] || '#3b82f6',
    colorIdx,
    money:    startMoney || PLAYER_START_MONEY,
    position: 0,
    inJail:   false,
    jailTurns: 0,   // turns spent in jail
    jailCard:  0,   // number of "get out of jail free" cards
    bankrupt:  false,
    hasRolled: false,
    startPasses: 0, // how many times passed START
  };
}

// Format uang untuk tampilan
function formatMoney(amount) {
  if (amount >= 1000) return `${(amount / 1000).toFixed(1)}k`;
  return String(amount);
}

// Render panel pemain kiri
function renderPlayerPanel(players, currentPlayerId, myId) {
  const list = document.getElementById('players-list');
  if (!list) return;

  list.innerHTML = players.map(p => {
    const isMe     = p.id === myId;
    const isActive = p.id === currentPlayerId;
    const statusIcon = p.bankrupt ? '💀' : p.inJail ? '🔒' : isActive ? '🎲' : '⏳';
    const statusText = p.bankrupt ? 'Bangkrut' : p.inJail ? `Penjara (${p.jailTurns} giliran)` : isActive ? 'Giliran ini' : 'Menunggu';

    return `
    <div class="player-card ${isActive ? 'active' : ''} ${p.inJail ? 'in-jail' : ''} ${p.bankrupt ? 'bankrupt' : ''}">
      <div class="row" style="gap:8px">
        <div class="player-token" style="background:${p.color}22;border:2px solid ${p.color}">${p.token}</div>
        <div style="flex:1;min-width:0">
          <div class="row" style="gap:6px">
            <div class="player-name-label" style="color:${p.color};overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
              ${p.username}${isMe ? ' <span style="font-size:.65rem;color:var(--text3)">(Kamu)</span>' : ''}
            </div>
          </div>
          <div class="player-money">💰 ${p.money.toLocaleString()}</div>
          <div class="player-status">${statusIcon} ${statusText}</div>
          ${p.jailCard > 0 ? `<div style="font-size:.7rem;color:var(--yellow)">🗝️ ${p.jailCard} kartu bebas</div>` : ''}
        </div>
      </div>
    </div>`;
  }).join('');

  // My countries
  renderMyCountries(myId);
}

// Render negara yang dimiliki pemain sendiri
function renderMyCountries(myId) {
  const el = document.getElementById('my-countries-list');
  if (!el || !window.GAME_STATE) return;
  const owned = (window.GAME_STATE.countries || []).filter(c => c.ownerId === myId);
  if (owned.length === 0) {
    el.innerHTML = '<div style="color:var(--text3);font-size:.8rem">Belum punya negara</div>';
    return;
  }
  el.innerHTML = owned.map(c => {
    const cd = getCountryById(c.countryId);
    if (!cd) return '';
    return `
    <div style="display:flex;align-items:center;gap:6px;padding:5px 0;border-bottom:1px solid var(--border)">
      <span>${cd.icon}</span>
      <span style="flex:1;font-size:.8rem;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${cd.name}</span>
      <span style="font-size:.72rem;color:var(--green)">${'🏠'.repeat(c.houses || 0)}</span>
    </div>`;
  }).join('');
}
