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
// 配置
// ============================================================
const PROJECT_PATH = path.resolve(__dirname, '..')
const REPORT_DIR = path.resolve(__dirname)
const REPORT_PATH = path.join(REPORT_DIR, 'audits-report.html')
const PAGE_DWELL_MS = 3000       // 页面停留时间
const NAVIGATE_TIMEOUT_MS = 20000 // navigateTo 超时
const RESET_INTERVAL = 4          // 每 N 个普通页面 reLaunch 重置
const MAX_CONSECUTIVE_FAILS = 10  // 连续失败熔断阈值
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

  // 读取 tabbar 页面列表
  const tabBarPages = new Set()
  if (appJson.tabBar && appJson.tabBar.list) {
    for (const item of appJson.tabBar.list) {
      tabBarPages.add('/' + item.pagePath)
    }
  }

  // 收集所有页面
  const pages = []
  for (const p of appJson.pages || []) pages.push('/' + p)
  if (!MAIN_ONLY) {
    for (const sub of appJson.subPackages || []) {
      for (const p of sub.pages || []) pages.push('/' + sub.root + '/' + p)
    }
  }

  return { pages, tabBarPages }
}

// 回退到首页（清除页面栈）
async function resetToHome(miniProgram) {
  try {
    await miniProgram.reLaunch('/pages/index/index')
    await sleep(800)
  } catch (_) {
    try {
      await miniProgram.switchTab('/pages/index/index')
      await sleep(800)
    } catch (_2) { /* 无法回退，继续尝试 */ }
  }
}

// navigateBack（带超时保护）
async function safeNavigateBack(miniProgram) {
  try {
    await Promise.race([
      miniProgram.navigateBack(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('navigateBack timeout')), 5000))
    ])
    await sleep(300)
  } catch (_) {
    // navigateBack 失败不影响主流程
  }
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
  console.log('   tabbar 页面 ' + tabBarPages.size + ' 个，将使用 switchTab')
  console.log('   每 ' + RESET_INTERVAL + ' 个普通页面重置页面栈')
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
  let normalSinceReset = 0  // 距上次重置以来的普通页面计数

  for (let i = 0; i < pages.length; i++) {
    const pagePath = pages[i]
    const isTabBar = tabBarPages.has(pagePath)
    const label = '[' + (i + 1) + '/' + pages.length + ']'

    try {
      process.stdout.write(label + ' 访问 ' + pagePath + ' ... ')

      if (isTabBar) {
        await miniProgram.switchTab(pagePath)
        await sleep(PAGE_DWELL_MS)
        console.log('✓ (tabbar)')
      } else {
        // 普通页面用 navigateTo，带超时保护
        await Promise.race([
          miniProgram.navigateTo(pagePath),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('navigate timeout (' + NAVIGATE_TIMEOUT_MS / 1000 + 's)')), NAVIGATE_TIMEOUT_MS)
          )
        ])
        await sleep(PAGE_DWELL_MS)
        console.log('✓')
        normalSinceReset++
      }

      results.push({ path: pagePath, status: 'ok', isTabBar })
      successCount++
      consecutiveFails = 0

      // 每 N 个普通页面，reLaunch 回首页彻底重置
      if (normalSinceReset >= RESET_INTERVAL) {
        process.stdout.write('   🔄 重置页面栈... ')
        await resetToHome(miniProgram)
        normalSinceReset = 0
        console.log('✓')
      }
    } catch (err) {
      const errMsg = err.message || String(err)

      // 连续失败每 3 次，尝试 reLaunch 重连
      if (consecutiveFails > 0 && consecutiveFails % 3 === 0) {
        process.stdout.write('🔄 尝试 reLaunch 重连... ')
        await resetToHome(miniProgram)
        normalSinceReset = 0
        console.log('✓')
      }

      // 遇到 webview 层级限制或 timeout，回退页面栈后重试
      if (errMsg.includes('webview count limit') || errMsg.includes('timeout')) {
        process.stdout.write('🔄 重置页面栈后重试... ')
        await resetToHome(miniProgram)
        normalSinceReset = 0
        await sleep(1000)
        try {
          await Promise.race([
            miniProgram.navigateTo(pagePath),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('retry timeout (' + NAVIGATE_TIMEOUT_MS / 1000 + 's)')), NAVIGATE_TIMEOUT_MS)
            )
          ])
          await sleep(PAGE_DWELL_MS)
          console.log('✓')
          results.push({ path: pagePath, status: 'ok', isTabBar, retried: true })
          successCount++
          consecutiveFails = 0
          continue
        } catch (retryErr) {
          console.log('✗ ' + retryErr.message)
          results.push({ path: pagePath, status: 'error', error: retryErr.message, isTabBar, retried: true })
          failCount++
          consecutiveFails++
        }
      } else {
        console.log('✗ ' + errMsg)
        results.push({ path: pagePath, status: 'error', error: errMsg, isTabBar })
        failCount++
        consecutiveFails++
      }

      // 连续失败熔断
      if (consecutiveFails >= MAX_CONSECUTIVE_FAILS) {
        console.log('\n⚠️  连续 ' + MAX_CONSECUTIVE_FAILS + ' 个页面失败，可能连接断开，终止')
        break
      }
    }
  }

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
  if (failCount > 0) {
    console.log('\n   失败页面：')
    results.filter(r => r.status === 'error').forEach(r => console.log('     - ' + r.path + ': ' + r.error))
  }

  const resultJsonPath = path.join(REPORT_DIR, 'audit-pages.json')
  fs.writeFileSync(
    resultJsonPath,
    JSON.stringify({ timestamp: new Date().toISOString(), pages: results, auditData }, null, 2),
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
