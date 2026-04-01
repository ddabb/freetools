/**
 * freetools 小程序自动化发布脚本
 *
 * 用法:
 *   node publish.js                      # 上传 + 提交审核（完整流程）
 *   node publish.js --upload-only        # 仅上传代码，不提交审核
 *   node publish.js --version 1.2.3      # 指定版本号
 *   node publish.js --desc "更新说明"     # 指定版本备注
 *
 * 配置说明:
 *   编辑同目录下的 .publish-config.json 修改 appid / appSecret / projectPath
 */

const ci = require('miniprogram-ci');
const fs = require('fs');
const path = require('path');

// 解析命令行参数
const args = process.argv.slice(2);
const uploadOnly = args.includes('--upload-only');

const versionArg = args.find(a => a.startsWith('--version'));
const version = versionArg ? versionArg.split('=')[1] : null;

const descArg = args.find(a => a.startsWith('--desc'));
const desc = descArg ? descArg.split('=')[1] : null;

// 读取配置
const configPath = path.join(__dirname, '.publish-config.json');
let config;
try {
  config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
} catch (err) {
  console.error('❌ 读取配置文件失败:', err.message);
  console.error('💡 请确保 .publish-config.json 存在并且格式正确');
  process.exit(1);
}

// 从配置中读取 privateKeyPath，默认指向项目目录中的私钥文件
const privateKeyPath = config.privateKeyPath ;

// 自动生成版本号（格式: YYYYMMDD.N）
function autoVersion() {
  const now = new Date();
  const dateStr = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`;
  const timeStr = `${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;
  return `${dateStr}.${timeStr}`;
}

const resolvedVersion = version || autoVersion();
const resolvedDesc = desc || `自动化发布 ${resolvedVersion}`;

console.log('========================================');
console.log('  freetools 小程序发布脚本');
console.log('========================================');
console.log(`  AppID:       ${config.appid}`);
console.log(`  项目路径:    ${config.projectPath}`);
console.log(`  版本号:      ${resolvedVersion}`);
console.log(`  备注:        ${resolvedDesc}`);
console.log(`  模式:        ${uploadOnly ? '仅上传代码' : '上传 + 提交审核'}`);
console.log('========================================\n');

async function publish() {
  // 初始化项目
  const project = new ci.Project({
    appid: config.appid,
    type: 'miniProgram',
    projectPath: config.projectPath,
    privateKeyPath: privateKeyPath,
    // 也可以直接用 appSecret（不推荐生产环境）
    ignores: ['node_modules/**/*', '*.md', 'docs/**/*', '.codebuddy/**/*', '项目提案.html', 'data/**/*', 'pmpimages/**/*'],
  });

  // 步骤1：上传代码
  console.log('📤 步骤1/2：正在上传代码...\n');
  const uploadResult = await ci.upload({
    project,
    version: resolvedVersion,
    desc: resolvedDesc,
    setting: {
      es6: true,
      minify: true,
      minifyWXSS: true,
      minifyWXML: true,
    },
    onProgressUpdate: (progress) => {
      process.stdout.write(`\r  上传进度: ${progress.infoList.filter(i => i.level === 'info').map(i => i.message).join(' ')}`);
    },
  });

  console.log(`\n\n✅ 代码上传成功！`);
  console.log(`   生成的 package: ${uploadResult.packageFileName}`);
  console.log(`   版本: ${uploadResult.version}`);
  console.log('');

  // 步骤2：提交审核（仅完整流程模式）
  if (!uploadOnly) {
    console.log('📋 步骤2/2：正在提交审核...\n');

    try {
      const auditResult = await ci.submitAudit({
        project,
        version: resolvedVersion,
        desc: resolvedDesc,
      });

      console.log(`✅ 审核提交成功！`);
      console.log(`   审核单编号: ${auditResult.auditId}`);
      console.log('');
      console.log('📌 下一步：');
      console.log(`   微信后台 → 管理 → 版本管理 → 查看审核进度`);
      console.log(`   审核通过后可通过 ci.release() 自动发布上线\n`);

      // 可选：查询审核状态
      console.log('⏳ 等待10秒后查询审核状态...\n');
      await new Promise(r => setTimeout(r, 10000));

      const auditInfo = await ci.getAuditInfo({ project });
      console.log('📊 当前审核状态:');
      console.log(`   审核单: ${auditInfo.auditId}`);
      console.log(`   状态: ${auditInfo.status === 0 ? '审核中' : auditInfo.status === 1 ? '审核通过' : '审核驳回'}`);
      if (auditInfo.status === 1) {
        console.log(`   发布时间: ${auditInfo.publishTime}`);
      }
      if (auditInfo.status === 2) {
        console.log(`   驳回原因: ${auditInfo.reason}`);
      }
    } catch (err) {
      console.log('\n❌ 审核提交失败:');
      console.log(`   ${err.message}`);
      console.log('');
      console.log('💡 可能的原因:');
      console.log('   - 管理员未完成身份认证');
      console.log('   - 小程序内容不符合规范');
      console.log('   - 今日提交次数已达上限（3次/天）');
      console.log('');
      console.log('📌 请登录微信后台手动提交审核：');
      console.log('   https://mp.weixin.qq.com\n');
    }
  } else {
    console.log('✅ 仅上传模式，跳过审核提交。');
    console.log('📌 请登录微信后台手动提交审核：');
    console.log('   https://mp.weixin.qq.com\n');
  }

  console.log('========================================');
  console.log('  发布流程完成！');
  console.log('========================================');
}

publish().catch(err => {
  console.error('\n❌ 发布失败:', err.message);
  process.exit(1);
});
