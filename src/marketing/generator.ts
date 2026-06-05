import type { GeneratedMarketingContent } from "./types";
import { withFallbackSlug } from "./slug";

type GenerateInput = {
  topic: string;
  primaryKeyword?: string;
  theme?: string;
  baseUrl?: string;
};

const DEFAULT_MODEL = "gpt-4.1-mini";

function fallbackContent(input: GenerateInput): GeneratedMarketingContent {
  const topic = input.topic.trim();
  const primaryKeyword = input.primaryKeyword?.trim() || topic;
  const theme = input.theme?.trim() || "PMP Exam Prep";
  const slug = withFallbackSlug(topic);
  const baseUrl = (input.baseUrl || "https://www.pmpmasterylab.com").replace(/\/$/, "");
  const blogUrl = `${baseUrl}/blog/${slug}`;
  const title = `${topic}: A Practical PMP Guide`;
  const excerpt = `A PMP-focused guide to ${topic.toLowerCase()} with exam-ready framing, practical examples, and review prompts.`;
  const contentMarkdown = [
    `# ${title}`,
    "",
    `## Why ${topic} Matters for PMP Candidates`,
    `${topic} shows up on the PMP exam because candidates are expected to choose responses that protect value, support people, and keep delivery aligned with business outcomes.`,
    "",
    ":::tip",
    `When you see ${topic.toLowerCase()} in a PMP question, slow down and identify the decision the exam is really testing. The best answer usually clarifies the situation, supports collaboration, and protects project value before jumping to escalation.`,
    ":::",
    "",
    "## The PMP Mindset",
    "- Start with the team and stakeholders before jumping to escalation.",
    "- Clarify the problem before selecting a tool or process.",
    "- Favor servant leadership, transparency, and adaptive decision-making.",
    "- Connect the decision to value delivery and risk reduction.",
    "",
    "## How to Apply It on Exam Questions",
    `When a question involves ${topic.toLowerCase()}, look for the answer that improves collaboration, makes information visible, and respects the project life cycle. Avoid answers that skip analysis, punish the team, or bypass agreed governance.`,
    "",
    ":::question",
    `Question: A PMP exam scenario mentions ${topic.toLowerCase()} and the team is unsure how to proceed. What should the project manager do first?`,
    "A. Escalate the issue to the sponsor immediately",
    "B. Clarify the situation with the team and relevant stakeholders",
    "C. Replace the team member who raised the concern",
    "D. Update the schedule baseline without discussion",
    "Correct: B",
    "Explanation: PMP-style questions usually reward understanding the problem and engaging the right people before escalation or unilateral action.",
    ":::",
    "",
    "## Common Traps to Avoid",
    `With ${topic.toLowerCase()} questions, avoid answers that sound decisive but skip analysis. The PMP exam often includes tempting options that escalate too soon, make assumptions, or treat people problems as paperwork problems.`,
    "",
    "## How to Practice This Skill",
    `After each practice session, review any ${topic.toLowerCase()} questions you missed and write down the clue you overlooked. Over time, this builds pattern recognition for similar exam scenarios.`,
    "",
    "## Practice Reflection",
    `Before your next simulation, write down one example of ${topic.toLowerCase()} in a predictive, agile, and hybrid environment. That quick comparison makes exam choices easier to spot.`,
  ].join("\n");

  return {
    topic: {
      title: topic,
      theme,
      primaryKeyword,
      secondaryKeywords: ["PMP exam prep", "PMI mindset", "PMP practice questions"],
      intent: "informational",
    },
    blog: {
      title,
      slug,
      excerpt,
      contentMarkdown,
      seoTitle: `${topic} for PMP Exam Prep | PMP Mastery Lab`,
      seoDescription: excerpt.slice(0, 155),
      focusKeyword: primaryKeyword,
      tags: [theme, "PMP Exam Prep", "PMI Mindset"],
    },
    assets: [
      {
        channel: "master_article",
        variant: 1,
        title: `Master Article: ${topic}`,
        body: contentMarkdown,
      },
      {
        channel: "threads",
        variant: 1,
        body: `${topic} is a PMP exam signal. Look for answers that clarify, collaborate, and protect value before escalating. Blog: ${blogUrl}`,
      },
      {
        channel: "threads",
        variant: 2,
        body: `PMP mindset check: ${topic} is rarely about reacting fast. It is about diagnosing, engaging stakeholders, and choosing the next responsible action.`,
      },
      {
        channel: "linkedin",
        variant: 1,
        body: `PMP candidates often miss ${topic} questions because they jump straight to the tool. The stronger exam move is to clarify the situation, engage the right people, and protect business value. Full guide: ${blogUrl}`,
      },
      {
        channel: "x",
        variant: 1,
        body: `${topic} on the PMP exam: clarify first, collaborate next, escalate only when needed. Full guide: ${blogUrl}`,
      },
      {
        channel: "facebook",
        variant: 1,
        body: `Studying ${topic} for the PMP exam? Focus on the decision pattern: understand the issue, support the team, engage stakeholders, and protect value. Read the guide: ${blogUrl}`,
      },
      {
        channel: "newsletter",
        variant: 1,
        title: `${topic} for PMP Candidates`,
        body: `This week in PMP Mastery Lab: ${topic}. The exam often rewards answers that clarify the problem, support collaboration, and connect decisions to value. Read the full guide: ${blogUrl}`,
      },
    ],
  };
}

