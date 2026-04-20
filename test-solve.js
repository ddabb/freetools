function genPlacements(hints, n) {
  if (hints.length === 1 && hints[0] === 0) {
    var arr = [];
    for (var i = 0; i < n; i++) arr.push(-1);
    return [arr];
  }
  var total = 0;
  for (var i = 0; i < hints.length; i++) total = total + hints[i];
  total = total + hints.length - 1;
  if (total > n) return [];
  var results = [];
  function dfs(idx, pos, cur) {
    if (idx === hints.length) {
      var full = cur.slice();
      for (var i = pos; i < n; i++) full[i] = -1;
      results.push(full);
      return;
    }
    var len = hints[idx];
    var rest = 0;
    for (var j = idx; j < hints.length; j++) rest = rest + hints[j];
    var maxPos = n - (rest + hints.length - idx - 1);
    for (var p = pos; p <= maxPos; p++) {
      var cur2 = cur.slice();
      for (var i = pos; i < p; i++) cur2[i] = -1;
      for (var i = p; i < p + len; i++) cur2[i] = 1;
      dfs(idx + 1, p + len + 1, cur2);
    }
  }
  var initArr = [];
  for (var i = 0; i < n; i++) initArr.push(0);
  dfs(0, 0, initArr);
  return results;
}

function solveLine(hints, line, n) {
  var placements = genPlacements(hints, n);
  var valid = placements.filter(function(p) {
    for (var j = 0; j < n; j++) {
      if (line[j] === 1 && p[j] !== 1) return false;
      if (line[j] === -1 && p[j] !== -1) return false;
    }
    return true;
  });
  if (!valid.length) return { mustFill: [], mustEmpty: [] };
  var mustFill = [], mustEmpty = [];
  for (var i = 0; i < n; i++) {
    var mustFillFlag = true;
    var mustEmptyFlag = true;
    for (var j = 0; j < valid.length; j++) {
      if (valid[j][i] !== 1) mustFillFlag = false;
      if (valid[j][i] === 1) mustEmptyFlag = false;
    }
    if (mustFillFlag) mustFill.push(i);
    if (mustEmptyFlag) mustEmpty.push(i);
  }
  return { mustFill: mustFill, mustEmpty: mustEmpty };
}

// 场景：填了位置0和2
var hints = [1, 1], n = 5;
var line = [1, 0, 1, 0, 0];
var res = solveLine(hints, line, n);
console.log('Line:', JSON.stringify(line));
console.log('Result:', JSON.stringify(res));
console.log('期望: mustFill=[0,2], mustEmpty=[1,3,4]');
console.log('PASS:', JSON.stringify(res.mustFill) === '[0,2]' && JSON.stringify(res.mustEmpty) === '[1,3,4]');
