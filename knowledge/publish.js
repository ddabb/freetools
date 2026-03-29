/**
 * freetools 知识库发布系统
 * 
 * 流程：
 * 1. 扫描 knowledge/ 目录下的 Markdown 文件
 * 2. 提取 Front Matter（title、category、tags、description）
 * 3. 转换 Markdown 为 HTML
 * 4. 生成 data/know/articles.json 索引
 * 5. 按分类生成 data/know/category/*.json
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const MarkdownIt = require('markdown-it');

// 配置路径
const KNOWLEDGE_DIR = path.join(__dirname, '..', 'knowledge', 'articles');
const OUTPUT_DIR = path.join(__dirname, '..', 'data', 'know');
const CATEGORY_DIR = path.join(OUTPUT_DIR, 'category');

// 确保输出目录存在
[OUTPUT_DIR, CATEGORY_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// 配置 Markdown 转换器
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: false
});

/**
 * 提取 Front Matter
 */
function extractFrontMatter(content) {
  const fmRegex = /^(\uFEFF)?(?:---|\+\+\+)\r?\n([\s\S]*?)\r?\n(?:---|\+\+\+)(?:\s*?$)/m;
  const match = content.match(fmRegex);

  let frontMatter = {};
  let cleanedContent = content;

  if (match) {
    try {
      frontMatter = yaml.load(match[2]);
    } catch (e) {
      console.warn('YAML 解析错误:', e.message);
    }
    cleanedContent = content.substring(match[0].length);
  }

  return { frontMatter, cleanedContent };
}

/**
 * 计算字数
 */
function countWords(text) {
  return text.replace(/\s+/g, '').length;
}

/**
 * 生成分类/标签统计
 */
function generateTaxonomy(articles) {
  const categories = {};
  const tags = {};

  articles.forEach(article => {
    // 统计分类
    if (article.category) {
      categories[article.category] = (categories[article.category] || 0) + 1;
    }

    // 统计标签
    if (Array.isArray(article.tags)) {
      article.tags.forEach(tag => {
        tags[tag] = (tags[tag] || 0) + 1;
      });
    }
  });

  return { categories, tags };
}

/**
 * 主函数
 */
