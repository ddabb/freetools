/**
 * 上标字符映射表
 * 支持：数字、拉丁字母、运算符、IPA修饰符
 * 暂不支持：希腊字母（Unicode无标准上标码位）、中文
 */

const SUPER_DIGITS = {
  '0': '\u2070', '1': '\u00B9', '2': '\u00B2', '3': '\u00B3', '4': '\u2074',
  '5': '\u2075', '6': '\u2076', '7': '\u2077', '8': '\u2078', '9': '\u2079',
  '+': '\u207A', '-': '\u207B', '=': '\u207C', '(': '\u207D', ')': '\u207E'
};

const SUPER_LETTERS = {
  'A': '\u1D2C', 'B': '\u1D2E', 'C': '\u1D9C', 'D': '\u1D30', 'E': '\u1D31', 'F': '\u1D9E',
  'G': '\u1D33', 'H': '\u1D34', 'I': '\u1D35', 'J': '\u1D36', 'K': '\u1D37', 'L': '\u1D3B',
  'M': '\u1D39', 'N': '\u1D3A', 'O': '\u1D3C', 'P': '\u1D3E', 'Q': '\u1D2B', 'R': '\u1D3F',
  'S': '\u02E2', 'T': '\u1D3B', 'U': '\u1D38', 'V': '\u1D3D', 'W': '\u1D42', 'X': '\u02E3',
  'Y': '\u02B8', 'Z': '\u1DBB',
  'a': '\u1D43', 'b': '\u1D47', 'c': '\u1D9C', 'd': '\u1D48', 'e': '\u1D49', 'f': '\u1DA0',
  'g': '\u1D4D', 'h': '\u02B0', 'i': '\u2071', 'j': '\u02B2', 'k': '\u1D4F', 'l': '\u02E1',
  'm': '\u1D50', 'n': '\u207F', 'o': '\u1D52', 'p': '\u1D56', 'q': '\u1D2B', 'r': '\u02B3',
  's': '\u02E2', 't': '\u1D57', 'u': '\u1D58', 'v': '\u1D5B', 'w': '\u02B7', 'x': '\u02E3',
  'y': '\u02B8', 'z': '\u1DBB'
};

// IPA modifier letters (U+02B0-02FF) - 视觉近似上标的修饰符
const SUPER_MODIFIERS = {
  '\u02B1': '\u02B1',  // ʱ murmured
  '\u02B4': '\u02B4',  // ʴ raised r nasal
  '\u02B5': '\u02B5',  // ʵ raised r nasal lab
  '\u02B6': '\u02B6',  // ʶ raised r lab
  '\u02E1': '\u02E1',  // ˡ lateral
  '\u02E2': '\u02E2',  // ˢ sibilant
  '\u02E3': '\u02E3',  // ˣ velar/labial
  '\u02E4': '\u02E4',  // ˤ pharyngeal
  '\u02E5': '\u02E5',  // ˥ extra high tone
  '\u02E6': '\u02E6',  // ˦ high tone
  '\u02E7': '\u02E7',  // ˧ mid tone
  '\u02E8': '\u02E8',  // ˨ low tone
  '\u02E9': '\u02E9',  // ˩ extra low tone
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

// Small letter modifiers (U+1D4B-1D7F)
const SUPER_SMALL = {
  '\u1D4B': '\u1D4B',  // ᵋ epsilon
  '\u1D4C': '\u1D4C',  // ᵌ open e
  '\u1D4D': '\u1D4D',  // ᵍ g
  '\u1D4E': '\u1D4E',  // ᵎ i raised
  '\u1D4F': '\u1D4F',  // ᵏ k
  '\u1D56': '\u1D56',  // ᵖ p
  '\u1D57': '\u1D57',  // ᵗ t
  '\u1D58': '\u1D58',  // ᵘ u
  '\u1D59': '\u1D59',  // ᵙ u raised
  '\u1D5A': '\u1D5A',  // ᵚ turned m
  '\u1D5B': '\u1D5B',  // ᵛ v
  '\u1D77': '\u1D77',  // ᵷ turned g
  '\u1D78': '\u1D78',  // ᵸ h bar
  '\u1D9C': '\u1D9C',  // ᶜ c modifier
  '\u1D9E': '\u1D9E',  // ᶞ r fish-hook
  '\u1D9F': '\u1D9F',  // ᶟ z crossed-tail
  '\u1DAB': '\u1DAB',  // ᶫ l mid
  '\u1DBA': '\u1DBA',  // ᶺ r turned
  '\u1DBB': '\u1DBB',  // ᶻ z modifier
  '\u1DBF': '\u1DBF',  // ᶿ theta modifier
};

// 合并映射表
const SUPERSCRIPT_MAP = {
  ...SUPER_DIGITS,
  ...SUPER_LETTERS,
  ...SUPER_MODIFIERS,
  ...SUPER_SMALL
};

/**
 * 将字符串转换为上标形式
 * @param {string} str - 原始字符串
 * @returns {string} 上标字符串
 */
function toSuperscript(str) {
  return String(str).split('').map(char => SUPERSCRIPT_MAP[char] || char).join('');
}

module.exports = {
  SUPER_DIGITS,
  SUPER_LETTERS,
  SUPER_MODIFIERS,
  SUPER_SMALL,
  SUPERSCRIPT_MAP,
  toSuperscript
};
