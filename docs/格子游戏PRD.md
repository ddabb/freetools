# 格子游戏产品需求文档 (PRD)

## 一、产品概述

### 1.1 背景
随身工具宝小程序已有数独（求解器+生成器）和数织两款格子游戏，用户反馈良好。为丰富游戏品类，提升用户粘性，计划新增多款经典单机格子逻辑游戏。

### 1.2 目标
- 新增 4-6 款经典单机格子游戏
- 统一游戏交互风格，降低学习成本
- 支持多难度、关卡进度、计时等功能

### 1.3 约束
- 仅单机游戏，无联网对战
- 无后端依赖，数据本地存储
- 包体积控制，避免影响主包大小

---

## 二、现有游戏

| 游戏 | 状态 | 路径 | 说明 |
|------|------|------|------|
| 数独求解器 | ✅ 已上线 | `packages/math/pages/sudoku-solver/` | 输入题目，自动求解 |
| 数独生成器 | ✅ 已上线 | `packages/math/pages/sudoku-generator/` | 生成题目，用户求解 |
| 数织 (nonogram) | ✅ 已上线 | `packages/math/pages/nonogram/` | 根据提示填充格子 |
| 躲避牛蛙 (frog-escape) | ✅ 已上线 | `packages/math/pages/frog-escape/` | 扫雷换皮（🐸主题） |
| 黑白棋 (othello) | ✅ 已上线 | `packages/math/pages/othello/` | 经典黑白棋游戏 |
| 数壹 (number-one) | ✅ 已上线 | `packages/math/pages/number-one/` | 难度决定尺寸，顺序下一题，跳关选择 |
| 数回 (slither-link) | ✅ 已上线 | `packages/math/pages/slither-link/` | 规则弹窗，跳关选择 |
| 灯塔 (akari) | ✅ 已上线 | `packages/math/pages/akari/` | 灯塔数量限制，跳关选择 |
| 数墙 (nurikabe) | ✅ 已上线 | `packages/math/pages/nurikabe/` | 需验证 |
| 一笔画 (one-stroke-solver) | ✅ 已上线 | `packages/math/pages/one-stroke-solver/` | 顺序下一题，跳关选择 |
| 战舰 (battleship) | ⏳ 未开始 | - | - |
| 幻方 (magic-square) | ⏳ 未开始 | - | - |
| 推箱子 (sokoban) | ⏳ 未开始 | - | - |

---

## 三、新增游戏规划

### 3.1 优先级排序

| 优先级 | 游戏 | 状态 | 理由 | GitHub 参考 |
|--------|------|------|------|------------|
| P0 | 扫雷（躲避牛蛙） | ✅ 已上线 | 最经典，用户基数大 | jbibi/Minesweeper |
| P0 | 黑白棋 (Othello) | ✅ 已上线 | 经典对战游戏，AI实现成熟 | - |
| P1 | 数壹 (Hitori) | ✅ 已上线 | 算法重写完成，含黑格数提示 | Puzzlink_Assistance |
| P1 | 数织 (Nonogram) | ✅ 已上线 | 规则独特，视觉效果好 | topics/picross (11+ JS项目) |
| P1 | 桥 (Hashiwokakero) | ⏳ 待开发 | 规则简单，有现成生成器 | Simon Tatham, Hashiwokakero-Generator |
| P1 | 珍珠 (Masyu) | ⏳ 待开发 | 规则优雅，逻辑性强 | Simon Tatham, Puzzlink_Assistance |
| P2 | 数回 (Slither Link) | ✅ 已上线 | 含验证按钮 | Simon Tatham, Puzzlink |
| P2 | 灯塔 (Akari) | ✅ 已上线 | 含校验反馈 | Simon Tatham, Puzzlink |
| P2 | 数墙 (Nurikabe) | ✅ 已上线 | 需验证 | turtlegraphics/nurikabe |
| P2 | 帐篷 (Tents) | ⏳ 待开发 | 推理类，有现成求解器 | Simon Tatham, asp-tents-puzzle |
| P2 | 2048 | ⏳ 待开发 | 用户基数大，实现简单 | topics/2048 (262+ JS项目) |
| P2 | 单词搜索 | ⏳ 待开发 | 适合中文用户，教育价值 | blex41/word-search |
| P3 | 战舰 (Battleship) | ⏳ 未开始 | 推理类，有挑战性 | - |
| P3 | 填字游戏 | ⏳ 待开发 | 经典文字游戏 | HartasCuerdas/jsCrossword |
| P3 | 星系 (Galaxies) | ⏳ 待开发 | 视觉效果好 | Simon Tatham |
| P3 | 多米诺 (Dominosa) | ⏳ 待开发 | 逻辑性强 | Simon Tatham |