function publishKnowledge() {
  console.log('📚 开始发布知识库...\n');

  if (!fs.existsSync(KNOWLEDGE_DIR)) {
    console.warn(`⚠️ 知识库目录不存在: ${KNOWLEDGE_DIR}`);
    fs.mkdirSync(KNOWLEDGE_DIR, { recursive: true });
    return;
  }

  // 读取所有 Markdown 文件
  const mdFiles = fs.readdirSync(KNOWLEDGE_DIR)
    .filter(f => f.endsWith('.md'))
    .map(filename => {
      const filePath = path.join(KNOWLEDGE_DIR, filename);
      const stats = fs.statSync(filePath);
      const content = fs.readFileSync(filePath, 'utf8');
      const { frontMatter, cleanedContent } = extractFrontMatter(content);

      // 转换 Markdown 为 HTML
      const contentHtml = md.render(cleanedContent);

      return {
        id: path.basename(filename, '.md'),
        name: filename,
        title: frontMatter.title || path.basename(filename, '.md'),
        description: frontMatter.description || '',
        category: frontMatter.category || '未分类',
        tags: Array.isArray(frontMatter.tags)
          ? frontMatter.tags.map(t => String(t).trim()).filter(Boolean)
          : (typeof frontMatter.tags === 'string'
              ? frontMatter.tags.split(',').map(t => t.trim()).filter(Boolean)
              : []),
        content: contentHtml,
        wordCount: countWords(cleanedContent),
        birthtime: stats.birthtime,
        updateTime: stats.mtime,
        order: 0
      };
    });

  // 按更新时间排序
  mdFiles.sort((a, b) => b.updateTime - a.updateTime);
  mdFiles.forEach((file, index) => {
    file.order = index + 1;
  });

  // 生成分类/标签统计
  const taxonomy = generateTaxonomy(mdFiles);

  // 生成主索引文件
  const mainIndex = {
    meta: {
      version: '1.0.0',
      generatedAt: new Date().toISOString(),
      totalArticles: mdFiles.length,
      totalCategories: Object.keys(taxonomy.categories).length,
      totalTags: Object.keys(taxonomy.tags).length
    },
    taxonomy,
    articles: mdFiles.map(f => ({
      id: f.id,
      title: f.title,
      description: f.description,
      category: f.category,
      tags: f.tags,
      wordCount: f.wordCount,
      birthtime: f.birthtime,
      updateTime: f.updateTime,
      order: f.order
    }))
  };

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'articles.json'),
    JSON.stringify(mainIndex, null, 2),
    'utf8'
  );

  console.log(`✅ 生成主索引: ${mdFiles.length} 篇文章`);

  // 按分类生成详细文件
  const categoryMap = {};
  mdFiles.forEach(file => {
    if (!categoryMap[file.category]) {
      categoryMap[file.category] = [];
    }
    categoryMap[file.category].push(file);
  });

  Object.entries(categoryMap).forEach(([category, articles]) => {
    const categoryData = {
      meta: {
        category,
        count: articles.length,
        generatedAt: new Date().toISOString()
      },
      articles: articles.map(a => ({
        id: a.id,
        title: a.title,
        description: a.description,
        tags: a.tags,
        wordCount: a.wordCount,
        updateTime: a.updateTime,
        order: a.order
      }))
    };

    const categoryFile = path.join(CATEGORY_DIR, `${category}.json`);
    fs.writeFileSync(categoryFile, JSON.stringify(categoryData, null, 2), 'utf8');
  });

  console.log(`✅ 生成分类文件: ${Object.keys(categoryMap).length} 个分类`);

  // 生成详细内容文件（用于详情页）
  const detailDir = path.join(OUTPUT_DIR, 'detail');
  if (!fs.existsSync(detailDir)) {
    fs.mkdirSync(detailDir, { recursive: true });
  }

  mdFiles.forEach(file => {
    const detailData = {
      id: file.id,
      title: file.title,
      description: file.description,
      category: file.category,
      tags: file.tags,
      content: file.content,
      wordCount: file.wordCount,
      birthtime: file.birthtime,
      updateTime: file.updateTime,
      order: file.order
    };

    const detailFile = path.join(detailDir, `${file.id}.json`);
    fs.writeFileSync(detailFile, JSON.stringify(detailData, null, 2), 'utf8');
  });

  console.log(`✅ 生成详情文件: ${mdFiles.length} 篇`);

  // 生成标签索引
  const tagIndex = {};
  Object.entries(taxonomy.tags).forEach(([tag, count]) => {
    const articlesWithTag = mdFiles.filter(f => f.tags.includes(tag));
    tagIndex[tag] = {
      count,
      articles: articlesWithTag.map(a => ({
        id: a.id,
        title: a.title,
        category: a.category
      }))
    };
  });

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'tags.json'),
    JSON.stringify(tagIndex, null, 2),
    'utf8'
  );

  console.log(`✅ 生成标签索引: ${Object.keys(tagIndex).length} 个标签`);

  // 输出统计信息
  console.log('\n📊 发布统计:');
  console.log(`   📄 文章总数: ${mdFiles.length}`);
  console.log(`   📂 分类数: ${Object.keys(taxonomy.categories).length}`);
  console.log(`   🏷️ 标签数: ${Object.keys(taxonomy.tags).length}`);
  console.log('\n📁 生成的文件:');
  console.log(`   ✓ data/know/articles.json (主索引)`);
  console.log(`   ✓ data/know/category/*.json (分类索引)`);
  console.log(`   ✓ data/know/detail/*.json (详情内容)`);
  console.log(`   ✓ data/know/tags.json (标签索引)`);
  console.log('\n✅ 知识库发布完成！');
}

// 执行
publishKnowledge();

module.exports = { publishKnowledge };
