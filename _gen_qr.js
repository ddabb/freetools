const ci = require('C:/Users/60138546/AppData/Roaming/npm/node_modules/miniprogram-ci');
const fs = require('fs');

const project = new ci.Project({
  appid: 'wxbe3bb18e2b2532d4',
  type: 'miniProgram',
  projectPath: 'F:/SelfJob/freetools',
  privateKeyPath: 'F:/SelfJob/freetools/private.wxbe3bb18e2b2532d4.key',
  ignores: ['node_modules/**/*', 'docs/**/*', 'data/**/*', '*.md', '.codebuddy/**/*']
});

ci.preview({
  project,
  version: '20260417.01',
  desc: 'P0-2 WXS过滤改造测试',
  setting: {
    es6: true,
    minify: false,
    minifyWXSS: false,
    minifyWXML: false,
    compileWorklet: false,
    disableSWC: true
  },
  qrcodeFormat: 'base64',
  qrcodeOutputDest: 'F:/SelfJob/freetools/preview-qr.txt'  // base64 保存为文本文件
}).then(ret => {
  console.log('SUCCESS');
  const txt = 'F:/SelfJob/freetools/preview-qr.txt';
  if (fs.existsSync(txt)) {
    const content = fs.readFileSync(txt, 'utf8');
    // 格式: data:image/jpeg;base64,xxxxx
    const base64 = content.replace(/^data:image\/\w+;base64,/, '');
    const buf = Buffer.from(base64, 'base64');
    fs.writeFileSync('F:/SelfJob/freetools/preview-qr.png', buf);
    console.log('QR saved as PNG, size:', buf.length, 'bytes');
  } else {
    console.log('File not found:', txt);
  }
}).catch(err => {
  console.error('ERROR:', err.message);
  if (err.response) {
    const d = err.response.data;
    console.error('errCode:', d && d.errCode, 'errMsg:', d && d.errMsg);
  }
  process.exit(1);
});