---

## 四、游戏详细设计

### 4.1 扫雷 (Minesweeper)

#### 规则
- N×N 格子，部分格子藏有地雷
- 点击格子：若是雷则游戏结束，若不是则显示周围8格的雷数
- 数字为0时自动展开周围格子
- 长按/右键标记可疑地雷
- 目标：揭开所有非雷格子

#### 难度设计
| 难度 | 格子数 | 雷数 | 雷密度 |
|------|--------|------|--------|
| 初级 | 9×9 | 10 | 12.3% |
| 中级 | 16×16 | 40 | 15.6% |
| 高级 | 16×30 | 99 | 20.6% |
| 自定义 | 用户设置 | 用户设置 | - |

#### 交互设计
- 点击：揭开格子
- 长按：标记/取消标记地雷
- 双击数字：若周围标记数=数字，自动揭开周围未标记格子
- 首次点击保证安全（不会踩雷）

#### 技术要点
- 雷区生成：首次点击后生成，保证首次安全
- 展开算法：BFS/DFS 递归展开0区
- 胜负判断：揭开数 = 总格数 - 雷数 → 胜利

---

### 4.2 黑白棋 (Othello / Reversi)

#### 规则
- 8×8 格子棋盘
- 双方各执一色（黑/白），黑先手
- 开局时中央4格交叉放置：白黑白黑
- 落子规则：必须落在能翻转对方棋子的位置
  - 新落子与己方棋子之间必须夹住对方棋子（横/竖/斜均可）
  - 被夹住的对方棋子全部翻转为己方颜色
- 无法落子时跳过回合
- 双方都无法落子或棋盘填满时游戏结束
- 棋子多者获胜

#### 难度设计（AI强度）
| 难度 | AI算法 | 搜索深度 | 特点 |
|------|--------|----------|------|
| 简单 | 贪心 | 1层 | 只看当前翻转数 |
| 中等 | Minimax | 3-4层 | 基础博弈树搜索 |
| 困难 | Minimax + Alpha-Beta | 6-8层 | 剪枝优化 |
| 专家 | Minimax + Alpha-Beta + 评估函数 | 8-10层 | 位置权重+边缘策略 |

#### 交互设计
- 点击格子：落子（仅允许合法位置）
- 高亮显示：所有合法落子位置
- 翻转动画：被翻转的棋子
- 实时显示：双方棋子数量
- 回合提示：当前谁下
- 游戏结束：显示胜负和比分

#### AI算法设计

##### 评估函数
```javascript
// 位置权重表（角落最重要，边缘次之，靠近角落的位置最差）
const POSITION_WEIGHT = [
  [100, -20,  10,   5,   5,  10, -20, 100],
  [-20, -50,  -2,  -2,  -2,  -2, -50, -20],
  [ 10,  -2,   1,   1,   1,   1,  -2,  10],
  [  5,  -2,   1,   0,   0,   1,  -2,   5],
  [  5,  -2,   1,   0,   0,   1,  -2,   5],
  [ 10,  -2,   1,   1,   1,   1,  -2,  10],
  [-20, -50,  -2,  -2,  -2,  -2, -50, -20],
  [100, -20,  10,   5,   5,  10, -20, 100]
];

function evaluate(board, player) {
  let score = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c] === player) score += POSITION_WEIGHT[r][c];
      else if (board[r][c] !== 0) score -= POSITION_WEIGHT[r][c];
    }
  }
  return score;
}
```

