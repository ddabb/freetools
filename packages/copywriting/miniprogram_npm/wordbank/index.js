module.exports = (function() {
var __MODS__ = {};
var __DEFINE__ = function(modId, func, req) { var m = { exports: {}, _tempexports: {} }; __MODS__[modId] = { status: 0, func: func, req: req, m: m }; };
var __REQUIRE__ = function(modId, source) { if(!__MODS__[modId]) return require(source); if(!__MODS__[modId].status) { var m = __MODS__[modId].m; m._exports = m._tempexports; var desp = Object.getOwnPropertyDescriptor(m, "exports"); if (desp && desp.configurable) Object.defineProperty(m, "exports", { set: function (val) { if(typeof val === "object" && val !== m._exports) { m._exports.__proto__ = val.__proto__; Object.keys(val).forEach(function (k) { m._exports[k] = val[k]; }); } m._tempexports = val }, get: function () { return m._tempexports; } }); __MODS__[modId].status = 1; __MODS__[modId].func(__MODS__[modId].req, m, m.exports); } return __MODS__[modId].m.exports; };
var __REQUIRE_WILDCARD__ = function(obj) { if(obj && obj.__esModule) { return obj; } else { var newObj = {}; if(obj != null) { for(var k in obj) { if (Object.prototype.hasOwnProperty.call(obj, k)) newObj[k] = obj[k]; } } newObj.default = obj; return newObj; } };
var __REQUIRE_DEFAULT__ = function(obj) { return obj && obj.__esModule ? obj.default : obj; };
__DEFINE__(1773900396320, function(require, module, exports) {
// wordbank package - exports all copywriting data
const lifeData = require('./data/life');
const loveData = require('./data/love');
const friendshipData = require('./data/friendship');
const familyData = require('./data/family');
const travelData = require('./data/travel');
const foodData = require('./data/food');
const workData = require('./data/work');
const lifeStyleData = require('./data/life-style');
const springFestivalData = require('./data/spring-festival');
const birthdayData = require('./data/birthday');
const nationalDayData = require('./data/national-day');
const teacherDayData = require('./data/teacher-day');
const newYearData = require('./data/new-year');
const laborDayData = require('./data/labor-day');
const childrenDayData = require('./data/children-day');
const midAutumnData = require('./data/mid-autumn');

// Export all data
exports.lifeData = lifeData;
exports.loveData = loveData;
exports.friendshipData = friendshipData;
exports.familyData = familyData;
exports.travelData = travelData;
exports.foodData = foodData;
exports.workData = workData;
exports.lifeStyleData = lifeStyleData;
exports.springFestivalData = springFestivalData;
exports.birthdayData = birthdayData;
exports.nationalDayData = nationalDayData;
exports.teacherDayData = teacherDayData;
exports.newYearData = newYearData;
exports.laborDayData = laborDayData;
exports.childrenDayData = childrenDayData;
exports.midAutumnData = midAutumnData;

// Also export as an array for easy access
exports.allCategories = [
  lifeData,
  loveData,
  friendshipData,
  familyData,
  travelData,
  foodData,
  workData,
  lifeStyleData,
  springFestivalData,
  birthdayData,
  nationalDayData,
  teacherDayData,
  newYearData,
  laborDayData,
  childrenDayData,
  midAutumnData
];

}, function(modId) {var map = {"./data/life":1773900396321,"./data/love":1773900396322,"./data/friendship":1773900396323,"./data/family":1773900396324,"./data/travel":1773900396325,"./data/food":1773900396326,"./data/work":1773900396327,"./data/life-style":1773900396328,"./data/spring-festival":1773900396329,"./data/birthday":1773900396330,"./data/national-day":1773900396331,"./data/teacher-day":1773900396332,"./data/new-year":1773900396333,"./data/labor-day":1773900396334,"./data/children-day":1773900396335,"./data/mid-autumn":1773900396336}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1773900396321, function(require, module, exports) {
// 人生感悟文案数据
module.exports = {
  id: 'life',
  name: '人生感悟',
  icon: '🌟',
  description: '关于人生的思考和感悟',
  content: [
    { text: '人生就像一场旅行，不在于目的地，而在于沿途的风景和看风景的心情。', from: '' },
    { text: '有些事，错过了就是错过了，再怎么后悔也回不去了，所以我们要学会珍惜当下。', from: '' },
    { text: '人生没有彩排，每一天都是现场直播，所以我们要认真对待每一天。', from: '' },
    { text: '有时候，我们需要停下来，看看自己走过的路，想想自己想要的是什么，然后继续前行。', from: '' },
    { text: '人生最大的幸福，不是拥有多少财富，而是拥有一颗知足的心。', from: '' },
    { text: '有些路，只能一个人走；有些事，只能一个人扛；有些苦，只能一个人尝。', from: '' },
    { text: '人生就像一杯茶，不会苦一辈子，但总会苦一阵子。', from: '' },
    { text: '有时候，我们需要学会放下，放下过去的遗憾，放下现在的焦虑，放下未来的担忧。', from: '' },
    { text: '人生最珍贵的不是得不到的和已失去的，而是现在所拥有的。', from: '' },
    { text: '有些道理，只有经历过才会懂；有些事情，只有失去了才会珍惜。', from: '' },
    { text: '人生就像一本书，每一页都有不同的故事，每一章都有不同的感悟。', from: '' },
    { text: '有时候，我们需要学会接受，接受不完美的自己，接受不完美的生活，接受不完美的世界。', from: '' },
    { text: '人生最大的敌人不是别人，而是自己；人生最大的胜利不是战胜别人，而是战胜自己。', from: '' },
    { text: '有些风景，错过了就错过了，但有些风景，只要你愿意回头，它依然在那里。', from: '' },
    { text: '人生就像一场戏，我们都是演员，扮演着不同的角色，演绎着不同的人生。', from: '' },
    { text: '有时候，我们需要学会沉默，沉默不是软弱，而是一种智慧，一种沉淀。', from: '' },
    { text: '人生最大的财富不是金钱，而是健康、亲情、友情和爱情。', from: '' },
    { text: '有些事情，不是看到了希望才去坚持，而是坚持了才会看到希望。', from: '' },
    { text: '人生就像一面镜子，你对它笑，它就对你笑；你对它哭，它就对你哭。', from: '' },
    { text: '有时候，我们需要学会感恩，感恩生命中的每一个遇见，感恩生活中的每一份美好。', from: '' },
    { text: '人生最幸福的事情，不是拥有一切，而是知道自己想要的是什么。', from: '' },
    { text: '有些路，看起来很艰难，但走下去会发现，其实并没有想象中那么难。', from: '' },
    { text: '人生就像一场马拉松，不在于起跑时有多快，而在于能否坚持到最后。', from: '' },
    { text: '有时候，我们需要学会原谅，原谅别人的过错，也原谅自己的不完美。', from: '' },
    { text: '人生最大的遗憾不是失败，而是我本可以。', from: '' },
    { text: '有些事情，只有经历过痛苦，才会懂得珍惜快乐；只有经历过失去，才会懂得拥有的珍贵。', from: '' },
    { text: '人生就像一杯酒，越品越香，越陈越浓。', from: '' },
    { text: '有时候，我们需要学会独处，独处不是孤独，而是一种享受，一种成长。', from: '' },
    { text: '人生最大的智慧不是拥有多少知识，而是懂得如何运用知识。', from: '' },
    { text: '有些风景，只有站在高处才能看到；有些道理，只有经历过才能明白。', from: '' },
    { text: '人生就像一幅画，每个人都是自己生命的画家，用不同的色彩描绘着不同的人生。', from: '' },
    { text: '有时候，我们需要学会放下过去，才能迎接未来；放下执念，才能获得自由。', from: '' },
    { text: '人生最大的快乐不是得到更多，而是付出更多；不是拥有更多，而是分享更多。', from: '' },
    { text: '有些事情，不是因为困难而放弃，而是因为放弃而困难。', from: '' },
    { text: '人生就像一场雨，雨过天晴，总会有彩虹。', from: '' },
    { text: '有时候，我们需要学会接受不完美，因为不完美才是人生的常态。', from: '' },
    { text: '人生最大的勇气不是面对死亡，而是面对生活中的各种困难和挑战。', from: '' },
    { text: '有些路，选择了就不要后悔，哪怕前方充满荆棘，也要勇敢地走下去。', from: '' },
    { text: '人生就像一场梦，我们都是梦中人，在梦中演绎着自己的人生。', from: '' },
    { text: '有时候，我们需要学会珍惜现在，因为现在是过去的未来，也是未来的过去。', from: '' }
  ]
};
}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1773900396322, function(require, module, exports) {
// 爱情文案数据
module.exports = {
  id: 'love',
  name: '爱情文案',
  icon: '💖',
  description: '关于爱情的甜蜜与感悟',
  content: [
    { text: '最好的爱情，不是完美无憾，而是你来了以后，始终在我身边，再也没走。', from: '' },
    { text: '爱情不是轰轰烈烈的誓言，而是平平淡淡的陪伴。', from: '' },
    { text: '真正的爱情，不是一时的热情，而是长久的陪伴。', from: '' },
    { text: '爱一个人，就是在漫长的时光里和他一起成长，在人生最后的岁月一同凋零。', from: '' },
    { text: '爱情不是寻找一个完美的人，而是学会用完美的眼光，欣赏一个不完美的人。', from: '' },
    { text: '最好的爱情，是我需要你时，你恰好都在。', from: '' },
    { text: '爱情不是终日彼此对视，而是共同瞭望远方，相伴而行。', from: '' },
    { text: '真正的爱情，不是因为对方有多好，而是因为和对方在一起，自己变得更好。', from: '' },
    { text: '爱情是一场博弈，必须保持永远与对方不分伯仲、势均力敌，才能长此以往地相依相息。', from: '' },
    { text: '最好的爱情，是两个人彼此做个伴。不要束缚，不要缠绕，不要占有，不要渴望从对方身上挖掘到意义，那是注定要落空的东西。', from: '' },
    { text: '今天的风里都飘着玫瑰香，而我的心里全是你的模样。情人节快乐，我的爱人！', from: '' },
    { text: '不是因为情人节才说爱你，而是借着这个充满仪式感的日子，想让你知道：你一直是我生命里最温暖的光。', from: '' },
    { text: '从遇见你的那天起，我就知道，这颗心终于找到了归处。谢谢你让我的生命如此完整，情人节快乐！', from: '' },
    { text: '我们的故事没有剧本，却比任何电影都动人。在这个浪漫的日子里，只想握紧你的手，说一句：余生请多指教。', from: '' },
    { text: '喜欢你的理由有很多：你的微笑、你的善良、你发呆时的可爱模样...但最主要的原因，是和你在一起时那个更快乐的自己。', from: '' },
    { text: '爱情不是刹那的烟火，而是细水长流的陪伴。感谢你陪我走过四季，未来的每一个情人节，我都想和你一起过。', from: '' },
    { text: '今天翻了翻我们的聊天记录，从早安到晚安，从分享日常到倾诉心事，原来幸福就藏在这些细碎的时光里。', from: '' },
    { text: '送你99朵玫瑰，不如许你一个未来。这个情人节，我想和你约定：一起慢慢变老，看遍世间繁华。', from: '' },
    { text: '你是我藏在心里的甜，是我嘴角扬起的笑，是我平凡生活里最耀眼的星星。情人节快乐，我最爱的人！', from: '' },
    { text: '爱情最美好的样子，大概就是我在闹，你在笑，我们一起吃很多饭，走很多路，看很多风景，然后一起慢慢变老。', from: '' }
  ]
};
}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1773900396323, function(require, module, exports) {
// 友情文案数据
module.exports = {
  id: 'friendship',
  name: '友情文案',
  icon: '🤝',
  description: '关于友情的珍贵与温暖',
  content: [
    { text: '真正的朋友，不是平时有多热闹，而是在你需要的时候，能默默地站在你身边。', from: '' },
    { text: '友情像酒，越陈越香。', from: '' },
    { text: '最好的友情，不是形影不离，而是各自忙碌，彼此牵挂。', from: '' },
    { text: '朋友是另一个自己，是我们生命中不可或缺的一部分。', from: '' },
    { text: '真正的友情，不是锦上添花，而是雪中送炭。', from: '' },
    { text: '友情的最高境界，是各自忙碌，互不打扰，却又彼此牵挂。', from: '' },
    { text: '朋友不需要太多，有一个懂你的就够了。', from: '' },
    { text: '真正的朋友，不会因为时间的流逝而疏远，不会因为距离的遥远而淡忘。', from: '' },
    { text: '友情像一盏明灯，在我们迷茫的时候，为我们指引方向。', from: '' },
    { text: '最好的友情，是你可以完全做自己，而对方依然爱你。', from: '' }
  ]
};
}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1773900396324, function(require, module, exports) {
// 亲情文案数据
module.exports = {
  id: 'family',
  name: '亲情文案',
  icon: '👨‍👩‍👧‍👦',
  description: '关于亲情的温暖与感动',
  content: [
    { text: '家是心灵的港湾，是我们永远的归宿。', from: '' },
    { text: '亲情是世界上最无私、最伟大的爱。', from: '' },
    { text: '父母的爱是世界上最温暖的阳光，永远照亮我们前行的路。', from: '' },
    { text: '家不是讲理的地方，而是讲爱的地方。', from: '' },
    { text: '亲情是一种深度，友情是一种广度，而爱情则是一种纯度。', from: '' },
    { text: '家是我们永远的后盾，无论我们走多远，它都会在那里等着我们。', from: '' },
    { text: '父母之恩，水不能溺，火不能灭。', from: '' },
    { text: '家是最小的国，国是千万家。', from: '' },
    { text: '亲情是与生俱来的，不需要刻意经营，却永远不会消失。', from: '' },
    { text: '最好的亲情，是彼此牵挂，相互扶持，一起走过人生的风风雨雨。', from: '' }
  ]
};
}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1773900396325, function(require, module, exports) {
// 旅行文案数据
module.exports = {
  id: 'travel',
  name: '旅行文案',
  icon: '✈️',
  description: '关于旅行的意义与感悟',
  content: [
    { text: '旅行不是为了逃离生活，而是为了不让生活逃离我们。', from: '' },
    { text: '世界那么大，我想去看看。', from: '' },
    { text: '旅行的意义，不是去过多少地方，而是在旅途中遇见更好的自己。', from: '' },
    { text: '身体和灵魂，总有一个要在路上。', from: '' },
    { text: '旅行是一场美丽的邂逅，遇见不同的风景，遇见不同的人，遇见不同的自己。', from: '' },
    { text: '最好的旅行，不是在景点拍照，而是在一个陌生的地方，发现一种久违的感动。', from: '' },
    { text: '旅行是一种学习，它让我们用一双婴儿的眼睛去看世界，去看不同的社会，让我们变得更宽容，让我们理解不同的价值观，让我们更好地懂得去爱、去珍惜。', from: '' },
    { text: '人生就像一场旅行，不必在乎目的地，在乎的是沿途的风景以及看风景的心情。', from: '' },
    { text: '旅行不是花钱买罪受，而是花钱买快乐，买经历，买回忆。', from: '' },
    { text: '最好的旅行，是和最爱的人一起，去看最美的风景。', from: '' }
  ]
};
}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1773900396326, function(require, module, exports) {
// 美食文案数据
module.exports = {
  id: 'food',
  name: '美食文案',
  icon: '🍔',
  description: '关于美食的诱惑与享受',
  content: [
    { text: '美食是一种生活态度，是对生活的热爱。', from: '' },
    { text: '人生没有什么是一顿美食解决不了的，如果有，那就两顿。', from: '' },
    { text: '美食不仅是一种味道，更是一种文化，一种情感。', from: '' },
    { text: '最好的美食，不是山珍海味，而是和最爱的人一起分享的家常便饭。', from: '' },
    { text: '美食是相逢最美好的理由，味道里都是满足，酒里有故事，故事里有你我。', from: '' },
    { text: '人生得意须尽欢，莫使金樽空对月。天生我材必有用，千金散尽还复来。烹羊宰牛且为乐，会须一饮三百杯。', from: '' },
    { text: '美食是一种艺术，是厨师用爱心和创意制作的艺术品。', from: '' },
    { text: '最好的美食，不是在高级餐厅，而是在街头巷尾，那些充满烟火气的地方。', from: '' },
    { text: '美食是一种记忆，是童年的味道，是家的味道，是幸福的味道。', from: '' },
    { text: '人生就像美食，需要慢慢品味，才能体会其中的美好。', from: '' }
  ]
};
}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1773900396327, function(require, module, exports) {
// 职场文案数据
module.exports = {
  id: 'work',
  name: '职场文案',
  icon: '💼',
  description: '关于职场的奋斗与成长',
  content: [
    { text: '工作不是为了生存，而是为了生活得更有意义。', from: '' },
    { text: '职场没有永远的朋友，只有永远的利益。', from: '' },
    { text: '成功不是一蹴而就的，而是需要不断地努力和积累。', from: '' },
    { text: '职场中，能力很重要，但态度更重要。', from: '' },
    { text: '机会总是留给有准备的人，所以我们要时刻准备着。', from: '' },
    { text: '职场中，不要抱怨，不要找借口，要学会解决问题。', from: '' },
    { text: '成功的人不是赢在起点，而是赢在转折点。', from: '' },
    { text: '职场中，要学会与不同的人相处，要学会团队合作。', from: '' },
    { text: '工作不仅仅是为了赚钱，更是为了实现自己的价值。', from: '' },
    { text: '最好的职场状态，是在工作中找到乐趣，在乐趣中实现成长。', from: '' },
    { text: '职场没有捷径，每一步脚踏实地的努力，都是未来登顶的基石。今天的汗水，终将成为明天的勋章。', from: '' },
    { text: '真正的强者，不是从不跌倒，而是跌倒后总能迅速爬起，拍拍身上的灰尘，继续前行。职场之路，勇者胜。', from: '' },
    { text: '不要害怕挑战，每一次挑战都是突破自我的机会。当你觉得困难时，说明你正在成长。', from: '' },
    { text: '职场中最珍贵的品质，不是天赋，不是聪明，而是坚持。很多时候，成功就在再坚持一下的努力之中。', from: '' },
    { text: '今天的你，或许还在为某个项目熬夜，或许还在为某个方案反复修改，但请相信，这些默默的付出，终将汇聚成你职场晋升的阶梯。', from: '' }
  ]
};
}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1773900396328, function(require, module, exports) {
// 生活方式文案数据
module.exports = {
  id: 'life-style',
  name: '生活方式',
  icon: '🏠',
  description: '关于生活的态度与品质',
  content: [
    { text: '生活不是缺少美，而是缺少发现美的眼睛。', from: '' },
    { text: '简单生活，热爱所爱。', from: '' },
    { text: '生活的品质不是由物质决定的，而是由心态决定的。', from: '' },
    { text: '最好的生活，不是大富大贵，而是平安健康，家人团聚。', from: '' },
    { text: '生活需要仪式感，它让我们的生活更加精致，更加有意义。', from: '' },
    { text: '慢生活，是一种态度，是一种智慧，是一种对生活的尊重。', from: '' },
    { text: '生活就像一面镜子，你对它笑，它就对你笑；你对它哭，它就对你哭。', from: '' },
    { text: '最好的生活方式，是按照自己的节奏，过自己喜欢的生活。', from: '' },
    { text: '生活需要激情，需要梦想，需要不断地尝试和探索。', from: '' },
    { text: '生活的意义，不是追求完美，而是在不完美中找到美好。', from: '' }
  ]
};
}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1773900396329, function(require, module, exports) {
// 春节文案数据
module.exports = {
  id: 'spring-festival',
  name: '春节文案',
  icon: '🧧',
  description: '关于春节的喜庆与祝福',
  content: [
    { text: '红灯笼高挂，团圆饭飘香，又是一年新春到，愿所有的牵挂都有归处，所有的等待都有回应。', from: '' },
    { text: '贴春联、挂福字，年味儿在空气里发酵，这一年的酸甜苦辣，都在除夕的钟声里化作新的期待。', from: '' },
    { text: '大年初一的阳光特别暖，照在红包上，也照在心里，愿新的一年，健康、平安、顺遂常伴左右。', from: '' },
    { text: '鞭炮声中辞旧岁，团圆是春节最温暖的底色，无论走得多远，家永远是最亮的那盏灯。', from: '' },
    { text: '年糕软糯，饺子鲜香，传统的味道里藏着最浓的思念，愿你新岁无忧，万事胜意。', from: '' },
    { text: '又是一年春来到，往事清零，爱恨随意，愿我们的友谊像老酒一样，越陈越香。', from: '' },
    { text: '记忆中的春节，是一起放鞭炮的快乐，是一起收红包的喜悦，今年春节，我们再聚聚吧。', from: '' },
    { text: '新的一年，愿你能勇敢追逐梦想，也能享受生活的美好，所求皆所愿，所行化坦途。', from: '' },
    { text: '虽然相隔千里，但我们看的是同一轮明月，愿这轮明月能替我把思念和祝福带给你。', from: '' },
    { text: '感谢过去一年你的陪伴和帮助，新的一年，愿我们都能成为更好的自己，友谊长存。', from: '' }
  ]
};
}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1773900396330, function(require, module, exports) {
// 生日祝福文案数据
module.exports = {
  id: 'birthday',
  name: '生日祝福',
  icon: '🎂',
  description: '关于生日的祝福与美好',
  content: [
    { text: '今天是你的生日，愿所有的快乐、所有的幸福、所有的温馨、所有的好运都围绕在你的身边，生日快乐！', from: '' },
    { text: '又是一年生日，愿你在新的一岁里，健康快乐，事业有成，家庭幸福，一切都如你所愿！', from: '' },
    { text: '生日快乐！愿你像星星一样永远闪亮，像花朵一样永远绽放，像阳光一样永远温暖。', from: '' },
    { text: '今天是属于你的日子，愿你的生日充满欢乐和惊喜，愿你的未来充满希望和梦想。', from: '' },
    { text: '生日快乐！愿你在这一天里感受到满满的爱和祝福，愿你的人生道路越走越宽广。', from: '' },
    { text: '又是一年生日，愿你在新的一岁里，收获更多的快乐和幸福，实现更多的梦想和目标。', from: '' },
    { text: '生日快乐！愿你像小鸟一样自由飞翔，像鱼儿一样快乐游弋，像花朵一样美丽绽放。', from: '' },
    { text: '今天是你的生日，愿你在这一天里，笑容如花，心情如蜜，幸福如潮。', from: '' },
    { text: '生日快乐！愿你在新的一岁里，身体健康，工作顺利，家庭和睦，一切都好。', from: '' },
    { text: '又是一年生日，愿你在这一天里，收到满满的祝福，感受到满满的爱，拥有满满的幸福。', from: '' },
    { text: '每一个生日都是一次成长的见证，愿你在新的一岁里，更加自信、勇敢、坚强，生日快乐！', from: '' },
    { text: '生日到了，愿你所有的愿望都能实现，所有的梦想都能成真，所有的努力都能得到回报。', from: '' },
    { text: '生日快乐！愿你的生活充满阳光和温暖，愿你的心情永远明亮和开朗，愿你的未来无限美好。', from: '' },
    { text: '今天是你的生日，我想对你说：你是最棒的，你值得拥有最好的一切，生日快乐！', from: '' },
    { text: '又是一年生日，愿你在新的一岁里，保持一颗年轻的心，保持一份对生活的热爱，保持一种积极向上的态度。', from: '' }
  ]
};
}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1773900396331, function(require, module, exports) {
// 国庆节文案数据
module.exports = {
  id: 'national-day',
  name: '国庆节文案',
  icon: '🇨🇳',
  description: '关于国庆节的爱国与祝福',
  content: [
    { text: '又是一年国庆节，五星红旗高高飘扬，愿我们的祖国繁荣昌盛，国泰民安。', from: '' },
    { text: '国庆节，是一个让我们感到无比自豪和骄傲的节日，让我们一起为祖国母亲庆祝生日。', from: '' },
    { text: '阅兵式的壮观，升旗仪式的庄严，让我们深深感受到祖国的强大和繁荣，为我们是中国人而感到自豪。', from: '' },
    { text: '国庆节，不仅是一个庆祝的节日，更是一个爱国的节日，让我们一起表达对祖国的热爱和祝福。', from: '' },
    { text: '大街小巷，红旗招展，国庆的气氛，让人感到无比的激动和自豪，愿这份激动和自豪能伴随我们一整年。', from: '' },
    { text: '国庆节，是一个团圆的节日，让我们和家人一起，共同庆祝祖国的生日，感受家庭的温暖和祖国的伟大。', from: '' },
    { text: '祖国的繁荣富强，是我们每一个中国人的骄傲和自豪，让我们一起为祖国的未来贡献自己的力量。', from: '' },
    { text: '国庆长假，是一个旅游的好时节，让我们走出家门，看看祖国的大好河山，感受祖国的美丽和壮观。', from: '' },
    { text: '国庆节，让我们放慢脚步，停下来，感受一下祖国的强大和繁荣，为我们是中国人而感到骄傲。', from: '' },
    { text: '祖国是我们的母亲，是我们的根，是我们的魂，让我们一起祝福祖国母亲生日快乐，永远繁荣昌盛。', from: '' },
    { text: '国庆的钟声敲响，爱国的情怀在心中荡漾，愿我们的祖国永远年轻，永远充满活力。', from: '' },
    { text: '五星红旗迎风飘扬，胜利歌声多么响亮，国庆节的喜悦，是每一个中国人共同的喜悦。', from: '' },
    { text: '从天安门广场的升旗仪式，到全国各地的庆祝活动，国庆节让我们感受到了祖国的凝聚力和向心力。', from: '' },
    { text: '祖国的强大，是我们最坚实的后盾，国庆节让我们更加珍惜这来之不易的和平与繁荣。', from: '' },
    { text: '国庆的阳光，温暖而明亮，庆祝的心情，欢快而热烈，愿祖国的明天更加美好。', from: '' }
  ]
};
}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1773900396332, function(require, module, exports) {
// 教师节文案数据
module.exports = {
  id: 'teacher-day',
  name: '教师节文案',
  icon: '👨‍🏫',
  description: '关于教师节的感恩与敬意',
  content: [
    { text: '粉笔灰染白了你的青丝，知识点亮了我们的人生，老师，谢谢你用平凡的坚守，成就了我们不平凡的梦想。节日快乐！', from: '' },
    { text: '你在三尺讲台上的每一次挥手，都为我们的未来勾勒出更清晰的轮廓；你批改作业的每一笔批注，都藏着对我们最真挚的期待。老师，节日快乐！', from: '' },
    { text: '小时候总觉得你的唠叨很麻烦，长大后才明白，那是世界上最温暖的指引。老师，感谢你从未放弃过那个曾经调皮的我。', from: '' },
    { text: '你的课堂不仅教给我们课本上的知识，更教会我们如何做一个有温度、有担当的人。这种教育，将伴随我们一生。老师，节日快乐！', from: '' },
    { text: '从a、o、e到加减乘除，从唐诗宋词到人生哲理，你用耐心和智慧，为我们打开了一扇又一扇知识的大门。老师，谢谢你！', from: '' },
    { text: '你就像春天的园丁，精心呵护每一朵小花；又像秋天的丰收者，为我们的成长感到欣慰。老师，愿你的生活如你带给我们的课堂一样，充满阳光和希望。', from: '' },
    { text: '还记得那些熬夜备课的夜晚，还记得那些为我们答疑解惑的课间，你的付出从未被岁月抹去，反而在我们心中愈发清晰。老师，节日快乐！', from: '' },
    { text: '你的一句话、一个眼神、一个微笑，都可能改变一个学生的一生。而你，就是那个默默改变世界的人。老师，感谢有你！', from: '' },
    { text: '不是所有的鲜花都能代表爱情，但所有的鲜花都能代表我们对老师的敬意。在这个特别的日子里，想说：老师，你辛苦了！', from: '' },
    { text: '加减乘除，算不尽你为我们付出的心血；诗词歌赋，颂不完我们对你的敬意。老师，节日快乐！', from: '' },
    { text: '你教会我们用知识武装自己，用善良温暖他人，用勇气面对挑战。这些人生课，比任何分数都珍贵。老师，谢谢你！', from: '' },
    { text: '曾经觉得毕业遥遥无期，如今却已各奔东西，但你的教导始终如影随形，成为我们人生道路上最坚实的后盾。老师，节日快乐！', from: '' },
    { text: '你不仅是知识的传授者，更是心灵的守护者。在我们迷茫时给我们方向，在我们低落时给我们力量。老师，你是最棒的！', from: '' },
    { text: '一支粉笔，两袖清风，三尺讲台，四季耕耘。这就是你最真实的写照，也是我们最敬爱的老师。节日快乐！', from: '' },
    { text: '你的声音可能不再如当年清脆，你的背可能不再如当年挺拔，但你在我们心中的形象，永远年轻、美丽。老师，节日快乐！', from: '' }
  ]
};
}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1773900396333, function(require, module, exports) {
// 元旦文案数据
module.exports = {
  id: 'new-year',
  name: '元旦文案',
  icon: '🎊',
  description: '关于元旦的祝福与新开始',
  content: [
    { text: '又是一年元旦到，新的一年，新的开始，愿你在新的一年里，身体健康，工作顺利，家庭幸福，万事如意。', from: '' },
    { text: '元旦，是一年的开始，也是希望的开始，让我们一起告别过去，迎接新的挑战和机遇。', from: '' },
    { text: '跨年的钟声即将敲响，让我们一起倒计时，迎接新的一年，新的希望，新的梦想。', from: '' },
    { text: '元旦，不仅是一个庆祝的节日，更是一个反思的节日，让我们一起回顾过去，展望未来。', from: '' },
    { text: '大街小巷，张灯结彩，元旦的气氛，让人感到无比的喜庆和热闹，愿这份喜庆和热闹能伴随我们一整年。', from: '' },
    { text: '元旦，是一个团圆的节日，让我们和家人一起，共同庆祝新年的到来，感受家庭的温暖和幸福。', from: '' },
    { text: '新的一年，新的气象，让我们一起给自己定下新的目标，新的计划，新的希望，勇敢地迎接新的挑战。', from: '' },
    { text: '元旦假期，是一个放松的好时节，让我们放下工作的压力，享受节日的欢乐，感受生活的美好。', from: '' },
    { text: '元旦，让我们放慢脚步，停下来，感受一下新年的气息，为自己加油打气，迎接新的一年。', from: '' },
    { text: '新的一年，我希望能做更好的自己，多读书，多运动，多陪伴家人，少抱怨，少拖延，少熬夜。', from: '' },
    { text: '元旦的钟声响起，新的开始就在眼前，愿你在新的一年里，所有的梦想都能实现，所有的努力都有收获。', from: '' },
    { text: '跨年的夜晚，星光璀璨，烟花绚烂，庆祝的笑声，此起彼伏，愿这份欢乐能永远留在我们心中。', from: '' },
    { text: '元旦，不仅是时间的更替，更是心灵的洗礼，让我们带着希望和勇气，迎接新的一年。', from: '' },
    { text: '新的一年，新的起点，让我们告别过去的遗憾，珍惜现在的美好，期待未来的精彩。', from: '' },
    { text: '元旦的阳光，温暖而明亮，照进我们的心田，让我们感受到生活的美好和希望。', from: '' }
  ]
};
}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1773900396334, function(require, module, exports) {
// 劳动节文案数据
module.exports = {
  id: 'labor-day',
  name: '劳动节文案',
  icon: '🛠️',
  description: '关于劳动节的致敬与歌颂',
  content: [
    { text: '劳动节到了，向所有辛勤工作的人们致敬！你们用双手创造了美好的生活，用汗水浇灌了希望的种子。', from: '' },
    { text: '劳动最光荣，劳动最伟大，劳动最美丽！祝所有劳动者节日快乐，身体健康，工作顺利！', from: '' },
    { text: '劳动是财富的源泉，是幸福的基础，是成功的阶梯！让我们一起用劳动创造美好的未来！', from: '' },
    { text: '劳动节快乐！愿你的每一份付出都有收获，愿你的每一份努力都有回报！', from: '' },
    { text: '无论是在田间地头，还是在工厂车间；无论是在办公室里，还是在施工现场，每一位劳动者都值得尊重和赞美！', from: '' },
    { text: '劳动节，一个属于所有劳动者的节日，让我们一起庆祝，一起分享劳动的快乐和成果！', from: '' },
    { text: '劳动创造了人类，劳动创造了文明，劳动创造了世界！向所有劳动者致敬！', from: '' },
    { text: '劳动节到了，放下手中的工作，好好休息一下，享受属于自己的节日！', from: '' },
    { text: '劳动是一种美德，是一种责任，是一种担当！让我们一起弘扬劳动精神，共创美好未来！', from: '' },
    { text: '劳动节快乐！愿你在劳动中找到乐趣，在工作中实现价值，在生活中收获幸福！', from: '' },
    { text: '每一份劳动都值得尊重，每一位劳动者都值得歌颂！劳动节快乐！', from: '' },
    { text: '劳动是生命的意义，是生活的动力，是幸福的保障！祝大家劳动节快乐！', from: '' },
    { text: '在这个属于劳动者的节日里，让我们向所有为生活努力拼搏的人们道一声：辛苦了！', from: '' },
    { text: '劳动是最朴素的美德，是最实在的幸福，是最珍贵的财富！劳动节快乐！', from: '' },
    { text: '无论是平凡的岗位，还是伟大的事业，只要是用双手创造价值，都是值得骄傲的！', from: '' }
  ]
};
}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1773900396335, function(require, module, exports) {
// 儿童节文案数据
module.exports = {
  id: 'children-day',
  name: '儿童节文案',
  icon: '🧒',
  description: '关于儿童节的祝福与回忆',
  content: [
    { text: '又是一年儿童节，愿所有的小朋友都能健康快乐地成长，拥有一个美好的童年！', from: '' },
    { text: '六一儿童节，是属于孩子们的节日，让我们一起回到童年，感受那份纯真和快乐。', from: '' },
    { text: '童年是人生中最美好的时光，无忧无虑，充满幻想和希望，愿每个孩子都能珍惜这段时光。', from: '' },
    { text: '六一儿童节，不仅是一个庆祝的节日，更是一个回忆的节日，让我们一起回忆自己的童年，感受那份纯真和快乐。', from: '' },
    { text: '小朋友们，节日快乐！愿你们像小树苗一样茁壮成长，像花朵一样美丽绽放。', from: '' },
    { text: '看着孩子们纯真的笑脸，听着他们欢快的笑声，这大概就是世界上最美好的事情吧！', from: '' },
    { text: '童年的记忆是最珍贵的财富，无论我们多大，心里都住着一个小孩，六一儿童节，让我们一起释放内心的那个小孩！', from: '' },
    { text: '六一儿童节，是一个充满欢乐和梦想的节日，让我们一起为孩子们创造一个美好的节日回忆。', from: '' },
    { text: '小朋友们，愿你们的童年充满阳光和欢笑，愿你们的未来充满希望和梦想。', from: '' },
    { text: '六一儿童节，不仅是孩子们的节日，也是我们这些大人的节日，让我们一起回到童年，感受那份纯真和快乐。', from: '' },
    { text: '六一儿童节到了，愿孩子们的笑声永远清脆，愿他们的眼睛永远明亮，愿他们的心灵永远纯真！', from: '' },
    { text: '童年是一幅五彩斑斓的画卷，六一儿童节，让我们一起为这幅画卷添上最鲜艳的色彩！', from: '' },
    { text: '看着孩子们奔跑的身影，听着他们银铃般的笑声，这就是六一儿童节最美好的样子。', from: '' },
    { text: '六一儿童节，是一个属于童心的节日，无论年龄多大，都要保持一颗童心，快乐地生活！', from: '' },
    { text: '小朋友们，愿你们的每一天都像六一儿童节一样快乐，愿你们的每一个梦想都能成真！', from: '' }
  ]
};
}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1773900396336, function(require, module, exports) {
// 中秋节文案数据
module.exports = {
  id: 'mid-autumn',
  name: '中秋节文案',
  icon: '🌙',
  description: '关于中秋节的团圆与思念',
  content: [
    { text: '又是一年中秋节，月儿圆圆，月饼甜甜，愿这圆圆的月亮，能带给你满满的团圆和幸福。', from: '' },
    { text: '中秋节，不仅是一个团圆的节日，更是一个思乡的节日，无论你身在何处，都不要忘记给家人打个电话，报个平安，送上祝福。', from: '' },
    { text: '赏月、吃月饼、猜灯谜、玩花灯，这些传统的习俗，承载着我们对美好生活的向往和对文化的传承。', from: '' },
    { text: '月儿圆，人团圆，中秋节的意义，大概就是和家人一起，团团圆圆吃块月饼，快快乐乐赏轮明月。', from: '' },
    { text: '一块月饼，一份思念，愿你在这个团圆的节日里，能和最爱的人一起，共享美好时光。', from: '' },
    { text: '月亮照亮了夜空，也照亮了我们的心情，愿这轮明月，能照亮你新一年的路。', from: '' },
    { text: '月饼香甜，口感丰富，就像我们的生活，有甜有咸，丰富多彩，新的一年，愿我们的生活更上一层楼。', from: '' },
    { text: '中秋佳节，家家户户乐陶陶，愿你在这个喜庆的节日里，收获满满的幸福和快乐。', from: '' },
    { text: '赏月是中秋节的传统活动，不仅有趣味性，更有诗意，让我们一起感受传统文化的魅力。', from: '' },
    { text: '中秋的月光如诗如画，洒在窗台，落在心上，唤起了我们对团圆最温暖的期待。', from: '' },
    { text: '中秋夜，月光如水，洒在每个人的心上，团圆的温暖，是这个节日最珍贵的礼物。', from: '' },
    { text: '咬一口月饼，甜在嘴里，暖在心里，中秋节的味道，就是家的味道。', from: '' },
    { text: '明月千里寄相思，无论距离多远，思乡之情都能跨越山海，抵达亲人的身边。', from: '' },
    { text: '中秋的月亮特别圆，特别亮，就像我们对家人的思念，从未减少，只会越来越深。', from: '' },
    { text: '家人围坐，灯火可亲，月饼飘香，笑声不断，这就是中秋节最美好的画面。', from: '' }
  ]
};
}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
return __REQUIRE__(1773900396320);
})()
//miniprogram-npm-outsideDeps=[]
//# sourceMappingURL=index.js.map