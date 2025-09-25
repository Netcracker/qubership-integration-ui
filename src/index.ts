// Main entry point for the UI library
export type * from './api/apiTypes';
export type { VSCodeMessage, VSCodeResponse } from './api/rest/vscodeExtensionApi';
export type { AppExtensionProps } from './appConfig';

// Export main components
export { default as App } from './App';
export { default as AppExtension } from './AppExtension';

// Export utility functions
export { isVsCode } from './api/rest/vscodeExtensionApi';