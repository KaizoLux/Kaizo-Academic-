// ─── GAME ENGINE ─────────────────────────────────────────────────────────────
// Core game logic: turns, movement, economy, actions

const GAME = {
  // ─── STATE ──────────────────────────────────────────────────────────────
  players: [],
  countries: [],          // array of { countryId, ownerId, ownerColor, houses }
  currentTurnId: null,
  turnOrder: [],
  turnNumber: 1,
  roomId: null,
  myId: null,
  config: { startingMoney: 5000, startBonus: 300 },
  BOARD: null,
  BOARD_SIZE: 0,
  _rolling: false,        // anti-double-roll guard
  _actionPending: false,  // prevent concurrent actions
  _subs: [],

  // ─── INIT ──────────────────────────────────────────────────────────────
  async init() {
    document.getElementById('loading-msg').textContent = 'Memuat game...';

    // Load room & player info from localStorage
    const roomRaw   = localStorage.getItem('wm_room');
    const playerRaw = localStorage.getItem('wm_player');

    if (!roomRaw || !playerRaw) {
      this._showError('Sesi tidak ditemukan. Kembali ke lobby.');
      return;
    }

    // Init Supabase DULU sebelum apapun
    await MP.init();

    this.myId = MP.getMyId();

    // Kalau myId masih null, ambil dari localStorage sebagai fallback
    if (!this.myId) {
      try {
        const p = JSON.parse(playerRaw);
        this.myId = p.id || p.name;
      } catch(e) {}
    }

    const room = JSON.parse(roomRaw);
    this.roomId = room.id;
    this.config = room.config ? (typeof room.config === 'string' ? JSON.parse(room.config) : room.config) : this.config;

    // Load players
    const rawPlayers = await MP.getRoomPlayers(this.roomId);
    this.players = rawPlayers.map((p, idx) => ({
      id:        p.id,
      username:  p.username,
      token:     p.token || PLAYER_TOKENS[idx] || '🚀',
      color:     p.color || PLAYER_COLORS[idx],
      colorIdx:  p.color_idx || idx,
      money:     p.money || this.config.startingMoney || 5000,
      position:  p.position || 0,
      inJail:    p.in_jail || false,
      jailTurns: p.jail_turns || 0,
      jailCard:  p.jail_card || 0,
      bankrupt:  p.bankrupt || false,
      hasRolled: false,
      startPasses: p.start_passes || 0,
    }));

    // Load game state
    const gs = await MP.getGameState(this.roomId);
    if (gs) {
      this.currentTurnId = gs.current_turn;
      this.turnOrder     = gs.turn_order ? (typeof gs.turn_order === 'string' ? JSON.parse(gs.turn_order) : gs.turn_order) : this.players.map(p => p.id);
      this.turnNumber    = gs.turn_number || 1;
    } else {
      this.turnOrder = this.players.map(p => p.id);
      this.currentTurnId = this.turnOrder[0];
    }

    // Load countries ownership
    const rawCountries = await MP.getCountries(this.roomId);
    this.countries = rawCountries.map(c => ({
      countryId:  c.country_id,
      ownerId:    c.owner_id,
      ownerColor: c.owner_color,
      houses:     c.houses || 0,
    }));

    // ── Set global for player panel renderer
    window.GAME_STATE = { players: this.players, countries: this.countries };

    // ── Render board & initial state
    Board.init();
    this._refreshAll();
    this._updateHeader();

    // ── Init chat
    const me = this._getMe();
    if (me) Chat.init(this.roomId, me.username, me.color);

    // ── Init voice
    Voice.init(this.roomId, this.myId);

    // ── Subscribe to realtime updates
    this._subscribe();

    // ── Show game
    document.getElementById('loading-screen').style.display = 'none';
    document.getElementById('game-layout').style.display    = 'grid';
    document.getElementById('header-room-code').textContent = room.room_code;

    // ── Button listeners
    document.getElementById('btn-roll').addEventListener('click', () => this.rollDice());
    document.getElementById('btn-end-turn').addEventListener('click', () => this.endTurn());
    document.getElementById('btn-rules').addEventListener('click', () => {
      document.getElementById('rules-modal').style.display = 'flex';
    });
    document.getElementById('btn-resign').addEventListener('click', () => this._resign());

    // ── Update roll button state
    this._updateControls();

    toast(`🎮 Game dimulai! ${this.players.length} pemain bergabung.`, 'success');
    if (this.currentTurnId === this.myId) {
      toast('🎲 Giliran kamu! Lempar dadu!', 'info');
    }
  },

  // ─── DICE ROLL ────────────────────────────────────────────────────────
  async rollDice() {
    if (this._rolling || this._actionPending) return;
    if (this.currentTurnId !== this.myId) { toast('Bukan giliran kamu!', 'error'); return; }

    const me = this._getMe();
    if (!me || me.bankrupt) return;
    if (me.hasRolled) { toast('Kamu sudah melempar dadu!', 'error'); return; }

    this._rolling = true;
    const btn = document.getElementById('btn-roll');
    if (btn) btn.disabled = true;

    const el1 = document.getElementById('die1');
    const el2 = document.getElementById('die2');
    const { d1, d2, total } = await Dice.rollWithAnimation(el1, el2);

    me.hasRolled = true;

    // Save dice result
    await MP.updateGameState(this.roomId, { dice_result: JSON.stringify({ d1, d2, total }) });
    this._refreshAll();

    // Handle jail
    if (me.inJail) {
      await this._handleJailTurn(me, d1, d2, total);
    } else {
      await this._movePlayer(me, total);
    }

    this._rolling = false;
    this._updateControls();
  },

  // ─── JAIL LOGIC ───────────────────────────────────────────────────────
  async _handleJailTurn(player, d1, d2, total) {
    // Can escape if doubles or has jail card
    if (d1 === d2) {
      player.inJail    = false;
      player.jailTurns = 0;
      Chat.system(`${player.username} keluar penjara dengan double!`);
      toast('🎉 Double! Kamu bebas dari penjara!', 'success');
      await this._movePlayer(player, total);
    } else if (player.jailCard > 0) {
      // Offer to use jail card
      this._showJailCardOffer(player, total);
    } else {
      player.jailTurns++;
      if (player.jailTurns >= 3) {
        // Force out after 3 turns, pay fine
        player.inJail    = false;
        player.jailTurns = 0;
        this.transferMoney(player.id, null, 150);
        toast('💸 3 giliran di penjara! Bayar denda 150 dan keluar.', 'info');
        await this._movePlayer(player, total);
      } else {
        toast(`🔒 Masih di penjara (giliran ${player.jailTurns}/3). Tidak bisa dadu kamu.`, 'info');
        await this._syncPlayer(player);
        // Show end turn
        document.getElementById('btn-end-turn').style.display = 'flex';
        document.getElementById('btn-end-turn').disabled = false;
      }
    }
  },

  _showJailCardOffer(player, diceTotal) {
    showActionModal(
      '🗝️ Kartu Keluar Penjara',
      `Kamu punya ${player.jailCard} kartu keluar penjara. Gunakan sekarang?`,
      [
        { label: 'Gunakan Kartu', cls: 'btn-success', fn: async () => {
          player.jailCard--;
          player.inJail    = false;
          player.jailTurns = 0;
          closeActionModal();
          Chat.system(`${player.username} menggunakan kartu keluar penjara!`);
          await this._movePlayer(player, diceTotal);
          this._updateControls();
        }},
        { label: 'Tetap di Penjara', cls: 'btn-ghost', fn: async () => {
          player.jailTurns++;
          closeActionModal();
          await this._syncPlayer(player);
          document.getElementById('btn-end-turn').style.display = 'flex';
          document.getElementById('btn-end-turn').disabled = false;
          this._updateControls();
        }},
      ]
    );
  },

  // ─── MOVEMENT ─────────────────────────────────────────────────────────
  async _movePlayer(player, steps) {
    if (typeof steps !== 'number' || steps <= 0) return;

    const oldPos = player.position;
    let newPos   = (oldPos + steps) % this.BOARD_SIZE;

    // Check if passed START (position wrapped around)
    const passedStart = newPos < oldPos || (oldPos + steps) >= this.BOARD_SIZE;
    if (passedStart && !player.bankrupt) {
      this.grantStartBonus(player.id);
      player.startPasses++;
      Chat.system(`${player.username} melewati START! +${this.config.startBonus || 300}`);
    }

    player.position = newPos;
    await this._syncPlayer(player);

    Board.updateTokens(this.players);
    Board.highlight(newPos);

    // Trigger tile action
    const tile = this.BOARD[newPos];
    await this._onLand(player, tile, newPos);

    this._refreshAll();
  },

  // Move to specific position (from cards)
  async _movePlayerTo(player, pos) {
    const oldPos = player.position;
    const passedStart = pos < oldPos;
    if (passedStart) {
      this.grantStartBonus(player.id);
      Chat.system(`${player.username} melewati START! +${this.config.startBonus || 300}`);
    }
    player.position = pos;
    await this._syncPlayer(player);
    Board.updateTokens(this.players);
    Board.highlight(pos);
    await this._onLand(player, this.BOARD[pos], pos);
    this._refreshAll();
  },

  // ─── LAND ON TILE ─────────────────────────────────────────────────────
  async _onLand(player, tile, pos) {
    if (!tile) return;
    this._actionPending = true;

    switch(tile.type) {
      case 'country':   await this._handleCountry(player, tile); break;
      case 'chance':    await this._handleChance(player); break;
      case 'community': await this._handleCommunity(player); break;
      case 'tax':       await this._handleTax(player, tile); break;
      case 'gotojail':  await this._handleGoToJail(player); break;
      case 'jail':      /* just visiting */ break;
      case 'parking':   /* free rest */
        toast('🅿️ Free Parking! Istirahat gratis.', 'info');
        break;
      case 'start':     /* already handled start bonus */ break;
    }

    this._actionPending = false;
    document.getElementById('btn-end-turn').style.display = 'flex';
    document.getElementById('btn-end-turn').disabled = false;
  },

  // ─── COUNTRY TILE ─────────────────────────────────────────────────────
  async _handleCountry(player, tile) {
    const cd = getCountryById(tile.countryId);
    if (!cd) return;

    const ownership = this._getOwnership(tile.countryId);

    if (!ownership) {
      // No owner – offer to buy
      if (player.id === this.myId) {
        await this._offerBuy(player, cd);
      } else {
        // AI/other player auto-buy if enough money (simple logic)
        if (player.money >= cd.price) {
          await this._buyCountry(player, cd);
          toast(`🌍 ${player.username} membeli ${cd.name}!`, 'info');
        }
      }
    } else if (ownership.ownerId === player.id) {
      // Own country – offer to build houses
      if (player.id === this.myId) {
        this._offerBuildHouse(player, cd, ownership);
      } else {
        toast(`🏠 ${player.username} berhenti di negaranya sendiri: ${cd.name}`, 'info');
      }
    } else {
      // Other player's country – pay rent
      await this._payRent(player, cd, ownership);
    }
  },

  _offerBuy(player, cd) {
    return new Promise((resolve) => {
      const canAfford = player.money >= cd.price;
      showActionModal(
        `🌍 Beli ${cd.name}?`,
        ``,
        [
          { label: `💰 Beli (${cd.price})`, cls: canAfford ? 'btn-primary' : 'btn-ghost', disabled: !canAfford, fn: async () => {
            closeActionModal();
            await this._buyCountry(player, cd);
            Chat.system(`${player.username} membeli ${cd.name}!`);
            resolve();
          }},
          { label: 'Lewati', cls: 'btn-ghost', fn: () => { closeActionModal(); resolve(); }},
        ],
        `<div class="country-info">
          <div class="country-info-icon">${cd.icon}</div>
          <div class="country-info-name">${cd.name}</div>
          <div class="country-info-lm">🏛️ ${cd.landmark}</div>
          <div class="country-info-grid">
            <div class="country-info-stat">
              <div class="country-info-stat-n">${cd.price}</div>
              <div class="country-info-stat-l">Harga Beli</div>
            </div>
            <div class="country-info-stat">
              <div class="country-info-stat-n">${cd.rent}</div>
              <div class="country-info-stat-l">Denda Dasar</div>
            </div>
            <div class="country-info-stat">
              <div class="country-info-stat-n">${cd.houseCost}</div>
              <div class="country-info-stat-l">Biaya/Rumah</div>
            </div>
            <div class="country-info-stat">
              <div class="country-info-stat-n">${getCountryRent(cd,5)}</div>
              <div class="country-info-stat-l">Denda Max</div>
            </div>
          </div>
          <div style="margin-top:12px">
            <div style="font-size:.72rem;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Tabel Denda</div>
            ${Houses.renderHouseInfo(cd, 0)}
          </div>
          <div style="margin-top:12px;padding:10px;background:var(--bg3);border-radius:8px;font-size:.82rem">
            Uang kamu: <span style="font-family:var(--mono);color:${player.money>=cd.price?'var(--green)':'var(--red)'}">${player.money.toLocaleString()}</span>
          </div>
        </div>`
      );
    });
  },

  _offerBuildHouse(player, cd, ownership) {
    const currentHouses = ownership.houses || 0;
    if (currentHouses >= Houses.MAX_HOUSES) {
      toast(`🏠 ${cd.name} sudah memiliki ${Houses.MAX_HOUSES} rumah (maksimum)!`, 'info');
      return;
    }

    const btns = [];
    for (let n = 1; n <= Houses.MAX_HOUSES - currentHouses; n++) {
      const cost = cd.houseCost * n;
      const canAfford = player.money >= cost;
      btns.push({
        label: `+${n} Rumah (${cost})`,
        cls: canAfford ? 'btn-success' : 'btn-ghost',
        disabled: !canAfford,
        fn: async () => {
          closeActionModal();
          await this._buildHouses(player, cd, ownership, n);
        },
      });
    }
    btns.push({ label: 'Tidak sekarang', cls: 'btn-ghost', fn: () => closeActionModal() });

    showActionModal(
      `🏠 Bangun Rumah di ${cd.name}`,
      `Saat ini: ${currentHouses} rumah | Sewa saat ini: ${getCountryRent(cd, currentHouses)}`,
      btns,
      `<div class="country-info">
        ${Houses.renderHouseInfo(cd, currentHouses)}
        <div style="margin-top:10px;font-size:.82rem">
          Uang kamu: <span style="font-family:var(--mono);color:var(--green)">${player.money.toLocaleString()}</span>
        </div>
      </div>`
    );
  },

  async _buyCountry(player, cd) {
    this.transferMoney(player.id, null, cd.price);
    const ownership = { countryId: cd.id, ownerId: player.id, ownerColor: player.color, houses: 0 };
    this.countries.push(ownership);
    await this._syncPlayer(player);
    await MP.buyCountry(this.roomId, cd.id, player.id, player.color);
    Board.updateTile(player.position, ownership);
    window.GAME_STATE.countries = this.countries;
    renderMyCountries(this.myId);
    this._refreshAll();
    toast(`✅ Berhasil membeli ${cd.name}!`, 'success');
  },

  async _buildHouses(player, cd, ownership, count) {
    const cost = cd.houseCost * count;
    const check = Houses.canBuild(player, cd, ownership, count);
    if (!check.ok) { toast(check.reason, 'error'); return; }

    this.transferMoney(player.id, null, cost);
    ownership.houses = (ownership.houses || 0) + count;

    await this._syncPlayer(player);
    await MP.updateCountryHouses(this.roomId, cd.id, ownership.houses);
    Board.updateTile(player.position, ownership);
    this._refreshAll();
    Chat.system(`${player.username} membangun ${count} rumah di ${cd.name}! (${ownership.houses} total)`);
    toast(`🏠 +${count} rumah di ${cd.name}!`, 'success');
  },

  async _payRent(player, cd, ownership) {
    const rent = getCountryRent(cd, ownership.houses || 0);
    const owner = this._getPlayer(ownership.ownerId);
    if (!owner || owner.bankrupt) return;

    const actualRent = Math.min(rent, player.money); // Cap at player's money
    this.transferMoney(player.id, owner.id, actualRent);

    await this._syncPlayer(player);
    await this._syncPlayer(owner);

    Chat.system(`${player.username} bayar denda ${actualRent} ke ${owner.username} (${cd.name})`);
    toast(`💸 Bayar denda ${actualRent} ke ${owner.username}!`, 'error');

    // Check bankruptcy
    if (player.money <= 0) {
      await this._declareBankruptcy(player);
    }
    this._refreshAll();
  },

  // ─── CHANCE CARD ──────────────────────────────────────────────────────
  async _handleChance(player) {
    const card = drawChanceCard();
    let result = card.apply(player, this);

    await new Promise((resolve) => {
      showActionModal(
        '❓ Kartu Chance!',
        '',
        [{ label: 'OK', cls: 'btn-yellow', fn: async () => {
          closeActionModal();
          if (result.type === 'drawagain') {
            await this._handleChance(player);
          } else if (result.type === 'move') {
            await this._movePlayerTo(player, result.newPos);
          } else if (result.type === 'jail') {
            await this.sendToJail(player.id);
          } else {
            await this._syncPlayer(player);
            this._refreshAll();
          }
          resolve();
        }}],
        `<div class="card-display chance">
          <div class="card-icon">${card.icon}</div>
          <div class="card-text">${card.text}</div>
          ${result.amount !== undefined ? `<div style="margin-top:10px;font-size:1.2rem;font-weight:800;font-family:var(--mono);color:${result.amount>=0?'var(--green)':'var(--red)'}">${result.amount >= 0 ? '+' : ''}${result.amount}</div>` : ''}
        </div>`
      );
    });
    Chat.system(`${player.username} dapat kartu Chance: ${card.text}`);
  },

  // ─── COMMUNITY CHEST ──────────────────────────────────────────────────
  async _handleCommunity(player) {
    const card = drawCommunityCard();
    let result = card.apply(player, this);

    await new Promise((resolve) => {
      showActionModal(
        '📦 Community Chest!',
        '',
        [{ label: 'OK', cls: 'btn-purple', fn: async () => {
          closeActionModal();
          if (result.type === 'drawagain') {
            await this._handleCommunity(player);
          } else if (result.type === 'move') {
            await this._movePlayerTo(player, result.newPos);
          } else if (result.type === 'jail') {
            await this.sendToJail(player.id);
          } else {
            await this._syncPlayer(player);
            this._refreshAll();
          }
          resolve();
        }}],
        `<div class="card-display community">
          <div class="card-icon">${card.icon}</div>
          <div class="card-text">${card.text}</div>
          ${result.amount !== undefined ? `<div style="margin-top:10px;font-size:1.2rem;font-weight:800;font-family:var(--mono);color:${result.amount>=0?'var(--green)':'var(--red)'}">${result.amount >= 0 ? '+' : ''}${result.amount}</div>` : ''}
        </div>`
      );
    });
    Chat.system(`${player.username} dapat Community Chest: ${card.text}`);
  },

  // ─── TAX ──────────────────────────────────────────────────────────────
  async _handleTax(player, tile) {
    const amount = tile.amount || 150;
    this.transferMoney(player.id, null, amount);
    await this._syncPlayer(player);
    Chat.system(`${player.username} membayar pajak ${amount}`);
    toast(`💸 Pajak! Bayar ${amount}.`, 'error');
    if (player.money <= 0) await this._declareBankruptcy(player);
    this._refreshAll();
  },

  // ─── GO TO JAIL ───────────────────────────────────────────────────────
  async _handleGoToJail(player) {
    await this.sendToJail(player.id);
    toast('⛓️ Go to Jail! Langsung ke penjara!', 'error');
    Chat.system(`${player.username} masuk penjara!`);
  },

  async sendToJail(playerId) {
    const player = this._getPlayer(playerId);
    if (!player) return;
    // Jail tile is position 8
    const jailPos = this.BOARD.findIndex(t => t.type === 'jail');
    player.position  = jailPos >= 0 ? jailPos : 8;
    player.inJail    = true;
    player.jailTurns = 0;
    await this._syncPlayer(player);
    Board.updateTokens(this.players);
    this._refreshAll();
  },

  // ─── ECONOMY ──────────────────────────────────────────────────────────
  // Transfer money: fromId null = bank, toId null = bank
  transferMoney(fromId, toId, amount) {
    if (amount <= 0) return;
    if (fromId) {
      const from = this._getPlayer(fromId);
      if (from) from.money = Math.max(0, from.money - amount);
    }
    if (toId) {
      const to = this._getPlayer(toId);
      if (to) to.money += amount;
    }
    // Update money display
    const me = this._getMe();
    if (me) {
      document.getElementById('my-money').textContent = `💰 ${me.money.toLocaleString()}`;
    }
  },

  grantStartBonus(playerId) {
    const bonus = this.config.startBonus || 300;
    this.transferMoney(null, playerId, bonus);
  },

  // ─── BANKRUPTCY ───────────────────────────────────────────────────────
  async _declareBankruptcy(player) {
    player.bankrupt = true;
    player.money    = 0;

    // Transfer all countries to bank (remove ownership)
    this.countries = this.countries.filter(c => c.ownerId !== player.id);

    await this._syncPlayer(player);
    Chat.system(`💀 ${player.username} bangkrut!`);
    toast(`💀 ${player.username} bangkrut!`, 'error');

    // Update board
    Board.updateTokens(this.players);
    this._refreshAll();

    // Check win condition
    this._checkWinner();
  },

  _checkWinner() {
    const alive = this.players.filter(p => !p.bankrupt);
    if (alive.length === 1) {
      this._showWinner(alive[0]);
    } else if (alive.length === 0) {
      this._showWinner(null);
    }
  },

  _showWinner(player) {
    const screen = document.getElementById('winner-screen');
    if (!screen) return;
    if (player) {
      document.getElementById('winner-emoji').textContent = '🏆';
      document.getElementById('winner-name').textContent  = player.username;
      document.getElementById('winner-money').textContent = `💰 ${player.money.toLocaleString()}`;
    } else {
      document.getElementById('winner-emoji').textContent = '🤝';
      document.getElementById('winner-name').textContent  = 'Seri!';
      document.getElementById('winner-money').textContent  = '';
    }
    screen.style.display = 'flex';
    Chat.system(`🏆 ${player ? player.username + ' menang!' : 'Permainan berakhir seri!'}`);
  },

  // ─── END TURN ─────────────────────────────────────────────────────────
  async endTurn() {
    if (this.currentTurnId !== this.myId) return;
    if (this._actionPending) return;

    const me = this._getMe();
    if (me) me.hasRolled = false;

    // Advance turn
    const currentIdx = this.turnOrder.indexOf(this.currentTurnId);
    let nextIdx = (currentIdx + 1) % this.turnOrder.length;

    // Skip bankrupt players
    let tries = 0;
    while (this.players.find(p => p.id === this.turnOrder[nextIdx])?.bankrupt && tries < this.turnOrder.length) {
      nextIdx = (nextIdx + 1) % this.turnOrder.length;
      tries++;
    }

    this.currentTurnId = this.turnOrder[nextIdx];
    this.turnNumber++;

    await MP.updateGameState(this.roomId, {
      current_turn: this.currentTurnId,
      turn_number:  this.turnNumber,
    });

    // Jail release check: if all players have passed START this round
    // Simple implementation: release jail after 3 turns (handled in handleJailTurn)

    document.getElementById('btn-end-turn').style.display = 'none';
    this._updateControls();
    this._updateHeader();
    this._refreshAll();

    if (this.currentTurnId === this.myId) {
      toast('🎲 Giliran kamu! Lempar dadu!', 'info');
    } else {
      const next = this._getPlayer(this.currentTurnId);
      toast(`⏳ Giliran ${next?.username || '?'}`, 'info');
    }
  },

  // ─── RESIGN ───────────────────────────────────────────────────────────
  async _resign() {
    if (!confirm('Yakin mau menyerah?')) return;
    const me = this._getMe();
    if (me) await this._declareBankruptcy(me);
    setTimeout(() => { window.location.href = 'lobby.html'; }, 2000);
  },

  // ─── TILE CLICK ───────────────────────────────────────────────────────
  onTileClick(pos, tile) {
    if (tile.type !== 'country') return;
    const cd = getCountryById(tile.countryId);
    if (!cd) return;

    const ownership = this._getOwnership(tile.countryId);
    const owner = ownership ? this._getPlayer(ownership.ownerId) : null;

    showActionModal(
      `${cd.icon} ${cd.name}`,
      `🏛️ ${cd.landmark}`,
      [{ label: 'Tutup', cls: 'btn-ghost', fn: closeActionModal }],
      `<div class="country-info">
        <div class="country-info-grid">
          <div class="country-info-stat">
            <div class="country-info-stat-n">${cd.price}</div>
            <div class="country-info-stat-l">Harga</div>
          </div>
          <div class="country-info-stat">
            <div class="country-info-stat-n" style="color:var(--primary)">${ownership ? (owner?.username || '?') : 'Bank'}</div>
            <div class="country-info-stat-l">Pemilik</div>
          </div>
          <div class="country-info-stat">
            <div class="country-info-stat-n">${ownership?.houses || 0}</div>
            <div class="country-info-stat-l">Rumah</div>
          </div>
          <div class="country-info-stat">
            <div class="country-info-stat-n">${getCountryRent(cd, ownership?.houses || 0)}</div>
            <div class="country-info-stat-l">Denda Saat Ini</div>
          </div>
        </div>
        <div style="margin-top:12px">
          <div style="font-size:.72rem;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Tabel Denda</div>
          ${Houses.renderHouseInfo(cd, ownership?.houses || 0)}
        </div>
      </div>`
    );
  },

  // ─── REALTIME SUBSCRIPTIONS ───────────────────────────────────────────
  _subscribe() {
    this._subs.push(MP.subscribeToPlayers(this.roomId, async () => {
      await this._reloadPlayers();
      this._refreshAll();
    }));

    this._subs.push(MP.subscribeToGameState(this.roomId, async (gs) => {
      if (!gs) return;
      if (gs.current_turn && gs.current_turn !== this.currentTurnId) {
        this.currentTurnId = gs.current_turn;
        this.turnNumber    = gs.turn_number || this.turnNumber;
        this._updateControls();
        this._updateHeader();
        if (this.currentTurnId === this.myId) {
          toast('🎲 Giliran kamu! Lempar dadu!', 'info');
        }
      }
      if (gs.dice_result) {
        const dr = typeof gs.dice_result === 'string' ? JSON.parse(gs.dice_result) : gs.dice_result;
        Dice.setDisplay(document.getElementById('die1'), document.getElementById('die2'), dr.d1, dr.d2);
      }
    }));

    this._subs.push(MP.subscribeToCountries(this.roomId, async () => {
      const raw = await MP.getCountries(this.roomId);
      this.countries = raw.map(c => ({
        countryId:  c.country_id,
        ownerId:    c.owner_id,
        ownerColor: c.owner_color,
        houses:     c.houses || 0,
      }));
      window.GAME_STATE.countries = this.countries;
      this._refreshBoard();
      renderMyCountries(this.myId);
    }));
  },

  async _reloadPlayers() {
    const raw = await MP.getRoomPlayers(this.roomId);
    raw.forEach(rp => {
      const local = this._getPlayer(rp.id);
      if (local && rp.id !== this.myId) {
        // Update remote player state
        local.money    = rp.money;
        local.position = rp.position;
        local.inJail   = rp.in_jail;
        local.bankrupt = rp.bankrupt;
        local.jailTurns= rp.jail_turns || 0;
        local.jailCard = rp.jail_card  || 0;
      }
    });
    window.GAME_STATE.players = this.players;
    Board.updateTokens(this.players);
  },

  // ─── SYNC ─────────────────────────────────────────────────────────────
  async _syncPlayer(player) {
    await MP.updatePlayer(player.id, {
      money:      player.money,
      position:   player.position,
      in_jail:    player.inJail,
      jail_turns: player.jailTurns,
      jail_card:  player.jailCard,
      bankrupt:   player.bankrupt,
      start_passes: player.startPasses || 0,
    });
    window.GAME_STATE.players = this.players;
  },

  // ─── REFRESH UI ───────────────────────────────────────────────────────
  _refreshAll() {
    const me = this._getMe();
    if (me) {
      document.getElementById('my-money').textContent     = `💰 ${me.money.toLocaleString()}`;
      document.getElementById('my-name-label').textContent = me.username;
    }
    renderPlayerPanel(this.players, this.currentTurnId, this.myId);
    Board.updateTokens(this.players);
    this._refreshBoard();
  },

  _refreshBoard() {
    BOARD.forEach((tile, pos) => {
      if (tile.type !== 'country') return;
      const ownership = this._getOwnership(tile.countryId);
      if (ownership) {
        Board.updateTile(pos, {
          ownerId:    ownership.ownerId,
          ownerColor: ownership.ownerColor,
          houses:     ownership.houses,
        });
      }
    });
  },

  _updateControls() {
    const isMyTurn  = this.currentTurnId === this.myId;
    const me        = this._getMe();
    const hasRolled = me?.hasRolled || false;

    const rollBtn = document.getElementById('btn-roll');
    const endBtn  = document.getElementById('btn-end-turn');
    if (rollBtn) rollBtn.disabled = !isMyTurn || hasRolled || me?.bankrupt;
    if (endBtn)  {
      endBtn.disabled = !isMyTurn || !hasRolled;
      if (!hasRolled) endBtn.style.display = 'none';
    }
  },

  _updateHeader() {
    const current = this._getPlayer(this.currentTurnId);
    const isMe = this.currentTurnId === this.myId;
    document.getElementById('turn-indicator').textContent = `${isMe ? '🎲' : '⏳'} ${current?.username || '?'}${isMe ? ' (Kamu)' : ''}`;
    document.getElementById('turn-number').textContent = `Ronde ${this.turnNumber}`;
  },

  _showError(msg) {
    document.getElementById('loading-msg').textContent = msg;
    setTimeout(() => { window.location.href = 'lobby.html'; }, 3000);
  },

  // ─── HELPERS ──────────────────────────────────────────────────────────
  _getMe()              { return this._getPlayer(this.myId); },
  _getPlayer(id)        { return this.players.find(p => p.id === id); },
  _getOwnership(cid)    { return this.countries.find(c => c.countryId === cid); },
};

