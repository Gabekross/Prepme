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

function PmpTip({ children }: { children: React.ReactNode }) {
  return (
    <div className="pmp-tip">
      <div className="pmp-tip-label">PMP Exam Tip</div>
      <div>{children}</div>
    </div>
  );
}

function MidArticleCta() {
  return (
    <div className="blog-mid-cta">
      <div>
        <div className="blog-mid-cta-title">Ready to test your PMP knowledge?</div>
        <p>Try a realistic PMP-style practice session and see where you stand.</p>
      </div>
      <a href="/bank/pmp">Start Free PMP Simulation</a>
    </div>
  );
}

function BlogPracticeQuestion({
  question,
  choices,
  correct,
  explanation,
}: {
  question: string;
  choices: string[];
  correct: string;
  explanation: string;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="blog-practice">
      <div className="blog-practice-label">Practice Question</div>
      <p className="blog-practice-question">{renderInline(question)}</p>
      <ol type="A">
        {choices.map((choice) => (
          <li key={choice}>{renderInline(choice)}</li>
        ))}
      </ol>
      <button type="button" onClick={() => setOpen((value) => !value)}>
        {open ? "Hide Answer" : "Show Answer"}
      </button>
      {open && (
        <div className="blog-practice-answer">
          <strong>Correct answer: {correct}</strong>
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

function renderSpecialBlock(kind: string, lines: string[], key: string) {
  if (kind === "tip") {
    return <PmpTip key={key}>{renderParagraphs(lines, key)}</PmpTip>;
  }

  if (kind === "cta") {
    return <MidArticleCta key={key} />;
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
      />
    );
  }

  return null;
}

export function MarkdownView({
  markdown,
  headings = extractHeadings(markdown),
  insertMidCta = false,
}: {
  markdown: string;
  headings?: BlogHeading[];
  insertMidCta?: boolean;
}) {
  const lines = markdown.split(/\r?\n/);
  const blocks: React.ReactNode[] = [];
  let listItems: string[] = [];
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

  function flushSpecialBlock(block: SpecialBlock | null) {
    if (!block) return;
    const rendered = renderSpecialBlock(block.kind, block.lines, `special-${block.start}`);
    if (rendered) blocks.push(rendered);
  }

  lines.forEach((raw, index) => {
    const line = raw.trim();

    if (specialBlock) {
      if (line === ":::") {
        const rendered = renderSpecialBlock(specialBlock.kind, specialBlock.lines, `special-${specialBlock.start}`);
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
      specialBlock = { kind: specialStart[1].toLowerCase(), lines: [], start: index };
      return;
    }

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
      const heading = headings[headingIndex++];
      blocks.push(<h3 id={heading?.id} key={index}>{renderInline(line.slice(4))}</h3>);
    } else if (line.startsWith("## ")) {
      const heading = headings[headingIndex++];
      blocks.push(<h2 id={heading?.id} key={index}>{renderInline(line.slice(3))}</h2>);
      h2Count += 1;
      if (insertMidCta && h2Count === 3 && !insertedAutoCta) {
        blocks.push(<MidArticleCta key={`auto-cta-${index}`} />);
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

  return <>{blocks}</>;
}
