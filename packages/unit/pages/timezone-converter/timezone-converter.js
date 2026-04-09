// packages/unit/pages/timezone-converter/timezone-converter.js

// 常用城市时区数据
const TIMEZONE_DATA = [
  { city: '北京', zone: 'Asia/Shanghai', offset: 8, country: '中国', abbr: 'CST' },
  { city: '上海', zone: 'Asia/Shanghai', offset: 8, country: '中国', abbr: 'CST' },
  { city: '东京', zone: 'Asia/Tokyo', offset: 9, country: '日本', abbr: 'JST' },
  { city: '首尔', zone: 'Asia/Seoul', offset: 9, country: '韩国', abbr: 'KST' },
  { city: '新加坡', zone: 'Asia/Singapore', offset: 8, country: '新加坡', abbr: 'SGT' },
  { city: '曼谷', zone: 'Asia/Bangkok', offset: 7, country: '泰国', abbr: 'ICT' },
  { city: '迪拜', zone: 'Asia/Dubai', offset: 4, country: '阿联酋', abbr: 'GST' },
  { city: '悉尼', zone: 'Australia/Sydney', offset: 10, country: '澳大利亚', abbr: 'AEST' },
  { city: '墨尔本', zone: 'Australia/Melbourne', offset: 10, country: '澳大利亚', abbr: 'AEST' },
  { city: '伦敦', zone: 'Europe/London', offset: 0, country: '英国', abbr: 'GMT' },
  { city: '巴黎', zone: 'Europe/Paris', offset: 1, country: '法国', abbr: 'CET' },
  { city: '柏林', zone: 'Europe/Berlin', offset: 1, country: '德国', abbr: 'CET' },
  { city: '莫斯科', zone: 'Europe/Moscow', offset: 3, country: '俄罗斯', abbr: 'MSK' },
  { city: '纽约', zone: 'America/New_York', offset: -5, country: '美国', abbr: 'EST' },
  { city: '洛杉矶', zone: 'America/Los_Angeles', offset: -8, country: '美国', abbr: 'PST' },
  { city: '芝加哥', zone: 'America/Chicago', offset: -6, country: '美国', abbr: 'CST' },
  { city: '温哥华', zone: 'America/Vancouver', offset: -8, country: '加拿大', abbr: 'PST' },
  { city: '多伦多', zone: 'America/Toronto', offset: -5, country: '加拿大', abbr: 'EST' },
  { city: '旧金山', zone: 'America/Los_Angeles', offset: -8, country: '美国', abbr: 'PST' },
  { city: '夏威夷', zone: 'Pacific/Honolulu', offset: -10, country: '美国', abbr: 'HST' },
  { city: '奥克兰', zone: 'Pacific/Auckland', offset: 13, country: '新西兰', abbr: 'NZDT' },
  { city: '孟买', zone: 'Asia/Kolkata', offset: 5.5, country: '印度', abbr: 'IST' },
  { city: '伊斯坦布尔', zone: 'Europe/Istanbul', offset: 3, country: '土耳其', abbr: 'TRT' },
  { city: '开罗', zone: 'Africa/Cairo', offset: 2, country: '埃及', abbr: 'EET' },
  { city: '约翰内斯堡', zone: 'Africa/Johannesburg', offset: 2, country: '南非', abbr: 'SAST' }
];

// 按地区分组
const REGION_GROUPS = {
  '亚洲': ['北京', '上海', '东京', '首尔', '新加坡', '曼谷', '迪拜', '孟买'],
  '欧洲': ['伦敦', '巴黎', '柏林', '莫斯科', '伊斯坦布尔'],
  '美洲': ['纽约', '洛杉矶', '芝加哥', '旧金山', '温哥华', '多伦多', '夏威夷'],
  '大洋洲': ['悉尼', '墨尔本', '奥克兰'],
  '非洲': ['开罗', '约翰内斯堡']
};