// ─── ACTION MODAL HELPERS ─────────────────────────────────────────────────
function showActionModal(title, sub, buttons, contentHtml='') {
  document.getElementById('action-title').textContent   = title;
  document.getElementById('action-sub').textContent     = sub;
  document.getElementById('action-content').innerHTML   = contentHtml;

  const btnsEl = document.getElementById('action-btns');
  btnsEl.innerHTML = '';
  buttons.forEach(b => {
    const btn = document.createElement('button');
    btn.className = `btn ${b.cls || 'btn-ghost'}`;
    btn.textContent = b.label;
    if (b.disabled) btn.disabled = true;
    btn.addEventListener('click', b.fn);
    btnsEl.appendChild(btn);
  });

  document.getElementById('action-modal').style.display = 'flex';
}

function closeActionModal() {
  document.getElementById('action-modal').style.display = 'none';
}

// ─── TOAST ────────────────────────────────────────────────────────────────
function toast(msg, type='info') {
  const c = document.getElementById('toast-container');
  if (!c) return;
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span>${type==='success'?'✓':type==='error'?'✕':'ℹ'}</span><span>${msg}</span>`;
  c.appendChild(el);
  setTimeout(() => {
    el.style.animation = 'toast-out .3s forwards';
    setTimeout(() => el.remove(), 350);
  }, 3500);
}

// ─── START GAME ON PAGE LOAD ──────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  GAME.init().catch(err => {
    console.error('[Game] Init error:', err);
    toast('Gagal memuat game: ' + err.message, 'error');
  });
});
