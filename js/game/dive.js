window.FG = window.FG || {};

FG.DEBRIS_TYPES = [
  { id: 'duckweed', name: '浮萍',     dmg: 5,  r: 2.9, d0: 0,    d1: 60,    color: '#6fae5a', shape: 'leaf' },
  { id: 'branch',   name: '枯枝',     dmg: 10, r: 2.7, d0: 0,    d1: 120,   color: '#7a5a38', shape: 'stick' },
  { id: 'bag',      name: '塑料袋',   dmg: 8,  r: 3.5, d0: 10,   d1: 420,   color: '#c9d6dd', shape: 'bag' },
  { id: 'weed',     name: '水草团',   dmg: 14, r: 3.6, d0: 40,   d1: 1000,  color: '#3f8c4a', shape: 'weed' },
  { id: 'log',      name: '沉木',     dmg: 19, r: 4.7, d0: 100,  d1: 2000,  color: '#5c4226', shape: 'log' },
  { id: 'net',      name: '废弃渔网', dmg: 24, r: 5.1, d0: 300,  d1: 5000,  color: '#b6c4a0', shape: 'net' },
  { id: 'rock',     name: '暗礁',     dmg: 30, r: 5.5, d0: 800,  d1: 8000,  color: '#3b4650', shape: 'rock' },
  { id: 'wreck',    name: '沉船残骸', dmg: 34, r: 6.2, d0: 1000, d1: 11000, color: '#4a3c30', shape: 'wreck' },
  { id: 'cable',    name: '断裂缆绳', dmg: 40, r: 5.6, d0: 2000, d1: 11000, color: '#7a8a6a', shape: 'weedy' },
  { id: 'sub',      name: '潜水器残骸', dmg: 52, r: 7.0, d0: 4000, d1: 11000, color: '#8a9aa8', shape: 'wreck' },
  { id: 'bone',     name: '巨兽骸骨', dmg: 60, r: 8.0, d0: 6000, d1: 11000, color: '#d8d0c0', shape: 'rock' }
];

