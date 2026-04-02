const path = require('path');
const baseDir = 'F:/selfjob/freetools';
const data = require(path.join(baseDir, './data/relative-relation.json'));
const fs = require('fs');
const graph = data.relationGraph;

// Get all property keys (columns), exclude gender
const firstNode = Object.values(graph)[0];
const props = Object.keys(firstNode).filter(k => k !== 'gender');

// Header row
const header = ['角色', ...props];
const rows = [header];

// Each node is a row
for (const [role, relations] of Object.entries(graph)) {
  const row = [role];
  for (const prop of props) {
    const val = relations[prop];
    if (val == null) {
      row.push('');
    } else if (Array.isArray(val)) {
      row.push(val.join(','));
    } else {
      row.push(String(val));
    }
  }
  rows.push(row);
}

// Build CSV
const escape = (v) => '"' + String(v).replace(/"/g, '""') + '"';
const csv = rows.map(r => r.map(escape).join(',')).join('\n');

// Write with BOM for Excel UTF-8 compatibility
fs.writeFileSync(path.join(baseDir, './data/relative-relation.csv'), '\ufeff' + csv, 'utf8');
console.log('Done! Rows:', rows.length, 'Cols:', props.length + 1);