function extractOutputText(response: any) {
  if (typeof response.output_text === "string") return response.output_text;
  const parts = response.output?.flatMap((item: any) => item.content ?? []) ?? [];
  return parts.map((part: any) => part.text ?? "").join("").trim();
}

export async function generateMarketingContent(input: GenerateInput): Promise<{
  content: GeneratedMarketingContent;
  model: string;
  promptVersion: string;
  usedFallback: boolean;
}> {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MARKETING_MODEL || DEFAULT_MODEL;
  const promptVersion = "marketing-hub-v1";

  if (!apiKey) {
    return { content: fallbackContent(input), model: "fallback-template", promptVersion, usedFallback: true };
  }

  const schema = {
    type: "object",
    additionalProperties: false,
    required: ["topic", "blog", "assets"],
    properties: {
      topic: {
        type: "object",
        additionalProperties: false,
        required: ["title", "theme", "primaryKeyword", "secondaryKeywords", "intent"],
        properties: {
          title: { type: "string" },
          theme: { type: "string" },
          primaryKeyword: { type: "string" },
          secondaryKeywords: { type: "array", items: { type: "string" } },
          intent: { type: "string" },
        },
      },
      blog: {
        type: "object",
        additionalProperties: false,
        required: ["title", "slug", "excerpt", "contentMarkdown", "seoTitle", "seoDescription", "focusKeyword", "tags"],
        properties: {
          title: { type: "string" },
          slug: { type: "string" },
          excerpt: { type: "string" },
          contentMarkdown: { type: "string" },
          seoTitle: { type: "string" },
          seoDescription: { type: "string" },
          focusKeyword: { type: "string" },
          tags: { type: "array", items: { type: "string" } },
        },
      },
      assets: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["channel", "variant", "title", "body"],
          properties: {
            channel: { type: "string", enum: ["master_article", "blog", "threads", "linkedin", "x", "facebook", "newsletter"] },
            variant: { type: "number" },
            title: { type: ["string", "null"] },
            body: { type: "string" },
          },
        },
      },
    },
  };

  try {
    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        instructions:
          [
            "You are PMP Mastery Lab's marketing strategist and PMP exam-prep editor.",
            "Generate accurate, practical PMP exam prep content for a premium education SaaS blog.",
            "Do not imply PMI endorsement, do not guarantee passing, and keep the blog as the source of truth.",
            "The blog.contentMarkdown field must be Markdown only, no HTML.",
            "Use a strong article structure with 5-7 H2 sections and optional H3 subsections.",
            "If a comparison table is useful, use a valid GitHub-style Markdown pipe table with one header row, one separator row, and no blank lines between table rows.",
            "Include exactly one PMP tip callout using this syntax: :::tip, then useful tip text, then :::.",
            "Include exactly one practice question block using this syntax: :::question, then Question:, A-D choices, Correct:, Explanation:, then :::.",
            "Do not include a final sales CTA inside the article body; the article template adds conversion CTAs automatically.",
            "In every channel asset, use absolute public URLs beginning with the site domain; never use relative /blog/... paths.",
          ].join(" "),
        input: `Create a content pyramid for topic "${input.topic}". Primary keyword: "${input.primaryKeyword ?? ""}". Theme: "${input.theme ?? ""}". Site URL: "${input.baseUrl ?? "https://www.pmpmasterylab.com"}". Return only structured JSON. The article should teach exam decision-making, include concrete PMP scenario framing, and be easy to scan with headings, lists, one tip callout, and one practice question block.`,
        text: {
          format: {
            type: "json_schema",
            name: "marketing_content_pyramid",
            strict: true,
            schema,
          },
        },
      }),
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => "");
      throw new Error(`OpenAI request failed: ${res.status}${errorText ? ` ${errorText}` : ""}`);
    }
    const json = await res.json();
    const outputText = extractOutputText(json);
    const parsed = JSON.parse(outputText) as GeneratedMarketingContent;
    parsed.blog.slug = withFallbackSlug(parsed.blog.slug || parsed.blog.title);
    return { content: parsed, model, promptVersion, usedFallback: false };
  } catch (error) {
    console.error("[marketing] AI generation failed, using fallback:", error);
    return { content: fallbackContent(input), model: "fallback-template", promptVersion, usedFallback: true };
  }
}
