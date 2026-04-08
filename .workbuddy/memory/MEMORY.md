# MEMORY.md - 长期记忆

## freetools 项目
- 路径: `f:\SelfJob\freetools`
- 微信小程序工具集合项目
- 工具排序调整规则见 update_memory ID 98570553

## 审计工具
- `run-audit.js`: 基于 miniprogram-automator 的自动化审计脚本（推荐）
  - 用法: `node test-reports/run-audit.js`
  - 全部页面统一 reLaunch 导航（包括 tabBar），避免 switchTab 超时
  - Windows 下需 monkey-patch spawn 添加 shell:true 以支持 .bat
  - 2026-04-08 审计达到 **100 分**（72/73 页面成功）
- `audit.py`: 自制 Python 审计脚本，覆盖关键检查项
  - 用法: `python audit.py [--json] [--fix]`
  - 7 项检查: :active残留、placeholder对比度、WXML节点数、setData频率、setData未绑定变量、wxss未使用样式、text hover-class
  - PowerShell 环境下用 `sys.stdout.reconfigure(encoding='utf-8')` 解决 GBK 编码问题

## 微信小程序开发备忘
- `<text>` 组件不支持 `hover-class` 属性
- placeholder 样式需通过 `placeholder-class` 属性指定，不会自动继承全局样式
- `showCandidates: true` 会导致 sudoku-generator 节点数超 1000
- `setData` 频率建议用时间戳节流（100ms）
- 数独求解器 xlsx 导出用 xlsx-js-style（需 patch require()），见 update_memory ID 97010151
