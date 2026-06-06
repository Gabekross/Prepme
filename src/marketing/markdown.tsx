import React from "react";

export type BlogHeading = {
  id: string;
  text: string;
  level: 2 | 3;
};

type SpecialBlock = {
  kind: string;
  lines: string[];
  start: number;
};

type BlogEventTracker = (eventName: string, properties?: Record<string, string | number | boolean | null>) => void;

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function stripMarkdown(text: string) {
  return text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/[*_`#>-]/g, "").trim();
}

export function estimateReadingTime(markdown: string) {
  const words = stripMarkdown(markdown).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 210));
}

export function extractHeadings(markdown: string): BlogHeading[] {
  const seen = new Map<string, number>();
  return markdown
    .split(/\r?\n/)
    .map((raw) => {
      const match = raw.trim().match(/^(##|###)\s+(.+)$/);
      if (!match) return null;
      const text = stripMarkdown(match[2]);
      const base = slugify(text) || "section";
      const count = seen.get(base) ?? 0;
      seen.set(base, count + 1);
      return {
        id: count ? `${base}-${count + 1}` : base,
        text,
        level: match[1] === "##" ? 2 : 3,
      } satisfies BlogHeading;
    })
    .filter((heading): heading is BlogHeading => Boolean(heading));
}

function normalizeInlineText(text: string) {
  return text
    .replace(/\*\*(?![^*]+\*\*)/g, "")
    .replace(/(?<!\*)\*(?![^*]+\*)/g, "");
}

function renderInlineFormatting(text: string, keyPrefix: string) {
  const nodes: React.ReactNode[] = [];
  const pattern = /(\*\*([^*]+)\*\*|`([^`]+)`|\*([^*]+)\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text))) {
    if (match.index > lastIndex) nodes.push(normalizeInlineText(text.slice(lastIndex, match.index)));
    if (match[2]) {
      nodes.push(<strong key={`${keyPrefix}-bold-${match.index}`}>{match[2]}</strong>);
    } else if (match[3]) {
      nodes.push(<code key={`${keyPrefix}-code-${match.index}`}>{match[3]}</code>);
    } else if (match[4]) {
      nodes.push(<em key={`${keyPrefix}-em-${match.index}`}>{match[4]}</em>);
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) nodes.push(normalizeInlineText(text.slice(lastIndex)));
  return nodes;
}

function renderInline(text: string) {
  const nodes: React.ReactNode[] = [];
  const pattern = /\[([^\]]+)\]\((https?:\/\/[^)\s]+|\/[^)\s]+)\)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text))) {
    if (match.index > lastIndex) {
      nodes.push(...renderInlineFormatting(text.slice(lastIndex, match.index), `text-${match.index}`));
    }
    const href = match[2];
    nodes.push(
      <a key={`${href}-${match.index}`} href={href} rel="noopener noreferrer">
        {renderInlineFormatting(match[1], `link-${match.index}`)}
      </a>
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    nodes.push(...renderInlineFormatting(text.slice(lastIndex), `text-${lastIndex}`));
  }
  return nodes;
}

function PmpTip({ children, label = "PMP Exam Tip" }: { children: React.ReactNode; label?: string }) {
  return (
    <div className="pmp-tip">
      <div className="pmp-tip-label">{label}</div>
      <div>{children}</div>
    </div>
  );
}

function MidArticleCta({ onEvent }: { onEvent?: BlogEventTracker }) {
  return (
    <div className="blog-mid-cta">
      <div>
        <div className="blog-mid-cta-title">Ready to test your PMP knowledge?</div>
        <p>Try a realistic PMP-style practice session and see where you stand.</p>
      </div>
      <a
        href="/bank/pmp"
        onClick={() => onEvent?.("blog_cta_click", { target: "mid_article_simulation", href: "/bank/pmp" })}
      >
        Start Free PMP Simulation
      </a>
    </div>
  );
}

