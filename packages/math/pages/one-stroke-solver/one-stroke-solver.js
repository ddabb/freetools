Page({
  data: {
    nodes: [],
    edges: [],
    selectedNode: null,
    isSolvable: null,
    resultMessage: '',
    startNode: null,
    endNode: null,
    path: [],
    currentGraph: 'house'
  },

  graphs: {
    house: {
      nodes: [
        { id: 0, x: 150, y: 50 },
        { id: 1, x: 50, y: 150 },
        { id: 2, x: 250, y: 150 },
        { id: 3, x: 50, y: 250 },
        { id: 4, x: 250, y: 250 }
      ],
      edges: [
        [0, 1], [0, 2], [1, 2], [1, 3], [2, 4], [3, 4], [1, 4]
      ]
    },
    square: {
      nodes: [
        { id: 0, x: 100, y: 100 },
        { id: 1, x: 200, y: 100 },
        { id: 2, x: 200, y: 200 },
        { id: 3, x: 100, y: 200 }
      ],
      edges: [
        [0, 1], [1, 2], [2, 3], [3, 0], [0, 2]
      ]
    },
    star: {
      nodes: [
        { id: 0, x: 150, y: 50 },
        { id: 1, x: 80, y: 200 },
        { id: 2, x: 220, y: 120 },
        { id: 3, x: 80, y: 120 },
        { id: 4, x: 220, y: 200 }
      ],
      edges: [
        [0, 1], [1, 2], [2, 3], [3, 4], [4, 0]
      ]
    },
    butterfly: {
      nodes: [
        { id: 0, x: 150, y: 150 },
        { id: 1, x: 80, y: 80 },
        { id: 2, x: 220, y: 80 },
        { id: 3, x: 80, y: 220 },
        { id: 4, x: 220, y: 220 }
      ],
      edges: [
        [0, 1], [0, 2], [0, 3], [0, 4], [1, 2], [3, 4]
      ]
    }
  },

  onLoad() {
    this.loadGraph('house');
  },

  loadGraph(name) {
    const graph = this.graphs[name];
    this.setData({
      nodes: graph.nodes,
      edges: graph.edges,
      currentGraph: name,
      isSolvable: null,
      resultMessage: '',
      startNode: null,
      endNode: null,
      path: [],
      selectedNode: null
    });
    this.drawGraph();
  },

  buildAdjacencyList() {
    const adj = {};
    this.data.nodes.forEach(node => {
      adj[node.id] = [];
    });
    this.data.edges.forEach(([a, b]) => {
      adj[a].push(b);
      adj[b].push(a);
    });
    return adj;
  },

  checkOneStroke() {
    const adj = this.buildAdjacencyList();
    const degrees = {};
    
    this.data.nodes.forEach(node => {
      degrees[node.id] = adj[node.id].length;
    });

    const oddDegreeNodes = [];
    Object.entries(degrees).forEach(([nodeId, degree]) => {
      if (degree % 2 !== 0) {
        oddDegreeNodes.push(parseInt(nodeId));
      }
    });

    let isSolvable, resultMessage, startNode, endNode;

    if (oddDegreeNodes.length === 0) {
      isSolvable = true;
      resultMessage = '可以一笔画成！从任意点开始都可以。';
      startNode = 0;
      endNode = 0;
    } else if (oddDegreeNodes.length === 2) {
      isSolvable = true;
      resultMessage = '可以一笔画成！请从一个奇点开始，在另一个奇点结束。';
      startNode = oddDegreeNodes[0];
      endNode = oddDegreeNodes[1];
    } else {
      isSolvable = false;
      resultMessage = `无法一笔画成！有 ${oddDegreeNodes.length} 个奇点，超过了2个。`;
      startNode = null;
      endNode = null;
    }

    this.setData({
      isSolvable,
      resultMessage,
      startNode,
      endNode
    });

    if (isSolvable) {
      const path = this.findPath(adj, startNode, endNode);
      this.setData({ path });
      this.drawGraph();
    } else {
      this.drawGraph();
    }
  },

  findPath(adj, start, end) {
    const path = [];
    const edgeUsed = new Set();
    
    const dfs = (current) => {
      for (const neighbor of adj[current]) {
        const edgeKey = [Math.min(current, neighbor), Math.max(current, neighbor)].join('-');
        if (!edgeUsed.has(edgeKey)) {
          edgeUsed.add(edgeKey);
          dfs(neighbor);
        }
      }
      path.unshift(current);
    };
    
    dfs(start);
    return path;
  },

  drawGraph() {
    const ctx = wx.createCanvasContext('graphCanvas');
    const width = 300;
    const height = 300;

    ctx.clearRect(0, 0, width, height);

    ctx.setStrokeStyle('#ddd');
    ctx.setLineWidth(3);
    this.data.edges.forEach(([a, b]) => {
      const nodeA = this.data.nodes.find(n => n.id === a);
      const nodeB = this.data.nodes.find(n => n.id === b);
      ctx.beginPath();
      ctx.moveTo(nodeA.x, nodeA.y);
      ctx.lineTo(nodeB.x, nodeB.y);
      ctx.stroke();
    });

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

    this.data.nodes.forEach(node => {
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
    });

    ctx.draw();
  },

  onSelectGraph(e) {
    const graph = e.currentTarget.dataset.graph;
    this.loadGraph(graph);
  },

  onShareAppMessage() {
    return {
      title: '一笔画求解 - 判断图形是否可以一笔画成',
      path: '/packages/math/pages/one-stroke-solver/one-stroke-solver'
    }
  }
})
