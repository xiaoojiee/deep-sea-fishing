window.FG = window.FG || {};

FG.HUD = {
  el: {},
  isTouch: false,
  lastState: null,
  idleHint: 0,

  init: function () {
    var ids = ['depthNum', 'depthUnit', 'depthMax', 'zoneName', 'zoneRange',
      'zoneBanner', 'zbTitle', 'zbSub',
      'duraFill', 'duraNum', 'baitDot', 'baitName', 'baitCount',
      'moneyNum', 'statCaught', 'statKings', 'statBest', 'bagCount',
      'fightBox', 'fishStatus', 'tensionFill', 'tensionNum', 'tensionMax',
      'distWrap', 'distFill', 'distNum', 'distSub', 'baitWrap', 'baitHpNum', 'baitHpFill',
      'chargeBox', 'chargeNum', 'chargeFill', 'chargeDir',
      'promptBox', 'resultOverlay', 'btnLeft', 'btnRight', 'btnRetract', 'touchControls', 'btnReel'];
    for (var i = 0; i < ids.length; i++) this.el[ids[i]] = document.getElementById(ids[i]);
    this.isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
  },

  show: function (id, visible) {
    var e = this.el[id];
    if (!e) return;
    if (visible) e.classList.remove('hidden');
    else e.classList.add('hidden');
  },

  update: function (game, dt) {
    var e = this.el;
    dt = dt || 0;

    e.moneyNum.textContent = game.money;
    e.statCaught.textContent = game.stats.caught;
    e.statKings.textContent = game.stats.kings;
    e.statBest.textContent = game.stats.best;
    e.bagCount.textContent = game.inventory.length;

    var st = game.state;

    // 分层横幅
    if (game.zoneBanner > 0 && game.zoneNow) {
      var z = game.zoneNow;
      e.zbTitle.textContent = z.name + ' · ' + z.alias;
      e.zbSub.textContent = FG.formatDepth(z.d0) + ' – ' + FG.formatDepth(z.d1) + '　' + z.desc;
      e.zoneBanner.classList.remove('hidden');
      e.zoneBanner.style.opacity = FG.RNG.clamp(game.zoneBanner / 1.0, 0, 1);
    } else {
      e.zoneBanner.classList.add('hidden');
    }

    if (game.hook) {
      var zc = FG.zoneAt(game.hook.depth);
      e.zoneName.textContent = zc.name + ' · ' + zc.alias;
      e.zoneRange.textContent = FG.formatDepth(zc.d0) + ' – ' + FG.formatDepth(zc.d1);
      e.zoneName.style.color = zc.accent;

      e.depthMax.textContent = '/ ' + FG.formatDepth(game.hook.maxDepth);
      if (game.hook.depth >= game.hook.maxDepth - Math.max(0.4, game.hook.maxDepth * 0.002)) e.depthMax.classList.add('at-limit');
      else e.depthMax.classList.remove('at-limit');

      var big = game.hook.depth >= 1000;
      e.depthUnit.textContent = big ? 'km' : 'm';
      e.depthNum.textContent = big ? (game.hook.depth / 1000).toFixed(3) : game.hook.depth.toFixed(1);
      var dR = game.hook.durability / game.hook.maxDurability;
      e.duraFill.style.width = (dR * 100) + '%';
      e.duraFill.style.background = dR > 0.5
        ? 'linear-gradient(90deg,#34d399,#a3e635)'
        : (dR > 0.22 ? 'linear-gradient(90deg,#facc15,#fb923c)' : 'linear-gradient(90deg,#ef4444,#f97316)');
      e.duraNum.textContent = Math.ceil(game.hook.durability);
    } else {
      e.depthNum.textContent = '0.0';
      e.depthUnit.textContent = 'm';
      e.zoneName.textContent = FG.ACTIVE_ZONES[0].name + ' · ' + FG.ACTIVE_ZONES[0].alias;
      e.zoneRange.textContent = FG.formatDepth(FG.ACTIVE_ZONES[0].d0) + ' – ' + FG.formatDepth(FG.ACTIVE_ZONES[0].d1);
      e.zoneName.style.color = FG.ACTIVE_ZONES[0].accent;
    }

    var bait = game.baitDef();
    if (bait) {
      e.baitDot.style.background = bait.color;
      e.baitDot.style.color = bait.color;
      e.baitName.textContent = bait.name;
      e.baitCount.textContent = 'x' + game.baitCount();
    }

    this.show('btnLeft', st === 'IDLE');
    this.show('btnRight', st === 'IDLE');
    this.show('btnRetract', st === 'DIVE');
    this.show('fightBox', st === 'FIGHT');
    this.show('btnReel', st === 'FIGHT');
    this.show('btnUp', st === 'DIVE');
    this.show('btnDown', st === 'DIVE');
    this.show('touchControls', this.isTouch && (st === 'DIVE' || st === 'FIGHT'));

    if (st === 'FIGHT' && game.fight) {
      var f = game.fight;
      var tr = FG.RNG.clamp(f.tension / f.breakAt, 0, 1);
      e.tensionFill.style.width = (tr * 100) + '%';
      var col = tr > 0.85 ? '#ef4444' : (tr > 0.62 ? '#facc15' : '#4ade80');
      e.tensionFill.style.background = col;
      e.tensionFill.style.boxShadow = '0 0 12px ' + col;
      e.tensionNum.textContent = Math.round(f.tension);
      e.tensionMax.textContent = Math.round(f.breakAt);
      e.fishStatus.textContent = FG.Fight.statusText(f);
      e.fishStatus.style.color = f.state === 'run' ? '#ff9b6a' : (f.state === 'tired' ? '#7ee787' : '#cfe9ff');

      e.distNum.textContent = FG.formatDepth(FG.Fight.distM(f));
      var pr = FG.Fight.progress(f);
      e.distFill.style.width = (pr * 100) + '%';
      e.distFill.style.background = pr > 0.999 ? '#7ee787' : 'linear-gradient(90deg,#60a5fa,#38bdf8)';
      var nearMax = f.d3Px > f.lineMaxPx * 0.82;
      e.distWrap.style.color = nearMax ? '#ff8f6a' : '';
      e.distSub.textContent = '水平 ' + (f.hDist / FG.CFG.H_PX_PER_M).toFixed(1) +
        'm + 水深 ' + FG.formatDepth(FG.yToDepth(f.y));
      e.distSub.className = nearMax ? 'warn' : '';

      var bp = f.baitMax > 0 ? f.baitHp / f.baitMax : 0;
      e.baitHpFill.style.width = (bp * 100) + '%';
      e.baitHpNum.textContent = Math.round(bp * 100);
      e.baitWrap.style.color = bp < 0.3 ? '#ff8f6a' : '';
    }

    // 蓄力条
    var charging = !!game.charge;
    this.show('chargeBox', charging);
    if (charging) {
      e.chargeFill.style.width = (game.chargePower() * 100) + '%';
      e.chargeNum.textContent = Math.round(game.chargePower() * 100);
      e.chargeDir.textContent = game.charge.dir > 0 ? '向右' : '向左';
    }

    var prompt = game.prompt;
    if (!prompt && st === 'IDLE' && !game.charge) {
      this.idleHint += dt;
      if (this.idleHint > 1.0) prompt = '按住水面蓄力，松开抛竿：按左边往左，按右边往右（或按住 ← →）';
    } else {
      this.idleHint = 0;
    }
    if (!prompt && st === 'DIVE' && game.fastHook && game.nearShadow) {
      prompt = '鱼钩移动太快，鱼不感兴趣 —— 松开 ↓ 让鱼钩稳住';
    }
    if (!prompt && st === 'DIVE' && game.diveTime > 1.4 && game.diveTime < 5.5) {
      prompt = '按住 ↓ 快速下潜可穿过浅水层，到深度后松开等鱼咬钩';
    }

    if (prompt) {
      e.promptBox.textContent = prompt;
      e.promptBox.classList.remove('hidden');
    } else {
      e.promptBox.classList.add('hidden');
    }

    if (st === 'RESULT' && game.result && this.lastState !== 'RESULT') {
      this.renderResult(game);
    }
    this.show('resultOverlay', st === 'RESULT');
    this.lastState = st;
  },

  renderResult: function (game) {
    var r = game.result;
    var el = this.el.resultOverlay;
    if (!r) return;

    if (r.reason === 'success' && r.catch) {
      var sp = FG.fishById(r.catch.spId) || FG.FISH[0];
      var rar = FG.RARITY[sp.rarity];
      el.innerHTML =
        '<div class="result-card">' +
          '<h2 style="color:' + (r.catch.king ? '#ffd76a' : '#9fe8ff') + '">' + r.title + '</h2>' +
          '<div class="sub">' + (r.catch.king ? '传说中的鱼王上钩了！' : '成功拉上船') + '</div>' +
          '<canvas class="result-fish" width="200" height="90"></canvas>' +
          '<div class="result-name">' + sp.name +
            (r.catch.king ? '<span class="result-king">鱼王</span>' : '') +
            '<span class="rarity-tag" style="background:' + rar.color + '22;color:' + rar.color + '">' + rar.name + '</span>' +
          '</div>' +
          '<div class="result-meta">' +
            '<div class="w">重量<strong>' + r.catch.weight + ' kg</strong></div>' +
            '<div class="p">估价<strong>¥' + r.catch.value + '</strong></div>' +
          '</div>' +
          '<div class="result-btns">' +
            '<button class="btn-main" id="resOk">收入背包</button>' +
          '</div>' +
        '</div>';
      var cv = el.querySelector('.result-fish');
      if (cv) {
        var c2 = cv.getContext('2d');
        c2.clearRect(0, 0, 200, 90);
        c2.save();
        FG.drawFishShape(c2, sp, 104, 45, FG.fishDrawSize(sp, r.catch.weight, 172), 1, 1, r.catch.king);
        c2.restore();
      }
    } else {
      el.innerHTML =
        '<div class="result-card">' +
          '<h2 style="color:#ff8f6a">' + (r.title || '失败') + '</h2>' +
          '<div class="sub">' + (r.sub || '') + '</div>' +
          '<div class="result-btns">' +
            '<button class="btn-main" id="resOk">继续</button>' +
          '</div>' +
        '</div>';
    }
  }
};
