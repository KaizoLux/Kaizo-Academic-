// ─── CHAT SYSTEM ─────────────────────────────────────────────────────────────
// Handles in-game chat with Supabase Realtime

const Chat = {
  _roomId: null,
  _myName: null,
  _myColor: null,
  _sub: null,
  _messagesEl: null,
  _inputEl: null,

  init(roomId, playerName, playerColor) {
    this._roomId  = roomId;
    this._myName  = playerName;
    this._myColor = playerColor;
    this._messagesEl = document.getElementById('chat-messages');
    this._inputEl    = document.getElementById('chat-input');

    // Load history
    this._loadHistory();

    // Subscribe to new messages
    this._sub = MP.subscribeToChat(roomId, (msg) => {
      if (msg) this._appendMessage(msg);
    });

    // Send on button click
    const sendBtn = document.getElementById('chat-send');
    if (sendBtn) sendBtn.addEventListener('click', () => this.send());

    // Send on enter
    if (this._inputEl) {
      this._inputEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.send();
        }
      });
    }
  },

  async _loadHistory() {
    try {
      const history = await MP.getChatHistory(this._roomId, 50);
      if (history && history.length > 0) {
        history.forEach(msg => this._appendMessage(msg, false));
        this._scrollToBottom();
      }
    } catch(e) {
      console.warn('[Chat] Cannot load history:', e);
    }
  },

  async send() {
    if (!this._inputEl) return;
    const msg = this._inputEl.value.trim();
    if (!msg) return;
    this._inputEl.value = '';

    try {
      await MP.sendChat(this._roomId, this._myName, msg, this._myColor);
    } catch(e) {
      console.error('[Chat] Send error:', e);
      // Optimistic fallback: show locally
      this._appendMessage({ username: this._myName, message: msg, color: this._myColor, created_at: new Date().toISOString() }, true);
    }
  },

  // Append a system message (game event)
  system(text) {
    if (!this._messagesEl) return;
    const el = document.createElement('div');
    el.className = 'chat-msg chat-msg-system';
    el.textContent = `── ${text} ──`;
    this._messagesEl.appendChild(el);
    this._scrollToBottom();

    // Also send to DB as system message
    if (this._roomId) {
      MP.sendChat(this._roomId, '🌍 Sistema', text, '#6b7280').catch(() => {});
    }
  },

  _appendMessage(msg, scroll=true) {
    if (!this._messagesEl) return;
    const isMe = msg.username === this._myName;
    const isSystem = msg.username === '🌍 Sistema';

    if (isSystem) {
      const el = document.createElement('div');
      el.className = 'chat-msg chat-msg-system';
      el.textContent = `── ${msg.message} ──`;
      this._messagesEl.appendChild(el);
    } else {
      const el = document.createElement('div');
      el.className = 'chat-msg';
      el.innerHTML = `
        <div class="chat-msg-name" style="color:${msg.color || 'var(--primary)'}">
          ${msg.username}${isMe ? ' (Kamu)' : ''}
        </div>
        <div class="chat-msg-text">${this._escapeHtml(msg.message)}</div>`;
      this._messagesEl.appendChild(el);
    }

    if (scroll) this._scrollToBottom();

    // Keep last 100 messages
    while (this._messagesEl.children.length > 100) {
      this._messagesEl.removeChild(this._messagesEl.firstChild);
    }
  },

  _scrollToBottom() {
    if (this._messagesEl) {
      this._messagesEl.scrollTop = this._messagesEl.scrollHeight;
    }
  },

  _escapeHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  },

  destroy() {
    if (this._sub) this._sub.unsubscribe?.();
  },
};
