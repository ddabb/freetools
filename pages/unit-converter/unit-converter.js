// unit-converter.js
Page({
  data: {
    unitType: 'length', // 单位类型：length-长度, area-面积, weight-重量, temperature-温度
    inputValue: 100, // 输入数值
    fromUnitIndex: 0, // 从单位索引
    toUnitIndex: 2, // 到单位索引
    fromUnits: ['米', '厘米', '英尺', '英寸'], // 从单位列表
    toUnits: ['米', '厘米', '英尺', '英寸'], // 到单位列表
    resultValue: '328.08' // 转换结果
  },
  
  // 设置单位类型
  setUnitType(e) {
    const unitType = e.currentTarget.dataset.type;
    this.setData({
      unitType
    });
    // 根据单位类型更新单位列表
    this.updateUnitLists(unitType);
  },
  
  // 更新单位列表
  updateUnitLists(unitType) {
    let fromUnits, toUnits;
    switch (unitType) {
      case 'length':
        fromUnits = ['米', '厘米', '英尺', '英寸'];
        toUnits = ['米', '厘米', '英尺', '英寸'];
        break;
      case 'area':
        fromUnits = ['平方米', '平方英尺', '公顷', '亩'];
        toUnits = ['平方米', '平方英尺', '公顷', '亩'];
        break;
      case 'weight':
        fromUnits = ['公斤', '克', '磅', '盎司'];
        toUnits = ['公斤', '克', '磅', '盎司'];
        break;
      case 'temperature':
        fromUnits = ['摄氏度', '华氏度', '开尔文'];
        toUnits = ['摄氏度', '华氏度', '开尔文'];
        break;
      default:
        fromUnits = ['米', '厘米', '英尺', '英寸'];
        toUnits = ['米', '厘米', '英尺', '英寸'];
    }
    this.setData({
      fromUnits,
      toUnits,
      fromUnitIndex: 0,
      toUnitIndex: 2
    });
    this.calculate();
  },
  
  // 设置输入数值
  setInputValue(e) {
    this.setData({
      inputValue: parseFloat(e.detail.value) || 0
    });
    this.calculate();
  },
  
  // 设置从单位
  setFromUnit(e) {
    this.setData({
      fromUnitIndex: e.detail.value
    });
    this.calculate();
  },
  
  // 设置到单位
  setToUnit(e) {
    this.setData({
      toUnitIndex: e.detail.value
    });
    this.calculate();
  },
  
  // 计算转换结果
  calculate() {
    const { unitType, inputValue, fromUnitIndex, toUnitIndex, fromUnits, toUnits } = this.data;
    let result = inputValue;
    
    // 这里仅做简单的模拟转换，实际开发中需要实现完整的单位转换逻辑
    this.setData({
      resultValue: result.toFixed(2)
    });
  }
})