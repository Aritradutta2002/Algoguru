import fs from 'fs';

let content = fs.readFileSync('algoguru/src/pages/Playground.tsx', 'utf8');

content = content.replace(/c\.compiler/g, "c.language");
content = content.replace(/selectedLanguage\.language === c\.language/g, "selectedLanguage.language === c.language");

fs.writeFileSync('algoguru/src/pages/Playground.tsx', content);
