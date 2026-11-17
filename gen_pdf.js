const fs = require('fs');
const { marked } = require('marked');

const md = fs.readFileSync('d:\\blockchain\\viva-notes.md', 'utf-8');
const html = marked(md);

const fullHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Viva Preparation Notes - VoteChain DApp</title>
<style>
  @media print { body { padding: 10px; } pre { page-break-inside: avoid; } h2, h3 { page-break-after: avoid; } }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; line-height: 1.65; padding: 30px 40px; max-width: 850px; margin: 0 auto; color: #1a1a1a; }
  h1 { font-size: 24px; border-bottom: 3px solid #7c3aed; padding-bottom: 10px; color: #7c3aed; margin-bottom: 20px; }
  h2 { font-size: 17px; margin-top: 32px; color: #1a1a1a; border-bottom: 2px solid #7c3aed; padding-bottom: 6px; }
  h3 { font-size: 14px; color: #444; margin-top: 22px; }
  h4 { font-size: 13px; color: #7c3aed; margin-top: 16px; }
  p { margin: 8px 0; }
  code { background: #f0ebff; padding: 1px 5px; border-radius: 3px; font-family: Consolas, monospace; font-size: 11px; color: #5b21b6; }
  pre { background: #1e1e2e; color: #cdd6f4; padding: 14px 16px; border-radius: 8px; overflow-x: auto; font-size: 11px; line-height: 1.5; margin: 10px 0; }
  pre code { background: none; color: inherit; padding: 0; font-size: 11px; }
  table { border-collapse: collapse; width: 100%; margin: 10px 0; font-size: 11px; }
  th { background: #7c3aed; color: white; padding: 7px 10px; text-align: left; font-weight: 600; }
  td { padding: 7px 10px; border: 1px solid #e0e0e0; }
  tr:nth-child(even) { background: #faf8ff; }
  strong { color: #222; }
  hr { border: none; border-top: 1px solid #e0e0e0; margin: 24px 0; }
  ul, ol { padding-left: 22px; }
  li { margin-bottom: 3px; }
  a { color: #7c3aed; text-decoration: none; }
  blockquote { border-left: 4px solid #7c3aed; padding: 8px 16px; margin: 12px 0; background: #faf8ff; }
</style>
</head>
<body>
${html}
</body>
</html>`;

fs.writeFileSync('d:\\blockchain\\Viva_Preparation_Notes.html', fullHtml);
console.log('Done! HTML file created.');