function BlogPracticeQuestion({
  question,
  choices,
  correct,
  explanation,
  onEvent,
}: {
  question: string;
  choices: string[];
  correct: string;
  explanation: string;
  onEvent?: BlogEventTracker;
}) {
  const [selected, setSelected] = React.useState<string | null>(null);
  const [checked, setChecked] = React.useState(false);
  const normalizedCorrect = correct.trim().slice(0, 1).toUpperCase();
  const selectedLetter = selected?.slice(0, 1).toUpperCase() ?? null;
  const isCorrect = checked && selectedLetter === normalizedCorrect;

  return (
    <div className="blog-practice">
      <div className="blog-practice-label">Practice Question</div>
      <p className="blog-practice-question">{renderInline(question)}</p>
      <div className="blog-practice-choices">
        {choices.map((choice, index) => {
          const letter = String.fromCharCode(65 + index);
          const isSelected = selected === letter;
          const isAnswer = checked && letter === normalizedCorrect;
          return (
            <button
              className={[
                "blog-choice",
                isSelected ? "is-selected" : "",
                isAnswer ? "is-answer" : "",
                checked && isSelected && !isAnswer ? "is-wrong" : "",
              ].filter(Boolean).join(" ")}
              key={`${letter}-${choice}`}
              type="button"
              onClick={() => {
                setSelected(letter);
                setChecked(false);
                onEvent?.("blog_practice_answer", { selected: letter, question: question.slice(0, 120) });
              }}
            >
              <span>{letter}</span>
              <span>{renderInline(choice)}</span>
            </button>
          );
        })}
      </div>
      <button
        className="blog-practice-check"
        type="button"
        onClick={() => {
          if (!selected) return;
          const nextChecked = !checked;
          setChecked(nextChecked);
          if (nextChecked) {
            onEvent?.("blog_practice_check", {
              selected,
              correct: normalizedCorrect,
              isCorrect: selectedLetter === normalizedCorrect,
            });
          }
        }}
        disabled={!selected}
      >
        {checked ? "Hide Explanation" : selected ? "Check Answer" : "Select an Answer"}
      </button>
      {checked && (
        <div className={`blog-practice-answer ${isCorrect ? "is-correct" : "is-incorrect"}`}>
          <strong>{isCorrect ? "Correct." : "Not quite."} Correct answer: {correct}</strong>
          {explanation && <p>{renderInline(explanation)}</p>}
        </div>
      )}
    </div>
  );
}

function renderParagraphs(lines: string[], keyPrefix: string) {
  return lines
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => <p key={`${keyPrefix}-${index}`}>{renderInline(line)}</p>);
}

function isMarkdownTableRow(line: string) {
  const trimmed = line.trim();
  return trimmed.startsWith("|") && trimmed.endsWith("|") && trimmed.split("|").length >= 3;
}

function isMarkdownTableSeparator(line: string) {
  return /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(line.trim());
}

