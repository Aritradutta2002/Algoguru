/**
 * Java IntelliSense for the playground.
 * Registers once per Monaco instance (language-global providers).
 * Symbol parsing is a conservative regex subset — not a Java LSP.
 */
import { ALL_SNIPPETS, PRIORITY_LABELS } from "@/data/javaSnippets";
import {
  STATIC_COMPLETIONS_MAP,
  INSTANCE_COMPLETIONS_MAP,
  ALL_INSTANCE_METHODS,
  JAVA_KEYWORDS,
  JAVA_TYPES,
  type JavaMethodCompletion,
} from "@/data/javaAutoComplete";
import { parseJavaSymbols } from "@/lib/playground/javaSymbols";

const registered = new WeakSet<object>();

const FULL_TEMPLATE_PREFIXES = new Set([
  "template",
  "cpfull",
  "codeforces",
  "codeforces-contest",
  "codechef",
  "codechef-contest",
  "leetcode",
  "leetcode-contest",
  "interview",
]);

export type TemplateSource = {
  prefix: string;
  name: string;
  code: string;
  description: string;
};

function kindOf(monaco: any, kind: JavaMethodCompletion["kind"]) {
  if (kind === "field") return monaco.languages.CompletionItemKind.Field;
  if (kind === "constructor") return monaco.languages.CompletionItemKind.Constructor;
  return monaco.languages.CompletionItemKind.Method;
}

function toSuggestion(monaco: any, m: JavaMethodCompletion, range: any, sortText: string) {
  return {
    label: { label: m.label, description: m.detail },
    kind: kindOf(monaco, m.kind),
    insertText: m.insertText,
    insertTextRules: m.insertText.includes("$")
      ? monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
      : undefined,
    detail: m.detail,
    documentation: { value: m.documentation },
    sortText,
    range,
  };
}

function resolveVariableType(fullText: string, varName: string): string | null {
  const typePatterns = [
    new RegExp(`(\\w+(?:<[^>]*>)?)\\s+${varName}\\s*[=;,)]`),
    new RegExp(`(\\w+(?:<[^>]*>)?)\\s+${varName}\\s*$`, "m"),
    new RegExp(`(\\w+(?:<[^>]*>)?)\\[\\]\\s+${varName}\\s*[=;,)]`),
    new RegExp(`for\\s*\\([^)]*?(\\w+(?:<[^>]*>)?)\\s+${varName}\\s*[;:]`),
  ];
  for (const pattern of typePatterns) {
    const match = fullText.match(pattern);
    if (match) return match[1].replace(/<.*>/, "");
  }
  return null;
}

function paramsFromDetail(detail: string): string[] {
  const inner = detail.match(/\((.*)\)/)?.[1]?.trim();
  if (!inner) return [];
  return inner.split(",").map((p) => p.trim()).filter(Boolean);
}

function lookupSignatures(className: string, methodName: string): JavaMethodCompletion[] {
  const pool = [
    ...(STATIC_COMPLETIONS_MAP.get(className) || []),
    ...(INSTANCE_COMPLETIONS_MAP.get(className) || []),
  ];
  const exact = pool.filter((m) => m.label === methodName && m.kind === "method");
  if (exact.length) return exact;
  return ALL_INSTANCE_METHODS.filter((m) => m.label === methodName && m.kind === "method").slice(0, 4);
}