Page({
  data: {
    // 当前基准时间
    baseDate: '',
    baseTime: '',
    baseCity: null,
    
    // 城市列表
    allCities: TIMEZONE_DATA,
    regionGroups: REGION_GROUPS,
    
    // 选中的城市（用于转换显示）
    selectedCities: [],
    
    // 收藏的城市
    favoriteCities: [],
    
    // 会议协调器
    meetingCities: [],
    meetingDuration: 60, // 分钟
    meetingResults: [],
    
    // 页面状态
    activeTab: 'converter', // converter, meeting
    showCityPicker: false,
    pickerMode: '', // 'base', 'add', 'meeting'
    searchKeyword: '',
    filteredCities: [],
    
    // 转换结果
    convertedTimes: []
  },

  onLoad() {
    // 初始化tab active class
    this.setData({
      tabConverterClass: 'tab-item active',
      tabMeetingClass: 'tab-item',
      converterPageClass: 'converter-page',
      meetingPageClass: 'meeting-page hidden',
      pickerModalClass: 'city-picker-modal hidden',
      cityGroupFavTitle: '⭐ 收藏城市',
      cityGroupAllTitle: '所有城市',
      showConverterPage: true,
      showMeetingPage: false,
      suggestionClass: 'suggestion-warning',
      suggestionText: '部分城市处于非工作时间，请注意协调',
      durationOptions: this.buildDurationOptions()
    });
    this.initTime();
    this.loadFavorites();
    this.loadSelectedCities();
  },

  onShow() {
    // 刷新时间
    this.calculateConversions();
    if (this.data.activeTab === 'meeting') {
      this.calculateMeetingTimes();
    }
  },

  // 初始化时间
  initTime() {
    const now = new Date();
    const dateStr = this.formatDate(now);
    const timeStr = this.formatTime(now);
    
    // 默认基准城市为北京
    const beijing = TIMEZONE_DATA.find(c => c.city === '北京');
    
    // 为所有城市添加offsetText属性
    const citiesWithOffsetText = TIMEZONE_DATA.map(city => ({
      ...city,
      offsetText: city.offset >= 0 ? `+${city.offset}` : `${city.offset}`
    }));
    
    this.setData({
      baseDate: dateStr,
      baseTime: timeStr,
      baseCity: { ...beijing, offsetText: beijing.offset >= 0 ? `+${beijing.offset}` : `${beijing.offset}` },
      allCities: citiesWithOffsetText
    }, () => {
      this.calculateConversions();
    });
  },

  // 格式化日期
  formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  // 格式化时间
  formatTime(date) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  },

  // 加载收藏
  loadFavorites() {
    const favorites = wx.getStorageSync('timezoneFavorites') || ['北京', '东京', '纽约', '伦敦'];
    this.setData({ favoriteCities: favorites });
  },

  // 保存收藏
  saveFavorites() {
    wx.setStorageSync('timezoneFavorites', this.data.favoriteCities);
  },

  // 加载选中的城市
  loadSelectedCities() {
    const selected = wx.getStorageSync('timezoneSelected') || ['东京', '纽约', '伦敦'];
    this.setData({ selectedCities: selected }, () => {
      this.calculateConversions();
    });
  },

  // 保存选中的城市
  saveSelectedCities() {
    wx.setStorageSync('timezoneSelected', this.data.selectedCities);
  },

  // 计算收藏标签的选中态
  buildFavoriteTagsWithState() {
    const selectedCities = this.data.selectedCities;
    return this.data.favoriteCities.map(name => ({
      name,
      tagClass: selectedCities.includes(name) ? 'favorite-tag selected' : 'favorite-tag'
    }));
  },

  // 计算会议时长选项的 active 态
  buildDurationOptions() {
    const cur = this.data.meetingDuration;
    return [
      { value: 30,  label: '30分钟', itemClass: cur === 30  ? 'duration-item active' : 'duration-item' },
      { value: 60,  label: '1小时',  itemClass: cur === 60  ? 'duration-item active' : 'duration-item' },
      { value: 90,  label: '1.5小时',itemClass: cur === 90  ? 'duration-item active' : 'duration-item' },
      { value: 120, label: '2小时',  itemClass: cur === 120 ? 'duration-item active' : 'duration-item' }
    ];
  },

  // 切换标签（JS预计算active class）
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({
      activeTab: tab,
      tabConverterClass: tab === 'converter' ? 'tab-item active' : 'tab-item',
      tabMeetingClass: tab === 'meeting' ? 'tab-item active' : 'tab-item',
      converterPageClass: tab === 'converter' ? 'converter-page' : 'converter-page hidden',
      meetingPageClass: tab === 'meeting' ? 'meeting-page' : 'meeting-page hidden',
      showConverterPage: tab === 'converter',
      showMeetingPage: tab === 'meeting'
    });
    if (tab === 'meeting') {
      this.calculateMeetingTimes();
    }
  },

  // 基准日期变化
  onBaseDateChange(e) {
    this.setData({ baseDate: e.detail.value }, () => {
      this.calculateConversions();
      if (this.data.activeTab === 'meeting') {
        this.calculateMeetingTimes();
      }
    });
  },

  // 基准时间变化
  onBaseTimeChange(e) {
    this.setData({ baseTime: e.detail.value }, () => {
      this.calculateConversions();
      if (this.data.activeTab === 'meeting') {
        this.calculateMeetingTimes();
      }
    });
  },

  // 计算各城市时间（JS预计算所有展示值）
  calculateConversions() {
    if (!this.data.baseDate || !this.data.baseTime || !this.data.baseCity) return;

    const baseDateTime = new Date(`${this.data.baseDate}T${this.data.baseTime}:00`);
    const baseOffset = this.data.baseCity.offset;
    
    const convertedTimes = this.data.selectedCities.map(cityName => {
      const city = TIMEZONE_DATA.find(c => c.city === cityName);
      if (!city) return null;

      const offsetDiff = city.offset - baseOffset;
      const localTime = new Date(baseDateTime.getTime() + offsetDiff * 60 * 60 * 1000);
      const hour = localTime.getHours();
      const isNight = hour < 6 || hour >= 22;
      const isWorkTime = hour >= 9 && hour < 18;
      const isFavorite = this.data.favoriteCities.includes(city.city);

      return {
        city: city.city,
        country: city.country,
        offset: city.offset,
        offsetDiff: offsetDiff,
        offsetText: city.offset >= 0 ? `+${city.offset}` : `${city.offset}`,
        localDate: this.formatDate(localTime),
        localTime: this.formatTime(localTime),
        // JS预计算展示值
        itemClass: isNight ? 'city-item night' : isWorkTime ? 'city-item worktime' : 'city-item',
        itemFlag: isNight ? '🌙' : '☀️',
        itemStatusClass: isWorkTime ? 'time-status work' : 'time-status normal',
        itemStatusText: isWorkTime ? '工作时间' : '非工作时间',
        itemFavClass: isFavorite ? 'action-btn favorited' : 'action-btn',
        itemFavIcon: isFavorite ? '★' : '☆'
      };
    }).filter(Boolean);

    this.setData({
      convertedTimes,
      favoriteTagsWithState: this.buildFavoriteTagsWithState(),
      durationOptions: this.buildDurationOptions()
    });
  },

  // 显示城市选择器
  showCityPicker(e) {
    const mode = e.currentTarget.dataset.mode || 'add';
    const selectedCities = this.data.selectedCities;
    const favoriteCitiesWithState = this.data.favoriteCities.map(name => ({
      name,
      checkClass: selectedCities.includes(name) ? 'option-check checked' : 'option-check',
      checkIcon: selectedCities.includes(name) ? '✓' : ''
    }));
    const filteredCities = TIMEZONE_DATA.map(city => ({
      ...city,
      offsetText: city.offset >= 0 ? `+${city.offset}` : `${city.offset}`,
      isSelected: selectedCities.includes(city.city),
      checkClass: selectedCities.includes(city.city) ? 'option-check checked' : 'option-check',
      checkIcon: selectedCities.includes(city.city) ? '✓' : ''
    }));
    this.setData({
      showCityPicker: true,
      pickerModalClass: 'city-picker-modal',
      pickerMode: mode,
      searchKeyword: '',
      cityGroupFavTitle: '⭐ 收藏城市',
      cityGroupAllTitle: '所有城市',
      favoriteCitiesWithState,
      filteredCities
    });
  },

  // 关闭城市选择器
  closeCityPicker() {
    this.setData({ showCityPicker: false, pickerModalClass: 'city-picker-modal hidden' });
  },

  // 搜索城市
  onSearchInput(e) {
    const keyword = e.detail.value.toLowerCase();
    const selectedCities = this.data.selectedCities;
    const filtered = TIMEZONE_DATA.map(city => ({
      ...city,
      offsetText: city.offset >= 0 ? `+${city.offset}` : `${city.offset}`,
      isSelected: selectedCities.includes(city.city),
      checkClass: selectedCities.includes(city.city) ? 'option-check checked' : 'option-check',
      checkIcon: selectedCities.includes(city.city) ? '✓' : ''
    })).filter(city => 
      city.city.toLowerCase().includes(keyword) ||
      city.country.toLowerCase().includes(keyword) ||
      city.abbr.toLowerCase().includes(keyword)
    );
    this.setData({ 
      searchKeyword: keyword,
      cityGroupFavTitle: keyword ? '' : '⭐ 收藏城市',
      cityGroupAllTitle: keyword ? '搜索结果' : '所有城市',
      filteredCities: filtered
    });
  },

  // 选择城市
  selectCity(e) {
    const cityName = e.currentTarget.dataset.city;
    const mode = this.data.pickerMode;

    if (mode === 'base') {
      const city = TIMEZONE_DATA.find(c => c.city === cityName);
      this.setData({ 
        baseCity: city,
        showCityPicker: false
      }, () => {
        this.calculateConversions();
      });
    } else if (mode === 'add') {
      if (!this.data.selectedCities.includes(cityName)) {
        const selected = [...this.data.selectedCities, cityName];
        this.setData({ 
          selectedCities: selected,
          showCityPicker: false
        }, () => {
          this.saveSelectedCities();
          this.calculateConversions();
        });
      } else {
        this.setData({ showCityPicker: false });
      }
    } else if (mode === 'meeting') {
      if (!this.data.meetingCities.includes(cityName)) {
        const meeting = [...this.data.meetingCities, cityName];
        this.setData({ 
          meetingCities: meeting,
          showCityPicker: false
        }, () => {
          this.calculateMeetingTimes();
        });
      } else {
        this.setData({ showCityPicker: false });
      }
    }
  },

  // 切换收藏
  toggleFavorite(e) {
    const cityName = e.currentTarget.dataset.city;
    const isFavorite = this.data.favoriteCities.includes(cityName);
    let favorites;
    
    if (isFavorite) {
      favorites = this.data.favoriteCities.filter(c => c !== cityName);
    } else {
      favorites = [...this.data.favoriteCities, cityName];
    }
    
    this.setData({ favoriteCities: favorites }, () => {
      this.saveFavorites();
      this.calculateConversions();
    });
  },

  // 删除选中城市
  removeSelectedCity(e) {
    const cityName = e.currentTarget.dataset.city;
    const selected = this.data.selectedCities.filter(c => c !== cityName);
    this.setData({ selectedCities: selected }, () => {
      this.saveSelectedCities();
      this.calculateConversions();
    });
  },

  // 设置为基准城市
  setAsBase(e) {
    const cityName = e.currentTarget.dataset.city;
    const city = TIMEZONE_DATA.find(c => c.city === cityName);
    this.setData({ baseCity: city }, () => {
      this.calculateConversions();
    });
  },

  // 会议协调器：添加城市
  addMeetingCity() {
    const selectedCities = this.data.selectedCities;
    const filteredCities = TIMEZONE_DATA.map(city => ({
      ...city,
      offsetText: city.offset >= 0 ? `+${city.offset}` : `${city.offset}`,
      isSelected: selectedCities.includes(city.city),
      checkClass: selectedCities.includes(city.city) ? 'option-check checked' : 'option-check',
      checkIcon: selectedCities.includes(city.city) ? '✓' : ''
    }));
    this.setData({
      showCityPicker: true,
      pickerModalClass: 'city-picker-modal',
      pickerMode: 'meeting',
      searchKeyword: '',
      cityGroupFavTitle: '⭐ 收藏城市',
      cityGroupAllTitle: '所有城市',
      filteredCities
    });
  },

  // 会议协调器：删除城市
  removeMeetingCity(e) {
    const cityName = e.currentTarget.dataset.city;
    const meeting = this.data.meetingCities.filter(c => c !== cityName);
    this.setData({ meetingCities: meeting }, () => {
      this.calculateMeetingTimes();
    });
  },

  // 会议协调器：设置时长
  onDurationChange(e) {
    const duration = parseInt(e.currentTarget.dataset.value) || 60;
    this.setData({ meetingDuration: duration }, () => {
      this.calculateMeetingTimes();
    });
  },

  // 计算会议时间（JS预计算所有展示值）
  calculateMeetingTimes() {
    if (this.data.meetingCities.length < 2) {
      this.setData({ meetingResults: [], isAllWorkTime: false, hasNightTime: false, suggestionClass: 'suggestion-warning', suggestionText: '部分城市处于非工作时间，请注意协调' });
      return;
    }

    const results = [];
    const baseDateTime = new Date(`${this.data.baseDate}T${this.data.baseTime}:00`);
    const baseOffset = this.data.baseCity.offset;

    this.data.meetingCities.forEach(cityName => {
      const city = TIMEZONE_DATA.find(c => c.city === cityName);
      if (!city) return;

      const offsetDiff = city.offset - baseOffset;
      const localTime = new Date(baseDateTime.getTime() + offsetDiff * 60 * 60 * 1000);
      const hour = localTime.getHours();
      const isWorkTime = hour >= 9 && hour < 18;
      const isNight = hour < 6 || hour >= 22;

      results.push({
        city: city.city,
        country: city.country,
        localTime: this.formatTime(localTime),
        isWorkTime: isWorkTime,
        isNight: isNight,
        // JS预计算展示值
        itemClass: isWorkTime ? 'analysis-item good' : 'analysis-item warning',
        itemFlag: isWorkTime ? '✅' : '⚠️',
        itemTimeTagClass: isWorkTime ? 'time-tag work' : 'time-tag overtime',
        itemTimeTagText: isWorkTime ? '工作时间' : '加班时间'
      });
    });

    const isAllWorkTime = results.length > 0 && results.every(r => r.isWorkTime);
    const hasNightTime = results.some(r => r.isNight);
    
    const suggestionClass = isAllWorkTime ? 'suggestion-good' : hasNightTime ? 'suggestion-bad' : 'suggestion-warning';
    const suggestionText = isAllWorkTime ? '所有城市都在工作时间，非常适合开会！' : hasNightTime ? '有城市处于深夜，建议调整会议时间' : '部分城市处于非工作时间，请注意协调';

    this.setData({ 
      meetingResults: results,
      isAllWorkTime: isAllWorkTime,
      hasNightTime: hasNightTime,
      suggestionClass: suggestionClass,
      suggestionText: suggestionText,
      durationOptions: this.buildDurationOptions()
    });
  },

  // 快速设置常用会议时间
  setQuickTime(e) {
    const time = e.currentTarget.dataset.time;
    this.setData({ baseTime: time }, () => {
      this.calculateConversions();
      this.calculateMeetingTimes();
    });
  },

  // 分享结果
  shareResult() {
    let text = `🌍 时区转换结果\n\n`;
    text += `基准：${this.data.baseCity.city} ${this.data.baseTime}\n\n`;
    
    this.data.convertedTimes.forEach(item => {
      const icon = item.isNight ? '🌙' : item.isWorkTime ? '☀️' : '🌆';
      text += `${icon} ${item.city} ${item.localTime}\n`;
    });

    wx.setClipboardData({
      data: text,
      success: () => {
        wx.showToast({ title: '已复制到剪贴板', icon: 'success' });
      }
    });
  }
});
