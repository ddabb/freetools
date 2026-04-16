const GridPathFinder = require('../../utils/GridPathFinder');

Page({
  data: {
    nodes: [],
    edges: [],
    isSolvable: null,
    resultMessage: '',
    startNode: null,
    endNode: null,
    path: [],
    gridWidth: 5,
    gridHeight: 5,
    gridHoles: [],
    isLoading: false,
    mode: 'generate' // generate �?verify
  },

  onLoad() {
    this.generateGrid();
  },

  // 切换模式
  switchMode(e) {
    const mode = e.currentTarget.dataset.mode;
    this.setData({ mode: mode });
  },

  drawGraph() {
    const that = this;
    try {
      // 使用新的2D Canvas API获取上下文，参照life-countdown.js的方�?
      const query = wx.createSelectorQuery();
      query.select('#graphCanvas')
        .fields({ node: true, size: true })
        .exec((res) => {
          console.debug('获取Canvas元素结果:', res);
          if (!res || res.length === 0 || !res[0] || !res[0].node) {
            console.error('获取Canvas元素失败:', res);
            return;
          }

          const canvas = res[0].node;
          const ctx = canvas.getContext('2d');
          const width = 300;
          const height = 300;

          // 调整canvas的实际尺�?
          canvas.width = width;
          canvas.height = height;

          ctx.clearRect(0, 0, width, height);

          // 绘制�?
          ctx.strokeStyle = '#ddd';
          ctx.lineWidth = 3;
          that.data.edges.forEach(([a, b]) => {
            // 检查边的两个节点是否都是洞
            const isHoleA = that.data.gridHoles.indexOf(a) !== -1;
            const isHoleB = that.data.gridHoles.indexOf(b) !== -1;
            if (!isHoleA && !isHoleB) {
              const nodeA = that.data.nodes.find(n => n.id === a);
              const nodeB = that.data.nodes.find(n => n.id === b);
              if (nodeA && nodeB) {
                ctx.beginPath();
                ctx.moveTo(nodeA.x, nodeA.y);
                ctx.lineTo(nodeB.x, nodeB.y);
                ctx.stroke();
              }
            }
          });

          // 绘制路径
          if (that.data.path && that.data.path.length > 1) {
            ctx.strokeStyle = '#ff6b35';
            ctx.lineWidth = 5;
            ctx.beginPath();
            const firstNode = that.data.nodes.find(n => n.id === that.data.path[0]);
            if (firstNode) {
              ctx.moveTo(firstNode.x, firstNode.y);
              for (let i = 1; i < that.data.path.length; i++) {
                const node = that.data.nodes.find(n => n.id === that.data.path[i]);
                if (node) {
                  ctx.lineTo(node.x, node.y);
                }
              }
              ctx.stroke();
            }
          }

          // 绘制节点
          that.data.nodes.forEach(node => {
            // 检查是否是�?
            if (that.data.gridHoles.indexOf(node.id) !== -1) {
              // 绘制�?
              ctx.beginPath();
              ctx.arc(node.x, node.y, 15, 0, 2 * Math.PI);
              ctx.fillStyle = '#f0f0f0';
              ctx.fill();
              ctx.strokeStyle = '#ddd';
              ctx.lineWidth = 2;
              ctx.stroke();
            } else {
              // 绘制正常节点
              let fillColor = '#3498db';
              let radius = 15;

              if (node.id === that.data.startNode && node.id === that.data.endNode) {
                fillColor = '#f39c12';
                radius = 18;
              } else if (node.id === that.data.startNode) {
                fillColor = '#2ecc71';
                radius = 18;
              } else if (node.id === that.data.endNode) {
                fillColor = '#e74c3c';
                radius = 18;
              }

              ctx.beginPath();
              ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
              ctx.fillStyle = fillColor;
              ctx.fill();
              ctx.strokeStyle = '#fff';
              ctx.lineWidth = 3;
              ctx.stroke();

              ctx.fillStyle = '#fff';
              ctx.font = '16px sans-serif';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(node.id + 1, node.x, node.y);
            }
          });
        });
    } catch (error) {
      console.error('绘制图形时出�?', error);
    }
  },
  },

  // 生成网格
  generateGrid() {
    const width = this.data.gridWidth;
    const height = this.data.gridHeight;
    const nodes = [];
    const edges = [];
    
    // 计算单元格大小，确保每个单元格都是方�?
    const canvasSize = 300;
    const cellSize = Math.min(canvasSize / (width + 1), canvasSize / (height + 1));
    const startX = (canvasSize - cellSize * width) / 2;
    const startY = (canvasSize - cellSize * height) / 2;
    
    // 生成节点
    for (let i = 0; i < height; i++) {
      for (let j = 0; j < width; j++) {
        const id = i * width + j;
        nodes.push({
          id: id,
          x: startX + j * cellSize + cellSize / 2,
          y: startY + i * cellSize + cellSize / 2
        });
      }
    }
    
    // 生成�?
    for (let i = 0; i < height; i++) {
      for (let j = 0; j < width; j++) {
        const id = i * width + j;
        // 右边的边
        if (j < width - 1) {
          edges.push([id, id + 1]);
        }
        // 下边的边
        if (i < height - 1) {
          edges.push([id, id + width]);
        }
      }
    }
    
    this.setData({
      nodes: nodes,
      edges: edges,
      gridHoles: []
    });
    this.drawGraph();
  },

  // 生成带洞的网格题�?
  generateGridPuzzle() {
    this.setData({ isLoading: true });
    
    const width = this.data.gridWidth;
    const height = this.data.gridHeight;
    const totalCells = width * height;
    const maxHoles = Math.floor(totalCells * 0.3); // 最�?0%的洞
    const holes = [];
    
    // 随机生成�?
    while (holes.length < maxHoles) {
      const hole = Math.floor(Math.random() * totalCells);
      if (holes.indexOf(hole) === -1) {
        holes.push(hole);
      }
    }
    
    this.setData({
      gridHoles: holes,
      isLoading: false
    });
    this.drawGraph();
  },

  // 生成有效题目（确保可以一笔画成）
  generateValidPuzzle() {
    this.setData({ isLoading: true });
    
    const width = this.data.gridWidth;
    const height = this.data.gridHeight;
    
    // 使用 GridPathFinder 的静态方法生成有效题�?
    const validHoles = GridPathFinder.generateValidPuzzle(height, width);
    
    this.setData({
      gridHoles: validHoles,
      isLoading: false,
      resultMessage: validHoles.length > 0 ? '生成了有效题目！' : '无法生成有效题目，请尝试调整网格大小�?,
      isSolvable: validHoles.length > 0
    });
    this.drawGraph();
  },

  // 检查网格模式下的一笔画
  checkGridOneStroke() {
    this.setData({ isLoading: true });
    
    setTimeout(() => {
      const width = this.data.gridWidth;
      const height = this.data.gridHeight;
      const holes = this.data.gridHoles;
      
      const pathFinder = new GridPathFinder(height, width, holes);
      const isSolvable = pathFinder.isOneStroke();
      
      let resultMessage, startNode, endNode;
      
      if (isSolvable) {
        resultMessage = '可以一笔画成！';
        // 找到第一个有效的单元格作为起�?
        for (let i = 0; i < width * height; i++) {
          if (holes.indexOf(i) === -1) {
            startNode = i;
            endNode = i;
            break;
          }
        }
      } else {
        resultMessage = '无法一笔画成！';
        startNode = null;
        endNode = null;
      }
      
      this.setData({
        isSolvable,
        resultMessage,
        startNode,
        endNode,
        isLoading: false
      });
      
      this.drawGraph();
    }, 500);
  },

  // 更新网格宽度
  updateGridWidth(e) {
    const range = [3, 4, 5, 6, 7, 8, 9];
    const width = range[e.detail.value];
    this.setData({ gridWidth: width });
    this.generateGrid();
  },

  // 更新网格高度
  updateGridHeight(e) {
    const range = [3, 4, 5, 6, 7, 8, 9];
    const height = range[e.detail.value];
    this.setData({ gridHeight: height });
    this.generateGrid();
  }
})