export function registerPlaygroundJavaLanguage(
  monaco: any,
  getTemplates: () => TemplateSource[],
) {
  if (!monaco || registered.has(monaco)) return;
  registered.add(monaco);

  monaco.languages.registerCompletionItemProvider("java", {
    triggerCharacters: ["."],
    provideCompletionItems: (model: any, position: any) => {
      const textUntilPosition = model.getValueInRange({
        startLineNumber: position.lineNumber,
        startColumn: 1,
        endLineNumber: position.lineNumber,
        endColumn: position.column,
      });

      const dotMatch = textUntilPosition.match(/(\w+)\.\s*(\w*)$/);
      if (!dotMatch) return { suggestions: [] };

      const className = dotMatch[1];
      const partial = dotMatch[2] || "";
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: position.column - partial.length,
        endColumn: position.column,
      };

      const suggestions: any[] = [];
      const seen = new Set<string>();
      const push = (m: JavaMethodCompletion, rank: string) => {
        const key = `${m.label}:${m.detail}`;
        if (seen.has(key)) return;
        seen.add(key);
        suggestions.push(toSuggestion(monaco, m, range, rank));
      };

      const staticMethods = STATIC_COMPLETIONS_MAP.get(className);
      if (staticMethods) for (const m of staticMethods) push(m, `0_${m.label}`);

      const instanceMethods = INSTANCE_COMPLETIONS_MAP.get(className);
      if (instanceMethods) for (const m of instanceMethods) push(m, `0_${m.label}`);

      if (suggestions.length === 0) {
        const resolvedType = resolveVariableType(model.getValue(), className);
        if (resolvedType) {
          const typeMethods = INSTANCE_COMPLETIONS_MAP.get(resolvedType);
          if (typeMethods) for (const m of typeMethods) push(m, `0_${m.label}`);
        }
      }

      if (
        suggestions.length === 0 &&
        className[0] === className[0].toLowerCase()
      ) {
        for (const m of ALL_INSTANCE_METHODS) push(m, `1_${m.label}`);
      }

      return { suggestions };
    },
  });

  monaco.languages.registerCompletionItemProvider("java", {
    provideCompletionItems: (model: any, position: any) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      const textUntilPosition = model.getValueInRange({
        startLineNumber: position.lineNumber,
        startColumn: 1,
        endLineNumber: position.lineNumber,
        endColumn: position.column,
      });
      if (textUntilPosition.match(/\w+\.\s*\w*$/)) {
        return { suggestions: [] };
      }

      const suggestions: any[] = [];

      for (const s of ALL_SNIPPETS) {
        suggestions.push({
          label: s.label,
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: s.insertText,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: s.detail,
          documentation: { value: s.documentation },
          filterText: `${s.label} ${s.detail}`,
          sortText: `${PRIORITY_LABELS.has(s.label) ? "0" : "1"}_${s.label.toLowerCase()}`,
          range,
        });
      }

      for (const kw of JAVA_KEYWORDS) {
        suggestions.push({
          label: kw,
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: kw,
          detail: "keyword",
          sortText: `2_${kw}`,
          range,
        });
      }

      for (const t of JAVA_TYPES) {
        suggestions.push({
          label: t,
          kind: monaco.languages.CompletionItemKind.Class,
          insertText: t,
          detail: "type",
          sortText: `3_${t}`,
          range,
        });
      }

      return { suggestions };
    },
  });

  monaco.languages.registerCompletionItemProvider("java", {
    provideCompletionItems: (model: any, position: any) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      const textUntilPosition = model.getValueInRange({
        startLineNumber: position.lineNumber,
        startColumn: 1,
        endLineNumber: position.lineNumber,
        endColumn: position.column,
      });
      if (textUntilPosition.match(/\w+\.\s*\w*$/)) {
        return { suggestions: [] };
      }

      const suggestions: any[] = [];
      for (const t of getTemplates()) {
        const isFullTemplate = FULL_TEMPLATE_PREFIXES.has(t.prefix);
        suggestions.push({
          label: t.prefix,
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: t.code,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.None,
          detail: `Template: ${t.name}`,
          documentation: { value: t.description },
          filterText: `${t.prefix} ${t.name}`,
          sortText: `0_${t.prefix}`,
          range: isFullTemplate
            ? {
                startLineNumber: 1,
                endLineNumber: model.getLineCount(),
                startColumn: 1,
                endColumn: model.getLineMaxColumn(model.getLineCount()),
              }
            : range,
        });
      }
      return { suggestions };
    },
  });

  monaco.languages.registerCompletionItemProvider("java", {
    provideCompletionItems: (model: any, position: any) => {
      const textUntilPosition = model.getValueInRange({
        startLineNumber: position.lineNumber,
        startColumn: 1,
        endLineNumber: position.lineNumber,
        endColumn: position.column,
      });
      if (textUntilPosition.match(/\w+\.\s*\w*$/)) return { suggestions: [] };

      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      const symbols = parseJavaSymbols(model.getValue());
      const seen = new Set<string>();
      const suggestions: any[] = [];

      for (const info of symbols) {
        if (seen.has(info.name)) continue;
        seen.add(info.name);

        let kind = monaco.languages.CompletionItemKind.Variable;
        let icon = info.kind;
        if (info.kind === "method") kind = monaco.languages.CompletionItemKind.Method;
        else if (info.kind === "class" || info.kind === "interface" || info.kind === "enum") {
          kind = monaco.languages.CompletionItemKind.Class;
        } else if (info.kind === "constant") {
          kind = monaco.languages.CompletionItemKind.Constant;
        } else if (info.kind === "parameter") {
          kind = monaco.languages.CompletionItemKind.Variable;
          icon = "param";
        }

        suggestions.push({
          label: info.name,
          kind,
          insertText: info.name,
          detail: `${icon}${info.detail ? ` · ${info.detail}` : ""} (line ${info.line})`,
          sortText: `0_${info.name.toLowerCase()}`,
          range,
        });
      }

      return { suggestions };
    },
  });

  monaco.languages.registerSignatureHelpProvider("java", {
    signatureHelpTriggerCharacters: ["(", ","],
    signatureHelpRetriggerCharacters: [","],
    provideSignatureHelp: (model: any, position: any) => {
      const textUntilPosition = model.getValueInRange({
        startLineNumber: Math.max(1, position.lineNumber - 2),
        startColumn: 1,
        endLineNumber: position.lineNumber,
        endColumn: position.column,
      });
      const call = textUntilPosition.match(/(\w+)\s*\.\s*(\w+)\s*\(([^()]*)$/);
      if (!call) return { value: { signatures: [], activeSignature: 0, activeParameter: 0 }, dispose() {} };

      const overloads = lookupSignatures(call[1], call[2]);
      if (!overloads.length) {
        return { value: { signatures: [], activeSignature: 0, activeParameter: 0 }, dispose() {} };
      }

      const activeParameter = call[3] ? call[3].split(",").length - 1 : 0;
      return {
        value: {
          signatures: overloads.map((m) => ({
            label: m.detail,
            documentation: { value: m.documentation },
            parameters: paramsFromDetail(m.detail).map((p) => ({ label: p })),
          })),
          activeSignature: 0,
          activeParameter: Math.max(0, activeParameter),
        },
        dispose() {},
      };
    },
  });

  monaco.languages.registerDefinitionProvider("java", {
    provideDefinition: (model: any, position: any) => {
      const word = model.getWordAtPosition(position);
      if (!word?.word) return [];
      const symbols = parseJavaSymbols(model.getValue());
      const match = symbols.find((s) => s.name === word.word);
      if (!match) return [];
      return [
        {
          uri: model.uri,
          range: new monaco.Range(match.line, match.column, match.line, match.column + match.name.length),
        },
      ];
    },
  });
}
