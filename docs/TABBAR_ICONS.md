# TabBar 图标说明

## 状态
当前TabBar配置中引用了图标文件，但图标资源尚未创建。

## 配置位置
`app.json` 文件中的 `tabBar` 配置项：

```json
{
  "tabBar": {
    "list": [
      {
        "pagePath": "pages/index/index",
        "text": "首页",
        "iconPath": "images/home.png",
        "selectedIconPath": "images/home-active.png"
      },
      {
        "pagePath": "pages/discover/discover",
        "text": "发现",
        "iconPath": "images/discover.png",
        "selectedIconPath": "images/discover-active.png"
      },
      {
        "pagePath": "pages/mine/mine",
        "text": "我的",
        "iconPath": "images/mine.png",
        "selectedIconPath": "images/mine-active.png"
      }
    ]
  }
}
```

## 需要的图标文件

### 1. 首页图标
- `images/home.png` - 未选中状态（81x81px，建议使用灰色）
- `images/home-active.png` - 选中状态（81x81px，建议使用蓝色#3498db）
- 图标建议：房子图标 🏠

### 2. 发现图标
- `images/discover.png` - 未选中状态（81x81px，建议使用灰色）
- `images/discover-active.png` - 选中状态（81x81px，建议使用蓝色#3498db）
- 图标建议：指南针或放大镜图标 🧭🔍

### 3. 我的图标
- `images/mine.png` - 未选中状态（81x81px，建议使用灰色）
- `images/mine-active.png` - 选中状态（81x81px，建议使用蓝色#3498db）
- 图标建议：用户图标 👤

## 临时解决方案

### 方案1：暂时移除图标配置
在创建图标资源之前，可以从 `app.json` 中移除 `iconPath` 和 `selectedIconPath` 配置：

```json
{
  "tabBar": {
    "list": [
      {
        "pagePath": "pages/index/index",
        "text": "首页"
      },
      {
        "pagePath": "pages/discover/discover",
        "text": "发现"
      },
      {
        "pagePath": "pages/mine/mine",
        "text": "我的"
      }
    ]
  }
}
```

### 方案2：创建简单的占位图标
使用以下步骤创建简单的占位图标：

1. 在项目根目录创建 `images` 文件夹
2. 使用以下尺寸的纯色图片：
   - 首页：灰色方块和蓝色方块
   - 发现：灰色方块和蓝色方块
   - 我的：灰色方块和蓝色方块

### 方案3：使用在线图标生成工具
推荐使用以下工具生成TabBar图标：
- https://iconfont.cn/
- https://www.iconfinder.com/
- https://icomoon.io/app/

## 设计建议

### 尺寸规格
- 标准：81x81px (@2x)
- 高清：162x162px (@3x)
- 格式：PNG（支持透明）

### 颜色方案
- 未选中：#999999（灰色）
- 选中：#3498db（项目主色）

### 设计风格
- 线性图标
- 简洁明了
- 统一粗细（2-3px）
- 适当留白

## 注意事项
1. 图标必须在 `images` 文件夹下
2. 文件名必须与 `app.json` 中配置一致
3. 建议同时提供 @2x 和 @3x 两套尺寸
4. 图标要简洁，在小尺寸下也能清晰识别

## 创建步骤

1. **创建文件夹**
   ```bash
   mkdir -p images
   ```

2. **准备图标资源**
   - 使用设计工具或在线工具创建6个图标文件
   - 确保尺寸和格式符合要求

3. **放置图标文件**
   ```
   images/
   ├── home.png
   ├── home-active.png
   ├── discover.png
   ├── discover-active.png
   ├── mine.png
   └── mine-active.png
   ```

4. **验证效果**
   - 在微信开发者工具中预览
   - 检查图标显示是否正常
   - 测试选中/未选中状态切换

## 优先级
- **高优先级**：创建TabBar图标，提升用户体验
- **中优先级**：优化图标设计，使其更符合项目风格
- **低优先级**：提供多种主题配色选项
