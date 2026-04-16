const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

const OUT_DIR = 'F:/selfjob/freetools/images/tabbar';
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

function crc32(buf) {
  let c = 0xffffffff;
  const table = new Int32Array(256);
  for (let i = 0; i < 256; i++) {
    let c2 = i;
    for (let j = 0; j < 8; j++) c2 = (c2 & 1) ? (0xedb88320 ^ (c2 >>> 1)) : (c2 >>> 1);
    table[i] = c2;
  }
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function createPNG(width, height, drawFn) {
  const canvas = Buffer.alloc(4 * width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      drawFn(canvas, x, y, width, height);
    }
  }

  function chunk(type, data) {
    const typeB = Buffer.from(type, 'ascii');
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const combined = Buffer.concat([typeB, data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(combined));
    return Buffer.concat([len, combined, crc]);
  }

  const sig = Buffer.from([137,80,78,71,13,10,26,10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  const rawData = Buffer.alloc(height * (1 + 4 * width));
  for (let y = 0; y < height; y++) {
    rawData[y * (1 + 4 * width)] = 0;
    canvas.copy(rawData, y * (1 + 4 * width) + 1, y * 4 * width, y * 4 * width + 4 * width);
  }

  const compressed = zlib.deflateSync(rawData, { level: 9 });
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', compressed), chunk('IEND', Buffer.alloc(0))]);
}

function hexRgb(h) {
  return [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)];
}

function px(buf, x, y, w, r, g, b, a) {
  const i = (y * w + x) * 4;
  buf[i]=r; buf[i+1]=g; buf[i+2]=b; buf[i+3]=a;
}

function blend(r1, g1, b1, a1, r2, g2, b2, a2) {
  const a = a1 + a2 * (1 - a1 / 255);
  if (a === 0) return [0,0,0,0];
  const r = Math.round((r1 * a1 + r2 * a2 * (1 - a1 / 255)) / a);
  const g = Math.round((g1 * a1 + g2 * a2 * (1 - a1 / 255)) / a);
  const b = Math.round((b1 * a1 + b2 * a2 * (1 - a1 / 255)) / a);
  return [r, g, b, Math.round(a)];
}

function fillRect(buf, x1, y1, x2, y2, w, r, g, b, a) {
  for (let y = Math.max(0, y1); y < Math.min(y2, buf.length / (4 * w)); y++) {
    for (let x = Math.max(0, x1); x < Math.min(x2, w); x++) {
      const i = (y * w + x) * 4;
      const [nr, ng, nb, na] = blend(buf[i], buf[i+1], buf[i+2], buf[i+3], r, g, b, a);
      px(buf, x, y, w, nr, ng, nb, na);
    }
  }
}

function fillCircle(buf, cx, cy, cr, w, r, g, b, a) {
  for (let y = Math.max(0, Math.floor(cy - cr)); y < Math.min(buf.length / (4 * w), Math.ceil(cy + cr + 1)); y++) {
    for (let x = Math.max(0, Math.floor(cx - cr)); x < Math.min(w, Math.ceil(cx + cr + 1)); x++) {
      const dx = x - cx, dy = y - cy;
      if (dx * dx + dy * dy <= cr * cr) {
        const i = (y * w + x) * 4;
        const [nr, ng, nb, na] = blend(buf[i], buf[i+1], buf[i+2], buf[i+3], r, g, b, a);
        px(buf, x, y, w, nr, ng, nb, na);
      }
    }
  }
}

function strokeCircle(buf, cx, cy, cr, thickness, w, r, g, b, a) {
  const outer = cr + thickness / 2;
  const inner = cr - thickness / 2;
  for (let y = Math.max(0, Math.floor(cy - outer)); y < Math.min(buf.length / (4 * w), Math.ceil(cy + outer + 1)); y++) {
    for (let x = Math.max(0, Math.floor(cx - outer)); x < Math.min(w, Math.ceil(cx + outer + 1)); x++) {
      const dx = x - cx, dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= outer && dist >= inner) {
        const i = (y * w + x) * 4;
        const [nr, ng, nb, na] = blend(buf[i], buf[i+1], buf[i+2], buf[i+3], r, g, b, a);
        px(buf, x, y, w, nr, ng, nb, na);
      }
    }
  }
}

function fillRoundedRect(buf, x1, y1, x2, y2, radius, w, r, g, b, a) {
  const rad = Math.min(radius, (x2 - x1) / 2, (y2 - y1) / 2);
  for (let y = y1; y < y2; y++) {
    for (let x = x1; x < x2; x++) {
      let inRect = true;
      // Check corners
      if (x < x1 + rad && y < y1 + rad) {
        const dx = x - (x1 + rad);
        const dy = y - (y1 + rad);
        inRect = dx * dx + dy * dy <= rad * rad;
      } else if (x >= x2 - rad && y < y1 + rad) {
        const dx = x - (x2 - rad - 1);
        const dy = y - (y1 + rad);
        inRect = dx * dx + dy * dy <= rad * rad;
      } else if (x < x1 + rad && y >= y2 - rad) {
        const dx = x - (x1 + rad);
        const dy = y - (y2 - rad - 1);
        inRect = dx * dx + dy * dy <= rad * rad;
      } else if (x >= x2 - rad && y >= y2 - rad) {
        const dx = x - (x2 - rad - 1);
        const dy = y - (y2 - rad - 1);
        inRect = dx * dx + dy * dy <= rad * rad;
      }
      if (inRect) {
        const i = (y * w + x) * 4;
        const [nr, ng, nb, na] = blend(buf[i], buf[i+1], buf[i+2], buf[i+3], r, g, b, a);
        px(buf, x, y, w, nr, ng, nb, na);
      }
    }
  }
}

function drawLine(buf, x1, y1, x2, y2, thickness, w, r, g, b, a) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return;
  const nx = -dy / len, ny = dx / len;
  const th = thickness / 2;
  for (let t = 0; t <= len; t += 0.5) {
    const cx = x1 + (dx / len) * t;
    const cy = y1 + (dy / len) * t;
    for (let d = -th; d <= th; d += 0.5) {
      const px1 = Math.round(cx + nx * d);
      const py1 = Math.round(cy + ny * d);
      if (px1 >= 0 && px1 < w && py1 >= 0 && py1 < buf.length / (4 * w)) {
        const i = (py1 * w + px1) * 4;
        const [nr, ng, nb, na] = blend(buf[i], buf[i+1], buf[i+2], buf[i+3], r, g, b, a);
        px(buf, px1, py1, w, nr, ng, nb, na);
      }
    }
  }
}

