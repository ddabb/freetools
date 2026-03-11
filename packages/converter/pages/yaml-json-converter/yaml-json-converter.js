// packages/converter/pages/yaml-json-converter/yaml-json-converter.js
Page({
  data: {
    activeTab: 'yaml2json', // 当前激活的标签页
    
    // YAML转JSON相关
    yamlInput: '', // YAML输入
    jsonOutput: '', // JSON输出
    showYamlJsonResult: false, // 是否显示YAML转JSON结果
    formatOutput: true, // 是否格式化输出
    removeEmptyLines: true, // 是否移除空行
    
    // JSON转YAML相关
    jsonInput: '', // JSON输入
    yamlOutput: '', // YAML输出
    showJsonYamlResult: false, // 是否显示JSON转YAML结果
    addComments: false, // 是否添加注释
    preserveOrder: true, // 是否保持顺序
    
    errorMessage: '', // 错误消息
    
    // 示例数据
    examples: [
      { 
        title: '用户信息', 
        yaml: 'name: 张三\nage: 25\ncity: 北京\nhobbies:\n  - 读书\n  - 运动\n  - 音乐',
        json: '{"name": "张三", "age": 25, "city": "北京", "hobbies": ["读书", "运动", "音乐"]}'
      },
      { 
        title: '服务器配置', 
        yaml: 'server:\n  host: localhost\n  port: 8080\ndatabase:\n  name: myapp\n  user: admin',
        json: '{"server": {"host": "localhost", "port": 8080}, "database": {"name": "myapp", "user": "admin"}}'
      },
      { 
        title: '产品列表', 
        yaml: 'products:\n  - name: 笔记本\n    price: 5999\n  - name: 手机\n    price: 3999',
        json: '{"products": [{"name": "笔记本", "price": 5999}, {"name": "手机", "price": 3999}]}'
      }
    ]
  },

  // 切换标签页
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({
      activeTab: tab,
      errorMessage: '',
      showYamlJsonResult: false,
      showJsonYamlResult: false
    });
  },

  // 设置YAML输入
  setYamlInput(e) {
    this.setData({
      yamlInput: e.detail.value,
      showYamlJsonResult: false
    });
  },

  // 设置JSON输入
  setJsonInput(e) {
    this.setData({
      jsonInput: e.detail.value,
      showJsonYamlResult: false
    });
  },

  // 切换格式化输出
  toggleFormat() {
    this.setData({
      formatOutput: !this.data.formatOutput
    });
  },

  // 切换移除空行
  toggleRemoveEmpty() {
    this.setData({
      removeEmptyLines: !this.data.removeEmptyLines
    });
  },

  // 切换添加注释
  toggleAddComments() {
    this.setData({
      addComments: !this.data.addComments
    });
  },

  // 切换保持顺序
  togglePreserveOrder() {
    this.setData({
      preserveOrder: !this.data.preserveOrder
    });
  },

  // 显示错误
  showError(message) {
    this.setData({ errorMessage: message });
    setTimeout(() => {
      this.setData({ errorMessage: '' });
    }, 5000);
  },

  // 清除错误
  clearError() {
    this.setData({ errorMessage: '' });
  },

  // YAML转JSON (简化实现)
  convertYamlToJson() {
    const { yamlInput, formatOutput } = this.data;
    
    if (!yamlInput.trim()) {
      this.showError('请输入YAML数据');
      return;
    }

    try {
      // 简化的YAML解析（实际项目中建议使用js-yaml库）
      const jsonObj = this.parseSimpleYaml(yamlInput);
      const jsonStr = formatOutput ? 
        JSON.stringify(jsonObj, null, 2) : 
        JSON.stringify(jsonObj);

      this.setData({
        jsonOutput: jsonStr,
        showYamlJsonResult: true
      });

      wx.vibrateShort();

    } catch (error) {
      console.error('YAML转JSON失败', error);
      this.showError('YAML格式错误：' + error.message);
    }
  },

  // 简化的YAML解析
  parseSimpleYaml(yaml) {
    const lines = yaml.split('\n').filter(line => line.trim());
    const result = {};
    const stack = [{ obj: result, indent: -1 }];
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine.startsWith('#')) continue;
      
      const indent = line.search(/\S/);
      const colonIndex = trimmedLine.indexOf(':');
      
      if (colonIndex === -1) continue;
      
      const key = trimmedLine.substring(0, colonIndex).trim();
      let value = trimmedLine.substring(colonIndex + 1).trim();
      
      // 调整栈深度
      while (stack.length > 1 && indent <= stack[stack.length - 1].indent) {
        stack.pop();
      }
      
      const current = stack[stack.length - 1].obj;
      
      if (value === '') {
        // 这是一个对象或数组
        const newValue = Array.isArray(current[key]) ? [] : {};
        if (Array.isArray(current[key])) {
          current[key].push(newValue);
        } else {
          current[key] = newValue;
        }
        stack.push({ obj: newValue, indent });
      } else {
        // 这是一个值
        if (value.startsWith('- ')) {
          // 数组项
          const arrayKey = key;
          if (!Array.isArray(current[arrayKey])) {
            current[arrayKey] = [];
          }
          current[arrayKey].push(value.substring(2).trim());
        } else {
          // 普通值
          current[key] = this.parseYamlValue(value);
        }
      }
    }
    
    return result;
  },

  // 解析YAML值
  parseYamlValue(value) {
    // 去除引号
    if ((value.startsWith('"') && value.endsWith('"')) || 
        (value.startsWith("'") && value.endsWith("'"))) {
      return value.slice(1, -1);
    }
    
    // 布尔值
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
    
    // 数字
    if (/^-?\d+$/.test(value)) return parseInt(value);
    if (/^-?\d*\.\d+$/.test(value)) return parseFloat(value);
    
    return value;
  },

  // JSON转YAML (简化实现)
  convertJsonToYaml() {
    const { jsonInput } = this.data;
    
    if (!jsonInput.trim()) {
      this.showError('请输入JSON数据');
      return;
    }

    try {
      const jsonObj = JSON.parse(jsonInput);
      const yaml = this.objectToYaml(jsonObj, 0);

      this.setData({
        yamlOutput: yaml,
        showJsonYamlResult: true
      });

      wx.vibrateShort();

    } catch (error) {
      console.error('JSON转YAML失败', error);
      this.showError('JSON格式错误：' + error.message);
    }
  },

  // 对象转YAML
  objectToYaml(obj, indentLevel) {
    const spaces = '  '.repeat(indentLevel);
    let yaml = '';

    if (Array.isArray(obj)) {
      for (const item of obj) {
        yaml += `${spaces}- ${this.valueToYaml(item, indentLevel + 1)}\n`;
      }
    } else if (typeof obj === 'object' && obj !== null) {
      for (const [key, value] of Object.entries(obj)) {
        yaml += `${spaces}${key}:`;
        if (typeof value === 'object' && value !== null) {
          yaml += '\n' + this.objectToYaml(value, indentLevel + 1);
        } else {
          yaml += ` ${this.valueToYaml(value, indentLevel + 1)}\n`;
        }
      }
    } else {
      yaml += `${spaces}${this.valueToYaml(obj, indentLevel)}\n`;
    }

    return yaml;
  },

  // 值转YAML
  valueToYaml(value, indentLevel) {
    if (value === null) return 'null';
    if (typeof value === 'string') {
      // 如果包含特殊字符，添加引号
      if (value.includes(':') || value.includes('#') || value.includes('\n') || 
          value.startsWith(' ') || value.endsWith(' ')) {
        return `"${value.replace(/"/g, '\\"')}"`;
      }
      return value;
    }
    if (typeof value === 'boolean') return value.toString();
    if (typeof value === 'number') return value.toString();
    return String(value);
  },

  // 使用示例
  useExample(e) {
    const example = e.currentTarget.dataset.example;
    
    if (this.data.activeTab === 'yaml2json') {
      this.setData({
        yamlInput: example.yaml,
        showYamlJsonResult: false
      });
    } else {
      this.setData({
        jsonInput: example.json,
        showJsonYamlResult: false
      });
    }
  },

  // 复制结果
  copyResult(e) {
    const type = e.currentTarget.dataset.type;
    const { jsonOutput, yamlOutput } = this.data;
    const text = type === 'json' ? jsonOutput : yamlOutput;

    wx.setClipboardData({
      data: text,
      success: () => {
        wx.showToast({ title: '已复制到剪贴板', icon: 'success' });
      },
      fail: () => {
        wx.showToast({ title: '复制失败', icon: 'none' });
      }
    });
  },

  // 分享给好友
  onShareAppMessage() {
    return {
      title: 'YAML·JSON转换器 - 配置文件格式互转',
      path: '/packages/converter/pages/yaml-json-converter/yaml-json-converter'
    }
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: 'YAML·JSON转换器 - 配置文件格式互转',
      query: 'yaml-json-converter'
    }
  },

  // 页面加载时执行
  onLoad() {
    wx.setNavigationBarTitle({ title: 'YAML·JSON转换器' });
  }
})