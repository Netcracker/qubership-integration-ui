declare module "*.css";

declare module "*.pegjs" {
  import type { Parser } from "pegjs";
  const parser: Parser;
  export default parser;
}

declare module "rollup-plugin-pegjs" {
  import type { Plugin } from "rollup";

  function pegjsPlugin(options?: never): Plugin;

  export default pegjsPlugin;
}
