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
    "## The PMP Mindset",
    "- Start with the team and stakeholders before jumping to escalation.",
    "- Clarify the problem before selecting a tool or process.",
    "- Favor servant leadership, transparency, and adaptive decision-making.",
    "- Connect the decision to value delivery and risk reduction.",
    "",
    "## How to Apply It on Exam Questions",
    `When a question involves ${topic.toLowerCase()}, look for the answer that improves collaboration, makes information visible, and respects the project life cycle. Avoid answers that skip analysis, punish the team, or bypass agreed governance.`,
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
          "You are PMP Mastery Lab's marketing strategist. Generate accurate, practical PMP exam prep content. Do not imply PMI endorsement, do not guarantee passing, and keep the blog as the source of truth. In every channel asset, use absolute public URLs beginning with the site domain; never use relative /blog/... paths.",
        input: `Create a content pyramid for topic "${input.topic}". Primary keyword: "${input.primaryKeyword ?? ""}". Theme: "${input.theme ?? ""}". Site URL: "${input.baseUrl ?? "https://www.pmpmasterylab.com"}". Return only structured JSON.`,
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
