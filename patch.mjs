import fs from 'fs';

let content = fs.readFileSync('algoguru/src/pages/Playground.tsx', 'utf8');

const runCodeReplacement = `const runCode = useCallback(async (debugRun = false) => {
    setIsRunning(true);
    setOutput("");
    try {
      let sourceCode = code;
      const isJava = selectedLanguage.language === "java";
      
      // If debug mode, instrument the code with print statements at breakpoints
      if (debugRun && breakpoints.size > 0 && isJava) {
        sourceCode = instrumentCodeForDebug(sourceCode, breakpoints);
        setOutput("🔍 Debug mode: Instrumented " + breakpoints.size + " breakpoint(s)...\\n\\n");
      }

      let processedCode = sourceCode;
      if (isJava) {
        processedCode = addAutoImports(sourceCode).replace(/public\\s+class\\s+/g, "class ");
      }

      const res = await fetch(PISTON_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: selectedLanguage.language,
          version: selectedLanguage.version,
          files: [{ name: "main." + selectedLanguage.extension, content: processedCode }],
          stdin: stdin || ""
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        setOutput((prev) => prev + \`⚠ Compile service error (\${res.status}): \${errorText || "Unknown error"}\`);
        return;
      }

      const data = await res.json();
      const parts = [];

      if (data.compile && data.compile.output) {
        parts.push(\`⚠ Compilation Error:\\n\${data.compile.output}\`);
      }
      if (data.run && data.run.stderr) {
        parts.push(\`⚠ Runtime Error:\\n\${data.run.stderr}\`);
      }
      if (data.run && data.run.output && !data.run.stderr) {
        parts.push(data.run.output);
      }

      const result = parts.join("\\n") || "✓ Program executed successfully (no output)";
      if (debugRun && breakpoints.size > 0) {
        setOutput((prev) => prev + result);
      } else {
        setOutput(result);
      }
    } catch (err) {
      setOutput((prev) => prev + \`⚠ Could not connect to compiler.\\n\${err instanceof Error ? err.message : "Unknown error"}\`);
    } finally {
      setIsRunning(false);
    }
  }, [code, stdin, selectedLanguage, breakpoints]);`;

content = content.replace(/const runCode = useCallback\([\s\S]+?\}, \[code, stdin, selectedCompiler, breakpoints\]\);/, runCodeReplacement);

// Let's also fix UI
content = content.replace(/selectedCompiler\.compiler/g, "selectedLanguage.language");
content = content.replace(/selectedCompiler\.label/g, "selectedLanguage.label");
content = content.replace(/availableCompilers/g, "availableLanguages");
content = content.replace(/selectedCompiler/g, "selectedLanguage");
content = content.replace(/setSelectedCompiler/g, "setSelectedLanguage");

fs.writeFileSync('algoguru/src/pages/Playground.tsx', content);
