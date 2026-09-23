window.FG = window.FG || {};

FG.CFG = {
  W: 1280,
  H: 720,
  SURFACE: 110,
  H_PX_PER_M: 8.5,
  WORLD_W: 2560,
  BOAT_X: 1280,
  BOAT_SCREEN_X: 92,    // 渔船固定钉在屏幕左边这个位置
  BOAT_SCALE: 1.6,      // 渔船 + 角色整体放大
  FISH_SCALE: 2.7,      // 鱼整体放大（相对最初版本放大一倍）
  CAST_MIN: 150,
  CAST_MAX: 640,
  CAST_DIR: 1,          // 只能朝一边抛竿：1=向右，-1=向左
  CHARGE_TIME: 1.1,
  CAM_ANCHOR: 0.40,
  CAM_MARGIN: 5,
  KING_CHANCE: 0.035,
  KING_MULT: 5,
  LAND_PX: 20,
  LINE_MIN_PX: 700,
  LINE_SLACK: 1.55,
  HOOK_R: 2.4,
  FISH_SWIM_MUL: 2.2,   // 鱼影横向游速倍率（游得快才来得及游进游出）
  MAX_SHADOWS: 20
};

/*
 * 海洋分层（分区压缩：每层独立 px/m，层内线性）
 * 现实分层 1-5；地幔/地星/太空/银河为预留奇幻层，locked=true 暂不开放
 */
FG.ZONES = [
  {
    id: 'epi', name: '海洋上层', alias: '透光层', d0: 0, d1: 200, pxPerM: 6.00,
    top: '#1e7aa8', bottom: '#0d5175', light: 1.00, snow: 0.10, glow: 0.00,
    accent: '#5fc8ff',
    desc: '阳光可穿透，浮游植物光合作用集中，绝大多数海洋生物生活在此。'
  },
  {
    id: 'meso', name: '海洋中层', alias: '弱光层', d0: 200, d1: 1000, pxPerM: 1.10,
    top: '#0b3a58', bottom: '#04172a', light: 0.34, snow: 0.30, glow: 0.45,
    accent: '#4fa8d8',
    desc: '光线微弱，已不足以光合作用；生物多有发光器官，昼夜垂直迁徙。'
  },
  {
    id: 'bathy', name: '海洋深层', alias: '无光层', d0: 1000, d1: 4000, pxPerM: 0.30,
    top: '#04121f', bottom: '#01070e', light: 0.05, snow: 0.62, glow: 0.70,
    accent: '#2f6f96',
    desc: '完全黑暗，水温低且恒定，生物稀少、身体特殊，压力巨大。'
  },
  {
    id: 'abyss', name: '深渊层', alias: '深渊层', d0: 4000, d1: 6000, pxPerM: 0.22,
    top: '#020a12', bottom: '#000306', light: 0.00, snow: 0.48, glow: 0.40,
    accent: '#7a5fd8',
    desc: '漆黑、高压、低温，仅靠上层沉降的「海雪」维持食物链。'
  },
  {
    id: 'hadal', name: '超深渊层', alias: '海沟带', d0: 6000, d1: 11000, pxPerM: 0.115,
    top: '#000204', bottom: '#000000', light: 0.00, snow: 0.30, glow: 0.32,
    accent: '#c94f8a',
    desc: '最深的海沟带，马里亚纳海沟约 11000m，仍有极端生物存活。'
  },

  /* ───── 以下为预留奇幻层（locked，暂时到不了） ───── */
  {
    id: 'mantle', name: '地幔层', alias: '熔流', d0: 11000, d1: 20000, pxPerM: 0.050,
    top: '#2a0d06', bottom: '#12040a', light: 0.00, snow: 0.25, glow: 0.85,
    accent: '#ff6b2c', locked: true,
    desc: '穿透海床之后，是缓慢流动的炽热岩层。这里的「鱼」不需要氧气。'
  },
  {
    id: 'core', name: '地星层', alias: '地心', d0: 20000, d1: 32000, pxPerM: 0.040,
    top: '#3a1206', bottom: '#1a0508', light: 0.00, snow: 0.20, glow: 1.00,
    accent: '#ffd24a', locked: true,
    desc: '行星的心脏。金属在流动，磁场在呼吸。'
  },
  {
    id: 'space', name: '太空', alias: '近地轨道', d0: 32000, d1: 44000, pxPerM: 0.030,
    top: '#01030a', bottom: '#000014', light: 0.00, snow: 0.12, glow: 0.60,
    accent: '#9fd0ff', locked: true,
    desc: '已经没有水了。鱼钩挂着一根不断变细的线，垂向群星。'
  },
  {
    id: 'galaxy', name: '银河', alias: '天河', d0: 44000, d1: 60000, pxPerM: 0.020,
    top: '#080318', bottom: '#02000a', light: 0.00, snow: 0.10, glow: 1.00,
    accent: '#e0b0ff', locked: true,
    desc: '银河也是河。这里钓上来的东西，最好别细看。'
  }
];

(function buildZoneIndex() {
  var acc = FG.CFG.SURFACE;
  for (var i = 0; i < FG.ZONES.length; i++) {
    var z = FG.ZONES[i];
    z.h = (z.d1 - z.d0) * z.pxPerM;
    z.y0 = acc;
    z.y1 = acc + z.h;
    if (!z.locked) acc += z.h;
  }
  var act = FG.ZONES.filter(function (z) { return !z.locked; });
  FG.ACTIVE_ZONES = act;
  FG.DEPTH_MAX = act[act.length - 1].d1;
  FG.WORLD_BOTTOM = act[act.length - 1].y1;
})();

FG.depthToY = function (d) {
  if (d <= 0) return FG.CFG.SURFACE;
  for (var i = 0; i < FG.ZONES.length; i++) {
    var z = FG.ZONES[i];
    if (d <= z.d1) return z.y0 + (d - z.d0) * z.pxPerM;
  }
  var last = FG.ZONES[FG.ZONES.length - 1];
  return last.y1;
};

FG.yToDepth = function (y) {
  for (var i = 0; i < FG.ZONES.length; i++) {
    var z = FG.ZONES[i];
    if (y <= z.y1) return z.d0 + (y - z.y0) / z.pxPerM;
  }
  return FG.ZONES[FG.ZONES.length - 1].d1;
};

FG.pxPerM = function (d) {
  for (var i = 0; i < FG.ZONES.length; i++) {
    if (d <= FG.ZONES[i].d1) return FG.ZONES[i].pxPerM;
  }
  return 1;
};

FG.pxPerMAtY = function (y) { return FG.pxPerM(FG.yToDepth(y)); };

FG.zoneAt = function (d) {
  for (var i = 0; i < FG.ZONES.length; i++) {
    if (d <= FG.ZONES[i].d1) return FG.ZONES[i];
  }
  return FG.ZONES[FG.ZONES.length - 1];
};

FG.zoneAtY = function (y) { return FG.zoneAt(FG.yToDepth(y)); };

FG.mToPxH = function (m) { return m * FG.CFG.H_PX_PER_M; };
FG.pxToMH = function (px) { return px / FG.CFG.H_PX_PER_M; };
/* 物体尺寸统一用水平比例换算，保持屏幕上大小一致 */
FG.mToPx = FG.mToPxH;
FG.pxToM = FG.pxToMH;

FG.formatDepth = function (d) {
  if (d >= 1000) return (d / 1000).toFixed(2) + 'km';
  return d.toFixed(1) + 'm';
};
