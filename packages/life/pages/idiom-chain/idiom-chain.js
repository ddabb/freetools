// idiom-chain.js - 成语龙链页面
const HISTORY_KEY = 'idiom_chain_history';

function pad(value) {
  return value < 10 ? `0${value}` : `${value}`;
}

function formatTime(timestamp) {
  if (!timestamp) return '未记录时间';
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return '时间格式异常';
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function toPlainChain(item) {
  const words = Array.isArray(item.words) ? item.words.filter(Boolean) : [];
  return {
    startWord: (item.startWord || '').trim(),
    count: Number(item.count) > 0 ? Number(item.count) : Math.max(words.length, 1),
    timestamp: Number(item.timestamp) || 0,
    words,
  };
}

function normalizeHistory(rawHistory) {
  const chains = rawHistory && Array.isArray(rawHistory.chains) ? rawHistory.chains : [];
  return chains
    .map(toPlainChain)
    .filter(item => item.startWord)
    .sort((a, b) => b.timestamp - a.timestamp)
    .map(item => ({
      ...item,
      formattedTime: formatTime(item.timestamp),
      previewText: item.words.length ? item.words.slice(0, 6).join(' → ') : item.startWord,
    }));
}

function persistHistory(chains) {
  wx.setStorageSync(HISTORY_KEY, {
    chains: (chains || []).map(toPlainChain).filter(item => item.startWord),
  });
}

Page({
  data: {
    chains: [],
  },

  onLoad() {
    this.loadHistory();
  },

  onShow() {
    this.loadHistory();
  },

  loadHistory() {
    const rawHistory = wx.getStorageSync(HISTORY_KEY);
    this.setData({
      chains: normalizeHistory(rawHistory),
    });
  },

  onRecordTap(e) {
    const index = Number(e.currentTarget.dataset.index);
    const record = this.data.chains[index];
    if (!record) return;

    // 跳转到查询页面继续接龙
    wx.navigateTo({
      url: `/packages/life/pages/idiom-query/idiom-query?word=${encodeURIComponent(record.startWord)}`,
    });
  },

  onRecordLongPress(e) {
    const index = Number(e.currentTarget.dataset.index);
    const record = this.data.chains[index];
    if (!record) return;

    wx.showModal({
      title: '删除记录',
      content: `确定删除"${record.startWord}"这条接龙历史吗？`,
      confirmColor: '#e74c3c',
      success: ({ confirm }) => {
        if (confirm) {
          this._deleteRecord(index);
        }
      },
    });
  },

  onClearHistory() {
    if (!this.data.chains.length) return;

    wx.showModal({
      title: '清空历史',
      content: '清空后无法恢复，确定继续吗？',
      confirmColor: '#e74c3c',
      success: ({ confirm }) => {
        if (!confirm) return;
        persistHistory([]);
        this.setData({ chains: [] });
        wx.showToast({ title: '历史已清空', icon: 'success' });
      },
    });
  },

  _deleteRecord(index) {
    const nextChains = this.data.chains.filter((_, currentIndex) => currentIndex !== index);
    persistHistory(nextChains);
    this.setData({
      chains: normalizeHistory({ chains: nextChains }),
    });
    wx.showToast({ title: '记录已删除', icon: 'success' });
  },

  // =====================
  //  分享功能
  // =====================
  onShareAppMessage() {
    const { chains } = this.data;
    const totalChains = chains.length;
    const bestChain = chains.length > 0 ? chains.reduce((max, c) => c.count > max.count ? c : max, chains[0]) : null;
    let title = '成语龙链 - 查看我的接龙历史';
    if (bestChain) {
      title = `我在成语接龙中最长接龙${bestChain.count}个，共${totalChains}条记录，来看看吧！`;
    }
    return {
      title,
      path: '/packages/life/pages/idiom-chain/idiom-chain',
    };
  },

  onShareTimeline() {
    const { chains } = this.data;
    const totalChains = chains.length;
    const bestChain = chains.length > 0 ? chains.reduce((max, c) => c.count > max.count ? c : max, chains[0]) : null;
    let title = '成语龙链 - 我的接龙历史';
    if (bestChain) {
      title = `成语接龙最长${bestChain.count}个，共${totalChains}条记录`;
    }
    return {
      title,
    };
  },
});
