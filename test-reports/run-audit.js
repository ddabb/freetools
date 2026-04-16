/**
 * freetools 自动化审计脚本
 *
 * 使用微信官方 miniprogram-automator，自动连接开发者工具、
 * 逐一访问所有页面，触发官方体验评分 Audits。
 *
 * 用法：
 *   node test-reports/run-audit.js
 *   node test-reports/run-audit.js --main-only   (仅主包页面)
 *   node test-reports/run-audit.js --limit 10      (只测前 N 个页面)
 *
 * 前置条件：
 *   1. 微信开发者工具已打开 freetools 项目
 *   2. 已登录开发者工具
 *   3. 在【设置 → 安全】中开启「服务端口」
 */

const path = require('path')
const fs = require('fs')

// ============================================================
// Patch: Node.js >= 18 在 Windows 上 spawn .bat 需要 shell: true
// 必须在 require('miniprogram-automator') 之前执行
// ============================================================
if (process.platform === 'win32') {
  const cp = require('child_process')
  const _spawn = cp.spawn.bind(cp)
  cp.spawn = function (cmd, args, opts) {
    if (typeof cmd === 'string' && /\.bat$/i.test(cmd)) {
      opts = Object.assign({ windowsHide: true }, opts, { shell: true })
    }
    return _spawn(cmd, args, opts)
  }
}

// ============================================================
// 配置
// ============================================================
const PROJECT_PATH = path.resolve(__dirname, '..')
const REPORT_DIR = path.resolve(__dirname)
const REPORT_PATH = path.join(REPORT_DIR, 'audits-report.html')
const PAGE_DWELL_MS = 3000       // 页面停留时间（等待审计数据采集）
const NAVIGATE_TIMEOUT_MS = 15000 // 单次导航超时
const MAX_CONSECUTIVE_FAILS = 15  // 连续失败熔断阈值
const MAIN_ONLY = process.argv.includes('--main-only')
const LIMIT_ARG = process.argv.findIndex(a => a === '--limit')
const PAGE_LIMIT = LIMIT_ARG !== -1 && process.argv[LIMIT_ARG + 1] ? parseInt(process.argv[LIMIT_ARG + 1], 10) : 0

// 微信开发者工具 CLI 路径
const CLI_PATH = process.env.DEVTOOLS_CLI || 'F:\\微信web开发者工具\\cli.bat'

// ============================================================
// 从 app.json 读取所有页面路径 & 识别 tabbar 页面
// ============================================================
function getPageInfo() {
  const appJson = JSON.parse(fs.readFileSync(path.join(PROJECT_PATH, 'app.json'), 'utf-8'))

  const tabBarPages = new Set()
  if (appJson.tabBar && appJson.tabBar.list) {
    for (const item of appJson.tabBar.list) {
      tabBarPages.add('/' + item.pagePath)
    }
  }

  const pages = []
  let indexPage = null
  let knowledgeListPage = null
  for (const p of appJson.pages || []) {
    const pagePath = '/' + p
    if (p === 'pages/index/index') {
      indexPage = pagePath  // 暂存 index 页面
    } else if (p === 'pages/knowledgelist/knowledgelist') {
      knowledgeListPage = pagePath  // 暂存 knowledgelist 页面
    } else {
      pages.push(pagePath)
    }
  }
  if (!MAIN_ONLY) {
    for (const sub of appJson.subPackages || []) {
      for (const p of sub.pages || []) pages.push('/' + sub.root + '/' + p)
    }
  }
  // 把 knowledgelist 和 index 页面放到最后访问
  if (knowledgeListPage) pages.push(knowledgeListPage)
  if (indexPage) pages.push(indexPage)

  return { pages, tabBarPages }
}

// 导航到指定页面，统一用 reLaunch（最稳定，无页面栈问题）
async function navigateToPage(miniProgram, pagePath) {
  // 知识库相关页面需要更长的超时时间（CDN 数据加载）
  const isKnowledgePage = pagePath.includes('knowledge');
  const timeoutMs = isKnowledgePage ? 30000 : NAVIGATE_TIMEOUT_MS;
  
  await Promise.race([
    miniProgram.reLaunch(pagePath),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('timeout (' + timeoutMs / 1000 + 's)')), timeoutMs)
    )
  ])
}

