"use client";

import { useMemo, type ReactNode } from "react";

type Block =
  | { kind: "title"; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "list"; ordered: boolean; items: string[] };

// A line that is only **text** (optionally with "#" or a trailing colon) is a title
const TITLE_BOLD = /^\s*(?:#{1,6}\s+)?\*\*([^*]+)\*\*\s*[:：]?\s*$/;
const TITLE_HASH = /^\s*#{1,6}\s+(.+?)\s*$/;
const BULLET = /^\s*[*\-•]\s+(.+)$/;
const NUMBERED = /^\s*\d+[.)]\s+(.+)$/;

function cleanTitle(text: string): string {
  return text
    .replace(/\*+/g, "")
    .replace(/[:：]\s*$/, "")
    .trim();
}

function parseBlocks(content: string): Block[] {
  const blocks: Block[] = [];

  for (const line of content.split("\n")) {
    if (!line.trim()) continue;
    const last = blocks[blocks.length - 1];

    const title = line.match(TITLE_BOLD) ?? line.match(TITLE_HASH);
    if (title) {
      blocks.push({ kind: "title", text: cleanTitle(title[1] ?? "") });
      continue;
    }

    const bullet = line.match(BULLET);
    const numbered = bullet ? null : line.match(NUMBERED);
    const item = bullet?.[1] ?? numbered?.[1];
    if (item !== undefined) {
      const ordered = numbered !== null;
      if (last?.kind === "list" && last.ordered === ordered) {
        last.items.push(item);
      } else {
        blocks.push({ kind: "list", ordered, items: [item] });
      }
      continue;
    }

    blocks.push({ kind: "paragraph", text: line.trim() });
  }

  return blocks;
}

// **bold** inside a sentence becomes bold text. Any stray "*" is dropped.
function renderInline(text: string): ReactNode[] {
  return text.split(/\*\*(.+?)\*\*/g).map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="font-bold text-foreground">
        {part}
      </strong>
    ) : (
      part.replace(/\*/g, "")
    ),
  );
}

export function FormattedMessage({ content }: { content: string }) {
  const blocks = useMemo(() => parseBlocks(content), [content]);

  return (
    <div className="space-y-2">
      {blocks.map((block, i) => {
        if (block.kind === "title") {
          return (
            <h4
              key={i}
              className="mt-3 flex items-center gap-2 rounded-lg border-s-4 border-primary bg-primary/10 px-3 py-1.5 text-sm font-bold text-primary first:mt-0"
            >
              {block.text}
            </h4>
          );
        }

        if (block.kind === "list") {
          return block.ordered ? (
            <ol
              key={i}
              className="list-decimal space-y-1.5 ps-5 marker:font-bold marker:text-primary"
            >
              {block.items.map((item, j) => (
                <li key={j}>{renderInline(item)}</li>
              ))}
            </ol>
          ) : (
            <ul key={i} className="space-y-1.5">
              {block.items.map((item, j) => (
                <li key={j} className="flex items-start gap-2">
                  <span
                    aria-hidden="true"
                    className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                  />
                  <span className="min-w-0 flex-1">{renderInline(item)}</span>
                </li>
              ))}
            </ul>
          );
        }

        return <p key={i}>{renderInline(block.text)}</p>;
      })}
    </div>
  );
}