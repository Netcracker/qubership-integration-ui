import { ExpressionNode } from "./model.ts";
import transformationExpressionParser from "./grammar.pegjs";

export function parse(text: string): ExpressionNode {
  return transformationExpressionParser.parse(text) as ExpressionNode;
}
