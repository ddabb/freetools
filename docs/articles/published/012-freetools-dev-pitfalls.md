# 从 10 个工具到 57 个工具，我踩过的 10 个坑

> 这些坑，每一个都让我掉了头发。

---

## 一、为什么写这篇文章？

### 1. 经验值得记录

做了 57 个工具，踩了无数坑。

有些坑，踩了两次。

有些坑，踩了才知道。

**现在记录下来，避免重复踩坑。**

### 2. 让读者少走弯路

如果你也在做小程序：
- 这些坑，你可以避开
- 这些经验，你可以直接用
- 这些代码，你可以直接抄

---

## 二、我踩过的 10 个坑

### 坑 1：分包超过 2MB

**问题：**

微信小程序主包+分包有 2MB 限制。

做到 30 个工具时，构建失败：

```
Error: 代码包大小超过 2MB
```

**原因：**

我把所有工具都放在主包里了。

**解决方案：**

使用「分包加载」：

```
主包（基础框架+首页）→ 500KB
  ↓
生活工具包（12个）→ 300KB
  ↓
数学工具包（9个） → 250KB
  ↓
文本工具包（9个） → 280KB
  ↓
...
```

**经验：**

- 每个工具单独一个文件夹
- 使用 wxss 抽离公共样式
- 图片用网络链接，不用本地

---

### 坑 2：wx:for 变量作用域

**问题：**

在数独求解器里，点击候选数没反应。

```html
<!-- 错误写法 -->
<view wx:for="{{board}}" wx:for-index="index">
  <view wx:for="{{item}}" wx:for-index="itemIndex">
    <view bindtap="tap" data-row="{{index}}">  <!-- index 已经被覆盖！ -->
    </view>
  </view>
</view>
```

**原因：**

内层 wx:for 覆盖了外层的 index。

**解决方案：**

明确指定变量名：

```html
<!-- 正确写法 -->
<view wx:for="{{board}}" wx:for-index="rowIndex" wx:for-item="row">
  <view wx:for="{{row}}" wx:for-index="colIndex" wx:for-item="cell">
    <view bindtap="tap" data-row="{{rowIndex}}" data-col="{{colIndex}}">
    </view>
  </view>
</view>
```

**经验：**

- 微信小程序的 wx:for 会覆盖外层变量
- 养成明确指定 wx:for-index 的习惯

---

### 坑 3：CDN 缓存策略不当

**问题：**

更新了 CDN 数据，用户看到的还是旧数据。

**原因：**

没有设置缓存过期时间。

**解决方案：**

```javascript
const CACHE_EXPIRE = 24 * 60 * 60 * 1000; // 24小时

function loadData() {
  const cached = wx.getStorageSync('data_key');
  const timestamp = wx.getStorageSync('data_timestamp');
  
  // 检查缓存是否有效
  if (cached && Date.now() - timestamp < CACHE_EXPIRE) {
    return cached;
  }
  
  // 从 CDN 加载
  wx.request({
    url: 'https://cdn.jsdelivr.net/.../data.json',
    success: (res) => {
      wx.setStorageSync('data_key', res.data);
      wx.setStorageSync('data_timestamp', Date.now());
    }
  });
}
```

**经验：**

- 本地缓存要设置过期时间
- 不同数据类型，缓存时间不同

---

### 坑 4：图片本地存储太大

**问题：**

小程序包太大，打包失败。

**原因：**

我把二维码背景图、图标都放本地了。

**解决方案：**

- 图标用 CSS 或 SVG，不用图片
- 背景图用网络链接
- 用 base64 代替小图片

**经验：**

- 小程序包空间有限
- 尽量用代码生成 UI

---

### 坑 5：异步请求没处理 Loading

**问题：**

点击按钮后，界面卡住了。

**原因：**

发起请求后，没有显示 Loading 状态。

**解决方案：**

```javascript
// 请求前
wx.showLoading({ title: '加载中...' });

// 请求中
wx.request({
  url: '...',
  success: () => {
    wx.hideLoading();
  },
  fail: () => {
    wx.hideLoading();
  }
});
```

**经验：**

- 所有网络请求都要有 Loading
- 还要有错误处理

---

### 坑 6：数据格式不统一

**问题：**

JSON.parse 报错。

**原因：**

CDN 返回的数据格式不对。

**解决方案：**

```javascript
// 防御性编程
function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch (e) {
    console.error('JSON解析失败', e);
    return null;
  }
}
```

**经验：**

- 永远不要信任外部数据
- 做好错误处理

---

### 坑 7：页面栈太深

**问题：**

返回按钮失灵了。

**原因：**

页面栈超过了 10 层。

**解决方案：**

```javascript
// 跳转到新页面
wx.navigateTo({ url: '...' });

// 如果页面栈满了，用 redirectTo
wx.redirectTo({ url: '...' });

// 或者用 reLaunch 回到首页
wx.reLaunch({ url: '/pages/index/index' });
```

**经验：**

- 小程序页面栈最多 10 层
- 合理使用跳转方式

---

### 坑 8：setData 性能问题

**问题：**

界面卡顿。

**原因：**

每次修改数据都调用 setData，而且传递大量数据。

**解决方案：**

```javascript
// ❌ 错误：每次都传整个数组
this.setData({ board: this.data.board });

// ✅ 正确：只传修改的部分
this.setData({
  'board[0][0]': newValue
});

// ✅ 正确：先修改内存，再一次性 setData
const board = this.data.board;
board[0][0] = newValue;
this.setData({ board });
```

**经验：**

- setData 很耗性能
- 尽量合并多次修改

---

### 坑 9：没有做版本兼容

**问题：**

新版本上线后，旧版本用户崩溃了。

**原因：**

数据结构变了，但没做兼容。

**解决方案：**

```javascript
function parseData(data) {
  // 默认值
  const defaultData = {
    version: '1.0.0',
    tools: []
  };
  
  // 兼容处理
  return {
    ...defaultData,
    ...data
  };
}
```

**经验：**

- 数据结构要有版本号
- 做好向后兼容

---

### 坑 10：没有收集错误日志

**问题：**

用户反馈 Bug，但我复现不出来。

**原因：**

没有错误日志。

**解决方案：**

```javascript
// 收集错误日志
App({
  onError: (err) => {
    // 上报到服务器或存储本地
    wx.setStorageSync('error_log', err);
  }
});
```

**经验：**

- 收集错误日志很重要
- 可以用 try-catch 包裹关键代码

---

## 三、总结：避坑指南

### 1. 设计阶段

- ✅ 规划好分包结构
- ✅ 确定数据格式
- ✅ 设计错误处理机制

### 2. 开发阶段

- ✅ wx:for 变量名不重复
- ✅ setData 性能优化
- ✅ 异步请求 Loading

### 3. 上线阶段

- ✅ CDN 缓存策略
- ✅ 版本兼容
- ✅ 错误日志收集

---

## 四、写在最后

**这些坑，每一个都让我掉了头发。**

但踩坑不是坏事：

- 踩坑 = 学习
- 踩坑 = 成长
- 踩坑 = 经验

**希望这些经验，能让你少掉头发。**

---

> 如果你也在做小程序，收藏这篇文章。
> 
> 踩坑的时候，看看有没有解决方案。