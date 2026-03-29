const fs = require('fs');
const path = require('path');

// 导入数独工具
const sudokuUtils = require('./packages/math/utils/sudoku');

// 难度配置
const difficultyConfig = [
  { level: '★☆☆☆☆', name: '简单', removeCount: 30 },
  { level: '★★☆☆☆', name: '中等', removeCount: 40 },
  { level: '★★★☆☆', name: '标准', removeCount: 50 },
  { level: '★★★★☆', name: '困难', removeCount: 55 },
  { level: '★★★★★', name: '专家', removeCount: 60 }
];

// 生成指定日期的数独数据
function generateSudokuForDate(date) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  // 根据日期选择难度（循环轮换）
  const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000);
  const difficultyIndex = (dayOfYear - 1) % difficultyConfig.length;
  const difficulty = difficultyConfig[difficultyIndex];
  
  console.log(`生成 ${date.toISOString().split('T')[0]} - 难度: ${difficulty.name}`);
  
  try {
    // 生成完整终盘
    const fullBoard = sudokuUtils.generateFullBoard();
    
    // 创建谜题
    const puzzle = sudokuUtils.createPuzzle(fullBoard, difficulty.removeCount);
    
    // 计算空白格数量
    let emptyCells = 0;
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        if (puzzle[i][j] === 0) {
          emptyCells++;
        }
      }
    }
    
    // 构建数据对象
    const sudokuData = {
      date: date.toISOString().split('T')[0],
      name: `${year}年${month}月${day}日数独`,
      level: difficulty.level,
      difficulty: difficulty.name,
      puzzle: puzzle,
      emptyCells: emptyCells
    };
    
    return sudokuData;
  } catch (error) {
    console.error(`生成数独失败: ${error.message}`);
    return null;
  }
}

// 生成指定年份的所有日期
function generateYearData(year) {
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31);
  const currentDate = new Date(startDate);
  
  const outputDir = path.join(__dirname, 'data', 'sudoku');
  
  // 确保输出目录存在
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  let generatedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;
  
  while (currentDate <= endDate) {
    const filename = `${currentDate.getFullYear()}${String(currentDate.getMonth() + 1).padStart(2, '0')}${String(currentDate.getDate()).padStart(2, '0')}.json`;
    const filepath = path.join(outputDir, filename);
    
    // 检查文件是否已存在
    if (fs.existsSync(filepath)) {
      console.log(`  跳过已存在的文件: ${filename}`);
      skippedCount++;
    } else {
      const sudokuData = generateSudokuForDate(currentDate);
      
      if (sudokuData) {
        fs.writeFileSync(filepath, JSON.stringify(sudokuData, null, 2), 'utf8');
        generatedCount++;
      } else {
        failedCount++;
      }
    }
    
    // 移动到下一天
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  console.log(`\n${year} 年生成完成!`);
  console.log(`  新生成文件: ${generatedCount}`);
  console.log(`  跳过已存在文件: ${skippedCount}`);
  console.log(`  失败文件: ${failedCount}`);
}

// 主程序
console.log('========================================');
console.log('  2025-2030 全年数独数据生成器');
console.log('========================================');

try {
  // 生成 2025-2030 年数据
  for (let year = 2025; year <= 2030; year++) {
    generateYearData(year);
    console.log('\n----------------------------------------');
  }
  
  console.log('\n========================================');
  console.log('  全部生成完成!');
  console.log('========================================');
} catch (error) {
  console.error('\n发生错误:', error.message);
  console.error(error.stack);
}
