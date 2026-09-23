window.FG = window.FG || {};

FG.Fight = {

  // 鱼咬住鱼钩，直接带着钩往外跑（没有提竿提示）
  start: function (game, shadow) {
    var sp = shadow.sp;
    var rod = game.rod();
    var line = game.line();
    var maxStam = FG.staminaOf(sp, shadow.weight);
    // 只朝一边抛竿，所以鱼也统一往那一侧跑，不会从船左边窜出屏幕
    var dir = FG.CFG.CAST_DIR >= 0 ? 1 : -1;
    var hDist = Math.abs(shadow.x - game.boat.x);
    var fishY = shadow.y;
    var d3 = Math.sqrt(hDist * hDist + Math.pow(fishY - FG.CFG.SURFACE, 2));

    game.state = 'FIGHT';
    game.prompt = null;
    game.hook.x = shadow.x;
    game.hook.y = fishY;
    game.hook.depth = FG.yToDepth(fishY);

    var bait = game.baitDef();
    var baitMax = 60 + maxStam * 0.35;
    var lineMax = Math.max(FG.CFG.LINE_MIN_PX, d3 * FG.CFG.LINE_SLACK);

    game.fight = {
      sp: sp,
      weight: shadow.weight,
      king: shadow.king,
      maxStamina: maxStam,
      stamina: maxStam,
      strength: FG.strengthOf(sp, shadow.weight),
      breakAt: rod.breakBonus + line.strength,
      tension: 8,
      mul: 1,
      state: 'calm',
      timer: FG.RNG.rand(0.35, 0.9),
      dir: dir,
      baseDist: hDist,
      hDist: hDist,
      y: fishY,
      catchY: fishY,
      catchDepth: Math.max(1, FG.yToDepth(fishY)),
      d3Px: d3,
      startD3Px: d3,
      lineMaxPx: lineMax,
      baitMax: baitMax,
      baitHp: baitMax,
      baitTough: bait ? bait.tough : 1,
      time: 0
    };

    game.shake = 14;
    FG.sfx.hookset();
    FG.Dive.burst(game, shadow.x, fishY, sp.color2, 16);
  },

  updateFight: function (game, dt) {
    var f = game.fight;
    var rod = game.rod();
    var reel = game.reel();
    var reeling = !!game.input.reel;
    f.time += dt;

    var stamRatio = FG.RNG.clamp(f.stamina / f.maxStamina, 0, 1);

    // ---- 挣扎状态机 ----
    f.timer -= dt;
    if (f.state === 'tired') {
      f.mul = 0.4;
    } else if (f.state === 'run') {
      if (f.timer <= 0) { f.state = 'calm'; f.timer = FG.RNG.rand(0.9, 2.2); f.mul = 1; }
    } else if (f.timer <= 0) {
      if (stamRatio > 0.06 && FG.RNG.chance(0.5)) {
        f.state = 'run';
        f.timer = FG.RNG.rand(0.6, 1.6);
        f.mul = FG.RNG.rand(1.5, 2.4);
        game.shake = Math.min(13, (game.shake || 0) + 8);
        FG.sfx.tone(90, 0.25, 'sawtooth', 0.05, 160);
      } else {
        f.state = 'calm';
        f.timer = FG.RNG.rand(0.9, 2.4);
        f.mul = 1;
      }
    }

    // ---- 张力 ----
    var pull = f.strength * (0.35 + 0.65 * stamRatio) * f.mul;
    var target = reeling ? (pull + rod.reelForce * reel.speed) : 0;
    var rate = reeling ? 3.2 : 4.4;
    f.tension += (target - f.tension) * rate * dt;
    if (f.tension < 0) f.tension = 0;

    // ---- 体力 ----
    if (f.stamina > 0) {
      if (reeling) {
        f.stamina -= (3 + f.tension * 0.18) * rod.reelEff * dt;
      } else if (f.state !== 'run') {
        f.stamina += (2 + f.maxStamina * 0.008) * dt;
        if (f.stamina > f.maxStamina) f.stamina = f.maxStamina;
      }
      if (f.state === 'run') f.stamina -= f.maxStamina * 0.016 * dt;
      if (f.stamina <= 0) {
        f.stamina = 0;
        if (f.state !== 'tired') {
          f.state = 'tired';
          f.mul = 0.4;
          f.timer = 999;
          FG.sfx.tone(300, 0.4, 'sine', 0.05, 120);
        }
      }
    }

    // ---- 水平距离：鱼往外窜到它想待的地方（屏幕像素） ----
    var basePull = f.strength * (0.35 + 0.65 * stamRatio);
    var wanted = f.baseDist + basePull * 2.7 * (f.state === 'tired' ? 0.4 : 1);
    if (f.hDist < wanted) {
      var outward = (f.state === 'run' ? 52 : 15) * (0.35 + 0.65 * stamRatio);
      f.hDist += outward * dt;
    }

    // ---- 水深：体力足时赖在原深度，被遛到力竭后一路浮到水面 ----
    // 弹簧强度也随体力衰减，否则力竭的鱼还能在最后几十米和收线打平
    var springRate = 0.9 * (0.12 + 0.88 * stamRatio);
    var targetDepth = f.catchDepth * (0.02 + 0.98 * stamRatio);
    var targetY = FG.depthToY(targetDepth);
    if (f.state === 'run') targetY += 70 * (0.3 + 0.7 * stamRatio);
    targetY += Math.sin(f.time * 2.7) * 18;
    f.y += FG.RNG.clamp((targetY - f.y) * springRate * dt, -260 * dt, 260 * dt);

    // ---- 收线：沿「鱼 → 船」的直线方向拉，水平与水深同时收 ----
    if (reeling) {
      var depthFactor = Math.min(8, 1 + (f.y - FG.CFG.SURFACE) / 300);
      var reelRate = (18 + reel.speed * 40) * (1 - 0.80 * stamRatio) * rod.reelEff * depthFactor;
      var d0 = Math.max(1, Math.sqrt(f.hDist * f.hDist + Math.pow(f.y - FG.CFG.SURFACE, 2)));
      f.hDist = Math.max(0, f.hDist - reelRate * (f.hDist / d0) * dt);
      f.y -= reelRate * ((f.y - FG.CFG.SURFACE) / d0) * dt;
      if (f.y < FG.CFG.SURFACE) f.y = FG.CFG.SURFACE;
    }

    f.hDist = FG.RNG.clamp(f.hDist, 0, 6000);
    f.y = FG.RNG.clamp(f.y, FG.CFG.SURFACE, FG.WORLD_BOTTOM);
    f.d3Px = Math.max(0.5, Math.sqrt(f.hDist * f.hDist + Math.pow(f.y - FG.CFG.SURFACE, 2)));

    // ---- 鱼的位置 ----
    game.hook.x = game.boat.x + f.dir * f.hDist;
    game.hook.y = f.y;
    game.hook.depth = FG.yToDepth(f.y);

    // ---- 鱼饵被啃 ----
    var chew = (1.5 + f.strength * 0.012 + (f.state === 'run' ? 9.0 : 0)) / f.baitTough;
    f.baitHp -= chew * dt;
    if (f.baitHp <= 0) {
      f.baitHp = 0;
      FG.sfx.tone(150, 0.35, 'square', 0.06, 70);
      FG.Dive.burst(game, game.hook.x, game.hook.y, '#d9b38c', 12);
      game.finish('bait_eaten');
      return;
    }

    // ---- 断线 ----
    if (f.tension >= f.breakAt) {
      game.shake = 20;
      FG.sfx.break();
      FG.Dive.burst(game, game.hook.x, game.hook.y, '#ffffff', 20);
      game.finish('break');
      return;
    }

    // ---- 线被拖光 ----
    if (f.d3Px >= f.lineMaxPx) {
      FG.sfx.break();
      game.finish('runout');
      return;
    }

    // ---- 拉到船边 ----
    if (f.d3Px <= FG.CFG.LAND_PX) {
      this.succeed(game);
    }
  },

  // 收线进度：0 = 刚中钩时到船的距离，1 = 拉到船边
  progress: function (f) {
    var d0 = Math.max(1, f.startD3Px);
    var d1 = FG.CFG.LAND_PX;
    if (d0 <= d1) return 1;
    return FG.RNG.clamp((d0 - f.d3Px) / (d0 - d1), 0, 1);
  },

  // 显示给玩家的「到船距离」（米）：水平按 8.5px/m，水深按真实米数
  distM: function (f) {
    var hM = f.hDist / FG.CFG.H_PX_PER_M;
    var vM = FG.yToDepth(f.y);
    return Math.sqrt(hM * hM + vM * vM);
  },

  succeed: function (game) {
    var f = game.fight;
    var item = FG.Economy.makeCatch(f.sp, f.weight, f.king);
    FG.Economy.addToBag(game, item);
    game.lastCatch = item;
    game.fight = null;
    FG.sfx.win();
    game.finish('success');
  },

  statusText: function (f) {
    if (!f) return '';
    if (f.state === 'tired') return '力　竭';
    if (f.state === 'run') return '往　外　窜！';
    var r = f.stamina / f.maxStamina;
    if (r > 0.72) return '精神饱满';
    if (r > 0.45) return '稍有吃力';
    if (r > 0.2) return '开始乏力';
    return '强弩之末';
  }
};
