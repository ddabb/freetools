const fs = require('fs');

const solverCode = fs.readFileSync('data/slither-link/slitherlink-solver.js', 'utf8');
eval(solverCode);

function loadPuzzle(id) {
  const s = String(id).padStart(4, '0');
  return JSON.parse(fs.readFileSync('data/slither-link/medium/medium-' + s + '.json', 'utf8'));
}

function edgesToString(h, v, rows, cols) {
  let s = 'h:\n';
  for (let r = 0; r <= rows; r++) s += h[r].map(x => x === 1 ? '█' : x === 0 ? '·' : '?').join(' ') + '\n';
  s += 'v:\n';
  for (let r = 0; r < rows; r++) s += v[r].map(x => x === 1 ? '█' : x === 0 ? '·' : '?').join(' ') + '\n';
  return s;
}

for (const id of [1, 3]) {
  const p = loadPuzzle(id);
  const rows = p.size, cols = p.size;
  console.log('=== medium-' + String(id).padStart(4, '0') + ' ===');
  console.log('Grid:');
  for (let r = 0; r < rows; r++) console.log('  ' + p.grid[r].map(x => x === 0 ? '.' : x).join(' '));
  console.log('Our answer isSingleLoop:', isSingleLoop(p.answer.h, p.answer.v, rows, cols));
  console.log(edgesToString(p.answer.h, p.answer.v, rows, cols));
  const result = solve(p.grid);
  if (result) {
    console.log('Solver found, isSingleLoop:', isSingleLoop(result.h, result.v, rows, cols));
    console.log(edgesToString(result.h, result.v, rows, cols));
    const match = JSON.stringify(result.h) === JSON.stringify(p.answer.h) && JSON.stringify(result.v) === JSON.stringify(p.answer.v);
    console.log('Match:', match);
  } else {
    console.log('Solver: NO SOLUTION!');
  }
  console.log('');
}
