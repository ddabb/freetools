/**
 * 测试数回游戏验证�?
 */

const fs = require('fs');
const path = require('path');
const validateSlitherLink = require('./validators/slither-link');

function testSlitherLink() {
  const gameDir = path.join(__dirname, 'slither-link');
  const files = fs.readdirSync(gameDir).filter(f => f.endsWith('.json') && f !== 'index.json');
  
  console.log('测试数回游戏验证�?..');
  console.log('找到 ' + files.length + ' 个题目文�?);
  
  // 只测试前10个文�?
  const testFiles = files.slice(0, 10);
  
  for (let i = 0; i < testFiles.length; i++) {
    const file = testFiles[i];
    try {
      const filePath = path.join(gameDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const puzzle = JSON.parse(content);
      
      console.log('测试 ' + file + '...');
      const result = validateSlitherLink(puzzle);
      console.log(file + ': ' + (result ? '有效' : '无效'));
    } catch (error) {
      console.log('读取错误: ' + file + ' - ' + error.message);
    }
  }
  
  console.log('测试完成!');
}

testSlitherLink();