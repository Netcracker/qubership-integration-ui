import React, { useEffect } from "react";
import { Editor, Monaco } from "@monaco-editor/react";
import { editor, IRange, languages, Position } from "monaco-editor";
import { Flex } from "antd";
import { useThemeContext } from "../contexts/ThemeContext";

class GroovyCompletionProvider implements languages.CompletionItemProvider {
  constructor() {
    // Do nothing
  }

  public provideCompletionItems(
    model: editor.ITextModel,
    position: Position,
  ): languages.ProviderResult<languages.CompletionList> {
    const word = model.getWordUntilPosition(position);
    const range: IRange = {
      startLineNumber: position.lineNumber,
      endLineNumber: position.lineNumber,
      startColumn: word.startColumn,
      endColumn: word.endColumn,
    };

    const suggestions: languages.CompletionItem[] = [
      {
        label: "exchange",
        kind: languages.CompletionItemKind.Variable,
        insertText: "exchange",
        detail: "Exchange property",
        range,
      },
      {
        label: "getMessage",
        kind: languages.CompletionItemKind.Method,
        insertText: "getMessage()",
        detail: "Get message object",
        range,
      },
      {
        label: "setMessage",
        kind: languages.CompletionItemKind.Method,
        insertText: "setMessage($0)",
        insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
        detail: "Set message object",
        range,
      },
      {
        label: "getProperty",
        kind: languages.CompletionItemKind.Method,
        insertText: "getProperty($0)",
        insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
        detail: "Get message property",
        range,
      },
      {
        label: "setProperty",
        kind: languages.CompletionItemKind.Method,
        insertText: "setProperty($0)",
        insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
        detail: "Set message property",
        range,
      },
      {
        label: "removeProperty",
        kind: languages.CompletionItemKind.Method,
        insertText: "removeProperty($0)",
        insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
        detail: "Remove message property",
        range,
      },
    ];

    return { suggestions: suggestions };
  }
}

const GROOVY_COMPLETION_PROVIDER = new GroovyCompletionProvider();

// Helper function to get CSS variable value and convert to HEX if needed
const getCSSVariable = (variable: string): string => {
  const value = getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  
  // Convert rgba to hex if needed
  if (value.startsWith('rgba(')) {
    const rgbaMatch = value.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
    if (rgbaMatch) {
      const [, r, g, b, a] = rgbaMatch;
      const alpha = parseFloat(a);
      
      // If alpha is 1, return solid hex color
      if (alpha === 1) {
        return `#${parseInt(r).toString(16).padStart(2, '0')}${parseInt(g).toString(16).padStart(2, '0')}${parseInt(b).toString(16).padStart(2, '0')}`;
      }
      
      // For transparent colors, blend with white background
      const blendR = Math.round(parseInt(r) * alpha + 255 * (1 - alpha));
      const blendG = Math.round(parseInt(g) * alpha + 255 * (1 - alpha));
      const blendB = Math.round(parseInt(b) * alpha + 255 * (1 - alpha));
      
      return `#${blendR.toString(16).padStart(2, '0')}${blendG.toString(16).padStart(2, '0')}${blendB.toString(16).padStart(2, '0')}`;
    }
  }
  
  return value;
};

// Helper function to define Monaco themes
const defineMonacoThemes = (monaco: Monaco): void => {
  const themeColors = {
    'editor.background': getCSSVariable('--modal-bg'),
    'editor.foreground': getCSSVariable('--modal-text-color'),
    'editor.lineHighlightBackground': getCSSVariable('--table-row-hover-bg'),
    'editorCursor.foreground': getCSSVariable('--modal-text-color'),
    'editorWhitespace.foreground': getCSSVariable('--table-border-color'),
    'editorLineNumber.foreground': getCSSVariable('--table-header-text-muted-color'),
    'editorLineNumber.activeForeground': getCSSVariable('--modal-text-color'),
    'editorGutter.background': getCSSVariable('--table-header-bg'),
  };

  monaco.editor.defineTheme('qip-light', {
    base: 'vs',
    inherit: true,
    rules: [],
    colors: themeColors,
  });

  monaco.editor.defineTheme('qip-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [],
    colors: themeColors,
  });
};

function configureGroovyLanguage(monaco: Monaco): void {
  const isGroovyLanguageRegistered = monaco.languages
    .getLanguages()
    .some((language) => language.id === "groovy");
  if (isGroovyLanguageRegistered) {
    return;
  }
  monaco.languages.register({ id: "groovy" });
  monaco.languages.setMonarchTokensProvider("groovy", {
    tokenizer: {
      root: [
        // Example of keywords and comments for basic highlighting
        [/(?:def|class|if|else|for|while|return)\b/, "keyword"],
        [/(\/\/.*$)|(\/\*[\s\S]*?\*\/)/, "comment"],
        [/"([^"\\]|\\.)*"/, "string"],
        [/\b\d+(\.\d+)?\b/, "number"],
      ],
    },
  });
  monaco.languages.registerCompletionItemProvider(
    "groovy",
    GROOVY_COMPLETION_PROVIDER,
  );
}

export type ScriptProps = React.HTMLAttributes<HTMLElement> & {
  value: string;
  onChange?: (value: string) => void;
  mode?: "groovy" | "json";
  readOnly?: boolean;
};

export const Script: React.FC<ScriptProps> = ({
  value,
  onChange,
  mode = "groovy",
  readOnly = false,
  ...props
}): React.ReactNode => {
  const { isDarkMode } = useThemeContext();

  const handleEditorDidMount = (_editor: editor.IStandaloneCodeEditor, monaco: Monaco) => {
    configureGroovyLanguage(monaco);
    defineMonacoThemes(monaco);

    // Apply theme based on current mode
    const theme = isDarkMode ? 'qip-dark' : 'qip-light';
    monaco.editor.setTheme(theme);
    (window as { monaco?: Monaco }).monaco = monaco; // Store monaco instance globally
  };

  useEffect(() => {
    // Update theme when isDarkMode changes
    const monaco = (window as { monaco?: Monaco }).monaco;
    if (monaco?.editor) {
      defineMonacoThemes(monaco);
      const theme = isDarkMode ? 'qip-dark' : 'qip-light';
      monaco.editor.setTheme(theme);
    }
  }, [isDarkMode]);

  return (
    <Flex vertical {...props}>
      <Editor
        height="35vh"
        className="qip-editor"
        value={value}
        language={mode}
        onMount={handleEditorDidMount}
        onChange={(value) => {
          if (!readOnly) {
            onChange?.(value ?? "");
          }
        }}
        options={{
          fixedOverflowWidgets: true,
          readOnly: readOnly,
          scrollBeyondLastLine: false,
        }}
      />
    </Flex>
  );
};
