import { MappingActions } from "../../../../mapper/actions-text/util";
import keyValueListParser from "../../../../mapper/expressions/key-value-grammar.pegjs";

export type KeyValuePair = {
  key: string;
  value: string;
};

export function parse(text: string): KeyValuePair[] {
  return keyValueListParser.parse(text) as KeyValuePair[];
}

export function makeArray(pairs: Readonly<KeyValuePair[]>): string[] {
  return pairs
    .map(
      ({ key, value }) =>
        [key, value].map((i) => MappingActions.escape(i, "=;\\")).join("=")
    )
}

export function sliceParameter(value: string[] | undefined): string {
    if (!value || value.length <= 1) return "";
    return value.slice(1).join(";\n") + ";";
}
