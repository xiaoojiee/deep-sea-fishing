window.FG = window.FG || {};

FG.RNG = {
  rand: function (a, b) { return a + Math.random() * (b - a); },
  int: function (a, b) { return Math.floor(a + Math.random() * (b - a + 1)); },
  pick: function (arr) { return arr[Math.floor(Math.random() * arr.length)]; },
  chance: function (p) { return Math.random() < p; },
  sign: function () { return Math.random() < 0.5 ? -1 : 1; },
  lerp: function (a, b, t) { return a + (b - a) * t; },
  clamp: function (v, a, b) { return v < a ? a : (v > b ? b : v); },
  round: function (v, n) { var m = Math.pow(10, n || 0); return Math.round(v * m) / m; },

  weighted: function (items, weightFn) {
    var total = 0, i, w, list = [];
    for (i = 0; i < items.length; i++) {
      w = Math.max(0, weightFn(items[i]));
      list.push(w);
      total += w;
    }
    if (total <= 0) return items[0];
    var r = Math.random() * total;
    for (i = 0; i < items.length; i++) {
      r -= list[i];
      if (r <= 0) return items[i];
    }
    return items[items.length - 1];
  }
};

FG.rollSize = function (sp) {
  var r = Math.random();
  var w = sp.wmin + (sp.wmax - sp.wmin) * Math.pow(r, 2.2);
  var king = false;
  if (Math.random() < FG.CFG.KING_CHANCE) {
    king = true;
    w = sp.wmax * (1.05 + Math.random() * 0.4);
  }
  w = FG.RNG.round(w, 2);
  if (w < 0.05) w = 0.05;
  return { weight: w, king: king };
};

FG.staminaOf = function (sp, weight) {
  return sp.stamina * Math.pow(weight / sp.avg, 1.2);
};

FG.strengthOf = function (sp, weight) {
  return sp.strength * Math.pow(weight / sp.avg, 1.1);
};

// 贴图大小完全由体重决定：0.05kg≈10px，400kg≈48px，鱼王会明显更大
FG.fishSizePx = function (weight) {
  var t = Math.pow(FG.RNG.clamp(weight, 0.05, 400) / 400, 0.42);
  return 10 + 38 * t;
};

// 鱼的实际身长（含体型系数：鳗形更长、扁平型更短）
FG.fishLenPx = function (sp, weight) {
  var sh = FG.SHAPE[sp.shape] || FG.SHAPE.normal;
  return FG.fishSizePx(weight) * sh.L;
};

// 在给定画框里按体型算出 drawFishShape 的 size 参数，保证不会画出框
FG.fishDrawSize = function (sp, weight, box) {
  var sh = FG.SHAPE[sp.shape] || FG.SHAPE.normal;
  var t = FG.RNG.clamp(FG.fishLenPx(sp, weight) / 100, 0, 1);
  return (box * (0.40 + 0.34 * t)) / sh.L;
};