// ============================================================
// 主流程
// ============================================================
async function runAudit() {
  const automator = require('miniprogram-automator')

  const { pages, tabBarPages } = getPageInfo()

  console.log('\n🔍 freetools 自动化审计')
  if (PAGE_LIMIT > 0 && pages.length > PAGE_LIMIT) {
    console.log('   ⚠️  限制只测试前 ' + PAGE_LIMIT + ' 个页面')
    pages.length = PAGE_LIMIT
  }
  console.log('   共 ' + pages.length + ' 个页面待访问' + (MAIN_ONLY ? '（仅主包）' : '（含分包）'))
  console.log('   tabbar 页面 ' + tabBarPages.size + ' 个')
  console.log('   报告输出: ' + REPORT_PATH + '\n')

  // 启动并连接
  let miniProgram
  try {
    console.log('⏳ 启动自动化...')
    miniProgram = await automator.launch({
      cliPath: CLI_PATH,
      projectPath: PROJECT_PATH,
      autoAudits: true,
    })
    console.log('✅ 已连接开发者工具\n')
  } catch (err) {
    console.error('❌ 启动失败:', err.message)
    console.error('   1. 开发者工具已打开 freetools 项目')
    console.error('   2. 在【设置 → 安全】开启「服务端口」')
    console.error('   3. 已登录微信账号')
    process.exit(1)
  }

  // 遍历所有页面
  const results = []
  let successCount = 0
  let failCount = 0
  let consecutiveFails = 0
  const startTime = Date.now()

  for (let i = 0; i < pages.length; i++) {
    const pagePath = pages[i]
    const isTabBar = tabBarPages.has(pagePath)
    const label = '[' + (i + 1) + '/' + pages.length + ']'
    const elapsed = Math.round((Date.now() - startTime) / 1000)
    const eta = Math.round(((Date.now() - startTime) / (i + 1)) * (pages.length - i - 1) / 1000)

    try {
      process.stdout.write(label + ' ' + pagePath + ' ... ')

      // 所有页面统一用 reLaunch（包括 tabBar 页面），避免 switchTab 超时
      await navigateToPage(miniProgram, pagePath)

      await sleep(PAGE_DWELL_MS)
      const mins = Math.floor(eta / 60)
      const secs = eta % 60
      console.log('✓ (' + elapsed + 's, ETA ' + mins + ':' + String(secs).padStart(2, '0') + ')')
      results.push({ path: pagePath, status: 'ok', isTabBar })
      successCount++
      consecutiveFails = 0
    } catch (err) {
      const errMsg = err.message || String(err)
      console.log('✗ ' + errMsg)
      results.push({ path: pagePath, status: 'error', error: errMsg, isTabBar })
      failCount++
      consecutiveFails++

      if (consecutiveFails >= MAX_CONSECUTIVE_FAILS) {
        console.log('\n⚠️  连续 ' + MAX_CONSECUTIVE_FAILS + ' 个页面失败，可能连接断开，终止')
        break
      }
    }
  }

  const totalTime = Math.round((Date.now() - startTime) / 1000)

  // 触发官方 Audits 体验评分
  console.log('\n⏳ 触发官方体验评分（Audits）...')
  let auditData = null
  try {
    auditData = await miniProgram.stopAudits({ path: REPORT_PATH })
    console.log('✅ 体验评分完成')
    if (auditData && auditData.score !== undefined) {
      console.log('   综合评分: ' + auditData.score)
    }
  } catch (err) {
    console.error('⚠️  体验评分出错:', err.message)
  }

  // 汇总
  console.log('\n📊 页面访问汇总：')
  console.log('   ✅ 成功: ' + successCount)
  console.log('   ❌ 失败: ' + failCount)
  console.log('   ⏱️  总耗时: ' + Math.floor(totalTime / 60) + 'm ' + (totalTime % 60) + 's')

  if (failCount > 0) {
    console.log('\n   失败页面：')
    results.filter(r => r.status === 'error').forEach(r => console.log('     - ' + r.path + ': ' + r.error))
  }

  const resultJsonPath = path.join(REPORT_DIR, 'audit-pages.json')
  fs.writeFileSync(
    resultJsonPath,
    JSON.stringify({
      timestamp: new Date().toISOString(),
      score: auditData ? auditData.score : null,
      success: successCount,
      fail: failCount,
      totalTime,
      pages: results,
      auditData
    }, null, 2),
    'utf-8'
  )
  console.log('\n   页面结果: ' + resultJsonPath)
  if (REPORT_PATH && fs.existsSync(REPORT_PATH)) {
    console.log('   体验评分报告: ' + REPORT_PATH)
  }

  await miniProgram.close()
  console.log('\n🎉 审计完成！')
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

runAudit().catch(err => {
  console.error('\n❌ 未预期的错误:', err)
  process.exit(1)
})