function parseMarkdownTableRow(line: string) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function renderMarkdownTable(rows: string[], key: string) {
  const tableRows = rows.filter(isMarkdownTableRow);
  if (tableRows.length < 2) {
    return renderParagraphs(tableRows, key);
  }

  const separatorIndex = tableRows.findIndex(isMarkdownTableSeparator);
  const headerIndex = separatorIndex > 0 ? separatorIndex - 1 : 0;
  const headerCells = parseMarkdownTableRow(tableRows[headerIndex]);
  const bodyRows = tableRows
    .filter((row, index) => index !== headerIndex && !isMarkdownTableSeparator(row))
    .map(parseMarkdownTableRow);

  return (
    <div className="blog-table-wrap" key={key}>
      <table className="blog-table">
        <thead>
          <tr>
            {headerCells.map((cell, index) => (
              <th key={`${key}-head-${index}`}>{renderInline(cell)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {bodyRows.map((row, rowIndex) => (
            <tr key={`${key}-row-${rowIndex}`}>
              {headerCells.map((_, cellIndex) => (
                <td key={`${key}-cell-${rowIndex}-${cellIndex}`}>{renderInline(row[cellIndex] ?? "")}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function renderSpecialBlock(kind: string, lines: string[], key: string, onEvent?: BlogEventTracker) {
  if (kind === "tip") {
    const labelLine = lines.find((line) => /^label:/i.test(line.trim()));
    const label = labelLine?.replace(/^label:\s*/i, "").trim() || "PMP Exam Tip";
    const tipLines = lines.filter((line) => !/^label:/i.test(line.trim()));
    return <PmpTip key={key} label={label}>{renderParagraphs(tipLines, key)}</PmpTip>;
  }

  if (kind === "cta") {
    return <MidArticleCta key={key} onEvent={onEvent} />;
  }

  if (kind === "question") {
    const question = lines.find((line) => /^q(uestion)?:/i.test(line))?.replace(/^q(uestion)?:\s*/i, "") ?? lines[0] ?? "";
    const correct = lines.find((line) => /^correct:/i.test(line))?.replace(/^correct:\s*/i, "") ?? "";
    const explanation = lines.find((line) => /^explanation:/i.test(line))?.replace(/^explanation:\s*/i, "") ?? "";
    const choices = lines
      .filter((line) => /^[A-D][).]\s+/i.test(line) || /^-\s+/.test(line))
      .map((line) => line.replace(/^[A-D][).]\s+/i, "").replace(/^-\s+/, ""));

    return (
      <BlogPracticeQuestion
        key={key}
        question={question}
        choices={choices}
        correct={correct}
        explanation={explanation}
        onEvent={onEvent}
      />
    );
  }

  return null;
}

export function MarkdownView({
  markdown,
  headings = extractHeadings(markdown),
  insertMidCta = false,
  onEvent,
}: {
  markdown: string;
  headings?: BlogHeading[];
  insertMidCta?: boolean;
  onEvent?: BlogEventTracker;
}) {
  const lines = markdown.split(/\r?\n/);
  const blocks: React.ReactNode[] = [];
  let listItems: string[] = [];
  let orderedListItems: string[] = [];
  let tableRows: string[] = [];
  let specialBlock: SpecialBlock | null = null;
  let headingIndex = 0;
  let h2Count = 0;
  let insertedAutoCta = false;

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

  function flushOrderedList(key: string) {
    if (!orderedListItems.length) return;
    blocks.push(
      <ol key={key}>
        {orderedListItems.map((item, index) => (
          <li key={`${key}-${index}`}>{renderInline(item)}</li>
        ))}
      </ol>
    );
    orderedListItems = [];
  }

  function flushTable(key: string) {
    if (!tableRows.length) return;
    blocks.push(renderMarkdownTable(tableRows, key));
    tableRows = [];
  }

  function flushSpecialBlock(block: SpecialBlock | null) {
    if (!block) return;
    const rendered = renderSpecialBlock(block.kind, block.lines, `special-${block.start}`, onEvent);
    if (rendered) blocks.push(rendered);
  }

  lines.forEach((raw, index) => {
    const line = raw.trim();

    if (specialBlock) {
      if (line === ":::") {
        const rendered = renderSpecialBlock(specialBlock.kind, specialBlock.lines, `special-${specialBlock.start}`, onEvent);
        if (rendered) blocks.push(rendered);
        specialBlock = null;
      } else {
        specialBlock.lines.push(raw);
      }
      return;
    }

    const specialStart = line.match(/^:::(tip|question|cta)\s*$/i);
    if (specialStart) {
      flushList(`list-${index}`);
      flushOrderedList(`olist-${index}`);
      flushTable(`table-${index}`);
      specialBlock = { kind: specialStart[1].toLowerCase(), lines: [], start: index };
      return;
    }

    if (!line) {
      flushList(`list-${index}`);
      flushOrderedList(`olist-${index}`);
      if (tableRows.length) {
        return;
      }
      return;
    }

    if (isMarkdownTableRow(line)) {
      flushList(`list-${index}`);
      flushOrderedList(`olist-${index}`);
      tableRows.push(line);
      return;
    }

    if (line.startsWith("- ")) {
      flushTable(`table-${index}`);
      flushOrderedList(`olist-${index}`);
      listItems.push(line.slice(2));
      return;
    }

    const orderedItem = line.match(/^\d+\.\s+(.+)$/);
    if (orderedItem) {
      flushTable(`table-${index}`);
      flushList(`list-${index}`);
      orderedListItems.push(orderedItem[1]);
      return;
    }

    flushList(`list-${index}`);
    flushOrderedList(`olist-${index}`);
    flushTable(`table-${index}`);

    if (line.startsWith("### ")) {
      const heading = headings[headingIndex++];
      blocks.push(<h3 id={heading?.id} key={index}>{renderInline(line.slice(4))}</h3>);
    } else if (line.startsWith("## ")) {
      const heading = headings[headingIndex++];
      blocks.push(<h2 id={heading?.id} key={index}>{renderInline(line.slice(3))}</h2>);
      h2Count += 1;
      if (insertMidCta && h2Count === 3 && !insertedAutoCta) {
        blocks.push(<MidArticleCta key={`auto-cta-${index}`} onEvent={onEvent} />);
        insertedAutoCta = true;
      }
    } else if (line.startsWith("# ")) {
      blocks.push(<h1 key={index}>{renderInline(line.slice(2))}</h1>);
    } else {
      blocks.push(<p key={index}>{renderInline(line)}</p>);
    }
  });

  flushSpecialBlock(specialBlock);

  flushList("list-final");
  flushOrderedList("olist-final");
  flushTable("table-final");

  return <>{blocks}</>;
}
