import { supabaseAdmin } from "@/lib/supabase/server";

type CampaignKey =
  | "one_day_question"
  | "three_day_tip"
  | "seven_day_feedback"
  | "weekly_question";

type Candidate = {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
};

type AttemptRow = {
  user_id: string;
  mode: "practice" | "exam";
  score_percent: number | null;
  submitted_at: string | null;
  updated_at: string | null;
};

type SubscriptionRow = {
  user_id: string;
  unsubscribe_token: string;
  marketing_opted_out_at: string | null;
  lifecycle_opted_out_at: string | null;
};

type Campaign = {
  key: CampaignKey;
  subject: string;
  preheader: string;
  ctaLabel: string;
  ctaPath: string;
  body: (context: EmailContext) => string;
};

type EmailContext = {
  user: Candidate;
  unsubscribeUrl: string;
  siteUrl: string;
  latestAttempt?: AttemptRow;
};

type SendResult = {
  sent: number;
  skipped: number;
  failed: number;
};

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const fromEmail = process.env.EMAIL_FROM ?? "PMP Exam Engine <onboarding@example.com>";
const companyAddress = process.env.EMAIL_COMPANY_ADDRESS ?? "Add your mailing address in EMAIL_COMPANY_ADDRESS";

const campaigns: Record<CampaignKey, Campaign> = {
  one_day_question: {
    key: "one_day_question",
    subject: "Quick PMP question for today",
    preheader: "One question is enough to keep the habit alive.",
    ctaLabel: "Answer Today's Question",
    ctaPath: "/bank/pmp/practice?count=1",
    body: () =>
      "Here is the whole goal for today: answer one PMP-style question and read the explanation. Tiny sessions are still real progress.",
  },
  three_day_tip: {
    key: "three_day_tip",
    subject: "A common PMP trap to avoid",
    preheader: "Practice the decision pattern, not just the answer.",
    ctaLabel: "Practice This Pattern",
    ctaPath: "/bank/pmp/practice?count=5",
    body: () =>
      "When a PMP question describes conflict, change, risk, or uncertainty, look for the answer that investigates, communicates, and follows the plan before jumping to action.",
  },
  seven_day_feedback: {
    key: "seven_day_feedback",
    subject: "Was anything confusing?",
    preheader: "A quick reply would help improve the app.",
    ctaLabel: "Continue Studying",
    ctaPath: "/bank/pmp",
    body: () =>
      "I noticed you tried the app but have not been back much. If anything felt confusing, missing, or not useful, just reply to this email. I read the feedback and use it to improve the product.",
  },
  weekly_question: {
    key: "weekly_question",
    subject: "This week's PMP practice prompt",
    preheader: "A small weekly reset for your exam prep.",
    ctaLabel: "Take a 5-Question Set",
    ctaPath: "/bank/pmp/practice?count=5",
    body: (context) => {
      if (context.latestAttempt?.score_percent != null) {
        return `Your latest score was ${context.latestAttempt.score_percent}%. Use this week's short set to reinforce weak areas and keep your study rhythm alive.`;
      }
      return "Use this week's short practice set to restart your study rhythm. Five questions is enough to expose one weak area and give you something concrete to improve.";
    },
  },
};

function daysSince(value: string | null) {
  if (!value) return Number.POSITIVE_INFINITY;
  return Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000);
}

function htmlEscape(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderEmail(campaign: Campaign, context: EmailContext) {
  const ctaUrl = `${context.siteUrl}${campaign.ctaPath}`;
  const body = htmlEscape(campaign.body(context));

  return `
<!doctype html>
<html>
  <body style="margin:0;background:#f6f7fb;font-family:Arial,sans-serif;color:#1f2937;">
    <div style="display:none;max-height:0;overflow:hidden;">${htmlEscape(campaign.preheader)}</div>
    <main style="max-width:560px;margin:0 auto;padding:28px 16px;">
      <section style="background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;padding:24px;">
        <h1 style="font-size:22px;line-height:1.25;margin:0 0 12px;color:#111827;">${htmlEscape(campaign.subject)}</h1>
        <p style="font-size:15px;line-height:1.6;margin:0 0 20px;">${body}</p>
        <a href="${ctaUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-weight:700;border-radius:8px;padding:12px 16px;">
          ${htmlEscape(campaign.ctaLabel)}
        </a>
      </section>
      <p style="font-size:12px;line-height:1.5;color:#6b7280;margin:16px 4px 0;">
        You are receiving this because you created an account for PMP Exam Engine.
        ${htmlEscape(companyAddress)}.
        <a href="${context.unsubscribeUrl}" style="color:#2563eb;">Unsubscribe</a>
      </p>
    </main>
  </body>
</html>`;
}

function selectCampaign(user: Candidate, latestAttempt?: AttemptRow): CampaignKey | null {
  const accountAge = daysSince(user.created_at);
  const lastSeenAge = daysSince(user.last_sign_in_at ?? user.created_at);

  if (accountAge >= 1 && accountAge < 3 && lastSeenAge >= 1) return "one_day_question";
  if (accountAge >= 3 && accountAge < 7 && lastSeenAge >= 3) return "three_day_tip";
  if (accountAge >= 7 && accountAge < 14 && lastSeenAge >= 7) return "seven_day_feedback";
  if (accountAge >= 14 && lastSeenAge >= 7) return "weekly_question";

  return null;
}

async function sendWithResend(to: string, subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to,
      subject,
      html,
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.message ?? `Resend returned ${response.status}`);
  }

  return typeof payload?.id === "string" ? payload.id : null;
}

