// Debug: trace through generateLoopWithBays for medium 7x7
// Focus on: why does it produce invalid edge sets?

const hEdges = new Set(), vEdges = new Set();

// Add border edges
const rows = 7, cols = 7;
for (let c = 0; c < cols; c++) { hEdges.add(`0,${c}`); hEdges.add(`${rows},${c}`); }
for (let r = 0; r < rows; r++) { vEdges.add(`${r},0`); vEdges.add(`${r},${cols}`); }

console.log('=== Border loop degrees ===');
// All border dots should have degree 2 from border edges alone
// Check corners
console.log('Corner (0,0): degree from vEdge(0,0) + hEdge(0,0) =', 
  vEdges.has('0,0') + 0, hEdges.has('0,0') + 0, 
  'hEdge top, vEdge left');

// Simulate one top-side bay: c1=2, c2=5, depth=2
const c1 = 2, c2 = 5, depth = 2;

console.log('\n=== Adding top bay c1=' + c1 + ' c2=' + c2 + ' depth=' + depth + ' ===');

// Current code: removes border, adds bay edges
for (let c = c1; c < c2; c++) { hEdges.delete(`0,${c}`); }
for (let c = c1; c < c2; c++) { hEdges.add(`${depth},${c}`); }
for (let r = 0; r < depth; r++) { vEdges.add(`${r},${c1}`); vEdges.add(`${r},${c2}`); }

// Check degrees at key dots
function getDegree(r, c) {
  let d = 0;
  if (hEdges.has(`${r},${c}`)) d++;
  if (hEdges.has(`${r},${c-1}`)) d++;
  if (vEdges.has(`${r},${c}`)) d++;
  if (vEdges.has(`${r-1},${c}`)) d++;
  return d;
}

console.log('\nKey dots after bay added:');
// Bay left entrance: dot (0, c1) = (0,2)
console.log('Dot (0,' + c1 + '): degree=' + getDegree(0, c1));
// Bay right entrance: dot (0, c2) = (0,5)  
console.log('Dot (0,' + c2 + '): degree=' + getDegree(0, c2));

// Bay interior corners
console.log('Dot (' + depth + ',' + c1 + '): degree=' + getDegree(depth, c1));
console.log('Dot (' + depth + ',' + c2 + '): degree=' + getDegree(depth, c2));

// Check if ALL dots with edges have degree 0 or 2
console.log('\n=== Checking all dots for degree violations ===');
let violations = [];
for (let r = 0; r <= rows; r++) {
  for (let c = 0; c <= cols; c++) {
    const d = getDegree(r, c);
    if (d > 0 && d !== 2) {
      violations.push(`dot(${r},${c}) degree=${d}`);
    }
  }
}
if (violations.length === 0) {
  console.log('No violations - this edge set is valid!');
} else {
  console.log('Violations found:', violations.length);
  violations.forEach(v => console.log('  ' + v));
}

// Now also simulate a left-side bay to check
console.log('\n=== Simulating left-side bay ===');
const hEdges2 = new Set(), vEdges2 = new Set();
for (let c = 0; c < cols; c++) { hEdges2.add(`0,${c}`); hEdges2.add(`${rows},${c}`); }
for (let r = 0; r < rows; r++) { vEdges2.add(`${r},0`); vEdges2.add(`${r},${cols}`); }

const r1 = 2, r2 = 5, d2 = 2;
// Current code for left bay
for (let r = r1; r < r2; r++) { vEdges2.delete(`${r},0`); }
for (let r = r1; r < r2; r++) { vEdges2.add(`${r},${d2}`); }
for (let c = 0; c < d2; c++) { hEdges2.add(`${r1},${c}`); hEdges2.add(`${r2},${c}`); }

function getDegree2(r, c) {
  let d = 0;
  if (hEdges2.has(`${r},${c}`)) d++;
  if (hEdges2.has(`${r},${c-1}`)) d++;
  if (vEdges2.has(`${r},${c}`)) d++;
  if (vEdges2.has(`${r-1},${c}`)) d++;
  return d;
}

let violations2 = [];
for (let r = 0; r <= rows; r++) {
  for (let c = 0; c <= cols; c++) {
    const d = getDegree2(r, c);
    if (d > 0 && d !== 2) {
      violations2.push(`dot(${r},${c}) degree=${d}`);
    }
  }
}
if (violations2.length === 0) {
  console.log('No violations!');
} else {
  console.log('Violations:', violations2.length);
  violations2.forEach(v => console.log('  ' + v));
}
