function GridPathFinder(row, column, notExistPotList) {
    this.row = row;
    this.column = column;
    this.notExistPotList = notExistPotList || [];
    this.passedPot = new Array(row * column);
    for (var i = 0; i < this.passedPot.length; i++) {
        this.passedPot[i] = false;
    }
    this.path = new Array(row * column - this.notExistPotList.length);
    for (var i = 0; i < this.path.length; i++) {
        this.path[i] = null;
    }
    this.noFullPath = true;
}

GridPathFinder.prototype.decideSingleBounds = function(bounds, singleBounds) {
    return (bounds & singleBounds) !== 0;
};

GridPathFinder.prototype.setPassedPotAndPath = function() {
    var args = arguments;
    if (args.length === 3) {
        var p = args[0];
        var a = args[1];
        var b = args[2];
        this.path[p] = a;
        this.setPassedPot(a, b);
    } else if (args.length === 1) {
        var a = args[0];
        this.setPassedPotAndPath(0, a, true);
    } else if (args.length === 2) {
        var p = args[0];
        var a = args[1];
        this.setPassedPotAndPath(p, a, true);
    } else {
        throw new Error('Invalid number of arguments');
    }
};

GridPathFinder.prototype.decideBounds = function(pot) {
    var count = 0;
    if (pot < this.column) count += 1;
    if ((pot - (this.row - 1) * this.column) >= 0 && (pot - (this.row - 1) * this.column) < this.column) count += 2;
    if (pot % this.column === 0) count += 4;
    if (pot % this.column === this.column - 1) count += 8;
    return count;
};

GridPathFinder.prototype.passedPotIndexOutOfBounds = function(a) {
    return a < 0 || a >= this.column * this.row;
};

GridPathFinder.prototype.showPath = function() {
    for (var i = 0; i < this.path.length; i++) {
        console.log(this.path[i] + " ");
    }
};

GridPathFinder.prototype.getPath = function() {
    return this.path;
};

GridPathFinder.prototype.notExistPot = function(pot) {
    for (var i = 0; i < this.notExistPotList.length; i++) {
        if (this.notExistPotList[i] === pot) {
            return true;
        }
    }
    return false;
};

GridPathFinder.prototype.getPassedPot = function(pot) {
    return this.passedPot[pot];
};

GridPathFinder.prototype.passedPotOrNotExistPot = function(a) {
    return this.notExistPot(a) || this.getPassedPot(a);
};

GridPathFinder.prototype.run = function(nowPosition) {
    var a = this.path[nowPosition];
    if (nowPosition === this.path.length - 1) {
        this.noFullPath = false;
        return true;
    }

    var self = this;
    var dirs = [
        { dx: -1, dy: 0, bound: 4,  key: 'left'  },
        { dx:  1, dy: 0, bound: 8,  key: 'right' },
        { dx:  0, dy: -1, bound: 1, key: 'up'    },
        { dx:  0, dy:  1, bound: 2, key: 'down'  }
    ];

    for (var i = 0; i < dirs.length; i++) {
        var dir = dirs[i];
        var next = a + dir.dx + dir.dy * this.column;

        if (this.noFullPath &&
            !this.decideSingleBounds(this.decideBounds(a), dir.bound) &&
            !this.passedPotIndexOutOfBounds(next) &&
            !this.passedPotOrNotExistPot(next)) {

            this.setPassedPotAndPath(nowPosition + 1, next);
            var ok = this.run(nowPosition + 1);
            this.setPassedPot(next, false); // 回溯：清除passedPot

            if (ok) return true;
        }
    }

    return false;
};

GridPathFinder.prototype.setPassedPot = function(a, b) {
    this.passedPot[a] = b;
};

/**
 * 验证一笔画是否有解：检查所有有效格是否连通
 * @param {boolean} printPath - 是否打印路径
 * @returns {boolean} 是否有解（所有有效格连通）
 */