// 首页图标
function drawHome(buf, w, h, color) {
  const [r, g, b] = hexRgb(color);
  const alpha = 255 * 0.85;
  
  // 房子主体
  fillRoundedRect(buf, w/8, h/2.2, w*0.875, h*0.89, 4, w, r, g, b, alpha);
  
  // 屋顶三角形
  const pts = [[w/2, h/14], [w/8, h/2.2], [w*0.875, h/2.2]];
  const minY = Math.min(...pts.map(p => p[1]));
  for (let y = minY; y < h/2.2; y++) {
    const t = (y - minY) / (h/2.2 - minY);
    const leftX = w/2 - (w/2 - w/8) * t;
    const rightX = w/2 + (w*0.875 - w/2) * t;
    for (let x = Math.floor(leftX); x <= Math.ceil(rightX); x++) {
      if (x >= 0 && x < w) {
        const i = (y * w + x) * 4;
        const [nr, ng, nb, na] = blend(buf[i], buf[i+1], buf[i+2], buf[i+3], r, g, b, alpha);
        px(buf, x, y, w, nr, ng, nb, na);
      }
    }
  }
  
  // 窗户
  fillRoundedRect(buf, w/4, h/3.2, w/4 + w/5, h/3.2 + h/6.4, 3, w, 255, 255, 255, 255 * 0.6);
  fillRoundedRect(buf, w*0.56, h/3.2, w*0.56 + w/5, h/3.2 + h/6.4, 3, w, 255, 255, 255, 255 * 0.6);
  
  // 门
  fillRoundedRect(buf, w*0.42, h*0.61, w*0.58, h*0.89, 3, w, 255, 255, 255, 255 * 0.4);
}

// 日志图标
function drawLog(buf, w, h, color) {
  const [r, g, b] = hexRgb(color);
  const alpha = 255 * 0.85;
  
  // 文档背景
  fillRoundedRect(buf, w/6, h/16, w*5/6, h-h/16, 8, w, r, g, b, alpha);
  
  // 内部白色
  fillRoundedRect(buf, w/4.5, h/4.5, w-w/4.5, h-h/4.5, 4, w, 255, 255, 255, 255);
  
  // 文字行
  const lines = [
    [0.3, 0.35],
    [0.45, 0.48],
    [0.38, 0.6],
    [0.42, 0.72],
    [0.35, 0.84],
  ];
  lines.forEach(([len, yOff]) => {
    fillRoundedRect(buf, w/4, h * yOff, w/4 + w * len, h * yOff + h/21, 2, w, r, g, b, 255 * 0.3);
  });
  
  // 勾选
  fillCircle(buf, w * 0.75, h * 0.3, w/8, w, 46, 213, 115, 255);
  drawLine(buf, w*0.68, w*0.3, w*0.73, w*0.35, 3, w, 255, 255, 255, 255);
  drawLine(buf, w*0.73, w*0.35, w*0.82, w*0.25, 3, w, 255, 255, 255, 255);
}

// 关于图标
function drawAbout(buf, w, h, color) {
  const [r, g, b] = hexRgb(color);
  
  // 外圈
  strokeCircle(buf, w/2, h/2, w*0.42, w/12, w, r, g, b, 255 * 0.6);
  
  // 圆点
  fillCircle(buf, w/2, h/3.2, w/21, w, r, g, b, 255);
  
  // 竖条
  fillRoundedRect(buf, w/2 - w/20, h/2, w/2 + w/20, h/2 + h/3.2, w/20/2, w, r, g, b, 255);
}

const icons = [
  ['home-normal.png', (buf, w, h) => drawHome(buf, w, h, '#7f8c8d')],
  ['home-active.png', (buf, w, h) => drawHome(buf, w, h, '#2980b9')],
  ['log-normal.png', (buf, w, h) => drawLog(buf, w, h, '#7f8c8d')],
  ['log-active.png', (buf, w, h) => drawLog(buf, w, h, '#2980b9')],
  ['about-normal.png', (buf, w, h) => drawAbout(buf, w, h, '#7f8c8d')],
  ['about-active.png', (buf, w, h) => drawAbout(buf, w, h, '#2980b9')],
];

const size = 128;
icons.forEach(([name, draw]) => {
  const png = createPNG(size, size, (buf, x, y, w, h) => {
    if (x === 0 && y === 0) draw(buf, w, h);
  });
  fs.writeFileSync(path.join(OUT_DIR, name), png);
  console.debug(`✅ ${name}`);
});

console.debug('\n全部生成完成！');
