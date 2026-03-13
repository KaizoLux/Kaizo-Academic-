// ─── MULTIPLAYER — SUPABASE ──────────────────────────────────────────────────
// Handles all Supabase realtime communication and room management

// ─── CONFIGURATION ────────────────────────────────────────────────────────
// IMPORTANT: Replace these with your actual Supabase credentials
// Get them from: https://supabase.com → Project Settings → API
const SUPABASE_URL  = 'https://kjcifrrkfpifdrwjufau.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqY2lmcnJrZnBpZmRyd2p1ZmF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwMDA4MjksImV4cCI6MjA4ODU3NjgyOX0.57mc0OEXzBD5JcIXV_0sdG3KH7WJzhCAycBB80HSjTA';

// ─── OFFLINE / DEMO MODE ──────────────────────────────────────────────────
// If Supabase is not configured, game runs in local 2-player demo mode
let _offlineMode = false;
let _supabase    = null;

// ─── INIT ─────────────────────────────────────────────────────────────────
const MP = {
  _subs: [],
  _myPlayerId: null,
  _myRoomId: null,

  async init() {
    // Check if Supabase SDK is available
    if (typeof window.supabase === 'undefined') {
      // Try loading Supabase CDN
      await this._loadSupabaseSDK();
    }
    try {
      _supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
      // Test connection
      const { error } = await _supabase.from('rooms').select('id').limit(1);
      if (error && error.code !== 'PGRST116') throw error;
      console.log('[MP] Supabase connected');
    } catch(e) {
      console.warn('[MP] Supabase unavailable, entering offline mode:', e.message);
      _offlineMode = true;
      this._initOffline();
    }
  },

  async _loadSupabaseSDK() {
    return new Promise((res) => {
      const timer = setTimeout(() => {
        console.warn('[MP] Supabase SDK timeout, masuk offline mode');
        _offlineMode = true;
        res();
      }, 8000);
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
      script.onload = () => { clearTimeout(timer); res(); };
      script.onerror = () => { clearTimeout(timer); _offlineMode = true; res(); };
      document.head.appendChild(script);
    });
  },

  _initOffline() {
    // In-memory store for offline/demo mode
    window._offlineStore = {
      rooms: [], players: [], countries: [],
      game_state: [], chat: [], _subs: {},
    };
  },

  isOffline() { return _offlineMode; },

  // ─── ROOM MANAGEMENT ──────────────────────────────────────────────────

  async createRoom(player, config) {
    const code = this._genCode();
    const playerId = this._genId();
    this._myPlayerId = playerId;

    if (_offlineMode) {
      const room = { id: this._genId(), room_code: code, host_id: playerId, status: 'waiting', config };
      const p = { id: playerId, room_id: room.id, username: player.name, token: player.token, money: config.startingMoney || 5000, position: 0, color: PLAYER_COLORS[0], colorIdx: 0, in_jail: false };
      window._offlineStore.rooms.push(room);
      window._offlineStore.players.push(p);
      this._myRoomId = room.id;
      localStorage.setItem('wm_my_id', playerId);
      localStorage.setItem('wm_room', JSON.stringify(room));
      return room;
    }

    const { data: room, error: re } = await _supabase.from('rooms').insert({
      room_code: code, host_id: playerId, status: 'waiting',
      config: JSON.stringify(config),
    }).select().single();
    if (re) throw re;

    const { error: pe } = await _supabase.from('players').insert({
      id: playerId, room_id: room.id, username: player.name, token: player.token,
      money: config.startingMoney || 5000, position: 0,
      color: PLAYER_COLORS[0], color_idx: 0, in_jail: false,
    });
    if (pe) throw pe;

    this._myRoomId = room.id;
    localStorage.setItem('wm_my_id', playerId);
    return room;
  },

  async joinRoom(code, player) {
    const playerId = this._genId();
    this._myPlayerId = playerId;

    if (_offlineMode) {
      const room = window._offlineStore.rooms.find(r => r.room_code === code.toUpperCase());
      if (!room) throw new Error('Room tidak ditemukan');
      if (room.status !== 'waiting') throw new Error('Game sudah dimulai');
      const existing = window._offlineStore.players.filter(p => p.room_id === room.id);
      if (existing.length >= 4) throw new Error('Room penuh (max 4 pemain)');
      const colorIdx = existing.length;
      const p = { id: playerId, room_id: room.id, username: player.name, token: player.token, money: room.config?.startingMoney || 5000, position: 0, color: PLAYER_COLORS[colorIdx], colorIdx, in_jail: false };
      window._offlineStore.players.push(p);
      this._myRoomId = room.id;
      localStorage.setItem('wm_my_id', playerId);
      localStorage.setItem('wm_room', JSON.stringify(room));
      this._notifyOfflineSubs('players', room.id);
      return room;
    }

    const { data: rooms } = await _supabase.from('rooms').select('*').eq('room_code', code.toUpperCase()).limit(1);
    if (!rooms || rooms.length === 0) throw new Error('Room tidak ditemukan');
    const room = rooms[0];
    if (room.status !== 'waiting') throw new Error('Game sudah dimulai');

    const { data: existing } = await _supabase.from('players').select('id,color_idx').eq('room_id', room.id);
    if (existing && existing.length >= 4) throw new Error('Room penuh (max 4 pemain)');

    const colorIdx = existing ? existing.length : 1;
    const config = room.config ? JSON.parse(room.config) : {};

    const { error: pe } = await _supabase.from('players').insert({
      id: playerId, room_id: room.id, username: player.name, token: player.token,
      money: config.startingMoney || 5000, position: 0,
      color: PLAYER_COLORS[colorIdx], color_idx: colorIdx, in_jail: false,
    });
    if (pe) throw pe;

    this._myRoomId = room.id;
    localStorage.setItem('wm_my_id', playerId);
    return room;
  },

  async leaveRoom(roomId, username) {
    if (_offlineMode) {
      window._offlineStore.players = window._offlineStore.players.filter(
        p => !(p.room_id === roomId && p.username === username)
      );
      return;
    }
    const myId = this.getMyId();
    if (myId) {
      await _supabase.from('players').delete().eq('id', myId).eq('room_id', roomId);
    }
  },

  async startGame(roomId) {
    const players = await this.getRoomPlayers(roomId);
    const turnOrder = players.map(p => p.id);

    if (_offlineMode) {
      const room = window._offlineStore.rooms.find(r => r.id === roomId);
      if (room) room.status = 'playing';
      const gs = { room_id: roomId, current_turn: turnOrder[0], turn_number: 1, turn_order: turnOrder, status: 'playing' };
      window._offlineStore.game_state = window._offlineStore.game_state.filter(g => g.room_id !== roomId);
      window._offlineStore.game_state.push(gs);
      this._notifyOfflineSubs('game_state', roomId);
      return;
    }

    await _supabase.from('rooms').update({ status: 'playing' }).eq('id', roomId);
    const { error } = await _supabase.from('game_state').upsert({
      room_id: roomId,
      current_turn: turnOrder[0],
      turn_number: 1,
      turn_order: JSON.stringify(turnOrder),
      status: 'playing',
    });
    if (error) throw error;
  },

  async getActiveRooms() {
    if (_offlineMode) {
      return window._offlineStore.rooms
        .filter(r => r.status === 'waiting')
        .map(r => ({ ...r, player_count: window._offlineStore.players.filter(p => p.room_id === r.id).length }));
    }
    const { data } = await _supabase.from('rooms').select('*, players(count)').eq('status', 'waiting').limit(10);
    return (data || []).map(r => ({ ...r, player_count: r.players?.[0]?.count || 1 }));
  },

  async getRoomPlayers(roomId) {
    if (_offlineMode) {
      return window._offlineStore.players.filter(p => p.room_id === roomId);
    }
    const { data } = await _supabase.from('players').select('*').eq('room_id', roomId).order('created_at');
    return data || [];
  },

  // ─── GAME STATE ───────────────────────────────────────────────────────

  async getGameState(roomId) {
    if (_offlineMode) {
      return window._offlineStore.game_state.find(g => g.room_id === roomId) || null;
    }
    const { data } = await _supabase.from('game_state').select('*').eq('room_id', roomId).single();
    return data;
  },

  async updateGameState(roomId, patch) {
    if (_offlineMode) {
      const gs = window._offlineStore.game_state.find(g => g.room_id === roomId);
      if (gs) Object.assign(gs, patch);
      this._notifyOfflineSubs('game_state', roomId);
      return;
    }
    await _supabase.from('game_state').update(patch).eq('room_id', roomId);
  },

  async updatePlayer(playerId, patch) {
    if (_offlineMode) {
      const p = window._offlineStore.players.find(x => x.id === playerId);
      if (p) Object.assign(p, patch);
      this._notifyOfflineSubs('players', window._offlineStore.players.find(x=>x.id===playerId)?.room_id);
      return;
    }
    await _supabase.from('players').update(patch).eq('id', playerId);
  },

  async getCountries(roomId) {
    if (_offlineMode) {
      return window._offlineStore.countries.filter(c => c.room_id === roomId);
    }
    const { data } = await _supabase.from('countries').select('*').eq('room_id', roomId);
    return data || [];
  },

  async buyCountry(roomId, countryId, ownerId, ownerColor) {
    const record = { room_id: roomId, country_id: countryId, owner_id: ownerId, owner_color: ownerColor, houses: 0 };
    if (_offlineMode) {
      const existing = window._offlineStore.countries.find(c => c.room_id === roomId && c.country_id === countryId);
      if (!existing) window._offlineStore.countries.push(record);
      this._notifyOfflineSubs('countries', roomId);
      return;
    }
    await _supabase.from('countries').upsert(record);
  },

  async updateCountryHouses(roomId, countryId, houses) {
    if (_offlineMode) {
      const c = window._offlineStore.countries.find(c => c.room_id === roomId && c.country_id === countryId);
      if (c) c.houses = houses;
      this._notifyOfflineSubs('countries', roomId);
      return;
    }
    await _supabase.from('countries').update({ houses }).eq('room_id', roomId).eq('country_id', countryId);
  },

  // ─── CHAT ─────────────────────────────────────────────────────────────

  async sendChat(roomId, username, message, color) {
    const record = { room_id: roomId, username, message, color, created_at: new Date().toISOString() };
    if (_offlineMode) {
      record.id = this._genId();
      if (!window._offlineStore.chat) window._offlineStore.chat = [];
      window._offlineStore.chat.push(record);
      this._notifyOfflineSubs('chat', roomId);
      return;
    }
    await _supabase.from('chat').insert(record);
  },

  async getChatHistory(roomId, limit=50) {
    if (_offlineMode) {
      return (window._offlineStore.chat || []).filter(c => c.room_id === roomId).slice(-limit);
    }
    const { data } = await _supabase.from('chat').select('*').eq('room_id', roomId).order('created_at', { ascending: true }).limit(limit);
    return data || [];
  },

  // ─── SUBSCRIPTIONS ────────────────────────────────────────────────────

  subscribeToPlayers(roomId, callback) {
    if (_offlineMode) {
      return this._addOfflineSub('players', roomId, callback);
    }
    const sub = _supabase.channel(`players:${roomId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players', filter: `room_id=eq.${roomId}` }, callback)
      .subscribe();
    this._subs.push(sub);
    return sub;
  },

  subscribeToGameState(roomId, callback) {
    if (_offlineMode) {
      return this._addOfflineSub('game_state', roomId, async (data) => {
        const gs = window._offlineStore.game_state.find(g => g.room_id === roomId);
        callback(gs);
      });
    }
    const sub = _supabase.channel(`gamestate:${roomId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_state', filter: `room_id=eq.${roomId}` },
        async () => {
          const gs = await this.getGameState(roomId);
          callback(gs);
        })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` },
        async (payload) => { if (payload.new?.status === 'playing') callback({ status: 'playing' }); })
      .subscribe();
    this._subs.push(sub);
    return sub;
  },

  subscribeToCountries(roomId, callback) {
    if (_offlineMode) return this._addOfflineSub('countries', roomId, callback);
    const sub = _supabase.channel(`countries:${roomId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'countries', filter: `room_id=eq.${roomId}` }, callback)
      .subscribe();
    this._subs.push(sub);
    return sub;
  },

  subscribeToChat(roomId, callback) {
    if (_offlineMode) return this._addOfflineSub('chat', roomId, callback);
    const sub = _supabase.channel(`chat:${roomId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat', filter: `room_id=eq.${roomId}` },
        (payload) => callback(payload.new))
      .subscribe();
    this._subs.push(sub);
    return sub;
  },

  unsubscribeAll() {
    this._subs.forEach(s => s.unsubscribe?.());
    this._subs = [];
    if (_offlineMode && window._offlineStore) window._offlineStore._subs = {};
  },

  // ─── OFFLINE HELPERS ──────────────────────────────────────────────────

  _addOfflineSub(table, roomId, callback) {
    const store = window._offlineStore;
    if (!store._subs[table]) store._subs[table] = {};
    if (!store._subs[table][roomId]) store._subs[table][roomId] = [];
    store._subs[table][roomId].push(callback);
    return { unsubscribe: () => {
      store._subs[table][roomId] = store._subs[table][roomId].filter(cb => cb !== callback);
    }};
  },

  _notifyOfflineSubs(table, roomId) {
    const store = window._offlineStore;
    if (!store || !store._subs[table] || !store._subs[table][roomId]) return;
    store._subs[table][roomId].forEach(cb => cb({}));
  },

  // ─── UTILS ────────────────────────────────────────────────────────────

  getMyId() {
    return this._myPlayerId || localStorage.getItem('wm_my_id');
  },

  _genCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  },

  _genId() {
    return 'id_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
  },
};

// Player colors (also used in lobby.html)
const PLAYER_COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b'];
