/**
 * 下标字符映射表
 * 支持：数字、部分拉丁字母、运算符、IPA修饰符
 * 暂不支持：希腊字母（Unicode无标准下标码位）、中文
 */

const SUB_DIGITS = {
  '0': '\u2080', '1': '\u2081', '2': '\u2082', '3': '\u2083', '4': '\u2084',
  '5': '\u2085', '6': '\u2086', '7': '\u2087', '8': '\u2088', '9': '\u2089',
  '+': '\u208A', '-': '\u208B', '=': '\u208C', '(': '\u208D', ')': '\u208E'
};

const SUB_LETTERS = {
  'a': '\u2090', 'e': '\u2091', 'h': '\u2095', 'i': '\u1D62', 'j': '\u2C7C',
  'k': '\u2096', 'l': '\u2097', 'm': '\u2098', 'n': '\u2099', 'o': '\u2092',
  'p': '\u209A', 'r': '\u1D63', 's': '\u209B', 't': '\u209C', 'u': '\u1D64',
  'v': '\u1D65', 'x': '\u2093',
  'A': '\u2090', 'E': '\u2091', 'H': '\u2095', 'I': '\u1D62', 'J': '\u2C7C',
  'K': '\u2096', 'L': '\u2097', 'M': '\u2098', 'N': '\u2099', 'O': '\u2092',
  'P': '\u209A', 'R': '\u1D63', 'S': '\u209B', 'T': '\u209C', 'U': '\u1D64',
  'V': '\u1D65', 'X': '\u2093'
};

// IPA modifier letters 也可做下标视觉效果
const SUB_MODIFIERS = {
  '\u02B1': '\u02B1',  // ʱ murmured
  '\u02B4': '\u02B4',  // ʴ raised r
  '\u02B5': '\u02B5',  // ʵ raised r nasal
  '\u02B6': '\u02B6',  // ʶ raised r lab
  '\u02E1': '\u02E1',  // ˡ lateral
  '\u02E2': '\u02E2',  // ˢ sibilant
  '\u02E3': '\u02E3',  // ˣ velar
  '\u02E4': '\u02E4',  // ˤ pharyngeal
  '\u02EC': '\u02EC',  // ˬ voicing
  '\u02ED': '\u02ED',  // ˭ unrounded
  '\u02EE': '\u02EE',  // ˮ devoiced
  '\u02F0': '\u02F0',  // ˰ aspiration
  '\u02F3': '\u02F3',  // ˳ mid long
  '\u02F4': '\u02F4',  // ˴ lowered
  '\u02F5': '\u02F5',  // ˵ lowered nasal
  '\u02F6': '\u02F6',  // ˶ lowered raised
  '\u02F7': '\u02F7',  // ˷ strongly lowered
  '\u02FA': '\u02FA',  // ˺ closed
  '\u02fb': '\u02fb',  // ˻ more open
  '\u02fc': '\u02fc',  // ˼ looped
  '\u02fd': '\u02fd',  // ˽ half length
  '\u02fe': '\u02fe',  // ˾ stroked
  '\u02ff': '\u02ff',  // ˿ high rising
};

// 合并映射表
const SUBSCRIPT_MAP = {
  ...SUB_DIGITS,
  ...SUB_LETTERS,
  ...SUB_MODIFIERS
};

/**
 * 将字符串转换为下标形式
 * @param {string} str - 原始字符串
 * @returns {string} 下标字符串
 */
function toSubscript(str) {
  return String(str).split('').map(char => SUBSCRIPT_MAP[char] || char).join('');
}

module.exports = {
  SUB_DIGITS,
  SUB_LETTERS,
  SUB_MODIFIERS,
  SUBSCRIPT_MAP,
  toSubscript
};