import type { ReactNode } from "react";
import styles from "./PillowMarkdown.module.css";

function renderInline(text: string): ReactNode[] {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={index} className={styles.inlineCode}>
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

export function PillowMarkdown({ content }: { content: string }) {
  const blocks = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className={styles.root}>
      {blocks.map((block, index) => {
        if (block.startsWith("```")) {
          const inner = block.replace(/^```[\w]*\n?/, "").replace(/```$/, "");
          return (
            <pre key={index} className={styles.codeBlock}>
              <code>{inner}</code>
            </pre>
          );
        }

        return block.split("\n").map((line, lineIndex) => {
          const key = `${index}-${lineIndex}`;
          if (!line.trim()) return <br key={key} />;
          if (line.startsWith("# ")) {
            return (
              <h3 key={key} className={styles.h1}>
                {line.slice(2)}
              </h3>
            );
          }
          if (line.startsWith("## ")) {
            return (
              <h4 key={key} className={styles.h2}>
                {line.slice(3)}
              </h4>
            );
          }
          if (line.startsWith("- ")) {
            return (
              <li key={key} className={styles.listItem}>
                {renderInline(line.slice(2))}
              </li>
            );
          }
          return (
            <p key={key} className={styles.paragraph}>
              {renderInline(line)}
            </p>
          );
        });
      })}
    </div>
  );
}
