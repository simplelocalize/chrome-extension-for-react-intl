// Translator mode for the SimpleLocalize Chrome extension, enabled with ?i18n-keys=1 (?i18n-keys=0 turns it off).
// Messages are plain strings from formatMessage, so the key cannot travel as an attribute: each message gets an
// invisible marker instead, and a DOM pass turns markers into data-translation-key on the element showing the text.

export const TRANSLATION_KEY_ATTRIBUTE = "data-translation-key";

const QUERY_PARAM = "i18n-keys";
const STORAGE_KEY = "i18n-keys";
const MARKER_START = "⁢";
const MARKER_END = "⁣";
const ZERO = "​";
const ONE = "‌";
const MARKER_PATTERN = new RegExp(`${MARKER_START}([${ZERO}${ONE}]+)${MARKER_END}`, "g");

// Markers carry an index into this list rather than the key itself, keeping each marker a few characters long
const markedKeys: string[] = [];
const markedKeyIndexes = new Map<string, number>();

export const markTranslationKey = (key: string): string => {
  let index = markedKeyIndexes.get(key);
  if (index === undefined) {
    index = markedKeys.push(key) - 1;
    markedKeyIndexes.set(key, index);
  }
  const bits = index.toString(2).replace(/0/g, ZERO).replace(/1/g, ONE);
  return `${MARKER_START}${bits}${MARKER_END}`;
};

export const extractTranslationKeys = (text: string): { keys: string[]; text: string } => {
  const keys: string[] = [];
  const stripped = text.replace(MARKER_PATTERN, (_, bits: string) => {
    const key = markedKeys[parseInt(bits.replace(new RegExp(ZERO, "g"), "0").replace(new RegExp(ONE, "g"), "1"), 2)];
    if (key) {
      keys.push(key);
    }
    return "";
  });
  return { keys, text: stripped };
};

const tagElement = (element: Element | null, keys: string[]) => {
  if (element && keys.length > 0 && element.getAttribute(TRANSLATION_KEY_ATTRIBUTE) !== keys[0]) {
    element.setAttribute(TRANSLATION_KEY_ATTRIBUTE, keys[0]);
  }
};

export const applyTranslationKeys = (root: Element) => {
  const walker = root.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const value = node.nodeValue ?? "";
    if (!value.includes(MARKER_START)) {
      continue;
    }
    const { keys, text } = extractTranslationKeys(value);
    node.nodeValue = text;
    tagElement(node.parentElement, keys);
  }

  // alt, title, placeholder, aria-label, meta content: the element owning the attribute gets the key
  root.querySelectorAll("*").forEach((element) => {
    Array.from(element.attributes).forEach((attribute) => {
      if (!attribute.value.includes(MARKER_START)) {
        return;
      }
      const { keys, text } = extractTranslationKeys(attribute.value);
      element.setAttribute(attribute.name, text);
      tagElement(element, keys);
    });
  });
};

// Re-applies after every React render; the observer's own edits leave no markers, so they settle in one pass
export const observeTranslationKeys = (root: Element): (() => void) => {
  let frame: number | null = null;
  const schedule = () => {
    if (frame === null) {
      frame = requestAnimationFrame(() => {
        frame = null;
        applyTranslationKeys(root);
      });
    }
  };
  const observer = new MutationObserver(schedule);
  observer.observe(root, { childList: true, subtree: true, characterData: true, attributes: true });
  applyTranslationKeys(root);
  return () => {
    observer.disconnect();
    if (frame !== null) {
      cancelAnimationFrame(frame);
    }
  };
};

// The flag survives client-side navigation, which drops the query string
export const isTranslationKeysModeEnabled = (search: string): boolean => {
  const param = new URLSearchParams(search).get(QUERY_PARAM);
  try {
    if (param === "1") {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } else if (param === "0") {
      sessionStorage.removeItem(STORAGE_KEY);
    }
    return sessionStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return param === "1";
  }
};
