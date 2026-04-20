// 快速测试数织生成
function seededRand(seed) {
  let s = seed;
  return function () {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function calcHints(line) {
  const h = [], c = 0;
  let count = 0;
  for (let i = 0; i < line.length; i++) {
    if (line[i]) { count++; }
    else if (count) { h.push(count); count = 0; }
  }
  if (count) h.push(count);
  return h.length ? h : [0];
}

// 测试生成
const size = 5;
const seed = 31337;
const rand = seededRand(seed);
const density = 0.5;
const answer = Array.from({ length: size }, () =>
  Array.from({ length: size }, () => rand() < density ? 1 : 0)
);

console.log('答案:', JSON.stringify(answer));
const rh = answer.map(row => calcHints(row));
console.log('行提示:', JSON.stringify(rh));
const ch = Array.from({ length: size }, (_, c) => calcHints(answer.map(r => r[c])));
console.log('列提示:', JSON.stringify(ch));

// 验证条件
let ok = true;
for (let r = 0; r < size; r++) {
  const sum = answer[r].reduce((a, b) => a + b, 0);
  if (sum === 0 || sum === size) { ok = false; console.log('行', r, '无效'); }
}
for (let c = 0; c < size; c++) {
  let sum = 0; for (let r = 0; r < size; r++) sum += answer[r][c];
  if (sum === 0 || sum === size) { ok = false; console.log('列', c, '无效'); }
}
console.log('验证:', ok ? '通过' : '失败');
