#!/usr/bin/env python3
"""Generate EmpireAI Master Build Bible PDF from Markdown (read-only build artifact)."""
from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

try:
    import markdown
except ImportError:
    print("markdown package required: pip install markdown")
    sys.exit(1)

REPO = Path(__file__).resolve().parents[1]
MD_PATH = REPO / "artifacts" / "empireai-master-build-bible.md"
HTML_PATH = REPO / "artifacts" / "empireai-master-build-bible.html"
PDF_PATH = REPO / "artifacts" / "EmpireAI-Master-Build-Bible.pdf"

HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>EmpireAI Master Build Bible</title>
<style>
  @page { margin: 18mm 16mm; }
  body { font-family: "Segoe UI", Calibri, Arial, sans-serif; font-size: 10.5pt; line-height: 1.45; color: #1a1a1a; max-width: 920px; margin: 0 auto; padding: 24px; }
  h1 { font-size: 22pt; border-bottom: 3px solid #1e3a5f; padding-bottom: 8px; page-break-before: always; }
  h1:first-of-type { page-break-before: avoid; }
  h2 { font-size: 15pt; color: #1e3a5f; margin-top: 1.4em; border-bottom: 1px solid #ccc; }
  h3 { font-size: 12pt; color: #2c5282; margin-top: 1.1em; }
  h4 { font-size: 10.5pt; color: #333; }
  a { color: #2563eb; text-decoration: none; }
  a:hover { text-decoration: underline; }
  table { border-collapse: collapse; width: 100%; margin: 10px 0 16px; font-size: 9pt; }
  th, td { border: 1px solid #cbd5e1; padding: 5px 7px; text-align: left; vertical-align: top; }
  th { background: #f1f5f9; font-weight: 600; }
  tr:nth-child(even) { background: #f8fafc; }
  code, pre { font-family: Consolas, monospace; font-size: 8.5pt; background: #f1f5f9; }
  pre { padding: 10px; overflow-x: auto; border: 1px solid #e2e8f0; white-space: pre-wrap; }
  blockquote { border-left: 4px solid #1e3a5f; margin: 12px 0; padding: 8px 14px; background: #f8fafc; }
  .toc { background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px 20px; margin: 20px 0; }
  .toc ul { list-style: none; padding-left: 0; }
  .toc > ul > li { margin: 6px 0; font-weight: 600; }
  .toc ul ul { padding-left: 18px; font-weight: normal; }
  hr { border: none; border-top: 1px solid #e2e8f0; margin: 24px 0; }
  .cover { text-align: center; padding: 80px 20px 40px; page-break-after: always; }
  .cover h1 { border: none; font-size: 28pt; page-break-before: avoid; }
  .cover p { font-size: 12pt; color: #475569; }
</style>
</head>
<body>
<div class="cover">
  <h1>EmpireAI Master Build Bible</h1>
  <p>Definitive hierarchical engineering map of the EmpireAI repository</p>
  <p>Repository archaeology · read-only · no code or documentation modified</p>
  <p><strong>Generated:</strong> 2026-07-02</p>
</div>
{toc}
{body}
</body>
</html>
"""


def slugify(text: str) -> str:
    text = re.sub(r"<[^>]+>", "", text)
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    return re.sub(r"[\s_-]+", "-", text).strip("-")


def build_toc(md: str) -> tuple[str, str]:
    headings: list[tuple[int, str, str]] = []
    for line in md.splitlines():
        m = re.match(r"^(#{1,4})\s+(.+)$", line)
        if m:
            level = len(m.group(1))
            title = m.group(2).strip()
            if level <= 3:
                headings.append((level, title, slugify(title)))

    lines = ['<div class="toc"><h2 id="table-of-contents">Table of Contents</h2><ul>']
    stack = [0]
    for level, title, slug in headings:
        if title == "Table of Contents":
            continue
        while stack[-1] >= level:
            lines.append("</ul>")
            stack.pop()
        if level > stack[-1]:
            if stack[-1] != 0:
                lines.append("<ul>")
            stack.append(level)
        lines.append(f'<li><a href="#{slug}">{title}</a></li>')
    while len(stack) > 1:
        lines.append("</ul>")
        stack.pop()
    lines.append("</ul></div>")
    return "\n".join(lines), ""


def add_heading_ids(html: str, md: str) -> str:
    for line in md.splitlines():
        m = re.match(r"^(#{1,4})\s+(.+)$", line)
        if m:
            title = m.group(2).strip()
            slug = slugify(title)
            for tag in ("h1", "h2", "h3", "h4"):
                pattern = rf"<{tag}>{re.escape(title)}</{tag}>"
                repl = f'<{tag} id="{slug}">{title}</{tag}>'
                if re.search(pattern, html):
                    html = re.sub(pattern, repl, html, count=1)
                    break
    return html


def find_edge() -> str | None:
    candidates = [
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    ]
    for c in candidates:
        if Path(c).exists():
            return c
    return None


def main() -> int:
    if not MD_PATH.exists():
        print(f"Missing markdown: {MD_PATH}")
        return 1

    md = MD_PATH.read_text(encoding="utf-8")
    toc_html, _ = build_toc(md)
    body_html = markdown.markdown(
        md,
        extensions=["tables", "fenced_code", "nl2br", "sane_lists"],
    )
    body_html = add_heading_ids(body_html, md)
    html = HTML_TEMPLATE.replace("{toc}", toc_html).replace("{body}", body_html)
    HTML_PATH.write_text(html, encoding="utf-8")

    browser = find_edge()
    if not browser:
        print("No Edge/Chrome found for PDF print. HTML written:", HTML_PATH)
        return 0

    html_uri = HTML_PATH.resolve().as_uri()
    cmd = [
        browser,
        "--headless=new",
        "--disable-gpu",
        f"--print-to-pdf={PDF_PATH.resolve()}",
        "--no-pdf-header-footer",
        html_uri,
    ]
    subprocess.run(cmd, check=True, timeout=120)
    print(f"PDF written: {PDF_PATH}")
    print(f"HTML written: {HTML_PATH}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
