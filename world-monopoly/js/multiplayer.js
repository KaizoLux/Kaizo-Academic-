// ─── MULTIPLAYER — SUPABASE ───────────────────────────────────────────────
const SUPABASE_URL  = 'https://kjcifrrkfpifdrwjufau.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqY2lmcnJrZnBpZmRyd2p1ZmF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwMDA4MjksImV4cCI6MjA4ODU3NjgyOX0.57mc0OEXzBD5JcIXV_0sdG3KH7WJzhCAycBB80HSjTA';

let _offlineMode = false;
let _supabase    = null;

// Guard: PLAYER_COLORS juga ada di player.js — hindari duplicate const
if (typeof PLAYER_COLORS === 'undefined') {
  var PLAYER_COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b'];
}

const MP = {
  _subs:        [],
  _myPlayerId:  null,
  _initialized: false,

  // ── INIT ──────────────────────────────────────────────────────────────
  async init() {
    if (this._initialized) return;   // jangan init 2x
    this._initialized = true;

    if (typeof window.supabase === 'undefined') {
      await this._loadSDK();
    }
    try {
      _supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
      const { error } = await _supabase.from('rooms').select('id').limit(1);
      if (error && error.code !== 'PGRST116') throw error;
      console.log('[MP] Supabase connected ✓');
    } catch(e) {
      console.warn('[MP] Masuk offline mode:', e.message);
      _offlineMode = true;
      this._initOffline();
    }
  },

  async _loadSDK() {
    return new Promise((res) => {
      const t = setTimeout(() => { _offlineMode = true; res(); }, 8000);
      const s = document.createElement('script');
      s.src     = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
      s.onload  = () => { clearTimeout(t); res(); };
      s.onerror = () => { clearTimeout(t); _offlineMode = true; res(); };
      document.head.appendChild(s);
    });
  },

  _initOffline() {
    window._offlineStore = { rooms:[], players:[], countries:[], game_state:[], chat:[], _subs:{} };
  },

  isOffline() { return _offlineMode; },

  // ── ROOM MANAGEMENT ───────────────────────────────────────────────────
  async createRoom(player, config) {
    const code = this._genCode();
    const pid  = this._genId();
    this._myPlayerId = pid;
    localStorage.setItem('wm_my_id', pid);

    if (_offlineMode) {
      const room = { id: this._genId(), room_code: code, host_id: pid, status: 'waiting', config };
      window._offlineStore.rooms.push(room);
      window._offlineStore.players.push({
        id: pid, room_id: room.id, username: player.name, token: player.token,
        money: config.startingMoney||5000, position:0, color: PLAYER_COLORS[0], color_idx:0, in_jail:false
      });
      localStorage.setItem('wm_room', JSON.stringify(room));
      return room;
    }

    const { data: room, error: re } = await _supabase.from('rooms').insert({
      room_code: code, host_id: pid, status: 'waiting', config: JSON.stringify(config),
    }).select().single();
    if (re) throw re;

    const { error: pe } = await _supabase.from('players').insert({
      id: pid, room_id: room.id, username: player.name, token: player.token,
      money: config.startingMoney||5000, position:0, color: PLAYER_COLORS[0], color_idx:0, in_jail:false,
    });
    if (pe) throw pe;
    return room;
  },

  async joinRoom(code, player) {
    const pid = this._genId();
    this._myPlayerId = pid;
    localStorage.setItem('wm_my_id', pid);

    if (_offlineMode) {
      const room = window._offlineStore.rooms.find(r => r.room_code === code.toUpperCase());
      if (!room) throw new Error('Room tidak ditemukan');
      if (room.status !== 'waiting') throw new Error('Game sudah dimulai');
      const existing = window._offlineStore.players.filter(p => p.room_id === room.id);
      if (existing.length >= 4) throw new Error('Room penuh (max 4 pemain)');
      const ci = existing.length;
      window._offlineStore.players.push({
        id:pid, room_id:room.id, username:player.name, token:player.token,
        money: room.config?.startingMoney||5000, position:0,
        color: PLAYER_COLORS[ci], color_idx:ci, in_jail:false
      });
      localStorage.setItem('wm_room', JSON.stringify(room));
      this._notify('players', room.id);
      return room;
    }

    const { data: rows } = await _supabase.from('rooms').select('*').eq('room_code', code.toUpperCase()).limit(1);
    if (!rows?.length) throw new Error('Room tidak ditemukan');
    const room = rows[0];
    if (room.status !== 'waiting') throw new Error('Game sudah dimulai');

    const { data: existing } = await _supabase.from('players').select('id').eq('room_id', room.id);
    if (existing?.length >= 4) throw new Error('Room penuh (max 4 pemain)');
    const ci  = existing?.length || 1;
    const cfg = room.config ? JSON.parse(room.config) : {};

    const { error: pe } = await _supabase.from('players').insert({
      id:pid, room_id:room.id, username:player.name, token:player.token,
      money:cfg.startingMoney||5000, position:0,
      color: PLAYER_COLORS[ci], color_idx:ci, in_jail:false,
    });
    if (pe) throw pe;
    return room;
  },

  async leaveRoom(roomId) {
    const myId = this.getMyId();
    if (!myId) return;
    if (_offlineMode) {
      window._offlineStore.players = window._offlineStore.players.filter(p => p.id !== myId);
      return;
    }
    await _supabase.from('players').delete().eq('id', myId);
  },

  async startGame(roomId) {
    const players = await this.getRoomPlayers(roomId);
    const order   = players.map(p => p.id);

    if (_offlineMode) {
      const r = window._offlineStore.rooms.find(r => r.id === roomId);
      if (r) r.status = 'playing';
      const gs = { room_id:roomId, current_turn:order[0], turn_number:1, turn_order:order, status:'playing' };
      window._offlineStore.game_state = window._offlineStore.game_state.filter(g => g.room_id !== roomId);
      window._offlineStore.game_state.push(gs);
      this._notify('game_state', roomId);
      return;
    }

    await _supabase.from('rooms').update({ status:'playing' }).eq('id', roomId);
    const { error } = await _supabase.from('game_state').upsert({
      room_id:      roomId,
      current_turn: order[0],
      turn_number:  1,
      turn_order:   JSON.stringify(order),
      status:       'playing',
    }, { onConflict: 'room_id' });
    if (error) throw error;
  },

  async getActiveRooms() {
    if (_offlineMode) {
      return window._offlineStore.rooms
        .filter(r => r.status === 'waiting')
        .map(r => ({ ...r, player_count: window._offlineStore.players.filter(p=>p.room_id===r.id).length }));
    }
    const { data } = await _supabase.from('rooms').select('*, players(count)').eq('status','waiting').limit(10);
    return (data||[]).map(r => ({ ...r, player_count: r.players?.[0]?.count||1 }));
  },

  async getRoomPlayers(roomId) {
    if (_offlineMode) return window._offlineStore.players.filter(p => p.room_id === roomId);
    const { data } = await _supabase.from('players').select('*').eq('room_id', roomId).order('created_at');
    return data||[];
  },

  // ── GAME STATE ────────────────────────────────────────────────────────
  async getGameState(roomId) {
    if (_offlineMode) return window._offlineStore.game_state.find(g=>g.room_id===roomId)||null;
    const { data } = await _supabase.from('game_state').select('*').eq('room_id',roomId).single();
    return data;
  },

  async updateGameState(roomId, patch) {
    if (_offlineMode) {
      const gs = window._offlineStore.game_state.find(g=>g.room_id===roomId);
      if (gs) Object.assign(gs, patch);
      this._notify('game_state', roomId);
      return;
    }
    await _supabase.from('game_state').update(patch).eq('room_id', roomId);
  },

  async updatePlayer(playerId, patch) {
    if (_offlineMode) {
      const p = window._offlineStore.players.find(x=>x.id===playerId);
      if (p) { Object.assign(p, patch); this._notify('players', p.room_id); }
      return;
    }
    await _supabase.from('players').update(patch).eq('id', playerId);
  },

  async getCountries(roomId) {
    if (_offlineMode) return window._offlineStore.countries.filter(c=>c.room_id===roomId);
    const { data } = await _supabase.from('countries').select('*').eq('room_id', roomId);
    return data||[];
  },

  async buyCountry(roomId, countryId, ownerId, ownerColor) {
    const rec = { room_id:roomId, country_id:countryId, owner_id:ownerId, owner_color:ownerColor, houses:0 };
    if (_offlineMode) {
      if (!window._offlineStore.countries.find(c=>c.room_id===roomId&&c.country_id===countryId))
        window._offlineStore.countries.push(rec);
      this._notify('countries', roomId);
      return;
    }
    await _supabase.from('countries').upsert(rec, { onConflict:'room_id,country_id' });
  },

  async updateCountryHouses(roomId, countryId, houses) {
    if (_offlineMode) {
      const c = window._offlineStore.countries.find(c=>c.room_id===roomId&&c.country_id===countryId);
      if (c) c.houses = houses;
      this._notify('countries', roomId);
      return;
    }
    await _supabase.from('countries').update({ houses }).eq('room_id',roomId).eq('country_id',countryId);
  },

  // ── CHAT ──────────────────────────────────────────────────────────────
  async sendChat(roomId, username, message, color) {
    const rec = { room_id:roomId, username, message, color, created_at: new Date().toISOString() };
    if (_offlineMode) {
      rec.id = this._genId();
      if (!window._offlineStore.chat) window._offlineStore.chat = [];
      window._offlineStore.chat.push(rec);
      this._notify('chat', roomId);
      return;
    }
    await _supabase.from('chat').insert(rec);
  },

  async getChatHistory(roomId, limit=50) {
    if (_offlineMode) return (window._offlineStore.chat||[]).filter(c=>c.room_id===roomId).slice(-limit);
    const { data } = await _supabase.from('chat').select('*').eq('room_id',roomId).order('created_at',{ascending:true}).limit(limit);
    return data||[];
  },

  // ── SUBSCRIPTIONS ─────────────────────────────────────────────────────
  subscribeToPlayers(roomId, cb) {
    if (_offlineMode) return this._addSub('players', roomId, cb);
    const sub = _supabase.channel(`players:${roomId}`)
      .on('postgres_changes',{event:'*',schema:'public',table:'players',filter:`room_id=eq.${roomId}`}, cb)
      .subscribe();
    this._subs.push(sub); return sub;
  },

  subscribeToGameState(roomId, cb) {
    if (_offlineMode) return this._addSub('game_state', roomId, async () => {
      cb(window._offlineStore.game_state.find(g=>g.room_id===roomId));
    });
    const sub = _supabase.channel(`gamestate:${roomId}`)
      .on('postgres_changes',{event:'*',schema:'public',table:'game_state',filter:`room_id=eq.${roomId}`},
          async () => cb(await this.getGameState(roomId)))
      .on('postgres_changes',{event:'UPDATE',schema:'public',table:'rooms',filter:`id=eq.${roomId}`},
          async (payload) => { if (payload.new?.status==='playing') cb({ status:'playing' }); })
      .subscribe();
    this._subs.push(sub); return sub;
  },

  subscribeToCountries(roomId, cb) {
    if (_offlineMode) return this._addSub('countries', roomId, cb);
    const sub = _supabase.channel(`countries:${roomId}`)
      .on('postgres_changes',{event:'*',schema:'public',table:'countries',filter:`room_id=eq.${roomId}`}, cb)
      .subscribe();
    this._subs.push(sub); return sub;
  },

  subscribeToChat(roomId, cb) {
    if (_offlineMode) return this._addSub('chat', roomId, cb);
    const sub = _supabase.channel(`chat:${roomId}`)
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'chat',filter:`room_id=eq.${roomId}`},
          (payload) => cb(payload.new))
      .subscribe();
    this._subs.push(sub); return sub;
  },

  unsubscribeAll() {
    this._subs.forEach(s => s.unsubscribe?.());
    this._subs = [];
    if (_offlineMode && window._offlineStore) window._offlineStore._subs = {};
  },

  // ── OFFLINE HELPERS ───────────────────────────────────────────────────
  _addSub(table, roomId, cb) {
    const s = window._offlineStore;
    if (!s._subs[table]) s._subs[table] = {};
    if (!s._subs[table][roomId]) s._subs[table][roomId] = [];
    s._subs[table][roomId].push(cb);
    return { unsubscribe: () => { s._subs[table][roomId] = s._subs[table][roomId].filter(x=>x!==cb); } };
  },

  _notify(table, roomId) {
    const cbs = window._offlineStore?._subs?.[table]?.[roomId];
    if (cbs) cbs.forEach(cb => cb({}));
  },

  // ── UTILS ─────────────────────────────────────────────────────────────
  getMyId()  { return this._myPlayerId || localStorage.getItem('wm_my_id'); },
  _genCode() { return Array.from({length:6}, () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random()*36)]).join(''); },
  _genId()   { return 'id_' + Date.now() + '_' + Math.random().toString(36).slice(2,8); },
};
