function genPlacements(hints, n) {
  if (hints.length === 1 && hints[0] === 0) {
    var arr = []; for (var i = 0; i < n; i++) arr.push(-1); return [arr];
  }
  var total = 0;
  for (var i = 0; i < hints.length; i++) total += hints[i];
  total += hints.length - 1;
  if (total > n) return [];
  var results = [];
  function dfs(idx, pos, cur) {
    if (idx === hints.length) {
      var full = cur.slice();
      for (var i = pos; i < n; i++) full[i] = -1;
      results.push(full); return;
    }
    var len = hints[idx];
    var rest = 0;
    for (var j = idx; j < hints.length; j++) rest += hints[j];
    var maxPos = n - (rest + hints.length - idx - 1);
    for (var p = pos; p <= maxPos; p++) {
      var cur2 = cur.slice();
      for (var i = pos; i < p; i++) cur2[i] = -1;
      for (var i = p; i < p + len; i++) cur2[i] = 1;
      dfs(idx + 1, p + len + 1, cur2);
    }
  }
  dfs(0, 0, Array(n).fill(0)); return results;
}

function solveLine(hints, line, n) {
  var placements = genPlacements(hints, n);
  var valid = [];
  for (var i = 0; i < placements.length; i++) {
    var ok = true;
    for (var j = 0; j < n; j++) {
      if (line[j] === 1 && placements[i][j] !== 1) { ok = false; break; }
      if (line[j] === -1 && placements[i][j] !== -1) { ok = false; break; }
    }
    if (ok) valid.push(placements[i]);
  }
  if (!valid.length) {
    // 没有合法排列 → 所有未知格子打叉
    var mf = [];
    for (var i = 0; i < n; i++) { if (line[i] === 0) mf.push(i); }
    return { mustFill: [], mustEmpty: mf };
  }
  var mustFill = [], mustEmpty = [];
  for (var i = 0; i < n; i++) {
    var mf = true, me = true;
    for (var j = 0; j < valid.length; j++) {
      if (valid[j][i] !== 1) mf = false;
      if (valid[j][i] === 1) me = false;
    }
    if (mf) mustFill.push(i);
    if (me) mustEmpty.push(i);
  }
  return { mustFill: mustFill, mustEmpty: mustEmpty };
}

// 场景：5格，提示[2,1]，用户先填pos2+标X-pos3，再填pos1
var hints = [2, 1], n = 5;
var line = [0, 1, 1, -1, 0];  // 位置0=?, 1=填, 2=填, 3=X, 4=?
console.log('提示[2,1], 5格, line=' + JSON.stringify(line));
console.log('Result:', JSON.stringify(solveLine(hints, line, n)));
console.log('期望: mustEmpty=[0] (pos0无合法placement)');

// 补充验证：填pos0后
var line2 = [1, 1, 1, -1, 0];
console.log('\n再填pos0, line=' + JSON.stringify(line2));
console.log('Result:', JSON.stringify(solveLine(hints, line2, n)));
console.log('期望: mustEmpty=[4] (只有pos4是未知，pos0/1/2已满足[2,1])');

// 5格提示[1,1]，填pos0和pos2
console.log('\n--- 5格，提示[1,1]，填pos0和pos2 ---');
var h2 = [1, 1];
var l2 = [1, 0, 1, 0, 0];
console.log('line=' + JSON.stringify(l2));
console.log('Result:', JSON.stringify(solveLine(h2, l2, n)));
console.log('期望: mustFill=[0,2], mustEmpty=[1,3,4]');