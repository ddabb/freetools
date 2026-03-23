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
    mode: 'generate' // generate 或 verify
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
    const ctx = wx.createCanvasContext('graphCanvas');
    const width = 300;
    const height = 300;

    ctx.clearRect(0, 0, width, height);

    // 绘制边
    ctx.setStrokeStyle('#ddd');
    ctx.setLineWidth(3);
    this.data.edges.forEach(([a, b]) => {
      // 检查边的两个节点是否都是洞
      const isHoleA = this.data.gridHoles.indexOf(a) !== -1;
      const isHoleB = this.data.gridHoles.indexOf(b) !== -1;
      if (!isHoleA && !isHoleB) {
        const nodeA = this.data.nodes.find(n => n.id === a);
        const nodeB = this.data.nodes.find(n => n.id === b);
        ctx.beginPath();
        ctx.moveTo(nodeA.x, nodeA.y);
        ctx.lineTo(nodeB.x, nodeB.y);
        ctx.stroke();
      }
    });

    // 绘制路径
    if (this.data.path && this.data.path.length > 1) {
      ctx.setStrokeStyle('#ff6b35');
      ctx.setLineWidth(5);
      ctx.beginPath();
      const firstNode = this.data.nodes.find(n => n.id === this.data.path[0]);
      ctx.moveTo(firstNode.x, firstNode.y);
      for (let i = 1; i < this.data.path.length; i++) {
        const node = this.data.nodes.find(n => n.id === this.data.path[i]);
        ctx.lineTo(node.x, node.y);
      }
      ctx.stroke();
    }

    // 绘制节点
    this.data.nodes.forEach(node => {
      // 检查是否是洞
      if (this.data.gridHoles.indexOf(node.id) !== -1) {
        // 绘制洞
        ctx.beginPath();
        ctx.arc(node.x, node.y, 15, 0, 2 * Math.PI);
        ctx.setFillStyle('#f0f0f0');
        ctx.fill();
        ctx.setStrokeStyle('#ddd');
        ctx.setLineWidth(2);
        ctx.stroke();
      } else {
        // 绘制正常节点
        let fillColor = '#3498db';
        let radius = 15;

        if (node.id === this.data.startNode && node.id === this.data.endNode) {
          fillColor = '#f39c12';
          radius = 18;
        } else if (node.id === this.data.startNode) {
          fillColor = '#2ecc71';
          radius = 18;
        } else if (node.id === this.data.endNode) {
          fillColor = '#e74c3c';
          radius = 18;
        }

        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
        ctx.setFillStyle(fillColor);
        ctx.fill();
        ctx.setStrokeStyle('#fff');
        ctx.setLineWidth(3);
        ctx.stroke();

        ctx.setFillStyle('#fff');
        ctx.setFontSize(16);
        ctx.setTextAlign('center');
        ctx.setTextBaseline('middle');
        ctx.fillText(node.id + 1, node.x, node.y);
      }
    });

    ctx.draw();
  },

  onShareAppMessage() {
    return {
      title: '一笔画求解 - 判断网格是否可以一笔画成',
      path: '/packages/math/pages/one-stroke-solver/one-stroke-solver'
    }
  },

  // 生成网格
  generateGrid() {
    const width = this.data.gridWidth;
    const height = this.data.gridHeight;
    const nodes = [];
    const edges = [];
    
    // 计算单元格大小，确保每个单元格都是方形
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
    
    // 生成边
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

  // 生成带洞的网格题目
  generateGridPuzzle() {
    this.setData({ isLoading: true });
    
    const width = this.data.gridWidth;
    const height = this.data.gridHeight;
    const totalCells = width * height;
    const maxHoles = Math.floor(totalCells * 0.3); // 最多30%的洞
    const holes = [];
    
    // 随机生成洞
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
    
    // 使用 GridPathFinder 的静态方法生成有效题目
    const validHoles = GridPathFinder.generateValidPuzzle(height, width);
    
    this.setData({
      gridHoles: validHoles,
      isLoading: false,
      resultMessage: validHoles.length > 0 ? '生成了有效题目！' : '无法生成有效题目，请尝试调整网格大小。',
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
        // 找到第一个有效的单元格作为起点
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
    const width = parseInt(e.detail.value) + 1;
    this.setData({ gridWidth: width });
    this.generateGrid();
  },

  // 更新网格高度
  updateGridHeight(e) {
    const height = parseInt(e.detail.value) + 1;
    this.setData({ gridHeight: height });
    this.generateGrid();
  }
})