##### Minimax + Alpha-Beta 剪枝
```javascript
function minimax(board, depth, alpha, beta, maximizing, player) {
  if (depth === 0 || isGameOver(board)) {
    return evaluate(board, player);
  }
  
  const moves = getValidMoves(board, maximizing ? player : -player);
  
  if (moves.length === 0) {
    return minimax(board, depth - 1, alpha, beta, !maximizing, player);
  }
  
  if (maximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      const newBoard = makeMove(board, move, player);
      const eval = minimax(newBoard, depth - 1, alpha, beta, false, player);
      maxEval = Math.max(maxEval, eval);
      alpha = Math.max(alpha, eval);
      if (beta <= alpha) break; // 剪枝
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      const newBoard = makeMove(board, move, -player);
      const eval = minimax(newBoard, depth - 1, alpha, beta, true, player);
      minEval = Math.min(minEval, eval);
      beta = Math.min(beta, eval);
      if (beta <= alpha) break; // 剪枝
    }
    return minEval;
  }
}
```

#### 技术要点
- 合法落子判断：8方向搜索是否有夹住的对方棋子
- 翻转执行：落子后翻转所有被夹住的对方棋子
- 终局判断：双方都无法落子或棋盘填满
- AI响应时间：简单难度<100ms，困难<1s
- 开局库：可预存常见开局应对（可选优化）

#### 特殊规则
- 开局4格固定放置
- 必须落子在能翻转的位置
- 无法落子时自动跳过
- 平局判定：双方棋子数相等

---

### 4.3 数回 (Slither Link / Loop the Loop)

#### 规则
- N×N 格子，每个格点可画线
- 格子内的数字(0-3)表示该格子四周的线段数
- 空格子无数字限制
- 目标：画出一个闭合环路，不交叉不分支

#### 难度设计
| 难度 | 格子数 | 提示密度 |
|------|--------|----------|
| 简单 | 5×5 | 高 |
| 中等 | 7×7 | 中 |
| 困难 | 10×10 | 低 |

#### 交互设计
- 点击格点边：画线/取消画线
- 长按格点边：标记"不可画线"
- 显示当前连线状态
- 完成时高亮显示闭合环路

#### 技术要点
- 数据结构：边集合，每条边有状态(无/有/禁止)
- 验证算法：检查是否形成单一闭合环路
- 提示生成：从解反向生成数字提示

---

### 4.3 数壹 (Hitori)

#### 规则
- N×N 格子，每格填有数字
- 目标：涂黑部分格子，使得：
  1. 每行每列没有重复的未涂黑数字
  2. 涂黑的格子不能相邻（上下左右）
  3. 所有未涂黑格子连通（可通过上下左右到达）

#### 难度设计
| 难度 | 格子数 |
|------|--------|
| 简单 | 5×5 |
| 中等 | 8×8 |
| 困难 | 12×12 |

#### 交互设计
- 点击格子：涂黑/取消涂黑
- 显示冲突提示（同行/列重复）
- 完成时验证连通性

#### 技术要点
- 题目生成：先填满数字，再确定解，反向生成
- 连通性检查：BFS/DFS
- 冲突检测：实时检测同行/列重复

---

### 4.4 灯塔 (Akari / Light Up)

#### 规则
- N×N 格子，部分格子是黑格（墙）
- 黑格可能有数字(0-4)，表示四周放置的灯塔数
- 目标：在白格放置灯塔，使得：
  1. 每个白格被至少一个灯塔照亮
  2. 灯塔之间不能互相照亮
  3. 数字黑格四周灯塔数等于数字

