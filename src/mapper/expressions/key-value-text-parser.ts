export interface KeyValuePair {
  key: string;
  value: string;
}

import keyValueListParser from "./key-value-grammar.pegjs";

export function parse(text: string): KeyValuePair[] {
  return keyValueListParser.parse(text) as KeyValuePair[];
}
