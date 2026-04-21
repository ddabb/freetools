/**
 * 灯塔游戏批量生成 - 每个题目单独文件
 */

const fs = require('fs');
const path = require('path');

function seededRand(seed) {
  let s = seed;
  return function () {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function generateAkari(size, wallDensity, seed) {
  const rand = seededRand(seed);
  const grid = Array.from({ length: size }, () => Array(size).fill(' '));
  
  // 生成黑格（墙）
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (rand() < wallDensity) {
        grid[r][c] = Math.floor(rand() * 5); // 0-4的数字
      }
    }
  }
  
  return {
    size,
    wallDensity,
    grid,
    seed
  };
}

function main() {
  const outputDir = path.join(__dirname, 'akari');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const difficulties = [
    { name: 'easy', size: 7, wallDensity: 0.15 },
    { name: 'medium', size: 10, wallDensity: 0.20 },
    { name: 'hard', size: 15, wallDensity: 0.25 }
  ];
  
  const countPerDiff = 1000;
  let total = 0;
  const startTime = Date.now();
  
  for (const { name, size, wallDensity } of difficulties) {
    console.log(`生成 ${name} (${size}×${size}, 墙密度: ${wallDensity})...`);
    
    for (let i = 1; i <= countPerDiff; i++) {
      const seed = i * 99991 + size * 7777;
      const game = generateAkari(size, wallDensity, seed);
      
      const item = {
        id: i,
        difficulty: name,
        size: game.size,
        wallDensity: game.wallDensity,
        grid: game.grid,
        seed
      };
      
      // 每个题目单独一个文件
      const filename = `${name}-${String(i).padStart(4, '0')}.json`;
      fs.writeFileSync(path.join(outputDir, filename), JSON.stringify(item));
      
      total++;
      process.stdout.write(`  ✓ ${filename}\r`);
    }
    console.log(`  ✓ ${name} 完成`);
  }

  // 保存索引
  const index = {
    total,
    difficulties: difficulties.map(d => d.name),
    generatedAt: new Date().toISOString(),
    files: fs.readdirSync(outputDir).filter(f => f.endsWith('.json') && f !== 'index.json').sort()
  };
  fs.writeFileSync(path.join(outputDir, 'index.json'), JSON.stringify(index, null, 2));

  console.log(`\n完成! 总计 ${total} 个题目, 耗时 ${Math.round((Date.now() - startTime) / 1000)}秒`);
}

main();