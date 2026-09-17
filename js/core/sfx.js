window.FG = window.FG || {};

FG.sfx = {
  ctx: null,
  enabled: true,

  init: function () {
    if (this.ctx) return;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (AC) this.ctx = new AC();
    } catch (e) { this.ctx = null; }
  },

  resume: function () {
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  },

  tone: function (freq, dur, type, vol, slideTo) {
    if (!this.enabled || !this.ctx) return;
    try {
      var t0 = this.ctx.currentTime;
      var osc = this.ctx.createOscillator();
      var g = this.ctx.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, t0);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol || 0.06, t0 + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(g); g.connect(this.ctx.destination);
      osc.start(t0); osc.stop(t0 + dur + 0.03);
    } catch (e) { }
  },

  noise: function (dur, vol, filterFreq) {
    if (!this.enabled || !this.ctx) return;
    try {
      var t0 = this.ctx.currentTime;
      var len = Math.floor(this.ctx.sampleRate * dur);
      var buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      var d = buf.getChannelData(0);
      for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
      var src = this.ctx.createBufferSource();
      src.buffer = buf;
      var f = this.ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = filterFreq || 900;
      var g = this.ctx.createGain();
      g.gain.value = vol || 0.08;
      src.connect(f); f.connect(g); g.connect(this.ctx.destination);
      src.start(t0);
    } catch (e) { }
  },

  cast:     function () { this.tone(320, 0.18, 'sine', 0.05, 800); },
  splash:   function () { this.noise(0.35, 0.09, 1400); },
  hit:      function () { this.tone(120, 0.16, 'square', 0.07, 60); this.noise(0.14, 0.06, 500); },
  bite:     function () { this.tone(880, 0.09, 'triangle', 0.09); setTimeout(this.tone.bind(this, 1180, 0.12, 'triangle', 0.09), 90); },
  hookset:  function () { this.tone(200, 0.22, 'sawtooth', 0.07, 520); },
  break:    function () { this.noise(0.4, 0.13, 600); this.tone(150, 0.35, 'sawtooth', 0.06, 40); },
  win:      function () { this.tone(660, 0.12, 'triangle', 0.08); setTimeout(this.tone.bind(this, 880, 0.12, 'triangle', 0.08), 110); setTimeout(this.tone.bind(this, 1320, 0.22, 'triangle', 0.08), 220); },
  coin:     function () { this.tone(1046, 0.08, 'square', 0.05); setTimeout(this.tone.bind(this, 1568, 0.12, 'square', 0.05), 70); },
  click:    function () { this.tone(520, 0.05, 'sine', 0.04); }
};