GridPathFinder.prototype.isOneStroke = function(printPath) {
    printPath = printPath || false;
    var visited = new Array(this.row * this.column);
    for (var i = 0; i < visited.length; i++) {
        visited[i] = false;
    }
    var path = []; // 用于记录路径

    var startCell = -1;

    // 找到第一个有效的单元格开始 DFS
    for (var i = 0; i < this.row * this.column; i++) {
        if (!this.notExistPot(i)) {
            startCell = i;
            break;
        }
    }

    if (startCell === -1) return false; // 没有有效的单元格

    var self = this;

    // 获取有效邻居的辅助函数
    var getNeighbors = function(i) {
        var neighbors = [];
        if (i % self.column > 0 && !self.notExistPot(i - 1) && !visited[i - 1]) neighbors.push(i - 1);
        if (i % self.column < self.column - 1 && !self.notExistPot(i + 1) && !visited[i + 1]) neighbors.push(i + 1);
        if (i >= self.column && !self.notExistPot(i - self.column) && !visited[i - self.column]) neighbors.push(i - self.column);
        if (i < (self.row - 1) * self.column && !self.notExistPot(i + self.column) && !visited[i + self.column]) neighbors.push(i + self.column);
        return neighbors;
    };

    // DFS 检查连通性和构建路径
    var dfs = function(i) {
        if (visited[i]) return true; // 如果已经访问过，返回 true
        visited[i] = true;
        path.push(i); // 记录当前单元格到路径中
        var neighbors = getNeighbors(i);
        for (var j = 0; j < neighbors.length; j++) {
            var neighbor = neighbors[j];
            if (!dfs(neighbor)) return false; // 如果邻居不能满足条件，返回 false
        }
        return true;
    };

    var isValid = dfs(startCell);

    // 检查所有有效的单元格是否都被访问了
    for (var i = 0; i < this.row * this.column; i++) {
        if (!this.notExistPot(i) && !visited[i]) return false; // 不是所有有效的单元格都被访问了
    }

    // 检查路径是否连续
    for (var i = 0; i < path.length - 1; i++) {
        if (!this.areAdjacent(path[i], path[i + 1])) {
            if (printPath) {
                console.log('Path error:', path[i], 'and', path[i + 1], 'are not adjacent');
            }
            return false;
        }
    }

    // 如果 printPath 为 true，则打印路径
    if (printPath) {
        console.log('Path:', path.join(' -> '));
    }

    return isValid;
};

GridPathFinder.prototype.areAdjacent = function(cell1, cell2) {
    var col1 = cell1 % this.column;
    var col2 = cell2 % this.column;
    var row1 = Math.floor(cell1 / this.column);
    var row2 = Math.floor(cell2 / this.column);
    return (
        (row1 === row2 && Math.abs(col1 - col2) === 1) ||
        (col1 === col2 && Math.abs(row1 - row2) === 1)
    );
};

GridPathFinder.prototype.resetPath = function() {
    for (var i = 0; i < this.path.length; i++) {
        this.path[i] = null;
    }
    for (var i = 0; i < this.passedPot.length; i++) {
        this.passedPot[i] = false;
    }
    this.noFullPath = true;
};

GridPathFinder.prototype.checkPathCompleteness = function() {
    var activeCells = 0;
    for (var i = 0; i < this.passedPot.length; i++) {
        if (this.passedPot[i]) activeCells++;
    }
    var totalActiveCells = this.row * this.column - this.notExistPotList.length;
    console.log('Active cells:', activeCells, 'Total active cells:', totalActiveCells);
    return activeCells === totalActiveCells;
};

/**
 * 静态方法：生成有效一笔画题目
 * 策略：构造连通的有效格集合 → 用 isOneStroke 验证 → 其余格为洞
 *
 * 关键不变量：有效格集合始终连通。连通性是一笔画可解的必要条件。
 * 对于网格图，连通性也是充分条件（连通网格子图必有哈密顿路径），
 * 因此只需验证连通性即可保证 isOneStroke 有解。
 */
