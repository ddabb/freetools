// packages/converter/pages/json-xml-converter/json-xml-converter.js
Page({
  data: {
    activeTab: 'json2xml', // 当前激活的标签页
    
    // JSON转XML相关
    jsonInput: '', // JSON输入
    xmlOutput: '', // XML输出
    showJsonXmlResult: false, // 是否显示JSON转XML结果
    addRootElement: true, // 是否添加根元素
    rootElementName: 'data', // 根元素名称
    
    // XML转JSON相关
    xmlInput: '', // XML输入
    jsonOutput: '', // JSON输出
    showXmlJsonResult: false, // 是否显示XML转JSON结果
    formatOutput: true, // 是否格式化输出
    preserveAttributes: true, // 是否保留属性
    
    errorMessage: '' // 错误消息
  },

  // 切换标签页
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({
      activeTab: tab,
      errorMessage: '',
      showJsonXmlResult: false,
      showXmlJsonResult: false
    });
  },

  // 设置JSON输入
  setJsonInput(e) {
    this.setData({
      jsonInput: e.detail.value,
      showJsonXmlResult: false
    });
  },

  // 设置XML输入
  setXmlInput(e) {
    this.setData({
      xmlInput: e.detail.value,
      showXmlJsonResult: false
    });
  },

  // 切换添加根元素
  toggleAddRoot() {
    this.setData({
      addRootElement: !this.data.addRootElement
    });
  },

  // 设置根元素名称
  setRootElementName(e) {
    this.setData({
      rootElementName: e.detail.value
    });
  },

  // 切换格式化输出
  toggleFormat() {
    this.setData({
      formatOutput: !this.data.formatOutput
    });
  },

  // 切换保留属性
  togglePreserveAttrs() {
    this.setData({
      preserveAttributes: !this.data.preserveAttributes
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

  // JSON转XML
  convertJsonToXml() {
    const { jsonInput, addRootElement, rootElementName } = this.data;
    
    if (!jsonInput.trim()) {
      this.showError('请输入JSON数据');
      return;
    }

    try {
      const jsonObj = JSON.parse(jsonInput);
      
      let xml = '';
      if (addRootElement) {
        xml += `<${rootElementName}>\n`;
        xml += this.objectToXml(jsonObj, 1);
        xml += `</${rootElementName}>`;
      } else {
        xml = this.objectToXml(jsonObj, 0);
      }

      this.setData({
        xmlOutput: xml,
        showJsonXmlResult: true
      });

      wx.vibrateShort();

    } catch (error) {
      console.error('JSON转XML失败', error);
      this.showError('JSON格式错误：' + error.message);
    }
  },

  // 对象转XML
  objectToXml(obj, indentLevel) {
    const spaces = '  '.repeat(indentLevel);
    let xml = '';

    if (Array.isArray(obj)) {
      for (const item of obj) {
        xml += `${spaces}<item>\n`;
        xml += this.objectToXml(item, indentLevel + 1);
        xml += `${spaces}</item>\n`;
      }
    } else if (typeof obj === 'object' && obj !== null) {
      for (const [key, value] of Object.entries(obj)) {
        const safeKey = this.escapeXmlTag(key);
        if (typeof value === 'object' && value !== null) {
          xml += `${spaces}<${safeKey}>\n`;
          xml += this.objectToXml(value, indentLevel + 1);
          xml += `${spaces}</${safeKey}>\n`;
        } else {
          xml += `${spaces}<${safeKey}>${this.escapeXmlText(String(value))}</${safeKey}>\n`;
        }
      }
    } else {
      xml += `${spaces}${this.escapeXmlText(String(obj))}\n`;
    }

    return xml;
  },

  // XML转JSON
  convertXmlToJson() {
    const { xmlInput } = this.data;
    
    if (!xmlInput.trim()) {
      this.showError('请输入XML数据');
      return;
    }

    try {
      // 简化的XML解析（实际项目中建议使用专门的XML解析库）
      const json = this.xmlToObject(xmlInput);
      const jsonStr = this.data.formatOutput ? 
        JSON.stringify(json, null, 2) : 
        JSON.stringify(json);

      this.setData({
        jsonOutput: jsonStr,
        showXmlJsonResult: true
      });

      wx.vibrateShort();

    } catch (error) {
      console.error('XML转JSON失败', error);
      this.showError('XML格式错误或解析失败');
    }
  },

  // 简化的XML转对象（基础实现）
  xmlToObject(xml) {
    // 移除换行和多余空格
    xml = xml.replace(/\n\s*/g, ' ').trim();
    
    // 简单的XML标签匹配和转换
    const result = {};
    const stack = [{ obj: result, key: 'root' }];
    let current = result;
    
    // 使用正则匹配标签（简化版）
    const tagRegex = /<(\/?)([a-zA-Z_][a-zA-Z0-9_]*)[^>]*>([^<]*)?/g;
    let match;
    
    while ((match = tagRegex.exec(xml)) !== null) {
      const [, closing, tagName, content] = match;
      
      if (closing) {
        // 闭合标签，弹出栈
        stack.pop();
        current = stack[stack.length - 1].obj;
      } else {
        // 开始标签
        const cleanContent = content ? content.trim() : '';
        
        if (cleanContent && !/<[^>]+>/.test(cleanContent)) {
          // 有文本内容
          if (Array.isArray(current[tagName])) {
            current[tagName].push(cleanContent);
          } else if (current[tagName]) {
            current[tagName] = [current[tagName], cleanContent];
          } else {
            current[tagName] = cleanContent;
          }
        } else {
          // 嵌套对象
          const newObj = {};
          if (Array.isArray(current[tagName])) {
            current[tagName].push(newObj);
          } else if (current[tagName]) {
            current[tagName] = [current[tagName], newObj];
          } else {
            current[tagName] = newObj;
          }
          stack.push({ obj: newObj, key: tagName });
          current = newObj;
        }
      }
    }
    
    return result.root || result;
  },

  // 转义XML标签名
  escapeXmlTag(tag) {
    return tag.replace(/[^a-zA-Z0-9_-]/g, '_');
  },

  // 转义XML文本
  escapeXmlText(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  },

  // 复制结果
  copyResult(e) {
    const type = e.currentTarget.dataset.type;
    const { xmlOutput, jsonOutput } = this.data;
    const text = type === 'xml' ? xmlOutput : jsonOutput;

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
      title: 'JSON·XML转换器 - 数据格式互转神器',
      path: '/packages/converter/pages/json-xml-converter/json-xml-converter',
      imageUrl: ''
    }
  },

  // 页面加载时执行
  onLoad() {
    wx.setNavigationBarTitle({ title: 'JSON·XML转换器' });
  }
})