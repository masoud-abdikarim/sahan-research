const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..', 'src');
const axiosPaths = new Set();
function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const stat = fs.statSync(p);
    if (stat.isDirectory()) {
      walk(p);
      continue;
    }
    if (!/\.(ts|tsx)$/.test(name)) continue;
    const text = fs.readFileSync(p, 'utf8');
    const regex = /axios\.(?:get|post|put|delete|patch)\(\s*(["'])(\/api\/[^"]+)\1/g;
    let m;
    while ((m = regex.exec(text))) {
      axiosPaths.add(m[2]);
    }
  }
}
const routePaths = new Set();
function walkRoutes(dir, acc = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const stat = fs.statSync(p);
    if (stat.isDirectory()) {
      walkRoutes(p, acc.concat(name));
      continue;
    }
    if (name === 'route.ts' && acc[0] === 'app' && acc[1] === 'api') {
      routePaths.add('/' + acc.slice(2).join('/'));
    }
  }
}
walk(root);
walkRoutes(root);
console.log('AXIOS PATHS');
[...axiosPaths].sort().forEach(p => console.log(p));
console.log('ROUTE PATHS');
[...routePaths].sort().forEach(p => console.log(p));
console.log('MISSING PATHS');
[...axiosPaths].sort().filter(p => !routePaths.has(p)).forEach(p => console.log(p));