GridPathFinder.generateValidPuzzle = function(row, column, maxHolePercentage) {
    maxHolePercentage = maxHolePercentage || 0.3;
    var totalCells = row * column;
    var maxHoles = Math.floor(totalCells * maxHolePercentage);
    if (maxHoles < 0) maxHoles = 0;

    // ---------- 辅助：检查活跃格集合是否连通 ----------
    var isConnected = function(activeArr) {
        // 找第一个活跃格
        var start = -1;
        for (var i = 0; i < totalCells; i++) { if (activeArr[i]) { start = i; break; } }
        if (start === -1) return false;

        var visited = new Array(totalCells).fill(false);
        var queue = [start];
        visited[start] = true;
        var visitedCount = 1;

        while (queue.length > 0) {
            var cur = queue.shift();
            var r = Math.floor(cur / column), c = cur % column;
            var nbs = [];
            if (c > 0   && activeArr[cur - 1] && !visited[cur - 1])   nbs.push(cur - 1);
            if (c < column - 1 && activeArr[cur + 1] && !visited[cur + 1]) nbs.push(cur + 1);
            if (r > 0   && activeArr[cur - column] && !visited[cur - column]) nbs.push(cur - column);
            if (r < row - 1   && activeArr[cur + column] && !visited[cur + column]) nbs.push(cur + column);
            for (var ni = 0; ni < nbs.length; ni++) {
                if (!visited[nbs[ni]]) { visited[nbs[ni]] = true; visitedCount++; queue.push(nbs[ni]); }
            }
        }

        var activeCount = 0;
        for (var i = 0; i < totalCells; i++) if (activeArr[i]) activeCount++;
        return visitedCount === activeCount;
    };

    // ---------- 阶段1：构建连通的有效格集合 ----------
    // 从一个起点开始，用 DFS 构建生成树，逐步扩展确保始终连通
    var activeSet = new Array(totalCells).fill(false);

    // 随机选择起点
    var allCells = [];
    for (var i = 0; i < totalCells; i++) allCells.push(i);
    // Fisher-Yates 洗牌
    for (var i = allCells.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = allCells[i]; allCells[i] = allCells[j]; allCells[j] = tmp;
    }

    // 从第一个格开始生长
    activeSet[allCells[0]] = true;

    // 收集当前活跃格的邻居（未活跃的候选格）
    var getCandidates = function() {
        var cand = [];
        var seen = {};
        for (var i = 0; i < totalCells; i++) {
            if (!activeSet[i]) continue;
            var r = Math.floor(i / column), c = i % column;
            var nbs = [];
            if (c > 0   && !activeSet[i - 1] && !seen[i - 1]) { nbs.push(i - 1); seen[i - 1] = true; }
            if (c < column - 1 && !activeSet[i + 1] && !seen[i + 1]) { nbs.push(i + 1); seen[i + 1] = true; }
            if (r > 0   && !activeSet[i - column] && !seen[i - column]) { nbs.push(i - column); seen[i - column] = true; }
            if (r < row - 1   && !activeSet[i + column] && !seen[i + column]) { nbs.push(i + column); seen[i + column] = true; }
            for (var k = 0; k < nbs.length; k++) cand.push(nbs[k]);
        }
        return cand;
    };

    // 计算目标最小活跃格数
    var minActive = totalCells - maxHoles;

    // 贪心扩展：随机顺序尝试加入候选格，始终保持连通
    while (true) {
        var curActiveCount = 0;
        for (var i = 0; i < totalCells; i++) if (activeSet[i]) curActiveCount++;
        if (curActiveCount >= minActive) break; // 已达目标

        var candidates = getCandidates();
        if (candidates.length === 0) break; // 没有更多候选

        // 随机打乱候选顺序
        for (var i = candidates.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var tmp = candidates[i]; candidates[i] = candidates[j]; candidates[j] = tmp;
        }

        // 尝试加入每个候选，找第一个保持连通性的
        var added = false;
        for (var i = 0; i < candidates.length; i++) {
            var cell = candidates[i];
            activeSet[cell] = true; // 假设加入
            if (isConnected(activeSet)) {
                added = true;
                // 不 break，继续尝试加入更多格
            } else {
                activeSet[cell] = false; // 拒绝，回退
            }
        }

        if (!added) break; // 无法继续扩展（被边界限制）
    }

    // ---------- 阶段2：收集洞 ----------
    var holes = [];
    for (var i = 0; i < totalCells; i++) {
        if (!activeSet[i]) holes.push(i);
    }

    // ---------- 阶段3：用 isOneStroke 最终验证 ----------
    var verifier = new GridPathFinder(row, column, holes);
    if (!verifier.isOneStroke()) {
        // isOneStroke 失败：尝试随机换洞
        // 将一些洞换为活跃格，同时保持连通
        var tries = 0;
        while (!verifier.isOneStroke() && tries < 20) {
            tries++;
            // 找一个洞，其有至少一个活跃邻居
            var holeSwapCandidates = [];
            for (var hi = 0; hi < holes.length; hi++) {
                var h = holes[hi];
                var hr = Math.floor(h / column), hc = h % column;
                if (hc > 0   && activeSet[h - 1]) holeSwapCandidates.push(h);
                if (hc < column - 1 && activeSet[h + 1]) holeSwapCandidates.push(h);
                if (hr > 0   && activeSet[h - column]) holeSwapCandidates.push(h);
                if (hr < row - 1   && activeSet[h + column]) holeSwapCandidates.push(h);
            }
            if (holeSwapCandidates.length === 0) break;

            // 随机选一个洞加入（替换）
            var toAdd = holeSwapCandidates[Math.floor(Math.random() * holeSwapCandidates.length)];
            activeSet[toAdd] = true;
            holes = [];
            for (var i = 0; i < totalCells; i++) { if (!activeSet[i]) holes.push(i); }
            verifier = new GridPathFinder(row, column, holes);
        }
    }

    // 最终再次验证
    verifier = new GridPathFinder(row, column, holes);
    if (!verifier.isOneStroke()) {
        return []; // 兜底失败（理论上不会发生）
    }

    return holes;
};

// 兼容 CommonJS 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GridPathFinder;
}

// 兼容 ES6 导出
if (typeof exports !== 'undefined' && !exports.default) {
    exports.GridPathFinder = GridPathFinder;
}

// 兼容全局变量
if (typeof window !== 'undefined') {
    window.GridPathFinder = GridPathFinder;
}
