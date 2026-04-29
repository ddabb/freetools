/**
 * 测试数回游戏验证�?- 快速验证前10个题�?
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
  
  let validCount = 0;
  let invalidCount = 0;
  
  for (let i = 0; i < testFiles.length; i++) {
    const file = testFiles[i];
    try {
      const filePath = path.join(gameDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const puzzle = JSON.parse(content);
      
      const result = validateSlitherLink(puzzle);
      if (result) {
        validCount++;
        console.log('�?' + file + ': 有效');
      } else {
        invalidCount++;
        console.log('�?' + file + ': 无效');
      }
    } catch (error) {
      invalidCount++;
      console.log('�?' + file + ': 错误 - ' + error.message);
    }
  }
  
  console.log('\n=== 测试结果 ===');
  console.log('有效: ' + validCount);
  console.log('无效: ' + invalidCount);
}

testSlitherLink();