#### 难度设计
| 难度 | 格子数 | 墙密度 |
|------|--------|--------|
| 简单 | 7×7 | 15% |
| 中等 | 10×10 | 20% |
| 困难 | 15×15 | 25% |

#### 交互设计
- 点击白格：放置/移除灯塔
- 显示照亮范围（高亮）
- 显示冲突（灯塔互相照亮）
- 完成时验证全覆盖

#### 技术要点
- 照亮计算：灯塔位置向四个方向延伸直到遇到墙/边界
- 覆盖检查：所有白格是否被照亮
- 冲突检查：灯塔之间是否互相照亮

---

### 4.5 数墙 (Nurikabe)

#### 规则
- N×N 格子，部分格子有数字
- 数字表示该格子所属白色区域的大小
- 目标：涂黑部分格子，使得：
  1. 每个数字格子属于一个大小等于该数字的白色连通区域
  2. 所有黑色格子连通
  3. 没有2×2的全黑区域

#### 难度设计
| 难度 | 格子数 |
|------|--------|
| 简单 | 5×5 |
| 中等 | 10×10 |
| 困难 | 15×15 |

#### 交互设计
- 点击格子：涂黑/涂白
- 显示白色区域大小
- 完成时验证所有规则

#### 技术要点
- 连通区域计算：BFS/DFS
- 2×2黑格检测：遍历检查
- 题目生成：先生成解，再提取数字提示

---

### 4.6 战舰 (Battleship Solitaire)

#### 规则
- N×N 格子，隐藏若干战舰
- 战舰形状：1×1, 1×2, 1×3, 1×4 等
- 边缘数字表示该行/列的战舰格子数
- 目标：找出所有战舰位置

#### 难度设计
| 难度 | 格子数 | 战舰配置 |
|------|--------|----------|
| 简单 | 6×6 | 1×3 + 2×2 + 2×1 |
| 中等 | 8×8 | 1×4 + 1×3 + 2×2 + 2×1 |
| 困难 | 10×10 | 1×4 + 2×3 + 3×2 + 4×1 |

#### 交互设计
- 点击格子：标记战舰/水域
- 长按：标记可疑位置
- 显示已找到的战舰
- 完成时验证战舰配置

#### 技术要点
- 战舰放置验证：不重叠、不接触（对角可接触）
- 边缘数字验证：每行/列战舰格子数匹配
- 题目生成：先放置战舰，再计算边缘数字

---

### 4.7 幻方 (Magic Square)

#### 规则
- N×N 格子，填入1到N²的数字
- 每行、每列、两条对角线的和相等
- 和 = N × (N² + 1) / 2

#### 难度设计
| 难度 | 格子数 | 预填比例 |
|------|--------|----------|
| 简单 | 3×3 | 60% |
| 中等 | 4×4 | 40% |
| 困难 | 5×5 | 30% |

#### 交互设计
- 点击格子：输入数字
- 显示当前行/列/对角线和
- 高亮显示完成的行/列/对角线
- 完成时验证所有和相等

#### 技术要点
- 幻方生成：使用经典构造算法
- 题目生成：从完整幻方挖空部分数字
- 验证：检查所有行/列/对角线和

---

### 4.8 推箱子 (Sokoban)

#### 规则
- N×M 格子，有墙、箱子、目标点、玩家
- 玩家可推箱子（不能拉）
- 目标：将所有箱子推到目标点

#### 难度设计
- 使用经典关卡库
- 按步数/推数分级

#### 交互设计
- 方向键/滑动：移动玩家
- 撤销功能：回退步骤
- 重置关卡
- 显示步数/推数

#### 技术要点
- 关卡存储：使用标准XSB格式
- 死锁检测：箱子推到角落等不可逆状态
- 关卡来源：使用开源关卡库

---

## 五、通用功能设计

