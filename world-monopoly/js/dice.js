// ─── DICE SYSTEM ─────────────────────────────────────────────────────────────
// Sistem dadu dengan animasi

const DICE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
const DICE_NUMS  = ['1', '2', '3', '4', '5', '6'];

const Dice = {
  _rolling: false,

  // Roll satu dadu, return 1-6
  rollOne() {
    return Math.floor(Math.random() * 6) + 1;
  },

  // Roll dua dadu dengan animasi, return Promise<{d1, d2, total}>
  rollWithAnimation(el1, el2) {
    return new Promise((resolve) => {
      if (this._rolling) return;
      this._rolling = true;

      el1.classList.add('rolling');
      el2.classList.add('rolling');

      // Fake roll animation
      let ticks = 0;
      const interval = setInterval(() => {
        el1.textContent = DICE_FACES[Math.floor(Math.random() * 6)];
        el2.textContent = DICE_FACES[Math.floor(Math.random() * 6)];
        ticks++;
        if (ticks >= 8) {
          clearInterval(interval);
          const d1 = this.rollOne();
          const d2 = this.rollOne();
          el1.textContent = DICE_FACES[d1 - 1];
          el2.textContent = DICE_FACES[d2 - 1];
          el1.classList.remove('rolling');
          el2.classList.remove('rolling');
          this._rolling = false;
          resolve({ d1, d2, total: d1 + d2 });
        }
      }, 80);
    });
  },

  // Set display without animation
  setDisplay(el1, el2, d1, d2) {
    if (el1) el1.textContent = DICE_FACES[d1 - 1];
    if (el2) el2.textContent = DICE_FACES[d2 - 1];
  },

  isRolling() { return this._rolling; },
};
