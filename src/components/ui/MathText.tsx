import katex from "katex";

import { cn } from "~/lib/utils";

const cache = new Map<string, string>();

function renderTex(tex: string, isDisplay: boolean): string {
  const key = `${isDisplay ? "D" : "I"}${tex}`;
  let html = cache.get(key);
  if (html === undefined) {
    html = katex.renderToString(tex, { throwOnError: false, displayMode: isDisplay, strict: "ignore" });
    cache.set(key, html);
  }
  return html;
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Text with inline `$...$` (and display `$$...$$`) KaTeX math. Markdown-light: **bold**, line breaks. */
export function mathToHtml(text: string): string {
  const out: string[] = [];
  const re = /\$\$([^$]+)\$\$|\$([^$]+)\$/g;
  let last = 0;
  for (const m of text.matchAll(re)) {
    if (m.index! > last) out.push(formatPlain(text.slice(last, m.index)));
    out.push(m[1] !== undefined ? renderTex(m[1], true) : renderTex(m[2], false));
    last = m.index! + m[0].length;
  }
  if (last < text.length) out.push(formatPlain(text.slice(last)));
  return out.join("");
}

function formatPlain(s: string) {
  return escapeHtml(s)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br/>");
}

type MathTextProps = { text: string; className?: string; as?: "span" | "div" | "p" };

export default function MathText({ text, className, as = "span" }: MathTextProps) {
  const Tag = as;
  // KaTeX output is generated locally from dataset strings, never from user input
  return <Tag className={cn(className)} dangerouslySetInnerHTML={{ __html: mathToHtml(text) }} />;
}

export function Tex({ tex, className }: { tex: string; className?: string }) {
  return <span className={className} dangerouslySetInnerHTML={{ __html: renderTex(tex, false) }} />;
}
