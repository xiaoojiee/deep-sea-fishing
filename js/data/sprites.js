window.FG = window.FG || {};

/*
 * 贴图资源
 *
 *  鱼：拆成两张图集，因为两排鱼的画法不同 ——
 *    fish_r1.png  第一排，4 格，原样不旋转
 *    fish_r2.png  第二排，4 格，整块像素网格旋转回水平 + 水平翻转
 *    两张都是 192x48，每格 48px（原图 16px 放大 2 倍 + 旋转留白，内容 32px）
 *    旋转用最近邻，像素值不改、不插值，只是把像素网格整体转过去
 *
 *  钓鱼人：蓝色大肥鱼4-4.png
 *    256x256，4 列 x 4 行，但精灵实际间距是 34x36、本体 24x26，
 *    整体位于 x64..191 / y60..195，右下角一格为空（共 15 个变种）
 */

FG.ART = {
  version: 5,             // 换贴图时 +1，避免浏览器拿缓存的旧图
  cell: 48,               // 每格边长
  content: 32,            // 格子里鱼本体占的边长
  sheets: {
    r1: 'js/贴图/fish_r1.png',
    r2: 'js/贴图/fish_r2.png'
  },
  fisher: {
    file: 'js/贴图/蓝色大肥鱼4-4.png',
    x0: 64, y0: 60, w: 24, h: 26, pitchX: 34, pitchY: 36,
    cols: 4, rows: 4,
    blank: [3, 3],        // 右下角那格是空的
    scale: 2              // 整数倍放大
  }
};

/* 鱼种 → 图集 + 格子号 + 染色（tint=null 保留原色） */
FG.FISH_SPRITE = {
  /* 透光层 */
  crucian:    { sheet: 'r1', cell: 0, tint: '#8fd6a0', amt: 0.34 },
  sardine:    { sheet: 'r1', cell: 2, tint: '#cfe6f2', amt: 0.30 },
  carp:       { sheet: 'r2', cell: 2, tint: '#e0a63c', amt: 0.42 },
  grasscarp:  { sheet: 'r2', cell: 0, tint: null, amt: 0 },
  catfish:    { sheet: 'r1', cell: 1, tint: '#7c7f68', amt: 0.40 },
  snakehead:  { sheet: 'r2', cell: 1, tint: '#41523f', amt: 0.52 },
  topmouth:   { sheet: 'r1', cell: 2, tint: '#b9d0dd', amt: 0.46 },
  mandarin:   { sheet: 'r2', cell: 2, tint: '#d8b45a', amt: 0.46 },
  blackcarp:  { sheet: 'r2', cell: 0, tint: '#38424a', amt: 0.55 },
  sturgeon:   { sheet: 'r1', cell: 3, tint: '#5d6a72', amt: 0.50 },
  goldkoi:    { sheet: 'r2', cell: 2, tint: '#ffcf3f', amt: 0.36 },

  /* 弱光层 */
  lanternfish: { sheet: 'r1', cell: 0, tint: '#3d6a8c', amt: 0.52 },
  lancetfish:  { sheet: 'r1', cell: 2, tint: '#6d7f8e', amt: 0.50 },
  oarfish:     { sheet: 'r1', cell: 3, tint: '#dbe4ee', amt: 0.42 },
  fireflysquid:{ sheet: 'r1', cell: 1, tint: '#7a5ab0', amt: 0.50 },
  ghostshark:  { sheet: 'r1', cell: 3, tint: '#9fb6c6', amt: 0.34 },
  megamouth:   { sheet: 'r2', cell: 1, tint: '#5a6168', amt: 0.55 },

  /* 无光层 */
  dragonfish:  { sheet: 'r1', cell: 2, tint: '#3a2456', amt: 0.55 },
  anglerfish:  { sheet: 'r1', cell: 1, tint: '#6b4a26', amt: 0.52 },
  vampiresquid:{ sheet: 'r1', cell: 1, tint: '#7c1f33', amt: 0.58 },
  giantsquid:  { sheet: 'r2', cell: 2, tint: '#a33232', amt: 0.58 },

  /* 深渊层 */
  hadalfish:   { sheet: 'r1', cell: 3, tint: '#e4d8f2', amt: 0.46 },
  frilledshark:{ sheet: 'r2', cell: 0, tint: '#5d5b46', amt: 0.55 },
  abyss:       { sheet: 'r1', cell: 3, tint: '#7a4ad0', amt: 0.62 },

  /* 超深渊层 */
  marianasnail: { sheet: 'r1', cell: 0, tint: '#f0e6ff', amt: 0.50 },
  ghostlyeel:   { sheet: 'r1', cell: 2, tint: '#4a5a80', amt: 0.55 },
  dragonking:   { sheet: 'r2', cell: 2, tint: '#a0293f', amt: 0.58 }
};