FG.Dive = {

  viewBounds: function () {
    var x0 = FG.render.camX || 0;
    return { x0: x0 - 80, x1: x0 + FG.CFG.W + 80 };
  },

  begin: function (game, x) {
    var h = game.hook;
    h.x = x;
    h.y = FG.CFG.SURFACE;
    h.depth = 0;
    h.vy = 0;
    h.invuln = 0.8;
    h.strain = 0;
    h.limitHit = false;
    game.debris = [];
    game.particles = [];
    game.shadows = [];
    game.bubbles = [];
    game.debrisTimer = 1.4;
    game.shadowTimer = 0.2;
    game.diveTime = 0;
    game.biteGrace = 1.1;
    for (var i = 0; i < 9; i++) this.spawnShadow(game, true);
  },

  spawnShadow: function (game, anywhere) {
    if (game.shadows.length >= FG.CFG.MAX_SHADOWS) return;
    var vb = this.viewBounds();
    var hookDepth = game.hook ? game.hook.depth : 30;
    var maxD = game.hook ? game.hook.maxDepth : FG.DEPTH_MAX;

    var sp = FG.RNG.weighted(FG.FISH, function (s) {
      if (s.dmin > maxD) return 0;
      var rw = FG.RARITY[s.rarity].weight;
      if (anywhere) return rw;
      var mid = (s.dmin + s.dmax) / 2;
      var span = Math.max(60, s.dmax - s.dmin);
      var near = 1 / (1 + Math.abs(mid - hookDepth) / (span * 0.6));
      var reach = (hookDepth >= s.dmin - span * 0.25 && hookDepth <= s.dmax + span * 0.25);
      return rw * near * (reach ? 3.4 : 0.06);
    });
    if (!sp) {
      sp = FG.reachableFish(maxD)[0] || FG.FISH[0];
    }

    var size = FG.rollSize(sp);
    var depth;
    if (!anywhere && hookDepth >= sp.dmin && hookDepth <= sp.dmax && FG.RNG.chance(0.65)) {
      var pad = (sp.dmax - sp.dmin) * 0.2;
      depth = FG.RNG.clamp(hookDepth + FG.RNG.rand(-pad, pad), sp.dmin, sp.dmax);
    } else {
      depth = FG.RNG.rand(sp.dmin, sp.dmax);
    }
    var dir = FG.RNG.sign();
    var hx = game.hook ? game.hook.x : FG.CFG.BOAT_X;
    var x;
    if (anywhere) x = FG.RNG.rand(vb.x0 + 40, vb.x1 - 40);
    else if (FG.RNG.chance(0.55)) x = FG.RNG.clamp(hx + FG.RNG.rand(-320, 320), vb.x0 + 40, vb.x1 - 40);
    else x = FG.RNG.rand(vb.x0 + 40, vb.x1 - 40);

    game.shadows.push({
      sp: sp,
      weight: size.weight,
      king: size.king,
      depth: depth,
      y: FG.depthToY(depth),
      x: x,
      vx: dir * sp.speed * FG.RNG.rand(0.7, 1.3),
      sizePx: FG.fishSizePx(size.weight),
      phase: Math.random() * 6.28,
      dir: dir > 0 ? 1 : -1,
      attract: 0,
      fleeing: 0,
      leave: 0
    });
  },

  spawnDebris: function (game) {
    var vb = this.viewBounds();
    var hookDepth = game.hook.depth;
    var scale = FG.pxPerM(hookDepth);
    var spread = 110 / scale;
    var depth = Math.random() < 0.62
      ? FG.RNG.clamp(hookDepth + FG.RNG.rand(-spread, spread), 1, FG.DEPTH_MAX)
      : FG.RNG.rand(1, FG.DEPTH_MAX);

    var pool = FG.DEBRIS_TYPES.filter(function (t) {
      return depth >= t.d0 - 4 && depth <= t.d1 + 4;
    });
    if (!pool.length) pool = [FG.DEBRIS_TYPES[0]];
    var t = FG.RNG.pick(pool);

    var fromLeft = FG.RNG.chance(0.5);
    var speed = FG.RNG.rand(60, 150) * (0.85 + Math.min(1.4, depth / 4000));
    var rPx = FG.mToPx(t.r);
    game.debris.push({
      type: t,
      rPx: rPx,
      depth: depth,
      y: FG.depthToY(depth),
      x: fromLeft ? vb.x0 - rPx - 10 : vb.x1 + rPx + 10,
      vx: fromLeft ? speed : -speed,
      rot: Math.random() * 6.28,
      rotV: FG.RNG.rand(-1.4, 1.4),
      bob: Math.random() * 6.28,
      bobAmp: FG.RNG.rand(3, 11)
    });
  },

  update: function (game, dt) {
    var hook = game.hook;
    var input = game.input;
    game.diveTime += dt;

    // 垂直运动全部按屏幕像素走，保证任何水层的操作手感一致
    var SINK = 210, RISE = 150, DRIFT = 26;
    var target = input.down ? SINK : (input.up ? -RISE : DRIFT);
    hook.vy += (target - hook.vy) * 4.6 * dt;
    hook.y += hook.vy * dt;

    if (hook.y < FG.CFG.SURFACE) { hook.y = FG.CFG.SURFACE; hook.vy = Math.max(0, hook.vy); }

    // 到达装备极限深度
    var maxY = FG.depthToY(hook.maxDepth);
    if (hook.y >= maxY) {
      hook.y = maxY;
      if (hook.vy > 0) hook.vy = -hook.vy * 0.10;
      hook.strain = Math.min(1, hook.strain + dt * 2.6);
      if (!hook.limitHit) {
        hook.limitHit = true;
        var z = FG.zoneAt(hook.maxDepth);
        game.prompt = '鱼线到头了（' + game.hookDef().name + ' 极限 ' + hook.maxDepth + 'm，已到' + z.alias + '）';
        game.promptTimer = 2.8;
        FG.sfx.tone(140, 0.25, 'square', 0.05, 90);
      }
    } else {
      hook.strain = Math.max(0, hook.strain - dt * 2.2);
      if (hook.y < maxY - 20) hook.limitHit = false;
    }

    hook.depth = FG.yToDepth(hook.y);
    hook.zone = FG.zoneAt(hook.depth);

    if (hook.invuln > 0) hook.invuln -= dt;
    if (hook.flash > 0) hook.flash -= dt;

    this.updateBubbles(game, dt, hook);

    game.debrisTimer -= dt;
    if (game.debrisTimer <= 0 && game.debris.length < 26) {
      game.debrisTimer = FG.RNG.rand(0.34, 0.85);
      this.spawnDebris(game);
    }

    if (this.driftDebris(game, dt, true)) return;

    this.updateShadows(game, dt);
    this.updateParticles(game, dt);

    if (game.shake) game.shake = Math.max(0, game.shake - dt * 26);
    if (game.lastHitTimer > 0) game.lastHitTimer -= dt;
  },

  driftDebris: function (game, dt, collide) {
    var hook = game.hook;
    var vb = this.viewBounds();
    var tangle = game.hookDef().tangle;
    var hookR = FG.mToPx(FG.CFG.HOOK_R);

    for (var i = game.debris.length - 1; i >= 0; i--) {
      var d = game.debris[i];
      d.x += d.vx * dt;
      d.rot += d.rotV * dt;
      d.bob += dt * 2.1;
      var y = d.y + Math.sin(d.bob) * d.bobAmp;

      if (d.x < vb.x0 - d.rPx - 60 || d.x > vb.x1 + d.rPx + 60) { game.debris.splice(i, 1); continue; }

      if (!collide || hook.invuln > 0) continue;

      var dx = hook.x - d.x, dyy = hook.y - y;
      var rr = d.rPx + hookR;
      if (dx * dx + dyy * dyy < rr * rr) {
        var dmg = d.type.dmg * (1 - tangle);
        hook.durability -= dmg;
        hook.invuln = 0.7;
        hook.flash = 0.35;
        game.shake = Math.min(16, (game.shake || 0) + 8);
        this.burst(game, d.x, y, d.type.color, 14);
        FG.sfx.hit();
        game.lastHit = d.type.name + ' -' + Math.round(dmg);
        game.lastHitTimer = 1.6;
        game.debris.splice(i, 1);
        if (hook.durability <= 0) {
          hook.durability = 0;
          game.finish('bait_lost');
          return true;
        }
      }
    }
    return false;
  },

  updateBubbles: function (game, dt, hook) {
    if (!game.bubbles) game.bubbles = [];
    game.bubblesTimer = (game.bubblesTimer || 0) - dt;
    var strong = Math.abs(hook.vy) > 45 || hook.strain > 0.3;
    if (game.bubblesTimer <= 0 && strong) {
      game.bubblesTimer = FG.RNG.rand(0.05, 0.14);
      game.bubbles.push({
        x: hook.x + FG.RNG.rand(-8, 8),
        y: hook.y,
        r: FG.RNG.rand(1.5, 3.6),
        vy: -FG.RNG.rand(18, 40) * (0.6 + hook.strain),
        life: 1
      });
    }
    for (var i = game.bubbles.length - 1; i >= 0; i--) {
      var b = game.bubbles[i];
      b.y += b.vy * dt;
      b.x += Math.sin(game.diveTime * 3 + i) * 6 * dt;
      b.life -= dt * 0.8;
      if (b.life <= 0 || b.y < FG.CFG.SURFACE) game.bubbles.splice(i, 1);
    }
  },

  updateShadows: function (game, dt) {
    var hook = game.hook;
    var bait = game.baitDef();
    var power = bait ? bait.power : 1;
    var radius = bait ? bait.radiusPx : 60;
    var detect = radius * 3.4;
    var vb = this.viewBounds();
    if (game.biteGrace > 0) game.biteGrace -= dt;

    game.shadowTimer -= dt;
    if (game.shadowTimer <= 0) {
      game.shadowTimer = FG.RNG.rand(0.8, 1.8);
      if (game.shadows.length < FG.CFG.MAX_SHADOWS) this.spawnShadow(game, false);
    }

    var speedFactor = FG.RNG.clamp(1 - (Math.abs(hook.vy) - 30) / 95, 0, 1);
    game.fastHook = speedFactor <= 0.04 && hook.strain < 0.4;
    game.nearShadow = false;

    for (var i = 0; i < game.shadows.length; i++) {
      var s = game.shadows[i];

      if (Math.abs(s.y - hook.y) > 300) s.leave += dt;
      else s.leave = 0;
      if (s.leave > 2.0) { game.shadows.splice(i, 1); i--; continue; }

      s.phase += dt * 3.2;

      var dx = hook.x - s.x, dy = hook.y - s.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      var canSmell = bait && bait.power >= s.sp.attract;
      if (canSmell && s.fleeing <= 0 && dist < detect) game.nearShadow = true;
      var lured = canSmell && s.fleeing <= 0 && dist < detect && dist > 1 && speedFactor > 0.04;

      if (s.fleeing > 0) {
        s.fleeing -= dt;
        s.vx = (s.vx > 0 ? 1 : -1) * s.sp.speed * 2.4;
      }

      if (lured) {
        var spd = s.sp.speed * 1.15;
        s.vx += ((dx / dist) * spd - s.vx) * 2.6 * dt;
        s.y += (dy / dist) * spd * dt;
        s.y += Math.sin(s.phase * 0.7) * 9 * dt;
      } else {
        var maxV = s.sp.speed * 1.3;
        if (Math.abs(s.vx) > maxV) s.vx = (s.vx > 0 ? 1 : -1) * maxV;
        s.y += Math.sin(s.phase * 0.4) * 18 * dt;
      }

      s.x += s.vx * dt;
      s.dir = s.vx >= 0 ? 1 : -1;

      if (s.x < vb.x0 - 60) s.x = vb.x1 + 50;
      if (s.x > vb.x1 + 60) s.x = vb.x0 - 50;

      var yMin = FG.depthToY(s.sp.dmin), yMax = FG.depthToY(s.sp.dmax);
      s.y = FG.RNG.clamp(s.y, yMin, yMax);
      s.depth = FG.yToDepth(s.y);

      if (lured && dist < radius && !(game.biteGrace > 0)) {
        var near = 1 - (dist / radius) * 0.45;
        s.attract += dt * s.sp.biteRate * power * near * speedFactor;
        if (s.attract >= 1) {
          s.attract = 1;
          FG.Fight.start(game, s);
          return;
        }
      } else {
        s.attract = Math.max(0, s.attract - dt * 0.45);
      }
    }
  },

  burst: function (game, x, y, color, n) {
    for (var i = 0; i < n; i++) {
      var a = Math.random() * 6.28, sp = FG.RNG.rand(30, 190);
      game.particles.push({
        x: x, y: y,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        life: 1, maxLife: FG.RNG.rand(0.3, 0.8),
        r: FG.RNG.rand(1.5, 4), color: color
      });
    }
  },

  updateParticles: function (game, dt) {
    for (var i = game.particles.length - 1; i >= 0; i--) {
      var p = game.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= (1 - 2.2 * dt);
      p.vy = p.vy * (1 - 2.2 * dt) - 14 * dt;
      p.life -= dt / p.maxLife;
      if (p.life <= 0) game.particles.splice(i, 1);
    }
  }
};
