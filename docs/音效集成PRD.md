# freetools 音效集成 PRD

> 创建时间：2026-04-24  
> 状态：进行中（P0 已完成）

## 一、背景与目标

**背景**：freetools 小程序包含多个益智游戏（扫雷、黑白棋、数独、数壹等），玩家交互反馈主要通过震动实现，但音效缺失导致沉浸感不足。

**目标**：为所有游戏类页面统一集成音效系统，提升用户体验。

**约束**：
- 音效文件托管于 jsdelivr CDN（同现有题库/图标方案）
- 使用 `wx.createInnerAudioContext()` 播放
- 音效文件体积控制在 50KB 以内/个

---

## 二、当前状态

| 游戏 | 状态 | 完成时间 |
|------|------|----------|
| 躲避牛蛙 (frog-escape) | ✅ 已完成 | 2026-04-23 |
| 黑白棋 (othello) | ✅ 已完成 | 2026-04-24 |

---

## 三、待集成游戏清单

### 高优先级（游戏类）

| 游戏 | 页面路径 | 建议音效 | 优先级 |
|------|----------|----------|--------|
| 数壹 (number-one) | `packages/math/pages/number-one` | click, win | P0 ✅ |
| 数织 (nonogram) | `packages/math/pages/nonogram` | click, win | P0 ✅ |
| 24点 (24point) | `packages/math/pages/24point` | click, correct, wrong | P1 |
| 成语接龙 (idiom-chain) | `packages/life/pages/idiom-chain` | click, correct, wrong | P1 |
| 成语对决 (idiom-battle) | `packages/life/pages/idiom-battle` | click, win, lose | P1 |
| 合并ABC (merge-abc) | `packages/life/pages/merge-abc` | click, merge, win, lose | P2 |
| 真心话大冒险 (truth-or-dare) | `packages/life/pages/truth-or-dare` | click, spin | P2 |
| 数独求解器 (sudoku-solver) | `packages/math/pages/sudoku-solver` | click, solve | P2 |

### 已有音效（非游戏）

| 页面 | 状态 | 备注 |
|------|------|------|
| 电子木鱼 (electronic-woodfish) | ✅ 自带 | 敲击音效 |
| 其他工具类页面 | ⏸️ 不处理 | 非游戏，无音效需求 |

---

## 四、技术方案

### 4.1 CDN 路径约定

```
https://cdn.jsdelivr.net/gh/ddabb/freetools@main/data/sounds/
├── click.wav      # 通用点击音效 (~26KB)
├── flag.wav      # 标记/旗帜音效
├── win.wav       # 胜利音效
├── lose.wav      # 失败音效
├── click3.mp3    # 备用点击音效
└── [新增].wav    # 按需添加
```

### 4.2 playSound 函数标准实现

```javascript
const SOUNDS_BASE = 'https://cdn.jsdelivr.net/gh/ddabb/freetools@main/data/sounds';

function playSound(src) {
  const audio = wx.createInnerAudioContext();
  audio.src = src;
  audio.play();
  audio.onEnded(() => audio.destroy());
  audio.onError(() => audio.destroy());
}
```

### 4.3 集成点示例

```javascript
// 点击时
playSound(SOUNDS_BASE + '/click.wav');

// 胜利时
playSound(SOUNDS_BASE + '/win.wav');

// 失败时
playSound(SOUNDS_BASE + '/lose.wav');
```

---

## 五、音效资源清单

| 文件名 | 用途 | 体积 | 状态 |
|--------|------|------|------|
| click.wav | 通用点击 | 26KB | ✅ 已有 |
| flag.wav | 标记/旗帜 | 26KB | ✅ 已有 |
| win.wav | 胜利提示 | 26KB | ✅ 已有 |
| lose.wav | 失败提示 | 26KB | ✅ 已有 |
| click3.mp3 | 备用点击 | 42KB | ✅ 已有 |

> 所有音效文件位于 `F:\SelfJob\freetools\data\sounds\`

---

## 六、实现清单

### Phase 1：P0 游戏集成

- [x] 数壹 (number-one) 集成音效
- [x] 数织 (nonogram) 集成音效

### Phase 2：P1 游戏集成

- [ ] 24点 (24point) 集成音效
- [ ] 成语接龙 (idiom-chain) 集成音效
- [ ] 成语对决 (idiom-battle) 集成音效

### Phase 3：P2 游戏集成

- [ ] 合并ABC (merge-abc) 集成音效
- [ ] 真心话大冒险 (truth-or-dare) 集成音效
- [ ] 数独求解器 (sudoku-solver) 集成音效

---

## 七、验收标准

1. **功能性**：所有点击/标记/胜利/失败事件正确触发音效
2. **稳定性**：音效播放不阻塞UI，播放后资源正确释放
3. **兼容性**：iOS/Android 双端正常播放，无兼容问题
4. **性能**：单次音效加载 < 500ms，不造成页面卡顿

---

## 八、附录

### 相关文档
- [格子游戏PRD.md](./格子游戏PRD.md)
- [CDN数据管理规范.md](./CDN数据管理规范.md)

### 提交记录
- `382447f9` feat(othello): add sound effects for moves and game over
- `7723c6bc` fix(frog-escape): sound CDN path and playSound duplicate

---

*最后更新：2026-04-24*