### 5.1 统一UI组件
- 游戏容器：格子大小自适应
- 计时器：开始/暂停/显示
- 步数统计：操作次数
- 撤销/重做：历史记录
- 难度选择：简单/中等/困难
- **关卡选择：显示「第 N/M 题」，输入框跳转，确定按钮**
- 设置面板：音效/主题等

### 5.1.1 跳关功能规范
所有格子游戏统一实现跳关功能：

**UI 布局：**
```
[第 N/M 题] [输入框] [确定]
```

**功能要求：**
- 显示当前题号和总题数
- 输入框 type="number"，placeholder="跳转"
- 输入超出范围自动修正为最大值
- 确定按钮点击或输入框回车执行跳转
- 跳转后清空输入框

**下一题行为：**
- 点击「下一题」按钮顺序加载（N+1，超过最大则循环回 1）
- 不随机选择题目

**已实现游戏：**
- ✅ 灯塔 - 各 1000 题
- ✅ 数回 - easy 200 / medium 100 / hard 50
- ✅ 数壹 - 每种难度 30 题（难度自动决定尺寸）
- ✅ 一笔画 - 各 1000 题

### 5.2 数据存储
- 关卡进度：localStorage
- 最佳记录：localStorage
- 游戏设置：localStorage

### 5.3 性能优化
- 格子渲染：虚拟列表（大格子）
- 动画：CSS transition
- 内存：及时释放大数组

---

## 六、技术实现

### 6.1 目录结构
```
packages/math/pages/
├── sudoku-solver/      # 数独求解器
├── sudoku-generator/   # 数独生成器
├── nonogram/           # 数织
├── frog-escape/        # 躲避牛蛙（扫雷换皮）
├── othello/            # 黑白棋
├── number-one/         # 数壹
├── slither-link/       # 数回
├── akari/              # 灯塔
├── nurikabe/           # 数墙
├── one-stroke-solver/  # 一笔画 [新增]
├── battleship/         # 战舰 [未开始]
├── magic-square/       # 幻方 [未开始]
└── sokoban/            # 推箱子 [未开始]
```

### 6.2 公共组件
```
components/
├── game-grid/          # 通用格子组件
├── game-timer/         # 计时器组件
├── game-controls/      # 控制按钮组
└── game-level-select/  # 关卡选择
```

### 6.3 工具函数
```
utils/
├── grid-utils.js       # 格子操作工具
├── pathfinding.js      # 路径搜索（BFS/DFS）
└── game-storage.js     # 游戏数据存储
```

---

## 七、开发计划

### Phase 1: 基础设施 (1周)
- [x] 创建公共组件（game-grid, game-timer, game-controls）
- [x] 创建工具函数（grid-utils, pathfinding, game-storage）
- [x] 设计统一UI风格

### Phase 2: P0 游戏 (1周)
- [x] 扫雷（躲避牛蛙）：核心逻辑 + UI + 题库
- [x] 黑白棋：核心逻辑 + AI + UI
- [x] 测试 + 优化

### Phase 3: P1 游戏 (1周)
- [x] 数织（Nonogram）：核心逻辑 + UI
- [x] 数壹（Hitori）：算法重写完成，已上线（含黑格数提示）
- [x] 测试 + 优化

### Phase 4: P2 游戏 (2周)
- [x] 数回（Slither Link）：核心逻辑 + UI（含验证按钮）
- [x] 灯塔（Akari）：核心逻辑 + UI（含校验反馈）
- [x] 数墙（Nurikabe）：核心逻辑 + UI（⚠️ 需验证）
- [ ] 测试 + 优化

### Phase 5: P3 游戏 (按需)
- [ ] 战舰（Battleship）：核心逻辑 + UI

