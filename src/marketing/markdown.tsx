import React from "react";

function renderInline(text: string) {
  const nodes: React.ReactNode[] = [];
  const pattern = /\[([^\]]+)\]\((https?:\/\/[^)\s]+|\/[^)\s]+)\)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text))) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index));
    const href = match[2];
    nodes.push(
      <a key={`${href}-${match.index}`} href={href} rel="noopener noreferrer">
        {match[1]}
      </a>
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

export function MarkdownView({ markdown }: { markdown: string }) {
  const lines = markdown.split(/\r?\n/);
  const blocks: React.ReactNode[] = [];
  let listItems: string[] = [];

  function flushList(key: string) {
    if (!listItems.length) return;
    blocks.push(
      <ul key={key}>
        {listItems.map((item, index) => (
          <li key={`${key}-${index}`}>{renderInline(item)}</li>
        ))}
      </ul>
    );
    listItems = [];
  }

  lines.forEach((raw, index) => {
    const line = raw.trim();
    if (!line) {
      flushList(`list-${index}`);
      return;
    }

    if (line.startsWith("- ")) {
      listItems.push(line.slice(2));
      return;
    }

    flushList(`list-${index}`);

    if (line.startsWith("### ")) {
      blocks.push(<h3 key={index}>{renderInline(line.slice(4))}</h3>);
    } else if (line.startsWith("## ")) {
      blocks.push(<h2 key={index}>{renderInline(line.slice(3))}</h2>);
    } else if (line.startsWith("# ")) {
      blocks.push(<h1 key={index}>{renderInline(line.slice(2))}</h1>);
    } else {
      blocks.push(<p key={index}>{renderInline(line)}</p>);
    }
  });

  flushList("list-final");

  return <>{blocks}</>;
}
