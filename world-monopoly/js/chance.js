// ─── CHANCE CARDS ────────────────────────────────────────────────────────────
// 15 kartu Chance dengan efek berbeda

const CHANCE_CARDS = [
  {
    id: 'c1', text: 'Maju 3 langkah!', icon: '👣',
    apply: (player, game) => {
      const newPos = (player.position + 3) % game.BOARD_SIZE;
      const passed = newPos < player.position;
      if (passed) game.grantStartBonus(player.id);
      return { type:'move', amount:3, newPos, passed };
    }
  },
  {
    id: 'c2', text: 'Mundur 2 langkah!', icon: '↩️',
    apply: (player, game) => {
      let newPos = player.position - 2;
      if (newPos < 0) newPos += game.BOARD_SIZE;
      return { type:'move', amount:-2, newPos };
    }
  },
  {
    id: 'c3', text: 'Dapat uang 200 dari bank!', icon: '💵',
    apply: (player, game) => {
      game.transferMoney(null, player.id, 200);
      return { type:'money', amount:200 };
    }
  },
  {
    id: 'c4', text: 'Bayar pajak administrasi 150!', icon: '📋',
    apply: (player, game) => {
      game.transferMoney(player.id, null, 150);
      return { type:'money', amount:-150 };
    }
  },
  {
    id: 'c5', text: 'Dapat kartu Keluar Penjara!', icon: '🗝️',
    apply: (player, game) => {
      player.jailCard = (player.jailCard || 0) + 1;
      return { type:'jailcard' };
    }
  },
  {
    id: 'c6', text: 'Pindah ke START! Dapat bonus uang!', icon: '🏁',
    apply: (player, game) => {
      game.grantStartBonus(player.id);
      return { type:'move', newPos:0 };
    }
  },
  {
    id: 'c7', text: 'Ambil uang 100 dari setiap pemain!', icon: '🤑',
    apply: (player, game) => {
      let collected = 0;
      game.players.forEach(p => {
        if (p.id !== player.id && !p.bankrupt) {
          game.transferMoney(p.id, player.id, 100);
          collected += 100;
        }
      });
      return { type:'money', amount:collected };
    }
  },
  {
    id: 'c8', text: 'Bayar 100 ke setiap pemain lain!', icon: '💸',
    apply: (player, game) => {
      const others = game.players.filter(p => p.id !== player.id && !p.bankrupt);
      const total = 100 * others.length;
      others.forEach(p => game.transferMoney(player.id, p.id, 100));
      return { type:'money', amount:-total };
    }
  },
  {
    id: 'c9', text: 'Maju ke negara berikutnya!', icon: '✈️',
    apply: (player, game) => {
      // Find next country tile from current position
      let p = (player.position + 1) % game.BOARD_SIZE;
      let tries = 0;
      while (tries < game.BOARD_SIZE && game.BOARD[p].type !== 'country') {
        p = (p + 1) % game.BOARD_SIZE;
        tries++;
      }
      const passed = p < player.position;
      if (passed) game.grantStartBonus(player.id);
      return { type:'move', newPos:p };
    }
  },
  {
    id: 'c10', text: 'Dapat bonus perjalanan 300!', icon: '🌏',
    apply: (player, game) => {
      game.transferMoney(null, player.id, 300);
      return { type:'money', amount:300 };
    }
  },
  {
    id: 'c11', text: 'Denda administrasi! Bayar 120.', icon: '📌',
    apply: (player, game) => {
      game.transferMoney(player.id, null, 120);
      return { type:'money', amount:-120 };
    }
  },
  {
    id: 'c12', text: 'Dapat hibah internasional 400!', icon: '🎁',
    apply: (player, game) => {
      game.transferMoney(null, player.id, 400);
      return { type:'money', amount:400 };
    }
  },
  {
    id: 'c13', text: 'Bayar biaya perawatan negara 200!', icon: '🔧',
    apply: (player, game) => {
      game.transferMoney(player.id, null, 200);
      return { type:'money', amount:-200 };
    }
  },
  {
    id: 'c14', text: 'Ambil kartu Chance lagi!', icon: '🔄',
    apply: (player, game) => {
      return { type:'drawagain', deck:'chance' };
    }
  },
  {
    id: 'c15', text: 'Pindah ke negara acak!', icon: '🎲',
    apply: (player, game) => {
      const countryTiles = game.BOARD
        .map((t,i) => ({t,i}))
        .filter(x => x.t.type === 'country');
      const target = countryTiles[Math.floor(Math.random() * countryTiles.length)];
      const passed = target.i < player.position;
      if (passed) game.grantStartBonus(player.id);
      return { type:'move', newPos:target.i };
    }
  },
];

// Shuffle deck
function shuffleChance() {
  const deck = [...CHANCE_CARDS];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

// Draw from deck (auto reshuffle when empty)
let _chanceDeck = [];
function drawChanceCard() {
  if (_chanceDeck.length === 0) _chanceDeck = shuffleChance();
  return _chanceDeck.pop();
}
