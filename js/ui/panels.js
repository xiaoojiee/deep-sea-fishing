window.FG = window.FG || {};

FG.Panels = {
  root: null,
  current: null,
  shopTab: 'rod',
  toast: '',
  toastTimer: 0,

  init: function () {
    this.root = document.getElementById('panels');
  },

  isOpen: function () { return !this.root.classList.contains('hidden'); },

  open: function (name) {
    this.current = name;
    this.root.classList.remove('hidden');
    FG.Game.paused = true;
    FG.Game.input.up = false;
    FG.Game.input.down = false;
    FG.Game.input.reel = false;
    this.render();
    FG.sfx.click();
  },

  close: function () {
    this.current = null;
    this.root.classList.add('hidden');
    this.root.innerHTML = '';
    FG.Game.paused = false;
  },

  setToast: function (msg) {
    this.toast = msg;
    this.toastTimer = 1.6;
  },

  update: function (dt) {
    if (this.toastTimer > 0) {
      this.toastTimer -= dt;
      if (this.toastTimer <= 0) {
        this.toast = '';
        if (this.isOpen()) this.render();
      }
    }
    if (this.current === 'debug') this.refreshDebugLive();
  },

  render: function () {
    if (!this.current) return;
    this.debugEl = null;
    if (this.current === 'inventory') this.renderInventory();
    else if (this.current === 'shop') this.renderShop();
    else if (this.current === 'codex') this.renderCodex();
    else if (this.current === 'help') this.renderHelp();
    else if (this.current === 'debug') this.renderDebug();
    this.paintIcons();
  },

  /* ---------------- 调试 ---------------- */
  renderDebug: function () {
    var g = FG.Game;
    var html = '<div class="panel">' + this.head('调　试') +
      '<div class="panel-body">' + this.toastHtml() +
      '<div style="font-size:12px;opacity:.5;margin-bottom:14px">开发用按钮，随时可以点。快捷键 <kbd style="background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.22);border-radius:5px;padding:1px 7px;font-size:12px">`</kbd> 开关本面板。</div>' +
      '<div class="debug-btns">' +
        '<button class="dbtn primary" data-dbg="money100">+ ¥100</button>' +
        '<button class="dbtn" data-dbg="money10000">+ ¥10,000</button>' +
        '<button class="dbtn" data-dbg="money0">金钱归零</button>' +
        '<button class="dbtn" data-dbg="bait99">全部鱼饵 x99</button>' +
        '<button class="dbtn" data-dbg="maxgear">装备全部满级</button>' +
        '<button class="dbtn" data-dbg="codex">解锁全部图鉴</button>' +
        '<button class="dbtn" data-dbg="dura">鱼钩耐久回满</button>' +
        '<button class="dbtn" data-dbg="time">跳过本次等待</button>' +
        '<button class="dbtn danger" data-dbg="reset">清空存档重开</button>' +
      '</div>' +
      '<div style="font-size:12px;letter-spacing:2px;opacity:.6;margin:22px 0 8px">实 时 状 态</div>' +
      '<pre class="debug-live" id="debugLive"></pre>' +
      '</div></div>';
    this.root.innerHTML = html;
    this.bindCommon();
    this.debugEl = this.root.querySelector('#debugLive');
    this.refreshDebugLive();
    void g;
  },

  refreshDebugLive: function () {
    if (!this.debugEl) return;
    var g = FG.Game;
    var r = FG.render;
    var L = [];
    L.push('状态        ' + g.state + (g.charge ? '  (蓄力 ' + Math.round(g.chargePower() * 100) + '% → ' + (g.charge.dir > 0 ? '右' : '左') + ')' : ''));
    L.push('FPS         ' + (g.fps || 0) + '   相机 y=' + FG.render.camY.toFixed(0) + ' / x=' + FG.render.camX.toFixed(0));
    L.push('金钱        ¥' + g.money);
    L.push('装备        ' + g.rod().name + ' / ' + g.line().name + ' / ' + g.hookDef().name + ' / ' + g.reel().name);
    L.push('鱼饵        ' + (g.baitDef() ? g.baitDef().name : '无') + ' x' + g.baitCount());
    if (g.hook) {
      var hz = FG.zoneAt(g.hook.depth);
      L.push('鱼钩        x=' + g.hook.x.toFixed(0) + '  y=' + g.hook.y.toFixed(0) +
        '  水深=' + FG.formatDepth(g.hook.depth) + ' [' + hz.alias + ']');
      L.push('            耐久=' + Math.ceil(g.hook.durability) + '/' + g.hook.maxDurability +
        '  极限=' + FG.formatDepth(g.hook.maxDepth) + '  局部比例=' + FG.pxPerM(g.hook.depth).toFixed(3) + 'px/m');
    }
    L.push('小船        x=' + g.boat.x + '   鱼影/杂物 ' + g.shadows.length + ' / ' + g.debris.length);
    if (g.fight) {
      var f = g.fight;
      var fz = FG.zoneAt(FG.yToDepth(f.y));
      L.push('拉扯        ' + f.sp.name + ' ' + f.weight + 'kg  状态=' + f.state + '  方向=' + (f.dir > 0 ? '右' : '左') + '  [' + fz.alias + ']');
      L.push('            张力 ' + f.tension.toFixed(1) + '/' + f.breakAt.toFixed(0) +
        '   体力 ' + Math.round(f.stamina) + '/' + Math.round(f.maxStamina));
      L.push('            离船 ' + FG.formatDepth(FG.Fight.distM(f)) +
        ' = 水平 ' + (f.hDist / FG.CFG.H_PX_PER_M).toFixed(1) + 'm + 水深 ' + FG.formatDepth(FG.yToDepth(f.y)));
      L.push('            像素距离 ' + f.d3Px.toFixed(0) + '/' + f.lineMaxPx.toFixed(0) +
        'px   鱼饵 ' + Math.round(f.baitHp) + '/' + Math.round(f.baitMax) +
        '  进度 ' + Math.round(FG.Fight.progress(f) * 100) + '%');
    }
    L.push('背包        ' + g.inventory.length + ' 条  总价值 ¥' + FG.Economy.bagValue(g));
    L.push('图鉴        ' + Object.keys(g.codex).length + '/' + FG.FISH.length + '  已钓 ' + g.stats.caught +
      '  鱼王 ' + g.stats.kings + '  最大 ' + g.stats.best + 'kg');
    this.debugEl.textContent = L.join('\n');
  },

  head: function (title) {
    var g = FG.Game;
    return '<div class="panel-head">' +
      '<h3>' + title + '</h3>' +
      '<div class="money">¥ ' + g.money + '</div>' +
      '<button class="close-x" id="panelClose">×</button>' +
      '</div>';
  },

  toastHtml: function () {
    if (!this.toast) return '';
    return '<div style="text-align:center;color:#7ee787;font-size:12.5px;margin-bottom:10px">' + this.toast + '</div>';
  },

  /* ---------------- 背包 ---------------- */
  renderInventory: function () {
    var g = FG.Game;
    var total = FG.Economy.bagValue(g);
    var html = '<div class="panel">' + this.head('背　包') +
      '<div class="panel-body">' + this.toastHtml();

    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">' +
      '<div style="font-size:13px;opacity:.7">共 ' + g.inventory.length + ' 条鱼 · 总价值 <b style="color:#ffd76a">¥' + total + '</b></div>' +
      '<button class="btn-panel" id="sellAllBtn">全部出售 (¥' + total + ')</button>' +
      '</div>';

    if (!g.inventory.length) {
      html += '<div class="empty-tip">背包空空的，去钓几条鱼吧。</div>';
    } else {
      html += '<div class="grid">';
      var list = g.inventory.slice().reverse();
      for (var i = 0; i < list.length; i++) {
        var it = list[i];
        var sp = FG.fishById(it.spId);
        if (!sp) continue;
        var rar = FG.RARITY[sp.rarity];
        html += '<div class="card">' +
          '<div class="thumb"><canvas class="fish-icon" data-sp="' + sp.id + '" data-size="76" data-weight="' + it.weight +
            '" data-king="' + (it.king ? 1 : 0) + '"></canvas></div>' +
          '<div class="info">' +
            '<div class="title">' + sp.name +
              (it.king ? '<span class="result-king" style="font-size:10px;padding:0 5px">王</span>' : '') +
            '</div>' +
            '<div class="desc">' + it.weight + ' kg · <span style="color:' + rar.color + '">' + rar.name + '</span></div>' +
            '<div class="price">¥' + it.value + '</div>' +
            '<button class="buy" data-sell="' + it.uid + '">出售</button>' +
          '</div></div>';
      }
      html += '</div>';
    }

    html += '</div></div>';
    this.root.innerHTML = html;
    this.bindCommon();
  },

  /* ---------------- 商店 ---------------- */
  renderShop: function () {
    var g = FG.Game;
    var tabs = [
      { id: 'rod', label: '鱼竿' },
      { id: 'line', label: '鱼线' },
      { id: 'hook', label: '鱼钩' },
      { id: 'reel', label: '卷线器' },
      { id: 'bait', label: '鱼饵' }
    ];
    var html = '<div class="panel">' + this.head('商　店') +
      '<div class="panel-body">' + this.toastHtml() +
      '<div class="tabs">';
    for (var i = 0; i < tabs.length; i++) {
      html += '<button class="tab' + (this.shopTab === tabs[i].id ? ' active' : '') + '" data-tab="' + tabs[i].id + '">' + tabs[i].label + '</button>';
    }
    html += '</div>';

    if (this.shopTab === 'bait') html += this.baitShop();
    else html += this.gearShop(this.shopTab);

    html += '</div></div>';
    this.root.innerHTML = html;
    this.bindCommon();
  },

  gearShop: function (kind) {
    var g = FG.Game;
    var list = FG.Economy.listOf(kind);
    var lv = g.equip[kind];
    var html = '<div class="grid">';
    for (var i = 0; i < list.length; i++) {
      var it = list[i];
      var owned = i <= lv;
      var isNext = i === lv + 1;
      var afford = g.money >= it.price;
      var stats = '';
      if (kind === 'rod') stats = '张力上限 +' + it.breakBonus + ' · 收线力 ' + it.reelForce + ' · 效率 ×' + it.reelEff;
      else if (kind === 'line') stats = '鱼线强度 +' + it.strength;
      else if (kind === 'hook') stats = '耐久 ' + it.durability + ' · 减伤 ' + Math.round(it.tangle * 100) + '% · 极限 ' + FG.formatDepth(it.maxDepth);
      else if (kind === 'reel') stats = '收线速度 ×' + it.speed;

      html += '<div class="card' + (owned ? '' : (isNext ? '' : ' locked')) + '">' +
        '<div class="info">' +
          '<div class="title">' + it.name +
            (owned ? '<span class="rarity-tag" style="background:#7ee78722;color:#7ee787">已装备</span>' : '') +
          '</div>' +
          '<div class="desc">' + it.desc + '<br><span style="color:#9fe8ff">' + stats + '</span></div>' +
          (owned ? '' : '<div class="price">¥' + it.price + '</div>') +
          (owned
            ? '<button class="buy max" disabled>当前使用中</button>'
            : (isNext
              ? '<button class="buy" data-buy="' + kind + '" ' + (afford ? '' : 'disabled') + '>' + (afford ? '购买并装备' : '金钱不足') + '</button>'
              : '<button class="buy" disabled>需先购买前置</button>')) +
        '</div></div>';
    }
    html += '</div>';
    return html;
  },

  baitShop: function () {
    var g = FG.Game;
    var html = '<div class="grid">';
    for (var i = 0; i < FG.BAITS.length; i++) {
      var b = FG.BAITS[i];
      var have = g.baits[b.id] || 0;
      var cost = b.price * b.pack;
      var afford = g.money >= cost;
      html += '<div class="card">' +
        '<div class="thumb"><span style="display:block;width:26px;height:26px;border-radius:50%;background:' + b.color + ';box-shadow:0 0 14px ' + b.color + '"></span></div>' +
        '<div class="info">' +
          '<div class="title">' + b.name + (g.baitId === b.id ? '<span class="rarity-tag" style="background:#ffd76a22;color:#ffd76a">使用中</span>' : '') + '</div>' +
          '<div class="desc">' + b.desc + '<br><span style="color:#9fe8ff">吸引力 ' + b.power.toFixed(2) +
            ' · 诱鱼半径 ' + Math.round(b.radiusPx / 85 * 100) + '% · 耐啃咬 ' + Math.round(b.tough * 100) + '%</span><br>持有 ' + have + '</div>' +
          '<div class="price">¥' + cost + ' / ' + b.pack + '个</div>' +
          '<button class="buy" data-baitbuy="' + b.id + '" ' + (afford ? '' : 'disabled') + '>' + (afford ? '购买 x' + b.pack : '金钱不足') + '</button>' +
          '<button class="buy" data-baitset="' + b.id + '" style="background:rgba(255,255,255,.14);margin-top:5px">挂上此饵</button>' +
        '</div></div>';
    }
    html += '</div>';
    return html;
  },

  /* ---------------- 图鉴 ---------------- */
  renderCodex: function () {
    var g = FG.Game;
    var found = 0;
    for (var k in g.codex) if (g.codex[k] && g.codex[k].count > 0) found++;
    var html = '<div class="panel">' + this.head('图　鉴') +
      '<div class="panel-body">' +
      '<div style="font-size:13px;opacity:.7;margin-bottom:14px">已发现 <b style="color:#9fe8ff">' + found + ' / ' + FG.FISH.length + '</b> 种 · 鱼王 <b style="color:#ffd76a">' + g.stats.kings + '</b> 条 · 最大纪录 <b style="color:#9fe8ff">' + g.stats.best + ' kg</b></div>' +
      '<div class="grid">';

    for (var i = 0; i < FG.FISH.length; i++) {
      var sp = FG.FISH[i];
      var rar = FG.RARITY[sp.rarity];
      var rec = g.codex[sp.id];
      var known = rec && rec.count > 0;
      var z = FG.zoneAt(sp.dmin);
      html += '<div class="card' + (known ? '' : ' locked') + '">' +
        '<div class="thumb"><canvas class="fish-icon" data-sp="' + sp.id + '" data-size="76" data-weight="' +
          (known ? rec.max : sp.avg) + '" data-king="' + (known && rec.king ? 1 : 0) +
          '" data-locked="' + (known ? 0 : 1) + '"></canvas></div>' +
        '<div class="info">' +
          '<div class="title">' + (known ? sp.name : '？？？') +
            '<span class="rarity-tag" style="background:' + rar.color + '22;color:' + rar.color + '">' + rar.name + '</span>' +
            '<span class="rarity-tag" style="background:' + z.accent + '22;color:' + z.accent + '">' + z.alias + '</span></div>' +
          '<div class="desc">' + (known ? sp.desc : '尚未钓到过这种鱼。') +
            '<br><span style="color:#9fe8ff">水深 ' + FG.formatDepth(sp.dmin) + '-' + FG.formatDepth(sp.dmax) +
            ' · 体重 ' + sp.wmin + '-' + sp.wmax + 'kg · 需饵 ' + sp.attract.toFixed(1) + '</span>' +
            (known ? '<br>已钓 ' + rec.count + ' 条 · 最大 ' + rec.max + 'kg' + (rec.king ? ' · <span style="color:#ffd76a">已获鱼王</span>' : '') : '') +
          '</div>' +
        '</div></div>';
    }

    html += '</div></div></div>';
    this.root.innerHTML = html;
    this.bindCommon();
  },

  /* ---------------- 帮助 ---------------- */
  renderHelp: function () {
    var html = '<div class="panel">' + this.head('玩　法') +
      '<div class="panel-body"><div class="help-body">' +
      '<h4>基本流程</h4>' +
      '你坐在小船中央。<b>按住左边水面就往左抛，按住右边就往右抛</b>，松手出竿。' +
      '<b>按住的时间越长，抛得越远</b>——屏幕下方的力度条会涨，同时水面上会显示预判落点。' +
      '用 <kbd>←</kbd> <kbd>→</kbd> 键长按同样可以蓄力。' +
      '抛得越远，之后要把鱼拉回船边的路程也越长，还会更容易把线拖光。' +
      '入水后按住 <kbd>↓</kbd> 下沉、<kbd>↑</kbd> 上浮，控制鱼钩到达目标水深。' +
      '不同鱼种生活在不同深度，越深的鱼越大越值钱。' +
      '<h4>下潜与诱鱼（重要）</h4>' +
      '鱼钩移动越快越引不起鱼的兴趣。想穿过挤满浅水鱼的上层水域，就按住 <kbd>↓</kbd> 全速下潜，' +
      '途中几乎不会被咬；到达目标深度后<b>松开按键</b>让鱼钩稳住（缓慢下沉 3.2m/s），鱼影才会围过来。' +
      '如果提示「鱼钩移动太快」，说明你还在动，鱼不会咬。' +
      '<h4>海洋分层</h4>' +
      '海是分层的，每层的水色、光和生物都不一样：<br>' +
      '1. <b>透光层 0–200m</b>　阳光可穿透，绝大多数海洋生物在此；<br>' +
      '2. <b>弱光层 200–1000m</b>　光线微弱，生物多有发光器官；<br>' +
      '3. <b>无光层 1000–4000m</b>　完全黑暗、水温恒定、压力巨大；<br>' +
      '4. <b>深渊层 4000–6000m</b>　全靠上层沉降的「海雪」维持食物链；<br>' +
      '5. <b>超深渊层 6000–11000m</b>　海沟带，马里亚纳海沟约 1.1 万米。' +
      '<h4>鱼钩决定能下多深</h4>' +
      '每个鱼钩的线长是固定的：<b>袖钩 200m / 伊势尼钩 1000m / 加强大物钩 4000m / 深海巨钩 6000m / 超深渊神钩 11000m</b>。' +
      '到极限后鱼钩会卡在那沉沉浮浮，想再下一层只能换钩。右侧标尺上的红虚线就是当前极限。' +
      '<h4>杂物与耐久</h4>' +
      '水中会漂来树枝、渔网、暗礁等杂物，碰到会扣除鱼钩耐久度。耐久归零鱼饵被刮走，本次作废。' +
      '躲开杂物只能靠上下移动鱼钩。鱼钩等级越高耐久越高，还能减免部分伤害。' +
      '<h4>咬钩</h4>' +
      '鱼影靠近鱼饵、围绕鱼钩转满一圈后就会咬钩。<b>没有提竿提示</b>——它会直接咬死鱼钩然后带着钩往外窜，' +
      '你会看到鱼线瞬间绷紧、船身一晃、张力条弹出，这就是中鱼了。鱼饵的吸引力决定能引来多稀有的鱼。' +
      '<h4>拉扯搏斗</h4>' +
      '按住 <kbd>空格</kbd>（手机点「收线」）把鱼往船边拉，松手放线。<br>' +
      '「<b>离船</b>」显示的是到船的真实直线距离 = <b>水平距离 + 水深</b>（下面会标出两者各多少）。' +
      '所以钩子沉得越深，要拉回来的路就越长。收线是沿着「鱼→船」的方向拉的，' +
      '水平和水深会同时缩短；同时鱼被遛到力竭后会自己往上浮，两下一配合才能真正拉到船边。<br>' +
      '· <b>收线</b>：拉近距离、消耗鱼的体力，但鱼线张力上升；<br>' +
      '· <b>松手</b>：张力回落，但鱼会往回跑、还回复体力；<br>' +
      '· 张力进入红区并超过上限 → <b>断线跑鱼</b>；一直不拉、鱼把线拖光 → 同样跑鱼。<br>' +
      '鱼会随机「猛冲」，这时拉力暴涨，必须立刻松手泄力。耗空鱼的体力后，收线会变得非常轻松，一路拉到船边即可。<br>' +
      '<b>注意鱼饵</b>：鱼咬着钩每多跑一秒，就会啃掉一点鱼饵（猛冲时啃得特别快）。' +
      '「鱼饵完好」条清空，鱼就会吞掉饵跑掉——所以不能一直跟它耗，该拉的时候必须拉。' +
      '越好的饵越耐啃（蚯蚓最软，拟饵路亚几乎咬不烂）。' +
      '<h4>鱼王</h4>' +
      '体重超过该鱼种最大区间的个体是<b style="color:#ffd76a">鱼王</b>，售价为普通个体的 5 倍，而且越重价值越高。' +
      '<h4>快捷键</h4>' +
      '长按 <kbd>←</kbd><kbd>→</kbd> 蓄力向左 / 向右抛竿 · <kbd>↑</kbd><kbd>↓</kbd> 控制深度 · ' +
      '<kbd>空格</kbd> 按住收线 · <kbd>R</kbd> 收竿 · <kbd>Esc</kbd> 关闭面板' +
      '<div style="margin-top:20px">' +
      '<button class="btn-panel" id="resetBtn" style="color:#ff9b6a;border-color:rgba(255,120,90,.4)">清空存档并重新开始</button>' +
      '</div>' +
      '<div style="font-size:11px;opacity:.4;margin-top:10px">进度自动保存在本机浏览器中。</div>' +
      '</div></div></div>';
    this.root.innerHTML = html;
    this.bindCommon();
  },

  /* ---------------- 图标绘制 ---------------- */
  paintIcons: function () {
    var list = this.root.querySelectorAll('canvas.fish-icon');
    for (var i = 0; i < list.length; i++) {
      var cv = list[i];
      var sp = FG.fishById(cv.getAttribute('data-sp'));
      if (!sp) continue;
      var size = parseFloat(cv.getAttribute('data-size')) || 76;
      var weight = parseFloat(cv.getAttribute('data-weight')) || sp.avg;
      var king = cv.getAttribute('data-king') === '1';
      var locked = cv.getAttribute('data-locked') === '1';
      cv.width = size * 2; cv.height = size;
      cv.style.width = size + 'px';
      cv.style.height = (size / 2) + 'px';
      var ctx = cv.getContext('2d');
      ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.save();
      if (locked) ctx.globalAlpha = 0.18;
      FG.drawAnyFish(ctx, sp, size, size / 2, FG.fishDrawSize(sp, weight, size), 1, 1, king);
      ctx.restore();
    }
  },

  /* ---------------- 事件 ---------------- */
  bindCommon: function () {
    var self = this;
    var close = this.root.querySelector('#panelClose');
    if (close) close.onclick = function () { self.close(); };

    var sellAll = this.root.querySelector('#sellAllBtn');
    if (sellAll) sellAll.onclick = function () {
      var g = FG.Game;
      if (!g.inventory.length) return;
      var v = FG.Economy.sellAll(g);
      FG.sfx.coin();
      g.persist();
      self.setToast('售出全部渔获，获得 ¥' + v);
      self.render();
    };

    var dbgs = this.root.querySelectorAll('[data-dbg]');
    for (var d = 0; d < dbgs.length; d++) {
      dbgs[d].onclick = function () {
        var k = this.getAttribute('data-dbg');
        var g = FG.Game;
        if (k === 'money100') { g.money += 100; self.setToast('+¥100　当前 ¥' + g.money); }
        else if (k === 'money10000') { g.money += 10000; self.setToast('+¥10000　当前 ¥' + g.money); }
        else if (k === 'money0') { g.money = 0; self.setToast('金钱已归零'); }
        else if (k === 'bait99') {
          for (var i = 0; i < FG.BAITS.length; i++) g.baits[FG.BAITS[i].id] = 99;
          self.setToast('全部鱼饵 x99');
        } else if (k === 'maxgear') {
          g.equip.rod = FG.RODS.length - 1;
          g.equip.line = FG.LINES.length - 1;
          g.equip.hook = FG.HOOKS.length - 1;
          g.equip.reel = FG.REELS.length - 1;
          self.setToast('装备已全部升到最高级');
        } else if (k === 'codex') {
          for (var j = 0; j < FG.FISH.length; j++) {
            var sp = FG.FISH[j];
            g.codex[sp.id] = { count: 1, max: sp.wmax, king: true };
          }
          self.setToast('图鉴已全部解锁');
        } else if (k === 'dura') {
          if (g.hook) g.hook.durability = g.hook.maxDurability;
          self.setToast('鱼钩耐久已回满');
        } else if (k === 'time') {
          g.castLock = 0;
          self.setToast('已清除冷却');
        } else if (k === 'reset') {
          if (confirm('确定要清空所有进度重新开始吗？')) {
            g.resetAll();
            self.close();
            return;
          }
        }
        FG.sfx.click();
        g.persist();
        self.render();
      };
    }

    var reset = this.root.querySelector('#resetBtn');
    if (reset) reset.onclick = function () {
      if (confirm('确定要清空所有进度重新开始吗？')) {
        FG.Game.resetAll();
        self.close();
      }
    };

    var sells = this.root.querySelectorAll('[data-sell]');
    for (var i = 0; i < sells.length; i++) {
      sells[i].onclick = function () {
        var v = FG.Economy.sell(FG.Game, this.getAttribute('data-sell'));
        FG.sfx.coin();
        FG.Game.persist();
        self.setToast('售出获得 ¥' + v);
        self.render();
      };
    }

    var tabs = this.root.querySelectorAll('[data-tab]');
    for (var t = 0; t < tabs.length; t++) {
      tabs[t].onclick = function () {
        self.shopTab = this.getAttribute('data-tab');
        self.render();
      };
    }

    var buys = this.root.querySelectorAll('[data-buy]');
    for (var b = 0; b < buys.length; b++) {
      buys[b].onclick = function () {
        var res = FG.Economy.buyUpgrade(FG.Game, this.getAttribute('data-buy'));
        FG.sfx.click();
        FG.Game.persist();
        self.setToast(res.msg);
        self.render();
      };
    }

    var bb = this.root.querySelectorAll('[data-baitbuy]');
    for (var c = 0; c < bb.length; c++) {
      bb[c].onclick = function () {
        var res = FG.Economy.buyBait(FG.Game, this.getAttribute('data-baitbuy'));
        if (res.ok) FG.sfx.coin();
        FG.Game.persist();
        self.setToast(res.msg);
        self.render();
      };
    }

    var bs = this.root.querySelectorAll('[data-baitset]');
    for (var d = 0; d < bs.length; d++) {
      bs[d].onclick = function () {
        FG.Game.baitId = this.getAttribute('data-baitset');
        FG.Game.persist();
        self.setToast('已换上 ' + FG.Game.baitDef().name);
        self.render();
      };
    }
  }
};
