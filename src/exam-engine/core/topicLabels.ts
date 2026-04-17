/**
 * Curated topic buckets per domain, built on top of the existing free-form
 * `tags` on each Question. Used by the dashboard to show per-topic accuracy
 * nested under each domain in the Performance Analytics section.
 *
 * Each bucket lists the raw tags (lowercase, kebab-case) that should count
 * toward it. A question can match multiple topics if its tags overlap
 * multiple buckets. Tags not present in any bucket are ignored.
 *
 * Keep this list intentionally short (~5–8 topics per domain). This is a
 * UI grouping layer, not a taxonomy — authors are free to add new raw tags
 * without breaking anything; unmapped tags simply won't appear as topics.
 */

import type { Domain } from "./types";

export type TopicDef = {
  /** Stable slug used as React key. */
  id: string;
  /** Human-readable label for the dashboard bar. */
  label: string;
  /** Raw question `tags` values that count toward this topic. */
  tags: string[];
};

export const TOPICS_BY_DOMAIN: Record<Domain, TopicDef[]> = {
  people: [
    {
      id: "leadership",
      label: "Leadership",
      tags: [
        "leadership",
        "leadership-styles",
        "situational",
        "servant-leadership",
        "adaptive-leadership",
        "authentic-leadership",
        "lmx-theory",
        "leader-member-exchange",
        "shared-leadership",
        "distributed-leadership",
        "blake-mouton",
        "heifetz",
        "power",
        "power-types",
      ],
    },
    {
      id: "conflict",
      label: "Conflict & Negotiation",
      tags: [
        "conflict",
        "conflict-resolution",
        "thomas-kilmann",
        "negotiation",
        "productive-conflict",
        "creative-tension",
      ],
    },
    {
      id: "team-development",
      label: "Team Development",
      tags: [
        "team-development",
        "tuckman",
        "team-stages",
        "stages-order",
        "team-charter",
        "norming",
        "team-dysfunctions",
        "lencioni",
        "drexler-sibbet",
        "team-performance-model",
        "team-composition",
        "t-shaped-skills",
        "team-norms",
        "constructive-norms",
        "destructive-norms",
        "cognitive-diversity",
        "self-organizing",
      ],
    },
    {
      id: "motivation",
      label: "Motivation & Recognition",
      tags: [
        "motivation",
        "maslow",
        "herzberg",
        "hierarchy",
        "recognition",
        "intrinsic-extrinsic-motivation",
        "ocb",
        "organizational-citizenship",
        "learned-helplessness",
        "team-recovery",
        "knowledge-workers",
      ],
    },
    {
      id: "communication",
      label: "Communication",
      tags: [
        "communication",
        "communication-methods",
        "communication-plan",
        "communication-richness",
        "daft-lengel",
        "active-listening",
        "feedback",
        "sbm",
      ],
    },
    {
      id: "emotional-intelligence",
      label: "Emotional Intelligence",
      tags: [
        "emotional-intelligence",
        "competencies",
        "emotional-labor",
        "compassion-fatigue",
        "psychological-safety",
      ],
    },
    {
      id: "stakeholder-engagement",
      label: "Stakeholder Engagement",
      tags: [
        "stakeholder",
        "stakeholders",
        "stakeholder-analysis",
        "stakeholder-engagement",
        "stakeholder-cube",
        "managing-upward",
        "sponsor-engagement",
        "influence",
        "power-interest",
      ],
    },
    {
      id: "coaching-empowerment",
      label: "Coaching & Empowerment",
      tags: ["coaching", "mentoring", "delegation", "empowerment"],
    },
    {
      id: "virtual-diversity",
      label: "Virtual Teams & Diversity",
      tags: ["virtual-teams", "cultural-diversity", "inclusion"],
    },
    {
      id: "facilitation",
      label: "Facilitation",
      tags: [
        "facilitation-techniques",
        "world-cafe",
        "open-space",
        "fishbowl",
        "appreciative-inquiry",
        "4d-cycle",
      ],
    },
    {
      id: "ethics",
      label: "Ethics & Professional Responsibility",
      tags: ["ethical", "code-of-ethics"],
    },
  ],

  process: [
    {
      id: "scope-requirements",
      label: "Scope & Requirements",
      tags: [
        "scope",
        "scope-management",
        "scope-verification",
        "control-scope",
        "project-scope",
        "product-scope",
        "wbs",
        "control-account",
        "work-package",
        "100-percent-rule",
        "requirements",
        "traceability",
        "acceptance-criteria",
        "gold-plating",
      ],
    },
    {
      id: "schedule",
      label: "Schedule",
      tags: [
        "schedule",
        "schedule-management",
        "critical-path",
        "schedule-network",
        "network-diagram",
        "float",
        "slack",
        "schedule-compression",
        "crashing",
        "fast-tracking",
        "milestone",
        "dependency",
        "lag",
        "lead",
        "relationships",
        "pert",
        "three-point-estimate",
        "analogous-estimating",
      ],
    },
    {
      id: "cost-ev",
      label: "Cost & Earned Value",
      tags: [
        "cost",
        "cost-management",
        "cost-types",
        "cost-baseline",
        "budget",
        "earned-value",
        "cpi",
        "spi",
        "eac",
        "vac",
        "tcpi",
        "forecasting",
      ],
    },
    {
      id: "quality",
      label: "Quality",
      tags: [
        "quality",
        "quality-control",
        "quality-tools",
        "seven-tools",
        "ishikawa",
        "cause-effect",
        "control-chart",
        "prevention",
        "inspection",
        "grade-vs-quality",
      ],
    },
    {
      id: "risk",
      label: "Risk",
      tags: [
        "risk",
        "risk-management",
        "risk-register",
        "risk-identification",
        "risk-response",
        "risk-responses",
        "response-strategies",
        "qualitative",
        "quantitative-risk",
        "monte-carlo",
        "decision-tree",
        "expected-value",
        "contingency-reserve",
        "residual",
        "secondary",
        "opportunities",
      ],
    },
    {
      id: "procurement",
      label: "Procurement",
      tags: ["procurement", "contract-types", "make-or-buy", "sow"],
    },
    {
      id: "agile",
      label: "Agile & Hybrid",
      tags: [
        "agile",
        "hybrid",
        "predictive",
        "scrum",
        "scrum-roles",
        "sprint",
        "sprint-planning",
        "ceremonies",
        "kanban",
        "wip",
        "flow",
        "manifesto",
        "principles",
        "backlog",
        "backlog-refinement",
        "product-owner",
        "user-story",
        "epic",
        "story-map",
        "definition-of-done",
        "spike",
        "velocity",
        "mvp",
        "value-delivery",
        "scaling",
        "safe",
        "continuous-delivery",
        "devops",
      ],
    },
    {
      id: "change-integration",
      label: "Change Control & Integration",
      tags: [
        "change-control",
        "integrated-change-control",
        "configuration-management",
        "version-control",
        "scope-creep",
        "project-management-plan",
        "project-charter",
        "initiating",
        "project-lifecycle",
        "project-closure",
        "lessons-learned",
        "knowledge-management",
        "issue-log",
        "issues",
        "administrative",
      ],
    },
    {
      id: "resource",
      label: "Resources",
      tags: ["resource", "resource-leveling", "resource-management"],
    },
  ],

  business_environment: [
    {
      id: "business-case-benefits",
      label: "Business Case & Benefits",
      tags: ["business-case", "benefits", "benefits-realization", "opm"],
    },
    {
      id: "strategy-alignment",
      label: "Strategy & Alignment",
      tags: [
        "organizational-strategy",
        "alignment",
        "pestle",
        "environmental-analysis",
      ],
    },
    {
      id: "governance-pmo",
      label: "Governance & PMO",
      tags: ["pmo", "governance", "pmo-types"],
    },
    {
      id: "portfolio-program",
      label: "Portfolio / Program / Project",
      tags: ["portfolio", "program", "project", "portfolio-program-project", "hierarchy"],
    },
    {
      id: "opas-eefs",
      label: "OPAs & EEFs",
      tags: ["opas", "eefs"],
    },
    {
      id: "compliance",
      label: "Compliance & External Factors",
      tags: ["compliance", "regulations", "sustainability", "esg"],
    },
  ],
};

/**
 * Build a reverse lookup: tag (case-insensitive) → topic id(s) for a given domain.
 * Tags not in any bucket are omitted.
 */
export function buildTopicIndex(): Record<Domain, Map<string, string[]>> {
  const out = {} as Record<Domain, Map<string, string[]>>;
  (Object.keys(TOPICS_BY_DOMAIN) as Domain[]).forEach((d) => {
    const m = new Map<string, string[]>();
    for (const topic of TOPICS_BY_DOMAIN[d]) {
      for (const raw of topic.tags) {
        const key = raw.toLowerCase();
        const list = m.get(key) ?? [];
        list.push(topic.id);
        m.set(key, list);
      }
    }
    out[d] = m;
  });
  return out;
}
