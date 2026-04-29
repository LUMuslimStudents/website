const fs = require('fs');
const path = require('path');
const dir = path.join(process.cwd(), 'src/pages');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx') && f !== 'Index.tsx');
for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes('<main className="flex-1')) {
    content = content.replace(/<main className="flex-1([^"]*)"/g, (match, p1) => {
      if (!p1.includes('pt-32')) {
        return '<main className="flex-1 pt-32' + p1 + '"';
      }
      return match;
    });
    fs.writeFileSync(filePath, content);
    console.log('Updated ' + file);
  }
}
