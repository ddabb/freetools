# FreeTools - 微信小程序实用工具集合

一个集成多种实用工具的微信小程序，为用户提供便捷、高效的工具服务。

## 项目结构

```
freetools/
├── app.js                 # 小程序入口文件
├── app.json               # 小程序全局配置
├── app.wxss               # 小程序全局样式
├── project.config.json    # 项目配置文件
├── sitemap.json           # 索引配置文件
│
├── pages/                 # 页面目录（主包）
│   ├── index/             # 首页
│   ├── discover/          # 发现页
│   └── mine/              # 我的页面
│
├── packages/              # 分包目录
│   ├── financial/         # 财务工具分包
│   ├── life/              # 生活工具分包
│   ├── utility/           # 实用工具分包
│   └── other/             # 其他工具分包
│
├── components/            # 组件目录
│   ├── tool-card/         # 工具卡片组件
│   └── category-card/     # 分类卡片组件
│
├── config/                # 配置目录
│   └── tools.js           # 工具统一配置
│
├── utils/                 # 工具函数目录
│   ├── util.js            # 通用工具函数
│   ├── validator.js       # 数据验证工具
│   ├── dateUtil.js        # 日期处理工具
│   └── storage.js         # 本地存储工具
│
├── images/                # 图片资源目录
├── i18n/                  # 国际化配置目录
├── docs/                  # 项目文档目录
└── miniprogram_npm/       # npm 包编译目录
```

## 核心功能

- **房贷计算器** - 计算房贷月供、利息和还款总额
- **人生倒计时** - 计算已活天数和剩余预期寿命
- **二维码生成** - 生成文本和链接的二维码
- **单位换算** - 各种单位的快速换算
- **健康计算** - 计算BMI和健康指标
- **密码生成** - 生成安全的随机密码
- **身份证验证** - 验证身份证号码的有效性
- **时间工具** - 秒表、计时器和时区转换
- 以及更多实用工具...

## 技术栈

- 微信小程序原生框架
- JavaScript (ES5/ES6)
- WXML 模板引擎
- WXSS 样式
- 模块化开发 (CommonJS)

## 开发指南

### 添加新工具

1. 在 `packages/` 对应分包目录下创建工具页面
2. 在 `config/tools.js` 中添加工具配置
3. 如需要，在 `utils/` 中添加工具函数

### 开发规范

- 使用 CommonJS 模块化（require/module.exports）
- 统一代码风格：ES6 方法简写、let/const
- 所有输入必须验证和错误处理
- 优先使用已有的工具函数库

### 分包策略

- 主包：核心页面（首页、发现、我的）
- 分包：按功能分类，减少首次加载时间

## 文档

详细文档请查看 `docs/` 目录：
- `docs/README.md` - 文档说明
- `docs/项目提案.html` - 项目提案
- `docs/OPTIMIZATION_SUMMARY.md` - 优化总结

## 配置说明

### 打包忽略规则

以下目录和文件不会被包含在小程序包中：
- `docs/` - 文档目录
- `.codebuddy/` - 开发工具目录
- `*.md` - Markdown 文件
- `node_modules/` - 依赖包（已通过 miniprogram_npm 编译）

### 预加载规则

- 首页：预加载 financial、life 分包
- 发现页：预加载所有工具分包

## 性能优化

已完成的优化：
- ✅ 修复定时器内存泄漏
- ✅ 实施分包加载，减少首次加载时间约 60%
- ✅ 组件化重构，减少代码重复
- ✅ 完善输入验证和错误处理
- ✅ 统一配置管理和工具函数库

详细优化记录见 `docs/OPTIMIZATION_SUMMARY.md`

## 注意事项

1. 不要使用 ES6 import/export 语法，使用 require/module.exports
2. 避免使用展开运算符 `...`，使用 Object.assign()
3. 新增工具必须更新 `config/tools.js`
4. 所有工具函数优先使用 `utils/` 中的现有工具
5. 必须添加输入验证和错误处理

## 版本历史

详见 `docs/OPTIMIZATION_SUMMARY.md`
