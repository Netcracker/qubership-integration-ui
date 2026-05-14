import {
  editor,
  IMarkdownString,
  IRange,
  languages,
  Position,
} from "monaco-editor";

export type PartialCompletionItem = Omit<languages.CompletionItem, "range">;

export function getRangeForWord(
  position: Position,
  word: editor.IWordAtPosition,
): IRange {
  return {
    startLineNumber: position.lineNumber,
    endLineNumber: position.lineNumber,
    startColumn: word.startColumn,
    endColumn: word.endColumn,
  };
}

// Statement-start / dot-chain detection only needs a short window before the
// cursor; reading the whole document on every keystroke is wasteful for big
// scripts.
export const DEFAULT_TEXT_BEFORE_LIMIT = 8192;

export function getTextBeforePosition(
  model: editor.ITextModel,
  position: Position,
  limit: number = DEFAULT_TEXT_BEFORE_LIMIT,
): string {
  const endOffset = model.getOffsetAt(position);
  const startOffset = Math.max(0, endOffset - limit);
  if (startOffset === 0) {
    return model.getValue().substring(0, endOffset);
  }
  const startPos = model.getPositionAt(startOffset);
  return model.getValueInRange({
    startLineNumber: startPos.lineNumber,
    startColumn: startPos.column,
    endLineNumber: position.lineNumber,
    endColumn: position.column,
  });
}

export function getDotChainPrefix(textBefore: string): string[] | null {
  const match =
    /([A-Za-z_$][\w$]*(?:\([^()]*\))?(?:\.[A-Za-z_$][\w$]*(?:\([^()]*\))?)*)\.[A-Za-z_$]*$/.exec(
      textBefore,
    );
  if (!match) {
    return null;
  }
  return match[1].split(".");
}

export function withRange(
  items: readonly PartialCompletionItem[],
  range: IRange,
): languages.CompletionItem[] {
  return items.map((item) => ({ ...item, range }));
}

export function markdown(value: string): IMarkdownString {
  return { value, isTrusted: false };
}