FG.Art = {
  imgs: {},
  fisherImg: null,
  ready: false,
  failed: false,
  caches: {},
  fisherCache: null,
  fisherVariant: 0,

  load: function (done) {
    var self = this;
    var keys = [];
    for (var k in FG.ART.sheets) keys.push(k);
    var total = keys.length + 1;
    var left = total;
    var step = function () { left--; if (left <= 0) { self.ready = !self.failed; self.build(); done && done(); } };

    keys.forEach(function (k) {
      var im = new Image();
      im.onload = step;
      im.onerror = function () { self.failed = true; step(); };
      im.src = FG.ART.sheets[k] + '?v=' + FG.ART.version;
      self.imgs[k] = im;
    });

    var b = new Image();
    b.onload = function () { self.fisherImg = b; step(); };
    b.onerror = function () { self.failed = true; step(); };
    b.src = FG.ART.fisher.file + '?v=' + FG.ART.version;
  },

  // 从图集里取一格，可选染色，缓存成离屏 canvas
  makeTinted: function (img, sx, sy, sw, sh, tint, amt) {
    var cv = document.createElement('canvas');
    cv.width = sw; cv.height = sh;
    var c = cv.getContext('2d');
    c.imageSmoothingEnabled = false;
    c.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
    if (tint && amt > 0) {
      c.globalCompositeOperation = 'source-atop';
      c.globalAlpha = amt;
      c.fillStyle = tint;
      c.fillRect(0, 0, sw, sh);
      c.globalAlpha = 1;
      c.globalCompositeOperation = 'source-over';
    }
    return cv;
  },

  build: function () {
    if (this.failed) return;
    var C = FG.ART.cell;
    this.caches = {};
    for (var id in FG.FISH_SPRITE) {
      var s = FG.FISH_SPRITE[id];
      var img = this.imgs[s.sheet];
      if (!img || !img.width) continue;
      this.caches[id] = this.makeTinted(img, s.cell * C, 0, C, C, s.tint, s.amt);
    }
    if (this.fisherImg && this.fisherImg.width) {
      var f = FG.ART.fisher;
      var v = this.fisherVariant;
      var vc = v % f.cols, vr = Math.floor(v / f.cols);
      if (f.blank && f.blank[0] === vr && f.blank[1] === vc) { vc = 0; vr = 0; }
      this.fisherCache = this.makeTinted(this.fisherImg,
        f.x0 + vc * f.pitchX, f.y0 + vr * f.pitchY, f.w, f.h, null, 0);
    }
  },

  pickFisher: function (seed) {
    var f = FG.ART.fisher;
    var picks = [];
    for (var i = 0; i < f.cols * f.rows; i++) {
      var c = i % f.cols, r = Math.floor(i / f.cols);
      if (f.blank && f.blank[0] === r && f.blank[1] === c) continue;
      picks.push(i);
    }
    this.fisherVariant = picks[Math.abs(seed) % picks.length];
    if (this.fisherImg) this.build();
  },

  get: function (speciesId) { return this.caches[speciesId] || null; }
};

/* 画一条鱼：优先用贴图，没有就退回矢量画法 */
FG.drawFishSprite = function (ctx, sp, x, y, size, dir, alpha, king) {
  var cv = FG.Art.ready ? FG.Art.get(sp.id) : null;
  if (!cv) return false;
  var S = FG.SHAPE[sp.shape] || FG.SHAPE.normal;
  // 鱼本体只占格子的一部分，所以画布要放大 cell/content 倍才是鱼的实际长度。
  // 体型系数只做轻微影响，不然鳗形的鱼会长得离谱。
  var L = size * (0.78 + 0.22 * S.L) * (FG.ART.cell / FG.ART.content);
  ctx.save();
  ctx.globalAlpha = alpha === undefined ? 1 : alpha;
  ctx.translate(x, y);
  // 贴图本体头朝左，dir=1（向右游）时水平镜像
  ctx.scale(-(dir || 1), 1);
  ctx.imageSmoothingEnabled = false;
  if (king) {
    ctx.shadowColor = 'rgba(255, 205, 90, .95)';
    ctx.shadowBlur = 22;
  }
  ctx.drawImage(cv, -L / 2, -L / 2, L, L);
  ctx.restore();
  return true;
};

FG.drawAnyFish = function (ctx, sp, x, y, size, dir, alpha, king) {
  if (!FG.drawFishSprite(ctx, sp, x, y, size, dir, alpha, king)) {
    FG.drawFishShape(ctx, sp, x, y, size, dir, alpha, king);
  }
};
