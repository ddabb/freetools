/**
 * 灯塔游戏批量生成 - 简化版
 * 方法：随机生成黑格和数字，验证有�?
 */

const fs = require('fs');
const path = require('path');
const { solve, countSolutions } = require('./akari-solver');

function seededRand(seed) {
  let s = seed;
  return function () {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

/**
 * 生成黑格（带数字�?
 */
function generateAkari(size, wallDensity, seed) {
  const rand = seededRand(seed);
  const grid = Array.from({ length: size }, () => Array(size).fill(' '));
  
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (rand() < wallDensity) {
        // 计算四周的白格数�?
        let adjacentWhite = 0;
        const adj = [[r-1,c],[r+1,c],[r,c-1],[r,c+1]];
        for (const [ar, ac] of adj) {
          if (ar >= 0 && ar < size && ac >= 0 && ac < size) {
            adjacentWhite++;
          }
        }
        
        // 生成 0 �?adjacentWhite 的数�?
        if (adjacentWhite > 0) {
          grid[r][c] = Math.floor(rand() * (adjacentWhite + 1));
        } else {
          grid[r][c] = 0;
        }
      }
    }
  }
  
  return grid;
}

/**
 * 验证题目是否有解，如果有解则返回带数字的题目
 */
function generateValidPuzzle(size, wallDensity, seed, maxAttempts = 10) {
  const rand = seededRand(seed);
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const grid = generateAkari(size, wallDensity, seed + attempt * 12345);
    
    // 验证有解
    const solution = solve(grid);
    if (solution) {
      // 有解！检查是否唯一�?
      const solCount = countSolutions(grid, 2);
      if (solCount === 1) {
        return { grid, unique: true };
      } else if (solCount > 1) {
        return { grid, unique: false };
      }
    }
  }
  
  return null;
}

function main() {
  const outputDir = path.join(__dirname, 'akari');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const difficulties = [
    { name: 'easy', size: 7, wallDensity: 0.15 },
    { name: 'medium', size: 10, wallDensity: 0.20 },
    { name: 'hard', size: 15, wallDensity: 0.25 }
  ];
  
  const countPerDiff = 10; // 先生�?0个测�?
  let total = 0;
  let uniqueCount = 0;
  const startTime = Date.now();
  
  for (const { name, size, wallDensity } of difficulties) {
    console.log(`生成 ${name} (${size}×${size}, 墙密�? ${wallDensity})...`);
    
    let generated = 0;
    let fileIndex = 1;
    let attempts = 0;
    const maxTotalAttempts = 1000;
    
    while (generated < countPerDiff && attempts < maxTotalAttempts) {
      attempts++;
      const seed = Date.now() + attempts * 99991;
      const result = generateValidPuzzle(size, wallDensity, seed, 5);
      
      if (result) {
        const item = {
          id: fileIndex,
          difficulty: name,
          size: size,
          wallDensity: wallDensity,
          grid: result.grid,
          unique: result.unique,
          seed
        };
        
        const filename = `${name}-${String(fileIndex).padStart(4, '0')}.json`;
        fs.writeFileSync(path.join(outputDir, filename), JSON.stringify(item));
        
        generated++;
        fileIndex++;
        total++;
        if (result.unique) uniqueCount++;
        
        process.stdout.write(`  �?${filename}${result.unique ? ' (唯一�?' : ' (多解)'}\r`);
      }
    }
    console.log(`  �?${name} 完成 (${generated}�? 唯一�? ${uniqueCount})`);
  }

  // 保存索引
  const index = {
    total,
    uniqueCount,
    difficulties: difficulties.map(d => d.name),
    generatedAt: new Date().toISOString(),
    files: fs.readdirSync(outputDir).filter(f => f.endsWith('.json') && f !== 'index.json').sort()
  };
  fs.writeFileSync(path.join(outputDir, 'index.json'), JSON.stringify(index, null, 2));

  console.log(`\n完成! 总计 ${total} 个题�?(唯一�? ${uniqueCount}), 耗时 ${Math.round((Date.now() - startTime) / 1000)}秒`);
}

main();
