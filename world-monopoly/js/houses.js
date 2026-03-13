// ─── HOUSES SYSTEM ───────────────────────────────────────────────────────────
// Mengelola pembelian dan tampilan rumah

const Houses = {
  // Max 5 rumah per negara
  MAX_HOUSES: 5,

  // Hitung harga rumah berdasarkan jumlah yang sudah ada
  getBuildCost(country, currentHouses) {
    if (!country) return 0;
    // Base cost dari data negara
    return country.houseCost;
  },

  // Hitung total biaya untuk membeli N rumah
  getTotalCost(country, currentHouses, additionalHouses) {
    if (!country || additionalHouses <= 0) return 0;
    return country.houseCost * additionalHouses;
  },

  // Validasi apakah bisa membeli rumah
  canBuild(player, country, ownership, additionalHouses) {
    if (!country || !ownership) return { ok: false, reason: 'Negara tidak ditemukan' };
    if (ownership.ownerId !== player.id) return { ok: false, reason: 'Bukan negaramu' };

    const currentHouses = ownership.houses || 0;
    if (currentHouses + additionalHouses > this.MAX_HOUSES) {
      return { ok: false, reason: `Maksimal ${this.MAX_HOUSES} rumah` };
    }

    const cost = this.getTotalCost(country, currentHouses, additionalHouses);
    if (player.money < cost) {
      return { ok: false, reason: `Uang tidak cukup (butuh ${cost})` };
    }

    return { ok: true, cost };
  },

  // Generate HTML untuk ikon rumah
  renderHouseIcons(count) {
    if (count <= 0) return '';
    const icons = [];
    for (let i = 0; i < count; i++) {
      icons.push('<div class="tile-house"></div>');
    }
    return `<div class="tile-houses">${icons.join('')}</div>`;
  },

  // Generate HTML tooltip info rumah
  renderHouseInfo(country, houses) {
    if (!country) return '';
    const rows = [];
    for (let h = 0; h <= this.MAX_HOUSES; h++) {
      const rent = getCountryRent(country, h);
      rows.push(`<div style="display:flex;justify-content:space-between;gap:12px;font-size:.75rem;padding:2px 0">
        <span style="color:var(--text2)">${h === 0 ? 'Dasar' : h + ' 🏠'}</span>
        <span style="font-family:var(--mono);color:${h===houses?'var(--yellow)':'var(--text)'};font-weight:${h===houses?'800':'400'}">
          ${rent}
        </span>
      </div>`);
    }
    return rows.join('');
  },
};