export async function runLifecycleEmailAutomation(limit = 50): Promise<SendResult> {
  const admin = supabaseAdmin();
  const result: SendResult = { sent: 0, skipped: 0, failed: 0 };

  const { data: userData, error: userError } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: limit,
  });
  if (userError) throw userError;

  const users: Candidate[] = (userData.users ?? [])
    .filter((user) => Boolean(user.email))
    .map((user) => ({
      id: user.id,
      email: user.email!,
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at ?? null,
    }));

  if (users.length === 0) return result;

  const userIds = users.map((user) => user.id);

  await admin
    .from("email_subscriptions")
    .upsert(userIds.map((user_id) => ({ user_id })), { onConflict: "user_id", ignoreDuplicates: true });

  const [{ data: roles }, { data: attempts }, { data: subscriptions }, { data: sends }] =
    await Promise.all([
      admin.from("user_roles").select("user_id, role").in("user_id", userIds),
      admin
        .from("attempts")
        .select("user_id, mode, score_percent, submitted_at, updated_at")
        .in("user_id", userIds)
        .order("updated_at", { ascending: false }),
      admin
        .from("email_subscriptions")
        .select("user_id, unsubscribe_token, marketing_opted_out_at, lifecycle_opted_out_at")
        .in("user_id", userIds),
      admin
        .from("lifecycle_email_sends")
        .select("user_id, campaign_key, sent_at")
        .in("user_id", userIds)
        .eq("status", "sent"),
    ]);

  const proUsers = new Set((roles ?? []).filter((role: any) => role.role === "pro").map((role: any) => role.user_id));
  const attemptByUser = new Map<string, AttemptRow>();
  for (const attempt of (attempts ?? []) as AttemptRow[]) {
    if (!attemptByUser.has(attempt.user_id)) attemptByUser.set(attempt.user_id, attempt);
  }
  const subscriptionByUser = new Map<string, SubscriptionRow>(
    ((subscriptions ?? []) as SubscriptionRow[]).map((sub) => [sub.user_id, sub])
  );
  const sentKeys = new Set((sends ?? []).map((send: any) => `${send.user_id}:${send.campaign_key}`));

  for (const user of users) {
    const sub = subscriptionByUser.get(user.id);
    const latestAttempt = attemptByUser.get(user.id);
    const campaignKey = selectCampaign(user, latestAttempt);

    if (!campaignKey || proUsers.has(user.id) || !sub || sub.marketing_opted_out_at || sub.lifecycle_opted_out_at) {
      result.skipped += 1;
      continue;
    }

    if (sentKeys.has(`${user.id}:${campaignKey}`)) {
      result.skipped += 1;
      continue;
    }

    const campaign = campaigns[campaignKey];
    const unsubscribeUrl = `${siteUrl}/api/email/unsubscribe?token=${encodeURIComponent(sub.unsubscribe_token)}`;
    const html = renderEmail(campaign, { user, unsubscribeUrl, siteUrl, latestAttempt });

    try {
      const providerMessageId = await sendWithResend(user.email, campaign.subject, html);
      await admin.from("lifecycle_email_sends").insert({
        user_id: user.id,
        campaign_key: campaign.key,
        provider_message_id: providerMessageId,
        status: "sent",
      });
      result.sent += 1;
    } catch (err: any) {
      await admin.from("lifecycle_email_sends").insert({
        user_id: user.id,
        campaign_key: campaign.key,
        status: "failed",
        error_message: err?.message ?? "Unknown email error",
      });
      result.failed += 1;
    }
  }

  return result;
}
