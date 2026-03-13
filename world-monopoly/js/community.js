// ─── COMMUNITY CHEST CARDS ───────────────────────────────────────────────────
// 15 kartu Community Chest dengan efek berbeda

const COMMUNITY_CARDS = [
  {
    id: 'cc1', text: 'Dapat bantuan internasional 250!', icon: '🤝',
    apply: (player, game) => {
      game.transferMoney(null, player.id, 250);
      return { type:'money', amount:250 };
    }
  },
  {
    id: 'cc2', text: 'Bayar pajak pembangunan 150!', icon: '🏗️',
    apply: (player, game) => {
      game.transferMoney(player.id, null, 150);
      return { type:'money', amount:-150 };
    }
  },
  {
    id: 'cc3', text: 'Dapat bonus ekspor 100!', icon: '📦',
    apply: (player, game) => {
      game.transferMoney(null, player.id, 100);
      return { type:'money', amount:100 };
    }
  },
  {
    id: 'cc4', text: 'Semua pemain bayar kamu 50!', icon: '💰',
    apply: (player, game) => {
      let collected = 0;
      game.players.forEach(p => {
        if (p.id !== player.id && !p.bankrupt) {
          game.transferMoney(p.id, player.id, 50);
          collected += 50;
        }
      });
      return { type:'money', amount:collected };
    }
  },
  {
    id: 'cc5', text: 'Kamu bayar semua pemain 50!', icon: '💳',
    apply: (player, game) => {
      const others = game.players.filter(p => p.id !== player.id && !p.bankrupt);
      const total = 50 * others.length;
      others.forEach(p => game.transferMoney(player.id, p.id, 50));
      return { type:'money', amount:-total };
    }
  },
  {
    id: 'cc6', text: 'Dapat kartu Keluar Penjara!', icon: '🗝️',
    apply: (player, game) => {
      player.jailCard = (player.jailCard || 0) + 1;
      return { type:'jailcard' };
    }
  },
  {
    id: 'cc7', text: 'Langsung masuk penjara!', icon: '⛓️',
    apply: (player, game) => {
      game.sendToJail(player.id);
      return { type:'jail' };
    }
  },
  {
    id: 'cc8', text: 'Dapat bonus perdagangan 200!', icon: '🌐',
    apply: (player, game) => {
      game.transferMoney(null, player.id, 200);
      return { type:'money', amount:200 };
    }
  },
  {
    id: 'cc9', text: 'Bayar biaya militer 180!', icon: '🛡️',
    apply: (player, game) => {
      game.transferMoney(player.id, null, 180);
      return { type:'money', amount:-180 };
    }
  },
  {
    id: 'cc10', text: 'Dapat hadiah diplomatik 120!', icon: '🎖️',
    apply: (player, game) => {
      game.transferMoney(null, player.id, 120);
      return { type:'money', amount:120 };
    }
  },
  {
    id: 'cc11', text: 'Ambil kartu Community Chest lagi!', icon: '🔄',
    apply: (player, game) => {
      return { type:'drawagain', deck:'community' };
    }
  },
  {
    id: 'cc12', text: 'Bayar denda administrasi 100!', icon: '📄',
    apply: (player, game) => {
      game.transferMoney(player.id, null, 100);
      return { type:'money', amount:-100 };
    }
  },
  {
    id: 'cc13', text: 'Terima subsidi dari bank 150!', icon: '🏦',
    apply: (player, game) => {
      game.transferMoney(null, player.id, 150);
      return { type:'money', amount:150 };
    }
  },
  {
    id: 'cc14', text: 'Dividen investasi! Terima 80 dari bank.', icon: '📈',
    apply: (player, game) => {
      game.transferMoney(null, player.id, 80);
      return { type:'money', amount:80 };
    }
  },
  {
    id: 'cc15', text: 'Bayar biaya perawatan infrastruktur 80!', icon: '🔩',
    apply: (player, game) => {
      game.transferMoney(player.id, null, 80);
      return { type:'money', amount:-80 };
    }
  },
];

// Shuffle deck
function shuffleCommunity() {
  const deck = [...COMMUNITY_CARDS];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

// Draw from deck (auto reshuffle when empty)
let _communityDeck = [];
function drawCommunityCard() {
  if (_communityDeck.length === 0) _communityDeck = shuffleCommunity();
  return _communityDeck.pop();
}
