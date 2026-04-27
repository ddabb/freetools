const fs = require('fs');
const solverCode = fs.readFileSync('slitherlink-solver.js', 'utf8');
eval(solverCode);

// Test solver speed on various grid types
const tests = [
  { name: '7x7 empty', grid: Array.from({length:7}, ()=>Array(7).fill(0)) },
  { name: '7x7 sparse', grid: Array.from({length:7}, (_,r)=>Array.from({length:7}, (_,c)=>(r+c)%5===0?(r+c)%3+1:0)) },
  { name: '5x5 sparse', grid: Array.from({length:5}, (_,r)=>Array.from({length:5}, (_,c)=>(r+c)%3===0?(r+c)%4:0)) },
];

for (const t of tests) {
  const times = [];
  for (let i = 0; i < 5; i++) {
    const start = Date.now();
    const r = solve(t.grid);
    times.push(Date.now() - start);
  }
  const avg = times.reduce((a,b)=>a+b,0)/times.length;
  console.log(t.name + ': avg=' + avg.toFixed(1) + 'ms, times=' + times.map(x=>x+'ms').join(', '));
}
