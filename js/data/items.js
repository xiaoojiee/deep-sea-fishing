window.FG = window.FG || {};

FG.RODS = [
  { id: 'bamboo',  name: '竹制手竿',     price: 0,      breakBonus: 45,  reelForce: 30, reelEff: 1.00, desc: '透光层够用，但张力上限很低。' },
  { id: 'fiber',   name: '玻璃钢竿',     price: 350,    breakBonus: 66,  reelForce: 37, reelEff: 1.12, desc: '柔韧有余，回鱼速度稍快。' },
  { id: 'carbon',  name: '碳素战竿',     price: 2000,   breakBonus: 95,  reelForce: 45, reelEff: 1.26, desc: '轻而强，能对抗浅层大型鱼。' },
  { id: 'master',  name: '大师级海钓竿', price: 14000,  breakBonus: 140, reelForce: 57, reelEff: 1.42, desc: '弱光层的主力装备。' },
  { id: 'deeprod', name: '深海重竿',     price: 90000,  breakBonus: 205, reelForce: 74, reelEff: 1.62, desc: '为无光层的高压与巨物而生。' },
  { id: 'abyssrod', name: '深渊征服者',  price: 800000, breakBonus: 300, reelForce: 94, reelEff: 1.85, desc: '能顶住深渊层与海沟带的拉力。' }
];

FG.LINES = [
  { id: 'nylon',   name: '尼龙线',     price: 0,      strength: 35,  desc: '普通鱼线，容易被猛冲扯断。' },
  { id: 'fluoro',  name: '碳氟线',     price: 250,    strength: 56,  desc: '切水快，抗磨性提升。' },
  { id: 'dyneema', name: '大力马线',   price: 1600,   strength: 88,  desc: '低延展、高强度，适合硬拉。' },
  { id: 'braid',   name: '编织超线',   price: 12000,  strength: 132, desc: '几乎不会断，弱光层首选。' },
  { id: 'steel',   name: '深海钢缆',   price: 80000,  strength: 195, desc: '外层包铠，能承受深海巨物的猛冲。' },
  { id: 'mono',    name: '亚深渊单丝', price: 600000, strength: 280, desc: '在 11000m 的水压下依然不会拉长。' }
];

FG.HOOKS = [
  { id: 'sleeve', name: '袖钩',         price: 0,      durability: 100, tangle: 0,    maxDepth: 200,   desc: '轻巧小钩，只能放到 200m。' },
  { id: 'iseama', name: '伊势尼钩',     price: 300,    durability: 175, tangle: 0.12, maxDepth: 1000,  desc: '钩身结实，可下潜到 1000m，进入弱光层。' },
  { id: 'heavy',  name: '加强大物钩',   price: 1800,   durability: 290, tangle: 0.24, maxDepth: 4000,  desc: '为无光层打造，能沉到 4000m。' },
  { id: 'deep',   name: '深海巨钩',     price: 20000,  durability: 480, tangle: 0.33, maxDepth: 6000,  desc: '耐压设计，可触及 6000m 的深渊层。' },
  { id: 'hadal',  name: '超深渊神钩',   price: 300000, durability: 820, tangle: 0.42, maxDepth: 11000, desc: '唯一的缺陷是贵。能一直沉到海沟最底部。' }
];

FG.REELS = [
  { id: 'handline', name: '手绕线轮', price: 0,      speed: 1.00, desc: '原始收线方式，速度慢。' },
  { id: 'spinning', name: '纺车轮',   price: 400,    speed: 1.30, desc: '收线更快，体力消耗更低。' },
  { id: 'drum',     name: '鼓式卷轮', price: 2200,   speed: 1.70, desc: '高齿比，回鱼迅猛。' },
  { id: 'electric', name: '电动卷轮', price: 16000,  speed: 2.10, desc: '带电机的卷轮，深海收线省力得多。' },
  { id: 'pressure', name: '深压卷轮', price: 100000, speed: 2.60, desc: '耐压外壳，无光层长时间作战不卡齿。' },
  { id: 'winch',    name: '深渊绞盘', price: 700000, speed: 3.20, desc: '本质上是装在船上的小型起重机。' }
];

FG.BAITS = [
  { id: 'worm',   name: '蚯蚓',       price: 5,   pack: 10, power: 1.00, radiusPx: 85,  tough: 1.00, color: '#c9773f', desc: '基础饵料，什么都能钓，但软、经不起长时间啃咬。' },
  { id: 'corn',   name: '嫩玉米',     price: 8,   pack: 10, power: 1.15, radiusPx: 93,  tough: 1.15, color: '#f2d24b', desc: '对草鱼和鲤鱼有奇效。' },
  { id: 'redbug', name: '红虫',       price: 13,  pack: 10, power: 1.35, radiusPx: 102, tough: 1.30, color: '#e0524b', desc: '腥味浓，稀有鱼更容易上钩，挂钩较牢。' },
  { id: 'shrimp', name: '鲜虾肉',     price: 22,  pack: 10, power: 1.62, radiusPx: 115, tough: 1.55, color: '#f59a8a', desc: '能引诱史诗级鱼种，也耐啃咬，是进入弱光层的门槛。' },
  { id: 'lure',   name: '拟饵路亚',   price: 40,  pack: 10, power: 2.00, radiusPx: 127, tough: 1.90, color: '#8ad4ff', desc: '几乎咬不烂，透光层顶级鱼种唯一的诱因。' },
  { id: 'glow',   name: '深海发光饵', price: 120, pack: 10, power: 2.60, radiusPx: 142, tough: 2.40, color: '#6fffe0', desc: '会自行发光，无光层里唯一能被看见的东西。' },
  { id: 'soul',   name: '深渊诱魂饵', price: 600, pack: 10, power: 3.40, radiusPx: 158, tough: 3.20, color: '#c060ff', desc: '据说配方来自一艘沉船。深渊里的东西认得它。' }
];

FG.byId = function (list, id) {
  for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
  return null;
};

FG.maxDepthOf = function (game) {
  return Math.min(game.hookDef().maxDepth, FG.DEPTH_MAX);
};
