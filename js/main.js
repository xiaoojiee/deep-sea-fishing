(function () {
  var game = FG.Game;
  var render = FG.render;
  var hud = FG.HUD;
  var panels = FG.Panels;

  var lastTime = 0;
  var fpsAcc = 0, fpsFrames = 0;

  function loop(ts) {
    var dt = lastTime ? (ts - lastTime) / 1000 : 0.016;
    lastTime = ts;
    if (dt > 0.05) dt = 0.05;
    if (dt < 0) dt = 0;

    fpsAcc += dt; fpsFrames++;
    if (fpsAcc >= 0.5) {
      game.fps = Math.round(fpsFrames / fpsAcc);
      fpsAcc = 0; fpsFrames = 0;
    }

    if (!panels.isOpen()) {
      game.update(dt);
    } else {
      panels.update(dt);
    }
    hud.update(game, dt);
    render.draw(game, panels.isOpen() ? 0 : dt);
    requestAnimationFrame(loop);
  }

  function isTypingTarget(t) {
    return t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA');
  }

  function onKey(e, down) {
    if (isTypingTarget(e.target)) return;
    var k = e.code;
    if (k === 'ArrowUp' || k === 'KeyW') {
      game.input.up = down; e.preventDefault();
    } else if (k === 'ArrowDown' || k === 'KeyS') {
      game.input.down = down; e.preventDefault();
    } else if (k === 'ArrowLeft' || k === 'KeyA') {
      e.preventDefault();
      if (down) { if (!e.repeat) { FG.sfx.resume(); game.beginCharge(-1); } }
      else game.releaseCharge();
    } else if (k === 'ArrowRight' || k === 'KeyD') {
      e.preventDefault();
      if (down) { if (!e.repeat) { FG.sfx.resume(); game.beginCharge(1); } }
      else game.releaseCharge();
    } else if (k === 'Space') {
      e.preventDefault();
      if (e.repeat) return;
      game.input.reel = down;
      if (!down) return;
      FG.sfx.resume();
      if (game.state === 'RESULT') {
        var el = document.getElementById('resOk');
        if (el) el.click();
      }
    } else if (k === 'Escape' && down) {
      if (panels.isOpen()) panels.close();
    } else if (k === 'Backquote' && down) {
      e.preventDefault();
      if (panels.isOpen() && panels.current === 'debug') panels.close();
      else { panels.close(); panels.open('debug'); }
    } else if (k === 'KeyR' && down) {
      if (game.state === 'DIVE') game.retract();
    }
  }

  function bindHold(el, on, off) {
    if (!el) return;
    el.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      FG.sfx.resume();
      on();
    });
    var up = function (e) { if (off) { e.preventDefault(); off(); } };
    el.addEventListener('pointerup', up);
    el.addEventListener('pointerleave', up);
    el.addEventListener('pointercancel', up);
  }

  function updatePortrait() {
    var p = document.getElementById('portrait');
    var portrait = window.innerHeight > window.innerWidth * 1.05;
    if (portrait && hud.isTouch) p.classList.remove('hidden');
    else p.classList.add('hidden');
  }

  function init() {
    game.init();
    render.init(document.getElementById('cv'));
    hud.init();
    panels.init();

    var btnLeft = document.getElementById('btnLeft');
    var btnRight = document.getElementById('btnRight');
    [[btnLeft, -1], [btnRight, 1]].forEach(function (pair) {
      var el = pair[0], dir = pair[1];
      if (!el) return;
      el.addEventListener('pointerdown', function (e) {
        e.preventDefault();
        FG.sfx.init(); FG.sfx.resume();
        game.beginCharge(dir);
      });
      el.addEventListener('pointerup', function (e) { e.preventDefault(); game.releaseCharge(); });
      el.addEventListener('pointerleave', function () { game.releaseCharge(); });
      el.addEventListener('pointercancel', function () { game.cancelCharge(); });
      el.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    });
    document.getElementById('btnRetract').onclick = function () { game.retract(); };

    bindHold(document.getElementById('btnUp'), function () { game.input.up = true; }, function () { game.input.up = false; });
    bindHold(document.getElementById('btnDown'), function () { game.input.down = true; }, function () { game.input.down = false; });
    bindHold(document.getElementById('btnReel'), function () { game.input.reel = true; }, function () { game.input.reel = false; });

    var panelBtns = document.querySelectorAll('[data-panel]');
    for (var i = 0; i < panelBtns.length; i++) {
      panelBtns[i].onclick = function () {
        FG.sfx.init(); FG.sfx.resume();
        panels.open(this.getAttribute('data-panel'));
      };
    }

    document.getElementById('resultOverlay').addEventListener('click', function (e) {
      if (e.target && e.target.id === 'resOk') {
        game.continueAfterResult();
      }
    });

    var cv = document.getElementById('cv');
    cv.addEventListener('pointerdown', function (e) {
      FG.sfx.init(); FG.sfx.resume();
      if (panels.isOpen()) return;
      if (game.state !== 'IDLE') return;
      var w = render.toWorld(e.clientX, e.clientY);
      game.beginCharge(w.x >= game.boat.x ? 1 : -1);
    });

    // 松手即抛：长按时间决定抛投距离
    window.addEventListener('pointerup', function () { game.releaseCharge(); });
    window.addEventListener('pointercancel', function () { game.cancelCharge(); });

    window.addEventListener('keydown', function (e) { onKey(e, true); });
    window.addEventListener('keyup', function (e) { onKey(e, false); });
    window.addEventListener('resize', function () { render.resize(); updatePortrait(); });
    window.addEventListener('orientationchange', function () { setTimeout(updatePortrait, 120); });
    window.addEventListener('blur', function () {
      game.input.up = game.input.down = game.input.reel = false;
      game.cancelCharge();
    });

    updatePortrait();
    requestAnimationFrame(loop);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
