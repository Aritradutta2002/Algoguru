const fs = require('fs');

let content = fs.readFileSync('src/pages/Playground.tsx', 'utf8');

// Swap back from PISTON to WANDBOX.
content = content.replace(/const PISTON_API.*?\"https\:\/\/emkc\.org\/api\/v2\/piston\/execute\"\;/, `const WANDBOX_API = "https://wandbox.org/api/compile.json";`);

const supportedLangsStr = `const SUPPORTED_LANGUAGES = [
  { label: "Java", language: "java", version: "openjdk-jdk-21+35", extension: "java" },
  { label: "Python", language: "python", version: "cpython-3.14.0", extension: "py" },
  { label: "C++", language: "c++", version: "gcc-head", extension: "cpp" },
];`;

content = content.replace(/const SUPPORTED_LANGUAGES = \[[^\]]*?\];/, supportedLangsStr);

// Swap runCode entirely.
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

      const res = await fetch(WANDBOX_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          compiler: selectedLanguage.version,
          code: processedCode,
          stdin: stdin || "",
          "compiler-option-raw": "",
          "runtime-option-raw": "",
          save: false,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        setOutput((prev) => prev + \`⚠ Compile service error (\${res.status}): \${errorText || "Unknown error"}\`);
        return;
      }

      const data = await res.json();
      const parts = [];

      if (data.compiler_error || data.compiler_message) {
        const msg = data.compiler_error || data.compiler_message;
        if (msg.trim()) parts.push(\`[Compiler]\\n\${msg}\`);
      }
      if (data.program_output) {
        parts.push(data.program_output);
      }
      if (data.program_error) {
        parts.push(\`[Runtime Error]\\n\${data.program_error}\`);
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


content = content.replace(/const runCode = useCallback\([\s\S]+?\}, \[code, stdin, selectedLanguage, breakpoints\]\);/, runCodeReplacement);

fs.writeFileSync('src/pages/Playground.tsx', content);
