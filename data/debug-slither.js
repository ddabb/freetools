/**
 * 测试数回游戏验证�?- 带调试信�?
 */

const fs = require('fs');
const path = require('path');

function testSlitherLink() {
  const gameDir = path.join(__dirname, 'slither-link');
  const file = 'easy-0001.json';
  
  const filePath = path.join(gameDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  const puzzle = JSON.parse(content);
  
  console.log('Puzzle:', JSON.stringify(puzzle, null, 2));
  
  const { size, grid } = puzzle;
  console.log('Size:', size);
  console.log('Grid:', grid);
  
  // 模拟验证器的初始�?
  const edges = {
    horizontal: Array.from({ length: size + 1 }, () => Array(size).fill(0)),
    vertical: Array.from({ length: size }, () => Array(size + 1).fill(0))
  };
  
  console.log('horizontal edges length:', edges.horizontal.length);
  console.log('vertical edges length:', edges.vertical.length);
  
  // 测试访问
  try {
    console.log('Testing horizontal edge access...');
    console.log('edges.horizontal[0][0]:', edges.horizontal[0][0]);
    console.log('edges.horizontal[size][0]:', edges.horizontal[size][0]);
    
    console.log('Testing vertical edge access...');
    console.log('edges.vertical[0][0]:', edges.vertical[0][0]);
    console.log('edges.vertical[0][size]:', edges.vertical[0][size]);
    
    console.log('All edge access tests passed!');
  } catch (e) {
    console.error('Error:', e.message);
  }
}

testSlitherLink();