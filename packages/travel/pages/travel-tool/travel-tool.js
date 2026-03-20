// travel-tool.js
Page({
  data: {
    days: 3, // 旅行天数
    destination: '', // 目的地
    showList: false, // 是否显示行李清单
    packingList: [] // 行李清单
  },
  
  // 设置旅行天数
  setDays(e) {
    this.setData({
      days: parseInt(e.detail.value) || 0
    });
  },
  
  // 设置目的地
  setDestination(e) {
    this.setData({
      destination: e.detail.value
    });
  },
  
  // 生成行李清单
  generate() {
    const { days, destination } = this.data;
    if (!days) {
      wx.showToast({
        title: '请输入旅行天数',
        icon: 'none'
      });
      return;
    }
    
    // 生成行李清单
    let packingList = [
      '护照/身份证',
      '手机充电器',
      '充电宝',
      '耳机',
      '牙刷/牙膏',
      '毛巾',
      '洗发水/沐浴露',
      '换洗衣物',
      '袜子',
      '内衣',
      '外套',
      '鞋子',
      '雨伞',
      '太阳镜',
      '防晒霜',
      '钱包',
      '钥匙',
      '相机',
      '药品',
      '水瓶'
    ];
    
    // 根据旅行天数调整清单
    if (days > 7) {
      packingList.push('更多换洗衣物');
      packingList.push('洗衣用品');
    }
    
    // 根据目的地调整清单
    if (destination.includes('海边') || destination.includes('海滩')) {
      packingList.push('泳衣');
      packingList.push('沙滩巾');
      packingList.push('墨镜');
    } else if (destination.includes('山区') || destination.includes(' hiking')) {
      packingList.push('登山鞋');
      packingList.push('登山包');
      packingList.push('保暖衣物');
    }
    
    // 更新结果
    this.setData({
      showList: true,
      packingList
    });
  },
  
  // 分享给好友
  onShareAppMessage() {
    return {
      title: '旅行助手 - 智能生成行李清单',
      path: '/packages/other/pages/travel-tool/travel-tool'
    }
  },
  
  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '旅行助手 - 智能生成行李清单',
      query: 'travel-tool'
    }
  }
})