### Phase 6: 新增游戏 (基于 GitHub 资源)
- [ ] 桥（Hashiwokakero）：参考 Simon Tatham + Hashiwokakero-Generator
- [ ] 珍珠（Masyu）：参考 Simon Tatham + Puzzlink_Assistance
- [ ] 帐篷（Tents）：参考 Simon Tatham + asp-tents-puzzle
- [ ] 2048：参考 topics/2048 (262+ JS项目)
- [ ] 单词搜索：参考 blex41/word-search (可 npm 安装)

---

## 八、验收标准

### 8.1 功能验收
- 游戏规则正确实现
- 胜负判断准确
- 撤销/重做正常
- 关卡进度保存

### 8.2 性能验收
- 首屏加载 < 2s
- 操作响应 < 100ms
- 内存占用 < 50MB

### 8.3 体验验收
- 格子大小自适应
- 操作流畅无卡顿
- 提示信息清晰

---

## 九、GitHub 项目参考资源

### 9.1 核心推荐项目

#### Simon Tatham's Portable Puzzle Collection ⭐⭐⭐
- **GitHub**: https://github.com/ghewgill/puzzles
- **语言**: C（可移植到 JS）
- **包含游戏**: 40+ 种经典格子游戏
- **价值**: 最权威的格子游戏合集，包含：
  - ✅ Slither Link（数回）
  - ✅ Nurikabe（数墙）
  - ✅ Hitori（数壹）
  - ✅ Light Up（灯塔/Akari）
  - ✅ Mines（扫雷）
  - ✅ Solo（数独）
  - 🆕 Bridges（桥/Hashiwokakero）
  - 🆕 Masyu（珍珠）
  - 🆕 Tents（帐篷）
  - 🆕 Net（网络）
  - 🆕 Galaxies（星系）
  - 🆕 Dominosa（多米诺）
  - 🆕 Pattern（模式识别）
  - 🆕 Loopy（循环）
  - 🆕 Range（范围）
  - 🆕 Towers（塔）
  - 🆕 Unequal（不等式）

#### Puzzlink Assistance ⭐⭐⭐
- **GitHub**: https://github.com/sevenkplus/Puzzlink_Assistance
- **语言**: JavaScript
- **功能**: 20+ 种格子游戏的辅助求解器
- **价值**: 可直接用于验证算法和提供提示功能
- **支持游戏**: Akari, Hitori, Masyu, Nurikabe, Slither Link, Yajilin, Tapa 等

#### Simon Tatham Android 移植版
- **GitHub**: https://github.com/marcelogp/sgtpuzzles
- **语言**: Java/C
- **价值**: 可直接参考 UI 设计和交互实现

---

### 9.2 数独/数字类

| 项目 | GitHub | 语言 | 说明 |
|------|--------|------|------|
| sugoku | megabyt-dev/sugoku | JS | 数独求解、生成、难度评级 |
| sudoku | atomicplay/sudoku | Node.js | 数独生成器和求解器，可 npm 安装 |
| qqwing | kronenthaler/qqwing | C++ | 高性能数独生成求解器 |
| sudoku-generator | BSVino/sudoku-generator | Python | Python 数独生成器 |

---

### 9.3 数织/图片类

| 项目 | GitHub | 语言 | 说明 |
|------|--------|------|------|
| birja_com | Ismat-Samadov/birja_com | TS/Next.js | Nonogram 游戏，UI 参考 |
| topics/picross | github.com/topics/picross?l=javascript | - | 11+ 个 JS 数织项目合集 |

---

### 9.4 桥/Hashiwokakero

| 项目 | GitHub | 语言 | 说明 |
|------|--------|------|------|
| Hashiwokakero-Generator | ErtyumPX/Hashiwokakero-Generator | C#/Unity | 桥游戏生成器，可视化 |

---

### 9.5 扫雷类

| 项目 | GitHub | 语言 | 说明 |
|------|--------|------|------|
| Minesweeper | jbibi/Minesweeper | JS (ES6) | 终端扫雷游戏 |
| Minesweeper | AlexiusTatius/Minesweeper | JS | 浏览器扫雷，多难度 |
| minesweeper | hmlendea/minesweeper | - | 扫雷游戏 |

