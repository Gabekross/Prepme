import type { GeneratedMarketingContent } from "./types";
import { withFallbackSlug } from "./slug";

export type MarketingContentMode = "exam_prep" | "pm_professional";

type GenerateInput = {
  topic: string;
  primaryKeyword?: string;
  theme?: string;
  baseUrl?: string;
  contentMode?: MarketingContentMode;
};

const DEFAULT_MODEL = "gpt-4.1-mini";

function fallbackContent(input: GenerateInput): GeneratedMarketingContent {
  const topic = input.topic.trim();
  const primaryKeyword = input.primaryKeyword?.trim() || topic;
  const contentMode = input.contentMode ?? "exam_prep";
  const theme = input.theme?.trim() || (contentMode === "pm_professional" ? "Project Management" : "PMP Exam Prep");
  const slug = withFallbackSlug(topic);
  const baseUrl = (input.baseUrl || "https://www.pmpmasterylab.com").replace(/\/$/, "");
  const blogUrl = `${baseUrl}/blog/${slug}`;

  if (contentMode === "pm_professional") {
    const title = `${topic}: A Practical Guide for Project Professionals`;
    const excerpt = `A practical project management guide to ${topic.toLowerCase()} for working professionals, team leaders, and PMP candidates.`;
    const contentMarkdown = [
      `# ${title}`,
      "",
      `## Why ${topic} Matters in Real Projects`,
      `${topic} affects how teams communicate, make decisions, manage uncertainty, and protect delivery outcomes. Strong project professionals use it to improve alignment, reduce friction, and help stakeholders make better choices.`,
      "",
      ":::tip",
      "Label: Project Management Tip",
      `Use ${topic.toLowerCase()} as a decision lens: clarify the situation, identify the people affected, make trade-offs visible, and choose the next action that protects value.`,
      ":::",
      "",
      "## What Good Looks Like",
      "- The team understands the goal and the decision being made.",
      "- Stakeholders have enough context to participate meaningfully.",
      "- Risks, assumptions, and constraints are visible.",
      "- The next step is practical, ethical, and aligned with business value.",
      "",
      "## How to Apply It at Work",
      `When ${topic.toLowerCase()} shows up in a project, start by diagnosing the situation instead of jumping to a tool. Look at the team dynamics, stakeholder expectations, delivery approach, risks, and decision rights before choosing an action.`,
      "",
      "## Common Mistakes to Avoid",
      `Avoid treating ${topic.toLowerCase()} as a checklist exercise. The stronger move is to adapt the approach to the team, organization, and delivery context while keeping outcomes and people in view.`,
      "",
      "## PMP Exam Connection",
      `For PMP candidates, ${topic.toLowerCase()} can still appear in scenario questions. The exam connection is usually about choosing a collaborative, value-focused, and context-aware response rather than memorizing a definition.`,
      "",
      "## Reflection Prompt",
      `Think of a recent project where ${topic.toLowerCase()} affected delivery. What signal did you notice first, who needed to be involved, and what would you do differently next time?`,
    ].join("\n");

    return {
      topic: {
        title: topic,
        theme,
        primaryKeyword,
        secondaryKeywords: ["project management", "team leadership", "PMP professional development"],
        intent: "informational",
      },
      blog: {
        title,
        slug,
        excerpt,
        contentMarkdown,
        seoTitle: `${topic} for Project Professionals | PMP Mastery Lab`,
        seoDescription: excerpt.slice(0, 155),
        focusKeyword: primaryKeyword,
        tags: [theme, "Project Management", "Professional Development"],
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
          body: `${topic} is not just a PMP exam topic. It is a practical project leadership skill: clarify the situation, engage the right people, and protect value. Blog: ${blogUrl}`,
        },
        {
          channel: "threads",
          variant: 2,
          body: `Project management tip: when ${topic.toLowerCase()} shows up, pause before reaching for a template. Diagnose the people, risks, constraints, and value trade-offs first.`,
        },
        {
          channel: "linkedin",
          variant: 1,
          body: [
            `Project professionals often run into ${topic.toLowerCase()} before it shows up in a status report.`,
            "",
            "The challenge is not just knowing the concept. It is recognizing the signal early, involving the right people, and choosing a response that protects delivery without creating unnecessary friction.",
            "",
            "A useful pattern:",
            "- Clarify what is actually happening",
            "- Identify who is affected",
            "- Make risks and trade-offs visible",
            "- Choose the next action that protects value",
            "",
            `I broke this down with practical examples here: ${blogUrl}`,
          ].join("\n"),
        },
        {
          channel: "x",
          variant: 1,
          body: `${topic}: clarify context, involve the right people, and choose the next action that protects value. Full guide: ${blogUrl}`,
        },
        {
          channel: "facebook",
          variant: 1,
          body: `Whether you are leading projects now or preparing for the PMP exam, ${topic.toLowerCase()} is easier to apply when you connect it to real team and stakeholder decisions. Read the guide: ${blogUrl}`,
        },
        {
          channel: "newsletter",
          variant: 1,
          title: `${topic} for Project Professionals`,
          body: `This week in PMP Mastery Lab: ${topic}. A practical guide for project professionals, team leaders, and PMP candidates who want to apply the concept beyond exam memorization. Read the full guide: ${blogUrl}`,
        },
      ],
    };
  }

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
        body: [
          `PMP candidates often miss ${topic.toLowerCase()} questions because they jump straight to the tool or the escalation path.`,
          "",
          "The stronger exam move is usually more deliberate: understand the situation, engage the right people, and connect the next action to project value.",
          "",
          "A simple decision pattern:",
          "- Clarify the problem before selecting a process",
          "- Consider the team and stakeholder impact",
          "- Make risks or assumptions visible",
          "- Escalate only when the situation truly calls for it",
          "",
          `I broke this down further here: ${blogUrl}`,
        ].join("\n"),
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
  const contentMode = input.contentMode ?? "exam_prep";
  const promptVersion = contentMode === "pm_professional" ? "marketing-hub-v2-pm-professional" : "marketing-hub-v1-exam-prep";

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
            contentMode === "pm_professional"
              ? "You are PMP Mastery Lab's project management education editor."
              : "You are PMP Mastery Lab's marketing strategist and PMP exam-prep editor.",
            contentMode === "pm_professional"
              ? "Generate accurate, practical project management content for working project professionals, PMP candidates, team leaders, scrum masters, and delivery managers."
              : "Generate accurate, practical PMP exam prep content for a premium education SaaS blog.",
            contentMode === "pm_professional"
              ? "Teach real-world project management application first. Include PMP exam relevance only as a short secondary connection where useful."
              : "Keep the article focused on PMP exam readiness and scenario-based exam decision-making.",
            contentMode === "pm_professional"
              ? "Avoid making every section about the PMP exam, exam questions, candidates, or test-taking."
              : "Use concrete PMP scenario framing and exam-oriented decision patterns.",
            "Do not imply PMI endorsement, do not guarantee passing, and keep the blog as the source of truth.",
            "The blog.contentMarkdown field must be Markdown only, no HTML.",
            "Use a strong article structure with 5-7 H2 sections and optional H3 subsections.",
            "If a comparison table is useful, use a valid GitHub-style Markdown pipe table with one header row, one separator row, and no blank lines between table rows.",
            contentMode === "pm_professional"
              ? "Include exactly one project management tip callout using this syntax: :::tip, then Label: Project Management Tip, then useful tip text, then :::."
              : "Include exactly one PMP tip callout using this syntax: :::tip, then useful tip text, then :::.",
            contentMode === "pm_professional"
              ? "Do not include a practice question block unless the topic strongly benefits from a short application scenario. If included, keep it workplace-focused with only a brief PMP exam connection."
              : "Include exactly one practice question block using this syntax: :::question, then Question:, A-D choices, Correct:, Explanation:, then :::.",
            "Do not include a final sales CTA inside the article body; the article template adds conversion CTAs automatically.",
            "For LinkedIn assets, write a richer professional post than the short social assets: start with a practical hook, add brief context, include 2-4 useful bullets or a decision pattern, and end with a soft link to the article. LinkedIn should feel educational and professional, not like a short ad.",
            "In every channel asset, use absolute public URLs beginning with the site domain; never use relative /blog/... paths.",
          ].join(" "),
        input:
          contentMode === "pm_professional"
            ? `Create a content pyramid for topic "${input.topic}". Primary keyword: "${input.primaryKeyword ?? ""}". Theme: "${input.theme ?? ""}". Site URL: "${input.baseUrl ?? "https://www.pmpmasterylab.com"}". Return only structured JSON. The article should teach practical project management decision-making for working professionals, include real-world workplace examples, and add only a brief PMP exam takeaway where useful. Keep the article easy to scan with headings, lists, one tip callout, and practical application guidance.`
            : `Create a content pyramid for topic "${input.topic}". Primary keyword: "${input.primaryKeyword ?? ""}". Theme: "${input.theme ?? ""}". Site URL: "${input.baseUrl ?? "https://www.pmpmasterylab.com"}". Return only structured JSON. The article should teach exam decision-making, include concrete PMP scenario framing, and be easy to scan with headings, lists, one tip callout, and one practice question block.`,
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
