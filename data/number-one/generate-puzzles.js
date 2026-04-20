/**
 * 数壹谜题批量生成脚本
 * 生成CDN数据源
 */

const fs = require('fs');
const path = require('path');
const { generateBatch } = require('./number-one-core.js');

// 配置
const CONFIG = {
  sizes: [5, 6, 7],
  difficulties: [1, 2, 3], // 1=简单, 2=中等, 3=困难
  countPerConfig: 20,      // 每种配置生成20个
  outputDir: path.join(__dirname, 'puzzles')
};

// 难度名称
const DIFF_NAMES = {
  1: 'easy',
  2: 'medium',
  3: 'hard'
};

// 大小名称
const SIZE_NAMES = {
  5: 'small',
  6: 'medium',
  7: 'large'
};

function main() {
  console.log('='.repeat(50));
  console.log('数壹谜题批量生成');
  console.log('='.repeat(50));
  console.log(`配置: ${CONFIG.sizes.join(', ')} 格`);
  console.log(`难度: ${CONFIG.difficulties.map(d => DIFF_NAMES[d]).join(', ')}`);
  console.log(`每种配置: ${CONFIG.countPerConfig} 个`);
  console.log('='.repeat(50));
  
  // 创建输出目录
  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
  }
  
  const allPuzzles = [];
  const stats = {
    total: 0,
    bySize: {},
    byDifficulty: {}
  };
  
  const startTime = Date.now();
  
  // 按大小和难度生成
  for (const size of CONFIG.sizes) {
    stats.bySize[size] = 0;
    
    for (const diff of CONFIG.difficulties) {
      console.log(`\n生成 ${size}×${size} ${DIFF_NAMES[diff]} 难度...`);
      
      const puzzles = generateBatch(CONFIG.countPerConfig, size, diff);
      
      // 添加元数据
      puzzles.forEach((p, i) => {
        p.id = `${size}-${DIFF_NAMES[diff]}-${i + 1}`;
        p.difficultyName = DIFF_NAMES[diff];
        p.sizeName = SIZE_NAMES[size];
      });
      
      // 保存到单独文件
      const filename = `${size}-${DIFF_NAMES[diff]}.json`;
      const filepath = path.join(CONFIG.outputDir, filename);
      fs.writeFileSync(filepath, JSON.stringify(puzzles, null, 2));
      console.log(`保存到: ${filename}`);
      
      allPuzzles.push(...puzzles);
      stats.total += puzzles.length;
      stats.bySize[size] += puzzles.length;
      stats.byDifficulty[diff] = (stats.byDifficulty[diff] || 0) + puzzles.length;
    }
  }
  
  // 保存汇总文件
  const summaryPath = path.join(CONFIG.outputDir, 'all-puzzles.json');
  fs.writeFileSync(summaryPath, JSON.stringify(allPuzzles, null, 2));
  console.log(`\n汇总文件: all-puzzles.json (${allPuzzles.length} 个谜题)`);
  
  // 保存索引文件
  const index = {
    total: allPuzzles.length,
    sizes: CONFIG.sizes,
    difficulties: CONFIG.difficulties.map(d => DIFF_NAMES[d]),
    countPerConfig: CONFIG.countPerConfig,
    generatedAt: new Date().toISOString(),
    files: fs.readdirSync(CONFIG.outputDir).filter(f => f.endsWith('.json')),
    stats
  };
  
  const indexPath = path.join(CONFIG.outputDir, 'index.json');
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
  console.log(`索引文件: index.json`);
  
  // 统计
  const elapsed = Math.round((Date.now() - startTime) / 1000);
  console.log('\n' + '='.repeat(50));
  console.log('生成完成！');
  console.log('='.repeat(50));
  console.log(`总计: ${stats.total} 个谜题`);
  console.log(`耗时: ${elapsed} 秒`);
  console.log(`\n按大小统计:`);
  for (const [size, count] of Object.entries(stats.bySize)) {
    console.log(`  ${size}×${size}: ${count} 个`);
  }
  console.log(`\n按难度统计:`);
  for (const [diff, count] of Object.entries(stats.byDifficulty)) {
    console.log(`  ${DIFF_NAMES[diff]}: ${count} 个`);
  }
  console.log(`\n输出目录: ${CONFIG.outputDir}`);
}

main();
