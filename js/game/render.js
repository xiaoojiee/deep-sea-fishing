window.FG = window.FG || {};

FG.SHAPE = {
  normal: { L: 1.00, H: 0.56 },
  long:   { L: 1.38, H: 0.44 },
  flat:   { L: 0.86, H: 0.64 },
  eel:    { L: 1.75, H: 0.30 }
};

FG.drawFishShape = function (ctx, sp, x, y, size, dir, alpha, king) {
  var sh = FG.SHAPE[sp.shape] || FG.SHAPE.normal;
  var L = size * sh.L;
  var Hh = size * sh.H;
  var rx = L / 2, ry = Hh / 2;
  dir = dir || 1;

  ctx.save();
  ctx.globalAlpha = alpha === undefined ? 1 : alpha;
  ctx.translate(x, y);
  ctx.scale(dir, 1);

  if (king) {
    ctx.shadowColor = 'rgba(255, 205, 90, .95)';
    ctx.shadowBlur = 22;
  }

  ctx.beginPath();
  ctx.moveTo(-rx * 0.82, 0);
  ctx.lineTo(-rx * 1.52, -ry * 0.95);
  ctx.lineTo(-rx * 1.18, 0);
  ctx.lineTo(-rx * 1.52, ry * 0.95);
  ctx.closePath();
  ctx.fillStyle = sp.color2;
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(rx * 0.12, -ry * 0.86);
  ctx.lineTo(-rx * 0.28, -ry * 1.5);
  ctx.lineTo(-rx * 0.5, -ry * 0.8);
  ctx.closePath();
  ctx.fillStyle = sp.color2;
  ctx.fill();

  var g = ctx.createLinearGradient(0, -ry, 0, ry);
  g.addColorStop(0, sp.color2);
  g.addColorStop(0.45, sp.color);
  g.addColorStop(1, sp.color2);
  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.beginPath();
  ctx.moveTo(rx * 0.15, ry * 0.15);
  ctx.lineTo(-rx * 0.2, ry * 0.82);
  ctx.lineTo(-rx * 0.05, ry * 0.1);
  ctx.closePath();
  ctx.fillStyle = sp.color2;
  ctx.globalAlpha *= 0.85;
  ctx.fill();
  ctx.globalAlpha = alpha === undefined ? 1 : alpha;

  ctx.beginPath();
  ctx.arc(rx * 0.62, -ry * 0.22, Math.max(1.3, size * 0.045), 0, Math.PI * 2);
  ctx.fillStyle = '#0d1418';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(rx * 0.64, -ry * 0.28, Math.max(0.6, size * 0.018), 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  ctx.restore();
};

FG.render = {
  canvas: null,
  ctx: null,
  W: 0, H: 0, dpr: 1,
  scale: 1, ox: 0, oy: 0,
  camX: 640, camY: 0,
  rodTip: { x: 0, y: 0 },
  stars: [],
  ambient: [],
  t: 0,

  init: function (canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.camY = 0;
    // 渔船钉在屏幕左边，相机横向不再移动
    this.camX = FG.CFG.BOAT_X - FG.CFG.BOAT_SCREEN_X;
    this.stars = [];
    for (var i = 0; i < 150; i++) {
      this.stars.push({
        x: Math.random() * FG.CFG.WORLD_W,
        y: Math.random() * (FG.CFG.SURFACE - 10),
        r: Math.random() * 1.5 + 0.4,
        p: Math.random() * 6.28
      });
    }
    this.ambient = [];
    this.resize();
  },

  resize: function () {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = window.innerWidth, h = window.innerHeight;
    this.dpr = dpr;
    this.W = w; this.H = h;
    this.canvas.width = Math.floor(w * dpr);
    this.canvas.height = Math.floor(h * dpr);
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.scale = Math.min(w / FG.CFG.W, h / FG.CFG.H);
    this.ox = (w - FG.CFG.W * this.scale) / 2;
    this.oy = (h - FG.CFG.H * this.scale) / 2;
  },

  /* 贴图落点吸附到设备像素网格：
     最近邻采样本身是锐利的，但每帧落在半像素上会来回蹭（抖）。
     只要把目标坐标对齐到真实屏幕像素，就同时做到「锐利」和「不抖」。 */
  snapX: function (w) {
    var k = this.scale * this.dpr;
    return k > 0 ? Math.round((w - this.camX) * k) / k + this.camX : w;
  },
  snapY: function (w) {
    var k = this.scale * this.dpr;
    return k > 0 ? Math.round((w - this.camY) * k) / k + this.camY : w;
  },

  toWorld: function (clientX, clientY) {
    var r = this.canvas.getBoundingClientRect();
    return {
      x: (clientX - r.left - this.ox) / this.scale + this.camX,
      y: (clientY - r.top - this.oy) / this.scale + this.camY
    };
  },

  viewH: function () { return FG.CFG.H; },

  camMaxY: function () {
    return Math.max(0, FG.WORLD_BOTTOM + 150 - FG.CFG.H);
  },

  updateCamera: function (game, dt) {
    var ty = FG.RNG.clamp((game.hook ? game.hook.y : FG.CFG.SURFACE) - FG.CFG.H * FG.CFG.CAM_ANCHOR,
      0, this.camMaxY());
    this.camX = FG.CFG.BOAT_X - FG.CFG.BOAT_SCREEN_X;

    var k = dt > 0 ? Math.min(1, 3.4 * dt) : 0;
    this.camY += (ty - this.camY) * k;
  },

  draw: function (game, dt) {
    var ctx = this.ctx;
    this.t += dt;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.fillStyle = '#01040a';
    ctx.fillRect(0, 0, this.W, this.H);

    ctx.save();
    ctx.translate(this.ox, this.oy);
    ctx.scale(this.scale, this.scale);

    var vx0 = -this.ox / this.scale, vx1 = (this.W - this.ox) / this.scale;
    var vy0 = -this.oy / this.scale, vy1 = (this.H - this.oy) / this.scale;

    this.updateCamera(game, dt);
    var camX = this.camX, camY = this.camY;

    var wx0 = vx0 + camX, wx1 = vx1 + camX;
    var wTop = vy0 + camY, wBot = vy1 + camY;

    ctx.save();
    if (game.shake > 0.5) {
      ctx.translate(FG.RNG.rand(-game.shake, game.shake) * 0.5,
                    FG.RNG.rand(-game.shake, game.shake) * 0.5);
    }
    ctx.translate(-camX, -camY);

    this.drawBackdrop(ctx, wx0, wx1, wTop, wBot);

    ctx.save();
    ctx.beginPath();
    ctx.rect(wx0, wTop, wx1 - wx0, wBot - wTop);
    ctx.clip();

    this.drawDepthGrid(ctx, wx0, wx1, wTop, wBot);
    this.drawRays(ctx, wx0, wx1, wTop);
    this.updateAmbient(dt, wx0, wx1, wTop, wBot);
    this.drawAmbient();
    this.drawSurface(ctx, wx0, wx1);
    this.drawBoat(game);
    this.drawDebris(game);
    this.drawShadows(game);
    this.drawBubbles(game);
    this.drawLine(game);
    this.drawParticles(game);
    this.drawFloatText(game);
    ctx.restore();

    ctx.restore();

    this.drawDepthGauge(game);
    this.drawCastHints(game);
    ctx.restore();
  },

  backdropGradient: function (ctx, y0, y1) {
    var g = ctx.createLinearGradient(0, Math.max(0, y0), 0, Math.max(1, y1));
    var a = FG.ACTIVE_ZONES;
    var top = a[0].y0, total = a[a.length - 1].y1 - top;
    for (var i = 0; i < a.length; i++) {
      var z = a[i];
      g.addColorStop(FG.RNG.clamp((z.y0 - top) / total, 0, 1), z.top);
      g.addColorStop(FG.RNG.clamp((z.y1 - top) / total, 0, 1), z.bottom);
    }
    return g;
  },

  drawBackdrop: function (ctx, x0, x1, top, bottom) {
    var S = FG.CFG.SURFACE;

    if (top < S) {
      var skyTop = Math.min(top, -320);
      var g = ctx.createLinearGradient(0, skyTop, 0, S);
      g.addColorStop(0, '#04101c');
      g.addColorStop(0.65, '#0a2740');
      g.addColorStop(1, '#155a83');
      ctx.fillStyle = g;
      ctx.fillRect(x0, skyTop, x1 - x0, S - skyTop);

      ctx.save();
      for (var i = 0; i < this.stars.length; i++) {
        var st = this.stars[i];
        if (st.x < x0 || st.x > x1) continue;
        ctx.globalAlpha = (0.35 + 0.65 * Math.abs(Math.sin(this.t * 1.3 + st.p))) * 0.7;
        ctx.fillStyle = '#dff2ff';
        ctx.beginPath();
        ctx.arc(st.x, st.y, st.r, 0, 6.2832);
        ctx.fill();
      }
      ctx.restore();

      ctx.save();
      var mx = x0 + (x1 - x0) * 0.83;
      ctx.beginPath();
      ctx.arc(mx, 52, 22, 0, 6.2832);
      ctx.fillStyle = '#e9f6ff';
      ctx.shadowColor = 'rgba(200, 235, 255, .9)';
      ctx.shadowBlur = 34;
      ctx.fill();
      ctx.restore();
    }

    var wTop = Math.max(S, top);
    ctx.fillStyle = this.backdropGradient(ctx, S, FG.WORLD_BOTTOM);
    ctx.fillRect(x0, wTop, x1 - x0, bottom - wTop + 6);

    // 海沟底部地形（只在最后一个可见层的底部）
    var fy = FG.WORLD_BOTTOM;
    if (bottom > fy - 200) {
      var floorBot = Math.max(bottom + 400, fy + 420);
      ctx.beginPath();
      ctx.moveTo(x0, floorBot);
      ctx.lineTo(x0, fy);
      for (var x = x0; x <= x1; x += 42) {
        ctx.lineTo(x, fy + Math.sin(x * 0.011) * 16 + Math.sin(x * 0.031) * 8);
      }
      ctx.lineTo(x1, fy);
      ctx.lineTo(x1, floorBot);
      ctx.closePath();
      ctx.fillStyle = '#050c12';
      ctx.fill();
    }

    // 层与层之间的分界带
    var a = FG.ACTIVE_ZONES;
    for (var k = 1; k < a.length; k++) {
      var z = a[k];
      var by = z.y0;
      if (by < top - 60 || by > bottom + 60) continue;
      var bg = ctx.createLinearGradient(0, by - 46, 0, by + 46);
      bg.addColorStop(0, 'rgba(255,255,255,0)');
      bg.addColorStop(0.5, 'rgba(180,225,255,.055)');
      bg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = bg;
      ctx.fillRect(x0, by - 46, x1 - x0, 92);
    }
  },

  niceStep: function (span, n) {
    var raw = span / Math.max(1, n);
    var p = Math.pow(10, Math.floor(Math.log10(Math.max(1e-6, raw))));
    var m = raw / p;
    var s = (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * p;
    return s;
  },

  drawDepthGrid: function (ctx, x0, x1, top, bottom) {
    ctx.save();
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'left';
    var i, z, d;
    for (i = 0; i < FG.ACTIVE_ZONES.length; i++) {
      z = FG.ACTIVE_ZONES[i];
      if (z.y1 < top - 40 || z.y0 > bottom + 40) continue;

      var step = this.niceStep(z.d1 - z.d0, Math.max(2, Math.round(z.h / 120)));
      var start = Math.ceil(z.d0 / step) * step;
      for (d = start; d <= z.d1 + 1e-6; d += step) {
        var y = FG.depthToY(d);
        if (y < top - 20) continue;
        if (y > bottom + 20) break;
        var isBorder = Math.abs(d - z.d0) < 1e-6 || Math.abs(d - z.d1) < 1e-6;
        ctx.strokeStyle = 'rgba(140, 210, 255, ' + (isBorder ? 0.16 : 0.07) + ')';
        ctx.setLineDash(isBorder ? [] : [5, 10]);
        ctx.beginPath();
        ctx.moveTo(x0, y);
        ctx.lineTo(x1, y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(140, 210, 255, .32)';
        ctx.fillText(FG.formatDepth(d), x0 + 12, y - 5);
      }

      // 层名
      if (z.y1 > top - 40 && z.y0 < bottom + 40) {
        var ly = FG.RNG.clamp(FG.depthToY((z.d0 + z.d1) / 2), top + 40, bottom - 20);
        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.font = 'bold 15px sans-serif';
        ctx.fillStyle = z.accent;
        ctx.fillText(z.name + ' · ' + z.alias, x0 + 12, ly);
        ctx.font = '11px sans-serif';
        ctx.globalAlpha = 0.32;
        ctx.fillStyle = '#cfe9ff';
        ctx.fillText(FG.formatDepth(z.d0) + ' – ' + FG.formatDepth(z.d1), x0 + 12, ly + 16);
        ctx.restore();
      }
    }
    ctx.restore();
  },

  drawRays: function (ctx, x0, x1, top) {
    var S = FG.CFG.SURFACE;
    var epi = FG.ACTIVE_ZONES[0];
    if (top > epi.y1 + 60) return;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x0, epi.y0, x1 - x0, epi.y1 - epi.y0 + 120);
    ctx.clip();
    ctx.globalCompositeOperation = 'lighter';
    var step = 260;
    var start = Math.floor(x0 / step) * step;
    for (var x = start; x <= x1 + step; x += step) {
      var i = Math.round(x / step);
      var o = Math.sin(this.t * 0.22 + i * 1.7) * 60;
      var rx = x + o;
      var g = ctx.createLinearGradient(rx, S, rx + 120, S + 1100);
      g.addColorStop(0, 'rgba(150, 225, 255, .085)');
      g.addColorStop(1, 'rgba(150, 225, 255, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(rx, S);
      ctx.lineTo(rx + 46, S);
      ctx.lineTo(rx + 300, S + 1100);
      ctx.lineTo(rx + 10, S + 1100);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  },

  zoneDensity: function (wTop, wBot) {
    var i, z, sum = 0, n = 0;
    for (i = 0; i < FG.ACTIVE_ZONES.length; i++) {
      z = FG.ACTIVE_ZONES[i];
      var o0 = Math.max(z.y0, wTop), o1 = Math.min(z.y1, wBot);
      if (o1 <= o0) continue;
      sum += z.snow * (o1 - o0);
      n += (o1 - o0);
    }
    return n > 0 ? sum / n : 0.2;
  },

  makeAmbient: function (wx0, wx1, wTop, wBot) {
    var z = FG.zoneAtY(FG.RNG.rand(wTop, wBot));
    var glow = Math.random() < z.glow;
    return {
      x: FG.RNG.rand(wx0, wx1),
      y: FG.RNG.rand(wTop, wBot),
      r: glow ? FG.RNG.rand(1.0, 2.4) : FG.RNG.rand(0.7, 2.0),
      vx: FG.RNG.rand(-8, 8),
      vy: glow ? FG.RNG.rand(-6, 6) : FG.RNG.rand(9, 26),
      ph: Math.random() * 6.28,
      glow: glow,
      color: glow ? FG.RNG.pick(['#7ff0ff', '#a0ffd0', '#ff9fd8', '#c0b0ff']) : '#cfe4f0'
    };
  },

  updateAmbient: function (dt, wx0, wx1, wTop, wBot) {
    var want = Math.round(90 * this.zoneDensity(wTop, wBot)) + 24;
    var i, p;
    while (this.ambient.length < want) this.ambient.push(this.makeAmbient(wx0, wx1, wTop, wBot));
    if (this.ambient.length > want + 40) this.ambient.length = want;
    for (i = 0; i < this.ambient.length; i++) {
      p = this.ambient[i];
      p.y += p.vy * dt;
      p.x += p.vx * dt;
      p.ph += dt * 2.2;
      if (p.y > wBot + 20 || p.y < wTop - 20 || p.x < wx0 - 20 || p.x > wx1 + 20) {
        this.ambient[i] = this.makeAmbient(wx0, wx1, wTop, wBot);
        this.ambient[i].y = FG.RNG.rand(wTop, wBot);
      }
      if (p.y < FG.CFG.SURFACE) p.y = FG.CFG.SURFACE + 2;
    }
  },

  drawAmbient: function () {
    var ctx = this.ctx;
    ctx.save();
    for (var i = 0; i < this.ambient.length; i++) {
      var p = this.ambient[i];
      var a = p.glow ? 0.35 + 0.5 * Math.abs(Math.sin(p.ph)) : 0.30;
      ctx.globalAlpha = a;
      if (p.glow) {
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
      }
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, 6.2832);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    ctx.restore();
  },

  drawSurface: function (ctx, x0, x1) {
    var S = FG.CFG.SURFACE;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x0, S + 20);
    for (var x = x0; x <= x1; x += 12) {
      ctx.lineTo(x, S + Math.sin(x * 0.021 + this.t * 1.6) * 3.4 + Math.sin(x * 0.061 - this.t * 2.3) * 1.6);
    }
    ctx.lineTo(x1, S + 20);
    ctx.closePath();
    var g = ctx.createLinearGradient(0, S - 6, 0, S + 18);
    g.addColorStop(0, 'rgba(190, 240, 255, .55)');
    g.addColorStop(1, 'rgba(190, 240, 255, 0)');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.restore();
  },

  drawBoat: function (game) {
    var ctx = this.ctx;
    var bx = game.boat.x;
    var bob = Math.sin(this.t * 1.6) * 3 + Math.sin(this.t * 0.9) * 1.6;
    var y = FG.CFG.SURFACE + bob;
    var dir = game.boat.rodDir || 1;
    var S = FG.CFG.BOAT_SCALE;

    ctx.save();
    ctx.translate(this.snapX(bx), this.snapY(y));
    ctx.scale(S, S);

    ctx.fillStyle = 'rgba(0,0,0,.25)';
    ctx.beginPath();
    ctx.ellipse(0, 6, 60, 7, 0, 0, 6.2832);
    ctx.fill();

    // 钓鱼人先画，再画船体，这样腿会被船舷挡住，像站在船里而不是站在船前面
    var person = FG.Art && FG.Art.fisherCache;
    if (person) {
      var pw = FG.ART.fisher.w * FG.ART.fisher.scale;
      var ph = FG.ART.fisher.h * FG.ART.fisher.scale;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(person, 14 - pw / 2, 4 - ph, pw, ph);
    } else {
      ctx.fillStyle = '#2f4257';
      ctx.beginPath();
      ctx.ellipse(12, -16, 9, 13, 0, 0, 6.2832);
      ctx.fill();
      ctx.fillStyle = '#e8c9a0';
      ctx.beginPath();
      ctx.arc(12, -32, 8, 0, 6.2832);
      ctx.fill();
      ctx.fillStyle = '#c94f4f';
      ctx.beginPath();
      ctx.ellipse(12, -38, 12, 4, 0, 0, 6.2832);
      ctx.fill();
    }

    ctx.beginPath();
    ctx.moveTo(-56, -6);
    ctx.lineTo(56, -6);
    ctx.lineTo(42, 16);
    ctx.lineTo(-42, 16);
    ctx.closePath();
    ctx.fillStyle = '#6b4a2c';
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-56, -6);
    ctx.lineTo(56, -6);
    ctx.lineTo(52, -1);
    ctx.lineTo(-52, -1);
    ctx.closePath();
    ctx.fillStyle = '#d8c39a';
    ctx.fill();

    ctx.fillStyle = '#8a5a34';
    ctx.fillRect(-48, -30, 36, 24);
    ctx.fillStyle = '#c9e8ff';
    ctx.fillRect(-43, -25, 12, 9);
    ctx.fillRect(-26, -25, 12, 9);

    var rx = person ? 16 : 12, ry = person ? -36 : -34;
    var tipX = rx + dir * 74, tipY = ry - 62;
    ctx.strokeStyle = '#e0d0b0';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(rx, ry);
    ctx.lineTo(tipX, tipY);
    ctx.stroke();
    ctx.restore();

    this.rodTip = {
      x: this.snapX(bx) + (rx + dir * 74) * S,
      y: this.snapY(y) + (ry - 62) * S
    };
  },

  drawDebris: function (game) {
    var ctx = this.ctx;
    if (!game.debris) return;
    for (var i = 0; i < game.debris.length; i++) {
      var d = game.debris[i];
      var y = d.y + Math.sin(d.bob) * d.bobAmp;
      var R = d.rPx;
      ctx.save();
      ctx.translate(d.x, y);
      ctx.rotate(d.rot);
      var t = d.type;
      ctx.fillStyle = t.color;
      ctx.strokeStyle = 'rgba(0,0,0,.35)';
      ctx.lineWidth = 1.5;

      if (t.shape === 'leaf') {
        for (var k = 0; k < 3; k++) {
          ctx.beginPath();
          ctx.ellipse(k * R * 0.5 - R * 0.5, k * R * 0.2 - R * 0.2, R * 0.56, R * 0.31, k * 0.7, 0, 6.2832);
          ctx.fill();
        }
      } else if (t.shape === 'stick') {
        ctx.fillRect(-R, -R * 0.2, R * 2, R * 0.4);
        ctx.beginPath();
        ctx.moveTo(R * 0.36, 0); ctx.lineTo(R, -R * 0.76); ctx.lineTo(R * 0.62, R * 0.13);
        ctx.closePath(); ctx.fill();
      } else if (t.shape === 'bag') {
        ctx.globalAlpha = 0.72;
        ctx.beginPath();
        ctx.ellipse(0, R * 0.1, R * 0.85, R * 0.7, 0, 0, 6.2832);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.moveTo(-R * 0.32, -R * 0.5); ctx.lineTo(0, -R); ctx.lineTo(R * 0.32, -R * 0.5);
        ctx.closePath(); ctx.fill();
      } else if (t.shape === 'weed' || t.shape === 'weedy') {
        ctx.lineWidth = R * 0.22;
        ctx.strokeStyle = t.color;
        for (var w = 0; w < 5; w++) {
          var bx2 = -R + w * (R * 0.5);
          ctx.beginPath();
          ctx.moveTo(bx2, R * 0.6);
          ctx.quadraticCurveTo(bx2 + R * 0.42, 0, bx2 + R * 0.1, -R * 0.8);
          ctx.stroke();
        }
      } else if (t.shape === 'log') {
        ctx.beginPath();
        ctx.ellipse(0, 0, R, R * 0.42, 0, 0, 6.2832);
        ctx.fill();
        ctx.globalAlpha = 0.55;
        ctx.fillStyle = '#2f2113';
        ctx.beginPath();
        ctx.ellipse(R * 0.86, 0, R * 0.17, R * 0.38, 0, 0, 6.2832);
        ctx.fill();
        ctx.globalAlpha = 1;
      } else if (t.shape === 'net') {
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.rect(-R, -R * 0.75, R * 2, R * 1.5);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = 'rgba(230,240,220,.4)';
        ctx.lineWidth = 1;
        for (var n = -R; n < R; n += R * 0.28) {
          ctx.beginPath(); ctx.moveTo(n, -R * 0.75); ctx.lineTo(n, R * 0.75); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(-R, n * 0.75); ctx.lineTo(R, n * 0.75); ctx.stroke();
        }
      } else if (t.shape === 'rock') {
        ctx.beginPath();
        ctx.moveTo(-R, R * 0.7);
        ctx.lineTo(-R * 0.6, -R * 0.6);
        ctx.lineTo(R * 0.2, -R * 0.9);
        ctx.lineTo(R, -R * 0.1);
        ctx.lineTo(R * 0.7, R * 0.7);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.fillRect(-R, -R * 0.7, R * 2, R * 1.4);
        ctx.fillStyle = 'rgba(255,255,255,.08)';
        ctx.fillRect(-R * 0.6, -R * 1.1, R * 0.35, R * 2.2);
        ctx.fillStyle = 'rgba(0,0,0,.35)';
        ctx.fillRect(R * 0.2, -R * 1.5, R * 0.18, R * 1.1);
      }
      ctx.restore();
    }
  },

  drawShadows: function (game) {
    var ctx = this.ctx;
    if (!game.shadows) return;
    for (var i = 0; i < game.shadows.length; i++) {
      var s = game.shadows[i];
      var y = s.y + Math.sin(s.phase) * 3;
      var sz = s.sizePx * 1.35 * FG.CFG.FISH_SCALE;
      FG.drawAnyFish(ctx, s.sp, this.snapX(s.x), this.snapY(y), sz, s.dir, 0.45, s.king);

      if (s.attract > 0.04) {
        ctx.save();
        ctx.globalAlpha = 0.85;
        ctx.strokeStyle = s.king ? '#ffd76a' : '#9fe8ff';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(s.x, y, sz * 0.95 + 12, -Math.PI / 2, -Math.PI / 2 + 6.2832 * s.attract);
        ctx.stroke();
        ctx.globalAlpha = 0.4;
        ctx.strokeStyle = 'rgba(255,255,255,.25)';
        ctx.beginPath();
        ctx.arc(s.x, y, sz * 0.95 + 12, 0, 6.2832);
        ctx.stroke();
        ctx.restore();
      }
    }
  },

  drawBubbles: function (game) {
    var ctx = this.ctx;
    if (!game.bubbles) return;
    ctx.save();
    for (var i = 0; i < game.bubbles.length; i++) {
      var b = game.bubbles[i];
      ctx.globalAlpha = Math.max(0, b.life) * 0.5;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, 6.2832);
      ctx.fillStyle = 'rgba(200, 240, 255, .8)';
      ctx.fill();
    }
    ctx.restore();
  },

  drawLine: function (game) {
    var ctx = this.ctx;
    var hook = game.hook;
    if (!hook) return;

    var tip = this.rodTip || { x: FG.CFG.BOAT_X, y: FG.CFG.SURFACE - 90 };
    var casting = game.state === 'CAST';
    var wob = (game.state === 'DIVE' && hook.strain)
      ? Math.sin(this.t * 11) * 3.0 * hook.strain : 0;

    var hx = hook.x, hy = hook.y + wob;
    var f = game.fight;
    var color = '#d7f0ff';
    var tensionRatio = 0;

    if (f) {
      tensionRatio = FG.RNG.clamp(f.tension / f.breakAt, 0, 1);
      var fdir = f.dir;
      var sz = FG.fishSizePx(f.weight) * 1.5 * FG.CFG.FISH_SCALE;
      var body = f.stamina > 0 ? f.stamina / f.maxStamina : 0;
      FG.drawAnyFish(ctx, f.sp,
        this.snapX(hx + fdir * sz * 0.5), this.snapY(hy + Math.sin(f.time * 5) * 4),
        sz, -fdir, 0.72 + 0.28 * (1 - body), f.king);
    }

    if (tensionRatio > 0) {
      var r = Math.round(120 + 135 * tensionRatio);
      var g2 = Math.round(230 - 165 * tensionRatio);
      var b = Math.round(120 - 80 * tensionRatio);
      color = 'rgb(' + r + ',' + g2 + ',' + b + ')';
    }

    var slack = casting ? 0 : (f ? (1 - tensionRatio) : 1);
    var sag = 26 * slack;
    var mx = (tip.x + hx) / 2;
    var my = (tip.y + hy) / 2 + sag;

    ctx.save();
    ctx.lineWidth = (f && f.tension > f.breakAt * 0.62) ? 2.4 : 1.6;
    ctx.strokeStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = tensionRatio > 0.62 ? 12 : 4;
    ctx.beginPath();
    ctx.moveTo(tip.x, tip.y);
    ctx.quadraticCurveTo(mx, my, hx, hy);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    if (hook.flash > 0) {
      ctx.shadowColor = 'rgba(255,120,80,.95)';
      ctx.shadowBlur = 18;
    }
    ctx.strokeStyle = hook.flash > 0 ? '#ffb08a' : '#e6f3ff';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.arc(hx, hy + 4, 7, Math.PI * 0.15, Math.PI * 1.25);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(hx + 6.6, hy + 1.4);
    ctx.lineTo(hx + 9.5, hy - 3);
    ctx.stroke();
    ctx.restore();

    var bait = game.baitDef();
    if (bait && !casting && !f) {
      ctx.save();
      ctx.fillStyle = bait.color;
      ctx.shadowColor = bait.color;
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(hx, hy + 1, 6 + bait.power * 1.6, 0, 6.2832);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 0.09;
      ctx.beginPath();
      ctx.arc(hx, hy + 1, bait.radiusPx, 0, 6.2832);
      ctx.fillStyle = bait.color;
      ctx.fill();
      ctx.globalAlpha = 0.3;
      ctx.lineWidth = 1.4;
      ctx.setLineDash([6, 8]);
      ctx.strokeStyle = bait.color;
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    if (game.state === 'DIVE' && hook.strain > 0.2) {
      ctx.save();
      ctx.globalAlpha = hook.strain * 0.55;
      ctx.strokeStyle = '#ff9b6a';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.moveTo(tip.x, tip.y);
      ctx.quadraticCurveTo(mx, my, hx, hy);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }
  },

  drawParticles: function (game) {
    var ctx = this.ctx;
    if (!game.particles) return;
    ctx.save();
    for (var i = 0; i < game.particles.length; i++) {
      var p = game.particles[i];
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, 6.2832);
      ctx.fill();
    }
    ctx.restore();
  },

  drawFloatText: function (game) {
    if (game.lastHitTimer > 0 && game.lastHit && game.hook) {
      var ctx = this.ctx;
      ctx.save();
      ctx.globalAlpha = FG.RNG.clamp(game.lastHitTimer / 1.6, 0, 1);
      ctx.font = 'bold 17px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ff9b6a';
      ctx.shadowColor = 'rgba(0,0,0,.8)';
      ctx.shadowBlur = 6;
      ctx.fillText(game.lastHit, game.hook.x, game.hook.y - 34 - (1.6 - game.lastHitTimer) * 14);
      ctx.restore();
    }
  },

  drawCastHints: function (game) {
    if (game.state !== 'IDLE') return;
    var ctx = this.ctx;
    var bx = game.boat.x - this.camX;
    var by = FG.CFG.SURFACE - this.camY;
    var ch = game.charge;

    if (ch) {
      var p = game.chargePower();
      var dist = FG.CFG.CAST_MIN + (FG.CFG.CAST_MAX - FG.CFG.CAST_MIN) * p;
      var wx = game.boat.x + ch.dir * dist - this.camX;
      var wy = by;
      var tip = this.rodTip || { x: game.boat.x, y: FG.CFG.SURFACE - 92 };
      var tx = tip.x - this.camX, ty = tip.y - this.camY;

      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.setLineDash([4, 7]);
      ctx.strokeStyle = '#9fe8ff';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      for (var i = 0; i <= 24; i++) {
        var k = i / 24, e2 = k * k * (3 - 2 * k);
        var px = FG.RNG.lerp(tx, wx, e2);
        var py = FG.RNG.lerp(ty, wy, e2) - 96 * Math.sin(Math.PI * e2);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.globalAlpha = 0.95;
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(159,232,255,.95)';
      ctx.beginPath(); ctx.ellipse(wx, wy, 26, 8, 0, 0, 6.2832); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,214,90,.8)';
      ctx.beginPath(); ctx.ellipse(wx, wy, 26 + p * 32, 8 + p * 10, 0, 0, 6.2832); ctx.stroke();
      ctx.restore();
      return;
    }

    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = 'bold 15px sans-serif';
    ctx.globalAlpha = 0.35 + 0.3 * Math.abs(Math.sin(this.t * 2));
    ctx.fillStyle = '#9fe8ff';
    ctx.fillText('按住蓄力 · 松开抛竿 ▶', FG.RNG.clamp(bx + 250, 130, FG.CFG.W - 130), by + 40);
    ctx.restore();
  },

  roundRect: function (ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  },

  drawDepthGauge: function (game) {
    var ctx = this.ctx;
    var X = 1206, TOP = 120, BOT = 664;
    var span = BOT - TOP;
    var yTop = FG.CFG.SURFACE, yBot = FG.WORLD_BOTTOM;
    var yOf = function (y) { return TOP + FG.RNG.clamp((y - yTop) / (yBot - yTop), 0, 1) * span; };

    ctx.save();
    ctx.fillStyle = 'rgba(6,26,40,.55)';
    ctx.strokeStyle = 'rgba(120,210,255,.18)';
    ctx.lineWidth = 1;
    this.roundRect(ctx, X - 10, TOP - 8, 20, span + 16, 9);
    ctx.fill();
    ctx.stroke();

    // 分层色带
    var i, z;
    for (i = 0; i < FG.ACTIVE_ZONES.length; i++) {
      z = FG.ACTIVE_ZONES[i];
      var a = yOf(z.y0), b = yOf(z.y1);
      ctx.fillStyle = z.accent;
      ctx.globalAlpha = 0.55;
      ctx.fillRect(X - 7, a, 14, Math.max(1.5, b - a));
      ctx.globalAlpha = 1;
    }

    // 视野窗口
    var v1 = yOf(this.camY), v2 = yOf(this.camY + FG.CFG.H);
    ctx.strokeStyle = 'rgba(255,255,255,.55)';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(X - 10, v1, 20, Math.max(3, v2 - v1));

    if (game.hook) {
      var my = yOf(FG.depthToY(game.hook.maxDepth));
      ctx.strokeStyle = 'rgba(255,110,90,.9)';
      ctx.lineWidth = 1.6;
      ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(X - 12, my); ctx.lineTo(X + 12, my); ctx.stroke();
      ctx.setLineDash([]);

      var hy = yOf(game.hook.y);
      ctx.fillStyle = '#9fe8ff';
      ctx.shadowColor = '#9fe8ff';
      ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.arc(X, hy, 4.5, 0, 6.2832); ctx.fill();
      ctx.shadowBlur = 0;
    }

    // 层名刻度
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'left';
    for (i = 0; i < FG.ACTIVE_ZONES.length; i++) {
      z = FG.ACTIVE_ZONES[i];
      var ty = FG.RNG.clamp((yOf(z.y0) + yOf(z.y1)) / 2, TOP + 9, BOT - 3);
      ctx.fillStyle = 'rgba(200,232,255,.62)';
      ctx.fillText(z.alias, X + 16, ty + 3);
    }
    ctx.restore();
  }
};
