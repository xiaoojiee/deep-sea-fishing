window.FG = window.FG || {};

FG.Economy = {
  valueOf: function (sp, weight, king) {
    var v = sp.price * weight * Math.pow(weight / sp.avg, 0.4);
    if (king) v *= FG.CFG.KING_MULT;
    return Math.max(1, Math.round(v));
  },

  makeCatch: function (sp, weight, king) {
    return {
      uid: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      spId: sp.id,
      weight: weight,
      king: king,
      value: this.valueOf(sp, weight, king)
    };
  },

  addToBag: function (game, catchItem) {
    game.inventory.push(catchItem);
    if (game.inventory.length > 200) game.inventory.shift();

    var sp = FG.fishById(catchItem.spId);
    var rec = game.codex[catchItem.spId];
    if (!rec) rec = game.codex[catchItem.spId] = { count: 0, max: 0, king: false };
    rec.count++;
    if (catchItem.weight > rec.max) rec.max = catchItem.weight;
    if (catchItem.king) rec.king = true;

    game.stats.caught++;
    if (catchItem.king) game.stats.kings++;
    if (catchItem.weight > game.stats.best) game.stats.best = catchItem.weight;
    void sp;
  },

  sell: function (game, uid) {
    for (var i = 0; i < game.inventory.length; i++) {
      if (game.inventory[i].uid === uid) {
        var v = game.inventory[i].value;
        game.money += v;
        game.inventory.splice(i, 1);
        game.stats.earned = (game.stats.earned || 0) + v;
        return v;
      }
    }
    return 0;
  },

  sellAll: function (game) {
    var total = 0;
    for (var i = 0; i < game.inventory.length; i++) total += game.inventory[i].value;
    game.money += total;
    game.stats.earned = (game.stats.earned || 0) + total;
    game.stats.sold = (game.stats.sold || 0) + game.inventory.length;
    game.inventory.length = 0;
    return total;
  },

  bagValue: function (game) {
    var t = 0;
    for (var i = 0; i < game.inventory.length; i++) t += game.inventory[i].value;
    return t;
  },

  upgradeInfo: function (game, kind) {
    var list = this.listOf(kind);
    var lv = game.equip[kind];
    var next = list[lv + 1];
    return { list: list, level: lv, current: list[lv], next: next || null, maxed: !next };
  },

  listOf: function (kind) {
    if (kind === 'rod') return FG.RODS;
    if (kind === 'line') return FG.LINES;
    if (kind === 'hook') return FG.HOOKS;
    if (kind === 'reel') return FG.REELS;
    return [];
  },

  buyUpgrade: function (game, kind) {
    var info = this.upgradeInfo(game, kind);
    if (!info.next) return { ok: false, msg: '已是最高等级' };
    if (game.money < info.next.price) return { ok: false, msg: '金钱不足' };
    game.money -= info.next.price;
    game.equip[kind]++;
    return { ok: true, msg: '已装备 ' + info.next.name };
  },

  buyBait: function (game, baitId) {
    var b = FG.byId(FG.BAITS, baitId);
    if (!b) return { ok: false, msg: '不存在' };
    var cost = b.price * b.pack;
    if (game.money < cost) return { ok: false, msg: '金钱不足' };
    game.money -= cost;
    game.baits[baitId] = (game.baits[baitId] || 0) + b.pack;
    return { ok: true, msg: '购得 ' + b.name + ' x' + b.pack };
  },

  canCast: function (game) {
    var b = game.baitDef();
    return !!b && (game.baits[b.id] || 0) > 0;
  }
};
