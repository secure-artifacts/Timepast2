const htmlTagPattern = /<\/?(div|p|br|strong|b|span|mark|ul|ol|li|font|table|tbody|thead|tfoot|tr|td|th)\b/i;

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function decodeHtmlEntities(value: string) {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = value;
  return textarea.value;
}

function normalizeWhitespace(value: string) {
  return value.replace(/\u00a0/g, " ").replace(/[ \t]+\n/g, "\n").trim();
}

export function plainTextToHtml(value: string) {
  return normalizeWhitespace(value)
    .split(/\r?\n/)
    .map((line) => (line ? escapeHtml(line) : "<br>"))
    .join("<br>");
}

function tableHtmlToText(html: string) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const rows = Array.from(doc.querySelectorAll("tr"))
    .map((row) =>
      Array.from(row.querySelectorAll("th,td"))
        .map((cell) => normalizeWhitespace(cell.textContent || ""))
        .filter(Boolean)
        .join(" \t ")
    )
    .filter(Boolean);
  if (rows.length) return rows.join("\n");
  return normalizeWhitespace(doc.body.textContent || "");
}

function colorStyle(element: Element) {
  const style = element.getAttribute("style") || "";
  const color = /(?:^|;)\s*color\s*:\s*([^;]+)/i.exec(style)?.[1]?.trim();
  if (!color || /expression|url|javascript/i.test(color)) return "";
  return ` style="color: ${escapeHtml(color)}"`;
}

function sanitizeNode(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return escapeHtml(node.textContent || "");
  if (node.nodeType !== Node.ELEMENT_NODE) return "";

  const element = node as HTMLElement;
  const children = Array.from(element.childNodes).map(sanitizeNode).join("");

  switch (element.tagName) {
    case "BR":
      return "<br>";
    case "B":
    case "STRONG":
      return `<strong>${children}</strong>`;
    case "MARK":
      return `<mark>${children}</mark>`;
    case "FONT": {
      const color = element.getAttribute("color");
      if (color && !/expression|url|javascript/i.test(color)) {
        return `<span style="color: ${escapeHtml(color)}">${children}</span>`;
      }
      return children;
    }
    case "SPAN":
      if (element.classList.contains("todo-check")) {
        const checked = element.classList.contains("checked") ? " checked" : "";
        return `<span class="todo-check${checked}" contenteditable="false"></span>`;
      }
      return `<span${colorStyle(element)}>${children}</span>`;
    case "P":
    case "DIV":
      return children ? `<div>${children}</div>` : "<div><br></div>";
    case "LI":
      return `<div>${children}</div>`;
    case "UL":
    case "OL":
      return children;
    default:
      return children;
  }
}

export function sanitizeRichHtml(html: string) {
  if (/google-sheets-html-origin|<table\b/i.test(html)) {
    return plainTextToHtml(tableHtmlToText(html));
  }

  const doc = new DOMParser().parseFromString(html, "text/html");
  return Array.from(doc.body.childNodes).map(sanitizeNode).join("").trim();
}

export function sanitizeClipboardHtml(html: string, fallbackText = "") {
  const sanitized = sanitizeRichHtml(html);
  return sanitized || plainTextToHtml(fallbackText);
}

export function normalizeStoredRichText(content: string) {
  if (!content) return "";

  const decoded = /&lt;|&gt;|&amp;/.test(content) ? decodeHtmlEntities(content) : content;
  if (decoded !== content && /google-sheets-html-origin|<table\b/i.test(decoded)) {
    return plainTextToHtml(tableHtmlToText(decoded));
  }
  if (/google-sheets-html-origin|<table\b/i.test(content)) {
    return plainTextToHtml(tableHtmlToText(content));
  }
  if (decoded !== content && htmlTagPattern.test(decoded)) {
    return sanitizeRichHtml(decoded);
  }
  if (htmlTagPattern.test(content)) {
    return sanitizeRichHtml(content);
  }

  return plainTextToHtml(content)
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/==(.*?)==/g, "<mark>$1</mark>")
    .replace(/- \[ \] ?/g, '<span class="todo-check" contenteditable="false"></span> ');
}

export function insertHtmlAtSelection(editor: HTMLElement, html: string) {
  editor.focus();
  const selection = window.getSelection();
  if (!selection) return;

  let range: Range;
  if (selection.rangeCount > 0 && editor.contains(selection.getRangeAt(0).commonAncestorContainer)) {
    range = selection.getRangeAt(0);
  } else {
    range = document.createRange();
    range.selectNodeContents(editor);
    range.collapse(false);
  }

  range.deleteContents();
  const template = document.createElement("template");
  template.innerHTML = html;
  const fragment = template.content;
  const lastNode = fragment.lastChild;
  range.insertNode(fragment);

  if (lastNode) {
    range = document.createRange();
    range.setStartAfter(lastNode);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
  }
}
