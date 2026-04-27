/**
 * Verify & fix existing puzzles: use solver to find correct answer
 */
const fs = require('fs');
const path = require('path');
const solverCode = fs.readFileSync(path.join(__dirname, 'slitherlink-solver.js'), 'utf8');
eval(solverCode);

const diffs = ['easy', 'medium', 'hard'];

for (const diff of diffs) {
  const dir = path.join(__dirname, diff);
  if (!fs.existsSync(dir)) { console.log(`Skip ${diff} (no dir)`); continue; }
  
  const files = fs.readdirSync(dir).filter(f => f.match(/^\w+-\d{4}\.json$/));
  console.log(`\n=== ${diff} (${files.length} files) ===`);
  
  let fixed = 0, valid = 0, noSolution = 0;
  const toFix = [];
  
  for (const file of files) {
    const fp = path.join(dir, file);
    const p = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const rows = p.size, cols = p.size;
    
    // Check if our stored answer is valid
    const answerValid = p.answer && isSingleLoop(p.answer.h, p.answer.v, rows, cols);
    
    // Solve from grid
    const result = solve(p.grid);
    const hasSolution = result !== null;
    const solverValid = hasSolution && isSingleLoop(result.h, result.v, rows, cols);
    
    if (!answerValid || !solverValid) {
      if (hasSolution && solverValid) {
        p.answer = result;  // Fix answer
        fs.writeFileSync(fp, JSON.stringify(p));
        fixed++;
        if (fixed <= 3) console.log(`  Fixed: ${file}`);
      } else {
        noSolution++;
        if (noSolution <= 3) console.log(`  NO SOLUTION: ${file}`);
      }
    } else {
      valid++;
    }
  }
  
  console.log(`  valid=${valid}, fixed=${fixed}, noSolution=${noSolution}`);
}
