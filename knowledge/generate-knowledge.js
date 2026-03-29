/**
 * 知识库 CDN 数据生成器
 * 
 * 使用方法：
 * 1. 在 knowledge/ 目录下按分类创建 JSON 文件
 * 2. 运行 node generate-knowledge.js
 * 3. 自动生成 data/know/index.json 和各分类文件
 */

const fs = require('fs');
const path = require('path');

// 知识库源目录
const KNOWLEDGE_DIR = path.join(__dirname, '..', 'knowledge');
// 输出目录
const OUTPUT_DIR = path.join(__dirname, '..', 'data', 'know');

// 确保输出目录存在
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// 读取所有分类文件
function getCategoryFiles() {
  if (!fs.existsSync(KNOWLEDGE_DIR)) {
    fs.mkdirSync(KNOWLEDGE_DIR, { recursive: true });
    return [];
  }
  return fs.readdirSync(KNOWLEDGE_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => path.join(KNOWLEDGE_DIR, f));
}

// 生成索引
function generateIndex() {
  const files = getCategoryFiles();
  const index = {
    meta: {
      version: '1.0.0',
      generatedAt: new Date().toISOString().split('T')[0],
      totalCategories: 0,
      totalFiles: 0
    },
    categories: {},
    files: []
  };

  files.forEach(filePath => {
    const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const categoryName = path.basename(filePath, '.json');
    
    index.categories[categoryName] = {
      name: content.name || categoryName,
      description: content.description || '',
      icon: content.icon || '📚',
      count: content.items ? content.items.length : 0
    };

    if (content.items && content.items.length > 0) {
      content.items.forEach(item => {
        item.category = categoryName;
        index.files.push(item);
        index.meta.totalFiles++;
      });
    }
  });

  index.meta.totalCategories = files.length;

  // 生成索引文件
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'index.json'),
    JSON.stringify(index, null, 2),
    'utf-8'
  );

  console.log(`✅ 生成索引: ${index.meta.totalCategories} 个分类, ${index.meta.totalFiles} 条知识`);
  return index;
}

// 添加新知识条目
function addKnowledge(category, item) {
  const filePath = path.join(KNOWLEDGE_DIR, `${category}.json`);
  let content = { items: [] };
  
  if (fs.existsSync(filePath)) {
    content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  }
  
  // 生成 ID
  if (!item.id) {
    const prefix = category.slice(0, 3);
    const timestamp = Date.now().toString(36);
    item.id = `${prefix}-${timestamp}`;
  }
  
  item.createdAt = new Date().toISOString();
  item.updatedAt = new Date().toISOString();
  
  content.items.push(item);
  content.meta = content.meta || { updatedAt: new Date().toISOString() };
  content.meta.updatedAt = new Date().toISOString();
  
  fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf-8');
  console.log(`✅ 添加知识: ${item.title}`);
  
  // 重新生成索引
  generateIndex();
}

// 列出所有知识
function listKnowledge() {
  const index = generateIndex();
  
  console.log('\n📚 知识库概览:');
  console.log('================');
  
  Object.entries(index.categories).forEach(([key, cat]) => {
    console.log(`\n${cat.icon} ${cat.name} (${cat.count} 条)`);
    if (cat.description) {
      console.log(`   ${cat.description}`);
    }
  });
  
  return index;
}

// 主函数
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'add':
    if (args.length < 3) {
      console.log('用法: node generate-knowledge.js add <category> <title> [content]');
      break;
    }
    const category = args[1];
    const title = args[2];
    const content = args[3] || '';
    addKnowledge(category, { title, content });
    break;
    
  case 'list':
    listKnowledge();
    break;
    
  case 'generate':
  default:
    generateIndex();
    break;
}

module.exports = { generateIndex, addKnowledge, listKnowledge };
