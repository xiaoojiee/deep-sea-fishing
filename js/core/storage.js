window.FG = window.FG || {};

FG.Storage = {
  KEY: 'fishing_game_save_v1',

  save: function (game) {
    try {
      var data = {
        money: game.money,
        inventory: game.inventory,
        equip: game.equip,
        baits: game.baits,
        baitId: game.baitId,
        codex: game.codex,
        stats: game.stats,
        settings: game.settings
      };
      localStorage.setItem(this.KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      return false;
    }
  },

  load: function () {
    try {
      var raw = localStorage.getItem(this.KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  },

  clear: function () {
    try { localStorage.removeItem(this.KEY); } catch (e) { }
  }
};