---

### 9.6 2048 类

| 项目 | GitHub | 语言 | 说明 |
|------|--------|------|------|
| topics/2048 | github.com/topics/2048?l=javascript | - | **262+ 个 JS 2048 项目** |
| 2048-puzzle-game | HoTaBu4/2048-puzzle-game | JS | 2048 游戏实现 |

---

### 9.7 填字/单词类

| 项目 | GitHub | 语言 | 说明 |
|------|--------|------|------|
| word-search | blex41/word-search | JS | 单词搜索拼图生成器，可 npm 安装 |
| word-search-generator | joshbduncan/word-search-generator | Python | 高级单词搜索生成器 v5.0 |
| jsCrossword | HartasCuerdas/jsCrossword | JS | JavaScript 填字游戏 |

---

### 9.8 Nurikabe 求解器

| 项目 | GitHub | 语言 | 说明 |
|------|--------|------|------|
| nurikabe | turtlegraphics/nurikabe | Python | 数墙求解器，支持任意图形 |
| Nurikabe-solver-OpenCV | igradeca/Nurikabe-solver-OpenCV | Python | 启发式求解，相机输入 |

---

### 9.9 帐篷/Tents

| 项目 | GitHub | 语言 | 说明 |
|------|--------|------|------|
| asp-tents-puzzle | SandroLinder/asp-tents-puzzle | Python | 帐篷拼图求解器 |

---

### 9.10 滑块拼图类

| 项目 | GitHub | 语言 | 说明 |
|------|--------|------|------|
| SlidingPuzzle-V.1.0 | CesarMartini/SlidingPuzzle-V.1.0 | Java | 滑块拼图游戏 |
| n_puzzle_solver | uttaparsa/n_puzzle_solver | C++ | N拼图求解器（BFS/DFS/A*） |

---

### 9.11 快速集成指南

#### 方案 A：直接使用 npm 包
```bash
# 数独
npm install sudoku

# 单词搜索
npm install @blex41/word-search
```

#### 方案 B：移植 Simon Tatham 算法
- Simon Tatham 的 puzzles 项目使用 C 编写
- 可将核心算法移植到 JavaScript
- 已有 Android 移植版（marcelogp/sgtpuzzles）可作为参考

#### 方案 C：使用 Puzzlink Assistance
- 直接使用其求解器作为验证算法
- 可集成提示功能

---

### 9.12 已有项目对比（避免重复）

| 游戏 | freetools 状态 | GitHub 参考项目 |
|------|---------------|----------------|
| 数独 | ✅ 已上线 | sugoku, qqwing |
| 数织 | ✅ 已上线 | nonogram, picross topics |
| 扫雷 | ✅ 已上线（躲避牛蛙） | jbibi/Minesweeper |
| 黑白棋 | ✅ 已上线 | - |
| 数壹 | ✅ 已上线 | Puzzlink_Assistance |
| 数回 | ✅ 已上线 | Simon Tatham, Puzzlink |
| 灯塔 | ✅ 已上线 | Simon Tatham, Puzzlink |
| 数墙 | ✅ 已上线 | nurikabe solver |
| 一笔画 | ✅ 已上线 | GridPathFinder |

---

## 十、参考资料

- [数独规则](https://zh.wikipedia.org/wiki/数独)
- [数织规则](https://zh.wikipedia.org/wiki/数织)
- [扫雷规则](https://zh.wikipedia.org/wiki/扫雷)
- [黑白棋规则](https://zh.wikipedia.org/wiki/黑白棋)
- [数回规则](https://zh.wikipedia.org/wiki/数回)
- [数壹规则](https://zh.wikipedia.org/wiki/数壹)
- [灯塔规则](https://zh.wikipedia.org/wiki/Akari)
- [数墙规则](https://zh.wikipedia.org/wiki/数墙)
