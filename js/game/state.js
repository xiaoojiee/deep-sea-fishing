window.FG = window.FG || {};

FG.Game = {
  state: 'IDLE',
  money: 0,
  inventory: [],
  equip: { rod: 0, line: 0, hook: 0, reel: 0 },
  baits: { worm: 10 },
  baitId: 'worm',
  codex: {},
  stats: { caught: 0, kings: 0, best: 0, sold: 0, earned: 0, fights: 0 },
  settings: { sound: true },

  input: { up: false, down: false, reel: false },

  boat: { x: 1280, bob: 0, rodDir: 1 },
  hook: null,
  castAnim: null,
  charge: null,
  zoneId: null,
  zoneBanner: 0,
  fps: 0,
  shadows: [],
  debris: [],
  particles: [],
  bubbles: [],
  fight: null,
  lastCatch: null,
  result: null,
  shake: 0,
  castLock: 0,
  prompt: null,
  lastHit: null,
  lastHitTimer: 0,
  paused: false,

  /* ---------- 装备读取 ---------- */
  rod: function () { return FG.RODS[this.equip.rod]; },
  line: function () { return FG.LINES[this.equip.line]; },
  hookDef: function () { return FG.HOOKS[this.equip.hook]; },
  reel: function () { return FG.REELS[this.equip.reel]; },
  baitDef: function () { return FG.byId(FG.BAITS, this.baitId); },
  baitCount: function () {
    var b = this.baitDef();
    return b ? (this.baits[b.id] || 0) : 0;
  },

  /* ---------- 存档 ---------- */
  persist: function () { FG.Storage.save(this); },

  init: function () {
    this.boat.x = FG.CFG.BOAT_X;
    var data = FG.Storage.load();
    if (data) {
      this.money = data.money || 0;
      this.inventory = data.inventory || [];
      this.equip = data.equip || { rod: 0, line: 0, hook: 0, reel: 0 };
      this.baits = data.baits || { worm: 10 };
      this.baitId = data.baitId || 'worm';
      this.codex = data.codex || {};
      this.stats = data.stats || { caught: 0, kings: 0, best: 0, sold: 0, earned: 0, fights: 0 };
      if (this.stats.fights === undefined) this.stats.fights = 0;
      this.settings = data.settings || { sound: true };
    }
  },

  resetAll: function () {
    FG.Storage.clear();
    this.money = 0;
    this.inventory = [];
    this.equip = { rod: 0, line: 0, hook: 0, reel: 0 };
    this.baits = { worm: 10 };
    this.baitId = 'worm';
    this.codex = {};
    this.stats = { caught: 0, kings: 0, best: 0, sold: 0, earned: 0, fights: 0 };
    this.state = 'IDLE';
    this.fight = null;
    this.result = null;
    this.prompt = null;
    this.hook = null;
    this.persist();
  },

  /* ---------- 蓄力：长按时间决定抛投距离 ---------- */
  chargePower: function () {
    if (!this.charge) return 0;
    return FG.RNG.clamp(this.charge.t / FG.CFG.CHARGE_TIME, 0, 1);
  },

  beginCharge: function () {
    if (this.state !== 'IDLE' || this.castLock > 0) return;
    if (!FG.Economy.canCast(this)) {
      this.prompt = '没有鱼饵了，去商店买一些吧';
      this.promptTimer = 2.2;
      FG.sfx.tone(180, 0.2, 'square', 0.05);
      return;
    }
    if (this.charge) return;
    this.charge = { dir: FG.CFG.CAST_DIR >= 0 ? 1 : -1, t: 0 };
    this.boat.rodDir = this.charge.dir;
    FG.sfx.tone(220, 0.06, 'sine', 0.03);
  },

  releaseCharge: function () {
    if (!this.charge) return;
    var power = this.chargePower();
    var dir = this.charge.dir;
    this.charge = null;
    var d = FG.CFG.CAST_MIN + (FG.CFG.CAST_MAX - FG.CFG.CAST_MIN) * power;
    this.castTo(this.boat.x + dir * d);
  },

  cancelCharge: function () {
    this.charge = null;
  },

  /* ---------- 抛竿：朝指定落点抛出 ---------- */
  castTo: function (targetX) {
    if (this.state !== 'IDLE') return;
    if (this.castLock > 0) return;
    if (!FG.Economy.canCast(this)) {
      this.prompt = '没有鱼饵了，去商店买一些吧';
      this.promptTimer = 2.2;
      FG.sfx.tone(180, 0.2, 'square', 0.05);
      return;
    }

    var bx = this.boat.x;
    var dir = targetX >= bx ? 1 : -1;
    var d = Math.abs(targetX - bx);
    if (d < FG.CFG.CAST_MIN) d = FG.CFG.CAST_MIN;
    if (d > FG.CFG.CAST_MAX) d = FG.CFG.CAST_MAX;
    var toX = bx + dir * d;

    this.baits[this.baitId]--;
    this.result = null;
    this.prompt = null;
    this.fight = null;
    this.shake = 0;
    this.debris = [];
    this.shadows = [];
    this.particles = [];
    this.bubbles = [];
    this.lastHit = null;
    this.lastHitTimer = 0;

    this.boat.rodDir = dir;
    var tipX = bx + 12 + dir * 74;
    var tipY = FG.CFG.SURFACE - 92;
    this.castAnim = { t: 0, dur: 0.62, fromX: tipX, fromY: tipY, toX: toX, dir: dir };
    this.hook = {
      x: tipX,
      depth: 0,
      y: tipY,
      vy: 0,
      zone: FG.ACTIVE_ZONES[0],
      durability: this.hookDef().durability,
      maxDurability: this.hookDef().durability,
      maxDepth: FG.maxDepthOf(this),
      invuln: 0.9,
      flash: 0,
      strain: 0,
      limitHit: false
    };
    this.state = 'CAST';
    FG.sfx.cast();
    this.persist();
  },

  /* ---------- 收竿（未中鱼时退还鱼饵） ---------- */
  retract: function () {
    if (this.state !== 'DIVE') return;
    this.baits[this.baitId] = (this.baits[this.baitId] || 0) + 1;
    this.state = 'IDLE';
    this.castLock = 0.45;
    this.charge = null;
    this.input.up = false;
    this.input.down = false;
    this.prompt = '已收竿，鱼饵完好';
    this.promptTimer = 1.6;
    this.persist();
  },

  finish: function (reason) {
    this.state = 'RESULT';
    var info = { reason: reason, catch: null };
    if (reason === 'success') {
      info.catch = this.lastCatch;
      info.title = '上　岸　！';
    } else if (reason === 'break') {
      info.title = '鱼　线　绷　断';
      info.sub = '张力超过鱼线极限，鱼带着钩跑了。松开空格泄力，别硬拉。';
    } else if (reason === 'runout') {
      info.title = '线　被　拖　光';
      info.sub = '一直不收线，鱼把线全部带走了。';
    } else if (reason === 'bait_eaten') {
      info.title = '鱼　饵　丢　失';
      info.sub = '鱼咬着钩跑了太久，把鱼饵啃光吞掉了。别一直跟它耗，该拉就得拉。';
    } else if (reason === 'bait_lost') {
      info.title = '鱼　饵　丢　失';
      info.sub = '鱼钩耐久耗尽，鱼饵被杂物刮走了。';
    }
    this.result = info;
    this.input.reel = false;
    this.input.up = false;
    this.input.down = false;
    this.prompt = null;
    this.persist();
  },

  continueAfterResult: function () {
    this.state = 'IDLE';
    this.castLock = 0.6;
    this.charge = null;
    this.result = null;
    this.fight = null;
    this.hook = null;
    this.castAnim = null;
    this.debris = [];
    this.shadows = [];
    this.particles = [];
    this.bubbles = [];
  },

  /* ---------- 主更新 ---------- */
  update: function (dt) {
    if (this.castLock > 0) this.castLock -= dt;
    if (this.promptTimer > 0) {
      this.promptTimer -= dt;
      if (this.promptTimer <= 0) this.prompt = null;
    }
    this.boat.bob += dt * 1.6;

    // 分层横幅
    var zNow = null;
    if (this.hook && (this.state === 'DIVE' || this.state === 'FIGHT' || this.state === 'CAST')) {
      zNow = FG.zoneAt(this.hook.depth);
    }
    if (zNow && zNow.id !== this.zoneId) {
      if (this.zoneId !== null) this.zoneBanner = 3.4;
      this.zoneId = zNow.id;
      this.zoneNow = zNow;
    }
    if (this.zoneBanner > 0) this.zoneBanner -= dt;
    if (this.state === 'IDLE' && this.hook === null) this.zoneId = null;

    if (this.charge) {
      if (this.state !== 'IDLE') this.charge = null;
      else {
        this.charge.t += dt;
        if (this.chargePower() >= 1) this.charge.t = FG.CFG.CHARGE_TIME;
      }
    }

    if (this.state === 'CAST') {
      var a = this.castAnim;
      if (!a) { this.state = 'IDLE'; return; }
      a.t += dt;
      var k = FG.RNG.clamp(a.t / a.dur, 0, 1);
      var e = k * k * (3 - 2 * k);
      this.hook.x = FG.RNG.lerp(a.fromX, a.toX, e);
      this.hook.y = FG.RNG.lerp(a.fromY, FG.CFG.SURFACE, e) - 96 * Math.sin(Math.PI * e);
      if (k >= 1) {
        this.state = 'DIVE';
        FG.Dive.begin(this, a.toX);
        this.castAnim = null;
        FG.sfx.splash();
        this.shake = 4;
      }
      return;
    }

    if (this.state === 'DIVE') {
      FG.Dive.update(this, dt);
    } else if (this.state === 'FIGHT') {
      FG.Dive.updateParticles(this, dt);
      FG.Dive.driftDebris(this, dt, false);
      FG.Fight.updateFight(this, dt);
      if (this.shake) this.shake = Math.max(0, this.shake - dt * 26);
      if (this.lastHitTimer > 0) this.lastHitTimer -= dt;
    } else {
      FG.Dive.updateParticles(this, dt);
      if (this.shake) this.shake = Math.max(0, this.shake - dt * 26);
      if (this.state === 'IDLE' && this.hook) {
        this.hook.y += (FG.CFG.SURFACE - this.hook.y) * 1.5 * dt;
        this.hook.depth = FG.yToDepth(this.hook.y);
      }
    }
  }
};
