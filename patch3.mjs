import fs from 'fs';

let content = fs.readFileSync('algoguru/src/pages/Playground.tsx', 'utf8');

// The language prop
content = content.replace(/language="java"\s+theme=\{currentTheme\.id\}/, 'language={selectedLanguage.language === "c++" ? "cpp" : selectedLanguage.language}\n                    theme={currentTheme.id}');

// Update the select button
content = content.replace(/onClick=\{\(\) => \{ setSelectedLanguage\(c\); \}\}/g, 'onClick={() => { setSelectedLanguage(c); setCode(DEFAULT_CODE[c.language] || ""); }}');

// In case there is an instance map, we need to bypass Java auto-complete logic if it's not Java.
// e.g. addAutoImports(sourceCode) is already guarded by `isJava`.
// Let's make sure `handleEditorMount` doesn't register java autocomplete providers if we aren't Java. But honestly, Monaco might register them globally to `java`. That's fine.

fs.writeFileSync('algoguru/src/pages/Playground.tsx', content);
