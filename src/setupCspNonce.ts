/**
 * CSP Workaround for Monaco Editor
 *
 * Problem: Monaco uses inline styles which CSP blocks.
 * Solution: Intercept DOM methods and apply styles via setProperty() instead.
 *
 * Must be imported FIRST, before any other imports.
 */

const CSP_NONCE = "123";
const TEMP_ATTR = "data-csp-style";

// ============================================================================
// STYLE PARSING
// ============================================================================

/**
 * Applies CSS text to an element using setProperty() (CSP-safe).
 * Example: "color: red; font-size: 12px !important" → element.style.setProperty(...)
 */
function applyStyles(style: CSSStyleDeclaration, cssText: string) {
  // Clear existing styles if empty
  if (!cssText) {
    while (style.length) {
      style.removeProperty(style[0]);
    }
    return;
  }

  // Parse and apply each declaration
  for (const declaration of cssText.split(";")) {
    const colonIndex = declaration.indexOf(":");
    if (colonIndex < 0) continue;

    const property = declaration.slice(0, colonIndex).trim();
    const rawValue = declaration.slice(colonIndex + 1).trim();
    if (!property || !rawValue) continue;

    const isImportant = rawValue.endsWith("!important");
    const value = isImportant ? rawValue.slice(0, -10).trim() : rawValue;
    const priority = isImportant ? "important" : "";

    style.setProperty(property, value, priority);
  }
}

// ============================================================================
// HTML STYLE EXTRACTION
// ============================================================================

/**
 * Extracts inline style="" attributes from HTML and replaces them with markers.
 * Returns clean HTML + a map of marker index → style value.
 */
function extractInlineStyles(html: string) {
  const styleMap = new Map<number, string>();
  let index = 0;

  const pattern = /(<[^>]*)\s+style\s*=\s*["']([^"']*)["']([^>]*>)/gi;

  const cleanHtml = html.replace(pattern, (_, before, styleValue, after) => {
    styleMap.set(index, styleValue);
    return `${before} ${TEMP_ATTR}="${index++}"${after}`;
  });

  return { cleanHtml, styleMap };
}

/**
 * Finds elements with temporary markers and applies their styles.
 */
function restoreInlineStyles(
  container: Element,
  styleMap: Map<number, string>,
) {
  const markedElements = container.querySelectorAll(`[${TEMP_ATTR}]`);

  markedElements.forEach((element) => {
    const index = Number(element.getAttribute(TEMP_ATTR));
    const styleValue = styleMap.get(index);

    if (styleValue) {
      applyStyles((element as HTMLElement).style, styleValue);
    }

    element.removeAttribute(TEMP_ATTR);
  });
}

// ============================================================================
// NONCE HELPER
// ============================================================================

/**
 * Adds nonce to <style> elements so CSP allows them.
 */
function addNonceIfStyleElement<T extends Element>(element: T): T {
  if (element.tagName?.toLowerCase() === "style") {
    element.setAttribute("nonce", CSP_NONCE);
  }
  return element;
}

// ============================================================================
// STORE ORIGINAL METHODS
// ============================================================================

const originalCreateElement = document.createElement.bind(document);
const originalCreateElementNS = document.createElementNS.bind(document);
const originalAppendChild = Node.prototype.appendChild;
const originalInsertBefore = Node.prototype.insertBefore;
const originalInsertAdjacentHTML = Element.prototype.insertAdjacentHTML;
const originalSetAttribute = Element.prototype.setAttribute;
const innerHtmlDescriptor = Object.getOwnPropertyDescriptor(
  Element.prototype,
  "innerHTML",
)!;
const cssTextDescriptor = Object.getOwnPropertyDescriptor(
  CSSStyleDeclaration.prototype,
  "cssText",
)!;

// ============================================================================
// PATCH: document.createElement / createElementNS
// Purpose: Add nonce to dynamically created <style> elements
// ============================================================================

document.createElement = function <K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  options?: ElementCreationOptions,
) {
  const element = originalCreateElement(tagName, options);
  return addNonceIfStyleElement(element) as HTMLElementTagNameMap[K];
};

// @ts-expect-error - simplified signature
document.createElementNS = function (
  namespaceURI: string | null,
  qualifiedName: string,
) {
  const element = originalCreateElementNS(namespaceURI, qualifiedName);
  return addNonceIfStyleElement(element);
};

// ============================================================================
// PATCH: appendChild / insertBefore
// Purpose: Ensure <style> elements have nonce before insertion
// ============================================================================

Node.prototype.appendChild = function <T extends Node>(child: T): T {
  if (child instanceof Element) {
    addNonceIfStyleElement(child);
  }
  return originalAppendChild.call(this, child) as T;
};

Node.prototype.insertBefore = function <T extends Node>(
  newNode: T,
  refNode: Node | null,
): T {
  if (newNode instanceof Element) {
    addNonceIfStyleElement(newNode);
  }
  return originalInsertBefore.call(this, newNode, refNode) as T;
};

// ============================================================================
// PATCH: innerHTML
// Purpose: Handle inline style="" attributes in HTML strings
// ============================================================================

Object.defineProperty(Element.prototype, "innerHTML", {
  get: innerHtmlDescriptor.get,
  set(value) {
    const html = String(value ?? "");

    // Fast path: no inline styles
    if (!html.includes("style=")) {
      innerHtmlDescriptor.set!.call(this, html);
      return;
    }

    // Extract styles, insert clean HTML, restore styles
    const { cleanHtml, styleMap } = extractInlineStyles(html);
    innerHtmlDescriptor.set!.call(this, cleanHtml);
    restoreInlineStyles(this, styleMap);
  },
  configurable: true,
});

// ============================================================================
// PATCH: insertAdjacentHTML
// Purpose: Handle inline style="" attributes in HTML strings
// ============================================================================

Element.prototype.insertAdjacentHTML = function (position, html) {
  const htmlString = String(html ?? "");

  // Fast path: no inline styles
  if (!htmlString.includes("style=")) {
    originalInsertAdjacentHTML.call(this, position, htmlString);
    return;
  }

  // Extract styles, insert clean HTML, restore styles
  const { cleanHtml, styleMap } = extractInlineStyles(htmlString);
  originalInsertAdjacentHTML.call(this, position, cleanHtml);

  // Determine where to search for marked elements
  const isOutsidePosition =
    position === "beforebegin" || position === "afterend";
  const searchContainer = isOutsidePosition
    ? (this.parentElement ?? this)
    : this;

  restoreInlineStyles(searchContainer, styleMap);
};

// ============================================================================
// PATCH: style.cssText
// Purpose: Handle element.style.cssText = "..." assignments
// ============================================================================

Object.defineProperty(CSSStyleDeclaration.prototype, "cssText", {
  get: cssTextDescriptor.get,
  set(value) {
    applyStyles(this, value);
  },
  configurable: true,
});

// ============================================================================
// PATCH: setAttribute
// Purpose: Handle element.setAttribute('style', '...') calls
// ============================================================================

Element.prototype.setAttribute = function (name, value) {
  const isStyleAttribute = name.toLowerCase() === "style";
  const hasStyleProperty = !!(this as HTMLElement).style;

  if (isStyleAttribute && hasStyleProperty) {
    applyStyles((this as HTMLElement).style, value);
  } else {
    originalSetAttribute.call(this, name, value);
  }
};
