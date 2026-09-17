window.FG = window.FG || {};

FG.RARITY = {
  common:    { name: '常见', color: '#8fb98f', order: 0, weight: 34 },
  uncommon:  { name: '少见', color: '#6fb1d8', order: 1, weight: 24 },
  rare:      { name: '稀有', color: '#b48fe0', order: 2, weight: 15 },
  epic:      { name: '史诗', color: '#e08f5a', order: 3, weight: 7 },
  legendary: { name: '传说', color: '#f0c34a', order: 4, weight: 2.4 },
  mythic:    { name: '神话', color: '#e05a7a', order: 5, weight: 1.0 }
};

FG.FISH = [
  /* ══════════ 第 1 层 · 海洋上层（透光层）0–200m ══════════ */
  {
    id: 'crucian', name: '鲫鱼', zone: 'epi', rarity: 'common',
    dmin: 0, dmax: 40, wmin: 0.1, wmax: 1.2, avg: 0.6,
    price: 8, strength: 6, stamina: 20, speed: 26, biteRate: 0.95, attract: 0,
    color: '#9fd0a8', color2: '#d6e8d2', shape: 'flat',
    desc: '到处都是的小家伙，好钓又便宜。'
  },
  {
    id: 'sardine', name: '沙丁鱼', zone: 'epi', rarity: 'common',
    dmin: 0, dmax: 60, wmin: 0.05, wmax: 0.4, avg: 0.18,
    price: 6, strength: 4, stamina: 12, speed: 60, biteRate: 1.15, attract: 0,
    color: '#bcd4e0', color2: '#f0f8ff', shape: 'long',
    desc: '成群结队，一咬就是一串，可惜不怎么值钱。'
  },
  {
    id: 'carp', name: '鲤鱼', zone: 'epi', rarity: 'common',
    dmin: 10, dmax: 80, wmin: 0.5, wmax: 6, avg: 2.6,
    price: 11, strength: 14, stamina: 46, speed: 34, biteRate: 0.82, attract: 0,
    color: '#d9a441', color2: '#f0d79a', shape: 'normal',
    desc: '力气不小的常见鱼种，会往深处钻。'
  },
  {
    id: 'grasscarp', name: '草鱼', zone: 'epi', rarity: 'uncommon',
    dmin: 20, dmax: 110, wmin: 3, wmax: 20, avg: 9,
    price: 14, strength: 28, stamina: 100, speed: 28, biteRate: 0.55, attract: 0.9,
    color: '#7fa650', color2: '#c3d99a', shape: 'long',
    desc: '体重惊人，耐力极强，是稳健的收线考试。'
  },
  {
    id: 'catfish', name: '鲶鱼', zone: 'epi', rarity: 'uncommon',
    dmin: 30, dmax: 140, wmin: 2, wmax: 15, avg: 7,
    price: 19, strength: 24, stamina: 82, speed: 32, biteRate: 0.5, attract: 0.9,
    color: '#6b6f5a', color2: '#a8ac95', shape: 'eel',
    desc: '深水里的滑头，喜欢啃食沉底的饵。'
  },
  {
    id: 'snakehead', name: '黑鱼', zone: 'epi', rarity: 'uncommon',
    dmin: 30, dmax: 130, wmin: 1, wmax: 8, avg: 3.4,
    price: 23, strength: 30, stamina: 70, speed: 54, biteRate: 0.5, attract: 0.9,
    color: '#4a5a4a', color2: '#8a9a78', shape: 'long',
    desc: '爆发力极强，一咬钩就往水草里冲。'
  },
  {
    id: 'topmouth', name: '翘嘴', zone: 'epi', rarity: 'rare',
    dmin: 50, dmax: 160, wmin: 1, wmax: 10, avg: 4,
    price: 31, strength: 26, stamina: 76, speed: 62, biteRate: 0.34, attract: 1.2,
    color: '#b9c7d1', color2: '#f2f7fa', shape: 'long',
    desc: '游速很快，中上层掠食者，拉扯时来回橫冲。'
  },
  {
    id: 'mandarin', name: '鳜鱼', zone: 'epi', rarity: 'rare',
    dmin: 60, dmax: 180, wmin: 0.5, wmax: 5, avg: 2,
    price: 42, strength: 22, stamina: 60, speed: 58, biteRate: 0.32, attract: 1.2,
    color: '#c8a24a', color2: '#5a4a2a', shape: 'normal',
    desc: '价格高昂的掠食者，体表布满斑纹。'
  },
  {
    id: 'blackcarp', name: '青鱼', zone: 'epi', rarity: 'epic',
    dmin: 80, dmax: 190, wmin: 10, wmax: 45, avg: 26,
    price: 29, strength: 46, stamina: 165, speed: 30, biteRate: 0.2, attract: 1.5,
    color: '#3d4a52', color2: '#7b8a92', shape: 'long',
    desc: '近海巨物，一旦发力几乎拖不动。'
  },
  {
    id: 'sturgeon', name: '鲟鱼', zone: 'epi', rarity: 'epic',
    dmin: 110, dmax: 200, wmin: 20, wmax: 90, avg: 50,
    price: 62, strength: 72, stamina: 265, speed: 34, biteRate: 0.2, attract: 1.5,
    color: '#55636b', color2: '#9fb0b8', shape: 'eel',
    desc: '古老的重装战士，体力深不见底。'
  },
  {
    id: 'goldkoi', name: '黄金锦鲤', zone: 'epi', rarity: 'legendary',
    dmin: 140, dmax: 200, wmin: 5, wmax: 30, avg: 14,
    price: 130, strength: 40, stamina: 122, speed: 58, biteRate: 0.14, attract: 2.0,
    color: '#f2c14e', color2: '#fff4c2', shape: 'normal',
    desc: '浑金如霞的吉兆之鱼，据说能带来好运。'
  },

  /* ══════════ 第 2 层 · 海洋中层（弱光层）200–1000m ══════════ */
  {
    id: 'lanternfish', name: '灯笼鱼', zone: 'meso', rarity: 'common',
    dmin: 200, dmax: 520, wmin: 0.02, wmax: 0.35, avg: 0.15,
    price: 20, strength: 5, stamina: 14, speed: 56, biteRate: 0.9, attract: 1.6,
    color: '#3a5a7a', color2: '#9ff0ff', shape: 'normal',
    desc: '体侧排着发光点，是弱光层最庞大的族群。'
  },
  {
    id: 'lancetfish', name: '帆蜥鱼', zone: 'meso', rarity: 'uncommon',
    dmin: 260, dmax: 760, wmin: 1, wmax: 9, avg: 4,
    price: 55, strength: 30, stamina: 90, speed: 44, biteRate: 0.55, attract: 1.8,
    color: '#5a6b7a', color2: '#c0d8e8', shape: 'eel',
    desc: '满口獠牙的深海掠食者，身上没有鳞。'
  },
  {
    id: 'oarfish', name: '皇带鱼', zone: 'meso', rarity: 'rare',
    dmin: 320, dmax: 1000, wmin: 10, wmax: 60, avg: 28,
    price: 120, strength: 48, stamina: 190, speed: 40, biteRate: 0.32, attract: 2.0,
    color: '#c8ccd8', color2: '#f0f4ff', shape: 'eel',
    desc: '银亮如带，长得像传说中的海蛇。'
  },
  {
    id: 'fireflysquid', name: '萤火鱿', zone: 'meso', rarity: 'rare',
    dmin: 280, dmax: 820, wmin: 0.1, wmax: 1.2, avg: 0.5,
    price: 400, strength: 16, stamina: 60, speed: 52, biteRate: 0.3, attract: 2.2,
    color: '#4a3a6a', color2: '#ffb0e0', shape: 'normal',
    desc: '整片海面会因它泛起蓝光，活着的时候比死了值钱得多。'
  },
  {
    id: 'ghostshark', name: '幽灵鲨', zone: 'meso', rarity: 'epic',
    dmin: 500, dmax: 1000, wmin: 5, wmax: 25, avg: 13,
    price: 160, strength: 52, stamina: 175, speed: 38, biteRate: 0.2, attract: 2.4,
    color: '#6a7a8a', color2: '#d8e8f0', shape: 'eel',
    desc: '银灰的半透明身体，在探照灯下几乎看不见。'
  },
  {
    id: 'megamouth', name: '巨口鲨', zone: 'meso', rarity: 'epic',
    dmin: 420, dmax: 1000, wmin: 100, wmax: 420, avg: 240,
    price: 90, strength: 88, stamina: 380, speed: 30, biteRate: 0.18, attract: 2.6,
    color: '#4a5058', color2: '#a8b8c0', shape: 'normal',
    desc: '一张能吞下小船的大嘴，但它只吃浮游生物。'
  },

  /* ══════════ 第 3 层 · 海洋深层（无光层）1000–4000m ══════════ */
  {
    id: 'dragonfish', name: '深海龙鱼', zone: 'bathy', rarity: 'rare',
    dmin: 1000, dmax: 2400, wmin: 0.5, wmax: 4.5, avg: 2,
    price: 260, strength: 26, stamina: 88, speed: 58, biteRate: 0.32, attract: 2.4,
    color: '#2a1a3a', color2: '#c060ff', shape: 'eel',
    desc: '牙齿太长，所以合不上嘴。身体两侧挂着紫色的微光。'
  },
  {
    id: 'anglerfish', name: '深海鮟鱇', zone: 'bathy', rarity: 'epic',
    dmin: 1000, dmax: 2600, wmin: 5, wmax: 32, avg: 15,
    price: 110, strength: 44, stamina: 150, speed: 30, biteRate: 0.26, attract: 2.6,
    color: '#3a2a22', color2: '#e8a060', shape: 'normal',
    desc: '额头吊着一盏灯。别盯着那盏灯看。'
  },
  {
    id: 'vampiresquid', name: '吸血鬼乌贼', zone: 'bathy', rarity: 'epic',
    dmin: 1200, dmax: 3200, wmin: 1, wmax: 11, avg: 5,
    price: 350, strength: 34, stamina: 120, speed: 50, biteRate: 0.22, attract: 2.8,
    color: '#5a1a2a', color2: '#e05a7a', shape: 'normal',
    desc: '深红色的斗篷状外套膜，受惊时喷出黏液而不是墨汁。'
  },
  {
    id: 'giantsquid', name: '大王乌贼', zone: 'bathy', rarity: 'legendary',
    dmin: 1500, dmax: 4000, wmin: 100, wmax: 520, avg: 260,
    price: 180, strength: 96, stamina: 420, speed: 44, biteRate: 0.14, attract: 3.0,
    color: '#8a3030', color2: '#ffb0b0', shape: 'eel',
    desc: '触腕上全是吸盘环，抹香鲸身上的疤就是它留的。'
  },

  /* ══════════ 第 4 层 · 深渊层 4000–6000m ══════════ */
  {
    id: 'hadalfish', name: '深渊狮子鱼', zone: 'abyss', rarity: 'rare',
    dmin: 4000, dmax: 5600, wmin: 0.5, wmax: 5.5, avg: 2.5,
    price: 500, strength: 30, stamina: 100, speed: 40, biteRate: 0.3, attract: 3.0,
    color: '#c8b8d8', color2: '#fff0ff', shape: 'eel',
    desc: '半透明的胶质身体，没有鱼鳔，靠海雪过活。'
  },
  {
    id: 'frilledshark', name: '皱鳃鲨', zone: 'abyss', rarity: 'epic',
    dmin: 4000, dmax: 5800, wmin: 50, wmax: 260, avg: 130,
    price: 380, strength: 84, stamina: 330, speed: 42, biteRate: 0.2, attract: 3.2,
    color: '#4a4a3a', color2: '#a8a890', shape: 'eel',
    desc: '活化石，一亿年没怎么变过样子。'
  },
  {
    id: 'abyss', name: '深渊巨物', zone: 'abyss', rarity: 'legendary',
    dmin: 4500, dmax: 6000, wmin: 200, wmax: 800, avg: 420,
    price: 650, strength: 130, stamina: 560, speed: 34, biteRate: 0.14, attract: 3.4,
    color: '#6a3fb5', color2: '#c9a8ff', shape: 'eel',
    desc: '没人见过它完整的模样，只见过它经过时整片海雪的流向。'
  },

  /* ══════════ 第 5 层 · 超深渊层（海沟带）6000–11000m ══════════ */
  {
    id: 'marianasnail', name: '马里亚纳狮子鱼', zone: 'hadal', rarity: 'epic',
    dmin: 6000, dmax: 8600, wmin: 1, wmax: 11, avg: 5,
    price: 1200, strength: 40, stamina: 130, speed: 42, biteRate: 0.28, attract: 3.0,
    color: '#e8d8f0', color2: '#ffffff', shape: 'eel',
    desc: '人类已知生活得最深的鱼，身体像一片会游动的纸。'
  },
  {
    id: 'ghostlyeel', name: '幽冥鳗', zone: 'hadal', rarity: 'legendary',
    dmin: 6500, dmax: 9600, wmin: 30, wmax: 160, avg: 80,
    price: 1500, strength: 100, stamina: 400, speed: 48, biteRate: 0.2, attract: 3.4,
    color: '#3a4a6b', color2: '#9fb4e0', shape: 'eel',
    desc: '身体会发出幽蓝微光，靠近时那光会先熄灭，然后才轮到你看见它。'
  },
  {
    id: 'dragonking', name: '沉渊龙王', zone: 'hadal', rarity: 'mythic',
    dmin: 8000, dmax: 11000, wmin: 300, wmax: 1200, avg: 700,
    price: 3000, strength: 165, stamina: 820, speed: 40, biteRate: 0.12, attract: 3.4,
    color: '#8a2f45', color2: '#ffb3c6', shape: 'normal',
    desc: '海沟最底处的黑影。它不吃饵，它只是决定今天要不要咬。'
  }
];

FG.fishById = function (id) {
  for (var i = 0; i < FG.FISH.length; i++) if (FG.FISH[i].id === id) return FG.FISH[i];
  return null;
};

FG.fishInZone = function (zoneId) {
  return FG.FISH.filter(function (f) { return f.zone === zoneId; });
};

/* 该层可直接钓到的鱼（钩子能到达的最深处覆盖到该层） */
FG.reachableFish = function (maxDepth) {
  return FG.FISH.filter(function (f) { return f.dmin <= maxDepth; });
};
