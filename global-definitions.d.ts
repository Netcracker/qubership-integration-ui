declare module "*.css";

declare module "*.pegjs" {
  import type { Parser } from "pegjs";
  const parser: Parser;
  export default parser;
}