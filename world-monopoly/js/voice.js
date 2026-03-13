// ─── VOICE CHAT — WebRTC ─────────────────────────────────────────────────────
// Peer-to-peer voice chat using WebRTC and Supabase Realtime for signaling

const Voice = {
  _roomId: null,
  _myId: null,
  _stream: null,
  _peers: {},       // peerId → { pc, stream }
  _micEnabled: false,
  _speakerEnabled: true,
  _sigSub: null,

  async init(roomId, myId) {
    this._roomId = roomId;
    this._myId   = myId;

    const micBtn     = document.getElementById('btn-mic');
    const speakerBtn = document.getElementById('btn-speaker');

    if (micBtn) micBtn.addEventListener('click', () => this.toggleMic());
    if (speakerBtn) speakerBtn.addEventListener('click', () => this.toggleSpeaker());

    // Subscribe to signaling channel
    this._subscribeSignaling();
  },

  // Toggle microphone
  async toggleMic() {
    const btn = document.getElementById('btn-mic');
    if (!this._micEnabled) {
      try {
        this._stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        this._micEnabled = true;
        if (btn) { btn.classList.add('active'); btn.title = 'Mic ON (klik untuk mute)'; }
        toast('🎤 Mikrofon aktif', 'success');

        // Add tracks to existing peer connections
        Object.values(this._peers).forEach(({ pc }) => {
          this._stream.getTracks().forEach(track => pc.addTrack(track, this._stream));
        });

        // Initiate connections with other players
        await this._initiateConnections();
      } catch(e) {
        toast('Tidak bisa akses mikrofon: ' + e.message, 'error');
      }
    } else {
      // Mute
      if (this._stream) {
        this._stream.getTracks().forEach(t => t.enabled = !t.enabled);
        const muted = !this._stream.getAudioTracks()[0]?.enabled;
        if (btn) btn.classList.toggle('muted', muted);
        toast(muted ? '🔇 Mikrofon di-mute' : '🎤 Mikrofon aktif', 'info');
      }
    }
  },

  toggleSpeaker() {
    this._speakerEnabled = !this._speakerEnabled;
    const btn = document.getElementById('btn-speaker');
    if (btn) btn.classList.toggle('muted', !this._speakerEnabled);

    // Mute all incoming audio
    Object.values(this._peers).forEach(({ audioEl }) => {
      if (audioEl) audioEl.muted = !this._speakerEnabled;
    });

    toast(this._speakerEnabled ? '🔊 Speaker ON' : '🔇 Speaker OFF', 'info');
  },

  async _initiateConnections() {
    if (!window.GAME_STATE || MP.isOffline()) return;
    // Get all other player IDs from game state
    const players = window.GAME_STATE.players || [];
    for (const p of players) {
      if (p.id !== this._myId && !this._peers[p.id]) {
        await this._createOffer(p.id);
      }
    }
  },

  async _createOffer(peerId) {
    const pc = this._createPC(peerId);
    if (!pc) return;

    try {
      if (this._stream) {
        this._stream.getTracks().forEach(t => pc.addTrack(t, this._stream));
      }

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      await this._sendSignal(peerId, { type: 'offer', sdp: offer.sdp });
    } catch(e) {
      console.error('[Voice] Offer error:', e);
    }
  },

  async _handleSignal(signal) {
    const { from, to, type, sdp, candidate } = signal;
    if (to !== this._myId) return;

    if (type === 'offer') {
      const pc = this._createPC(from);
      if (!pc) return;

      if (this._stream) {
        this._stream.getTracks().forEach(t => pc.addTrack(t, this._stream));
      }

      await pc.setRemoteDescription({ type: 'offer', sdp });
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await this._sendSignal(from, { type: 'answer', sdp: answer.sdp });
    } else if (type === 'answer') {
      const peer = this._peers[from];
      if (peer?.pc) await peer.pc.setRemoteDescription({ type: 'answer', sdp });
    } else if (type === 'ice') {
      const peer = this._peers[from];
      if (peer?.pc && candidate) {
        await peer.pc.addIceCandidate(candidate).catch(() => {});
      }
    }
  },

  _createPC(peerId) {
    if (this._peers[peerId]) return this._peers[peerId].pc;

    const config = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    };

    let pc;
    try {
      pc = new RTCPeerConnection(config);
    } catch(e) {
      console.warn('[Voice] WebRTC not available');
      return null;
    }

    const peerData = { pc, audioEl: null };
    this._peers[peerId] = peerData;

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        this._sendSignal(peerId, { type: 'ice', candidate: e.candidate });
      }
    };

    pc.ontrack = (e) => {
      const audioEl = document.createElement('audio');
      audioEl.srcObject = e.streams[0];
      audioEl.autoplay  = true;
      audioEl.muted     = !this._speakerEnabled;
      document.getElementById('voice-peers')?.appendChild(audioEl);
      peerData.audioEl = audioEl;
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        this._removePeer(peerId);
      }
    };

    return pc;
  },

  _removePeer(peerId) {
    const peer = this._peers[peerId];
    if (peer) {
      peer.pc?.close();
      peer.audioEl?.remove();
      delete this._peers[peerId];
    }
  },

  async _sendSignal(to, data) {
    if (MP.isOffline() || !_supabase) return;
    try {
      await _supabase.from('voice_signals').insert({
        room_id: this._roomId, from_id: this._myId, to_id: to, signal: JSON.stringify(data),
      });
    } catch(e) {
      // voice signaling is best-effort
    }
  },

  _subscribeSignaling() {
    if (MP.isOffline() || !_supabase) return;
    try {
      this._sigSub = _supabase
        .channel(`voice:${this._roomId}`)
        .on('postgres_changes', {
          event: 'INSERT', schema: 'public', table: 'voice_signals',
          filter: `room_id=eq.${this._roomId}`,
        }, (payload) => {
          if (payload.new?.to_id === this._myId) {
            const signal = JSON.parse(payload.new.signal || '{}');
            this._handleSignal({ ...signal, from: payload.new.from_id, to: payload.new.to_id });
          }
        })
        .subscribe();
    } catch(e) {
      console.warn('[Voice] Signaling unavailable');
    }
  },

  destroy() {
    if (this._stream) this._stream.getTracks().forEach(t => t.stop());
    Object.keys(this._peers).forEach(id => this._removePeer(id));
    if (this._sigSub) this._sigSub.unsubscribe?.();
  },
};
