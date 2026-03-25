# 公开API集成建议

> 生成时间：2026-03-25
> 状态：待集成

---

## 📋 API清单

### 一、天气类

#### 1. 和风天气 API（推荐⭐⭐⭐⭐⭐）

**官网**：[https://dev.qweather.com/](https://dev.qweather.com/)

**特点**：
- 国内最准确天气预报
- 免费版1000次/天
- 支持实时天气、预报、预警、生活指数等

**接入方案**：
```javascript
// 请求地址
const url = 'https://devapi.qweather.com/v7/weather/now';

// 参数
const params = {
  location: '101010100', // 城市代码
  key: 'YOUR_API_KEY'
};
```

**可集成功能**：
- 当前天气查询
- 未来7天预报
- 穿衣指数、紫外线指数
- 空气质量指数

---

#### 2. Open-Meteo（备选⭐⭐⭐⭐）

**官网**：[https://open-meteo.com/](https://open-meteo.com/)

**特点**：
- 完全免费，无需注册
- 全球覆盖
- 无使用限制

**接入方案**：
```javascript
// 请求地址
const url = 'https://api.open-meteo.com/v1/forecast';

// 示例
fetch('https://api.open-meteo.com/v1/forecast?latitude=31.23&longitude=121.47&current_weather=true')
```

---

### 二、文字/语录类

#### 3. 一言 API（必选⭐⭐⭐⭐⭐）

**官网**：[https://hitokoto.cn/](https://hitokoto.cn/)

**特点**：
- 完全免费
- 无需注册
- 语录种类丰富

**接入方案**：
```javascript
// 请求地址
const url = 'https://v1.hitokoto.cn';

// 示例
fetch('https://v1.hitokoto.cn/?c=a&c=b&c=c')
  .then(res => res.json())
  .then(data => console.log(data.hitokoto));
```

**可集成功能**：
- 随机语录展示
- 文案素材库
- 每日一言

---

#### 4. 随机毒鸡汤（推荐⭐⭐⭐⭐）

**来源**：[https://github.com/egotions/eggos](https://github.com/egotions/eggos)

**特点**：
- 完全免费
- 无需注册
- 毒鸡汤文案

**接入方案**：
```javascript
// 请求地址
const url = 'https://egnij.com/api/soul/random';
```

**可集成功能**：
- 文案素材
- 随机毒鸡汤
- 朋友圈文案

---

### 三、节假日类

#### 5. Holiday API（推荐⭐⭐⭐⭐）

**官网**：[https://holidayapi.com/](https://holidayapi.com/)

**特点**：
- 全球节假日数据
- 免费版1000次/月

**接入方案**：
```javascript
// 请求地址
const url = 'https://holidayapi.com/v1/holidays';

// 参数
const params = {
  key: 'YOUR_API_KEY',
  country: 'CN',
  year: 2026
};
```

---

#### 6. Calendarific（推荐⭐⭐⭐⭐）

**官网**：[https://calendarific.com/](https://calendarific.com/)

**特点**：
- 全球节假日
- 免费版2000次/月

**接入方案**：
```javascript
// 请求地址
const url = 'https://calendarific.com/api/v4/holidays';

// 参数
const params = {
  api_key: 'YOUR_API_KEY',
  country: 'CN',
  year: 2026
};
```

---

### 四、汇率类

#### 7. Frankfurter API（推荐⭐⭐⭐⭐⭐）

**官网**：[https://www.frankfurter.app/](https://www.frankfurter.app/)

**特点**：
- 完全免费
- 无需注册
- 实时汇率

**接入方案**：
```javascript
// 基础汇率
fetch('https://api.frankfurter.app/latest?from=CNY&to=USD')
  
// 货币列表
fetch('https://api.frankfurter.app/currencies')
```

---

#### 8. exchangerate-api（备选⭐⭐⭐⭐）

**官网**：[https://www.exchangerate-api.com/](https://www.exchangerate-api.com/)

**特点**：
- 免费版1500次/月
- 支持实时汇率

---

### 五、图片类

#### 9. Unsplash API（推荐⭐⭐⭐⭐）

**官网**：[https://unsplash.com/developers](https://unsplash.com/developers)

**特点**：
- 免费高清图片
- 免费50张/小时

**接入方案**：
```javascript
// 请求地址
const url = 'https://api.unsplash.com/photos/random';

// 请求头
const headers = {
  'Authorization': 'Client-ID YOUR_ACCESS_KEY'
};
```

---

#### 10. Pexels API（推荐⭐⭐⭐⭐）

**官网**：[https://www.pexels.com/api/](https://www.pexels.com/api/)

**特点**：
- 免费图片200张/月
- 图片质量高

---

### 六、IP地址类

#### 11. IP-API（推荐⭐⭐⭐⭐⭐）

**官网**：[http://ip-api.com/](http://ip-api.com/)

**特点**：
- 完全免费
- 无需注册
- 45次/分钟限制

**接入方案**：
```javascript
// 请求地址
const url = 'http://ip-api.com/json/';

// 示例
fetch('http://ip-api.com/json/?lang=zh-CN')
  .then(res => res.json())
  .then(data => {
    console.log(data.country);  // 国家
    console.log(data.city);     // 城市
  });
```

**可集成功能**：
- 自动定位城市
- IP归属地查询
- 天气自动获取

---

### 七、其他

#### 12. 快递100 API

**官网**：[https://www.kuaidi100.com/](https://www.kuaidi100.com/)

**特点**：
- 快递查询
- 有免费额度

---

## 🛠️ 集成优先级

| 优先级 | API | 功能 | 工作量 |
|--------|-----|------|--------|
| P0 | 一言API | 语录素材 | 1h |
| P0 | 和风天气 | 天气查询 | 2h |
| P1 | Frankfurter | 汇率计算 | 1h |
| P1 | IP-API | IP定位 | 1h |
| P2 | 毒鸡汤API | 文案素材 | 1h |
| P2 | Holiday API | 节假日 | 2h |
| P3 | Unsplash | 图片素材 | 2h |

---

## ⚠️ 注意事项

### 1. 微信小程序配置
在 `小程序后台 → 开发 → 开发管理 → 服务器域名` 中添加：
```
request 合法域名：
- https://v1.hitokoto.cn
- https://devapi.qweather.com
- https://api.frankfurter.app
- https://api.open-meteo.com
```

### 2. 安全建议
- API Key不要暴露在小程序代码中
- 使用云函数中转API请求
- 添加请求错误处理和重试机制

### 3. 缓存策略
```
建议缓存时间：
- 天气数据：30分钟
- 汇率数据：1小时
- 语录数据：本地缓存，不频繁请求
```

---

## 📝 待办事项

- [ ] 申请和风天气API Key
- [ ] 申请Unsplash API Key
- [ ] 配置服务器域名白名单
- [ ] 开发天气工具页面
- [ ] 开发语录/毒鸡汤页面
- [ ] 开发汇率计算器增强版
