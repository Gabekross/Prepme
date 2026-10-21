#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";

const fixturePath = "staging/set-a-replacements.json";
const manifestPath = "staging/set-a-2026-visual-manifest.json";
const questions = JSON.parse(readFileSync(fixturePath, "utf8"));
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const byId = new Map(questions.map((question) => [question.id, question]));
const visualByQuestion = new Map(manifest.assets.map((asset) => [asset.question, asset]));
const visualCaptions = new Map(Object.entries({
  R7: "Stakeholder response-time data",
  "pma-prc-002": "Activity network data",
  "pma-prc-003": "Status-date performance data",
  "pma-prc-006": "Forecast input data",
  "pma-prc-011": "Activity schedule data",
  "pma-prc-015": "Schedule-crashing options",
  "pma-prc-025": "Variance-at-completion data",
  "pma-prc-033": "Threat probability and impact data",
  "pma-prc-036": "Budget and reserve data",
  "pma-prc-039": "Three-point duration data",
  "pma-prc-047": "Decision-tree outcome data",
  "pma-prc-089": "Milestone confidence data",
}));

const choice = (id, text) => ({ id, text });
const reviewMetadata = {
  editorialStatus: "provisionally_approved",
  authoringVersion: "set-a-july-2026-v2",
  smeDecision: "approved",
  validatorDecision: "approved",
  ownerDecision: "approved",
  reviewDate: "2026-10-21",
};

function mediaFor(questionId) {
  const asset = visualByQuestion.get(questionId);
  if (!asset) throw new Error(`Missing visual manifest entry for ${questionId}`);
  return {
    imageUrl: `${manifest.assetDirectory}${asset.file}`,
    alt: asset.alt,
    table: {
      caption: visualCaptions.get(questionId) ?? "Exhibit data",
      columns: asset.columns.map(String),
      rows: asset.rows.map((row) => row.map((cell) => String(cell))),
    },
  };
}

function replace(id, fields) {
  const current = byId.get(id);
  if (!current) throw new Error(`Question not found: ${id}`);
  Object.assign(current, fields, {
    metadata: { ...current.metadata, ...reviewMetadata, ...(fields.metadata ?? {}) },
  });
}

const replacements = [
  {
    id: "pma-ppl-035", domain: "people", task: "People Task 3", approach: "Adaptive",
    prompt: "An experienced team uses an approved generative-AI assistant to draft customer-support workflows. Representative-user testing finds that the tool repeatedly omits a documented alternate route for customers who cannot use the standard digital flow. The team wants to keep using it because drafting is faster. What should the project manager do first?",
    choices: [choice("a", "Pause this workflow until the vendor supplies a corrected model, while retaining the existing acceptance test."), choice("b", "Analyze the failure, add accountable human review and measurable accessibility criteria, and validate the revised workflow with representative users."), choice("c", "Continue the pilot with a warning for reviewers because the team remains accountable for the final workflow."), choice("d", "Add a second automated checker and accept a workflow whenever the two tools agree.")],
    key: "b",
    explanation: "AI can accelerate drafting, but it does not replace accountable human judgment. B investigates the observed failure, adds a control tied to the documented accessibility requirement, and verifies that the revised workflow works for affected users. A makes remediation depend entirely on the vendor and does not establish an internal control. C knowingly leaves a demonstrated quality gap in place. D measures agreement between tools, not compliance with the user requirement.",
  },
  {
    id: "pma-ppl-040", domain: "people", task: "People Task 3", approach: "Hybrid",
    prompt: "An AI-assisted forecast influences staffing recommendations. Operations owns staffing decisions, data engineering owns source quality, and a vendor maintains the model. After a market disruption, the model continues producing confident recommendations from unrepresentative historical data. No role owns the decision to suspend model use. What should the project manager do first?",
    choices: [choice("a", "Ask the vendor to decide when the model should be suspended because it maintains the algorithm."), choice("b", "Establish ownership and thresholds for data quality, suspension, human staffing decisions, escalation, and monitored re-entry."), choice("c", "Let operations override individual recommendations while data engineering continues monitoring inputs."), choice("d", "Suspend the model until the annual review and return staffing decisions to the project manager.")],
    key: "b",
    explanation: "The immediate gap is decision ownership across organizational boundaries. B defines accountable authority, measurable suspension thresholds, human decision responsibility, escalation, and the evidence required before reuse. A delegates organizational accountability to an external vendor. C permits individual overrides but leaves the system-level suspension decision unresolved. D is disproportionate and assigns staffing authority to the project manager without support from the scenario.",
  },
  {
    id: "pma-ppl-065", domain: "people", task: "People Task 4", approach: "Hybrid",
    prompt: "A public agency is piloting an AI tool that summarizes supplier proposals. Procurement retains formal scoring authority. The pilot saves time but underrates proposals from smaller suppliers whose evidence appears in nonstandard sections. Which group should the project manager engage to assess the impact and define the next controlled action?",
    choices: [choice("a", "Procurement decision owners and the vendor, using only aggregate supplier results until the next award cycle."), choice("b", "Procurement decision owners, authorized small-supplier representatives, and AI, data, and legal specialists under confidentiality rules."), choice("c", "The sponsor and legal counsel, who can decide whether efficiency justifies continued use."), choice("d", "The technical team and internal audit, who can correct the model before affected stakeholders are consulted.")],
    key: "b",
    explanation: "B combines the accountable procurement decision owners, authorized insight from the affected supplier group, and the technical and legal expertise needed to investigate within confidentiality controls. A lacks affected-party evidence and delays action. C omits the technical and supplier perspectives needed to understand the disparity. D begins remediation before the impact and user evidence are understood, which risks solving the wrong problem.",
  },
  {
    id: "pma-ppl-066", domain: "people", task: "People Task 2", approach: "Hybrid",
    prompt: "A public agency's AI proposal-summary pilot saves review time but underrates smaller suppliers whose evidence appears in nonstandard sections. The procurement lead wants to suspend the pilot. The innovation lead wants immediate expansion because average review time fell by 35%. Both accept facilitated discussion, and no live award has used the tool's output. What should the project manager do?",
    choices: [choice("a", "Pause the pilot and escalate the competing recommendations with the existing evidence for a sponsor decision."), choice("b", "Agree criteria covering procurement integrity, error disparity, benefit, and reversibility, then route a bounded next step through the decision owner."), choice("c", "Expand only to low-value proposals while monitoring review time and supplier complaints."), choice("d", "Continue the existing pilot without expansion until the vendor explains the error pattern.")],
    key: "b",
    explanation: "B moves the parties from positions to shared, measurable decision criteria while preserving the authority of the designated decision owner. It addresses integrity, disparity, benefit, and reversibility before selecting a bounded next step. A escalates before developing decision-ready criteria. C permits expansion without an acceptable disparity threshold. D continues exposure without a defined control, acceptance condition, or decision point.",
  },
  {
    id: "pma-ppl-068", domain: "people", task: "People Task 6", approach: "Hybrid",
    prompt: "After controls are added to a public agency's AI proposal-summary pilot, review time remains 20% faster, but the small-supplier error rate remains above the pilot's approved tolerance. Policy requires documented human scoring and permits tools only as decision support. The governance board is deciding whether the pilot may continue. What should the project manager communicate?",
    choices: [choice("a", "Recommend conditional continuation because required human scoring makes the remaining disparity acceptable."), choice("b", "Report the time benefit, out-of-tolerance disparity, human-decision requirement, and measurable remediation or limited-pilot options."), choice("c", "Report the out-of-tolerance result and recommend suspension without including the measured efficiency benefit."), choice("d", "Report aggregate accuracy and review time because subgroup results could be commercially sensitive.")],
    key: "b",
    explanation: "B gives the governance board complete, decision-relevant evidence: the verified benefit, the unresolved out-of-tolerance disparity, the required human authority, and proportionate options with measurable controls. Human scoring does not automatically make the disparity acceptable. C omits a verified benefit and biases the decision record. D conceals a material subgroup outcome through aggregation rather than addressing confidentiality with controlled reporting.",
  },
  {
    id: "pma-ppl-070", domain: "people", task: "People Task 5", approach: "Predictive",
    prompt: "A sponsor favors the lowest-capital-cost construction option. Community and operations representatives favor lower operating emissions and better heat resilience at higher initial cost. Both options meet minimum regulation, the decision is open, and the governance board owns changes to success measures. What should the project manager do first?",
    choices: [choice("a", "Ask the sponsor and operations lead to negotiate a preferred option before community evidence is considered."), choice("b", "Facilitate measurable lifecycle cost, emissions, resilience, value, and risk criteria, then submit the analysis and any measure change to the board."), choice("c", "Retain capital cost as the deciding measure and document emissions and resilience as secondary observations."), choice("d", "Commission a technical lifecycle analysis before clarifying stakeholder priorities or decision criteria.")],
    key: "b",
    explanation: "B turns the conflicting expectations into measurable lifecycle, value, and risk criteria and preserves the governance board's authority over success measures. A excludes an affected community perspective from the decision process. C keeps one stakeholder's preferred measure as controlling despite material operating and resilience evidence. D begins analysis before clarifying what evidence the stakeholders and decision owner need, increasing the risk of an irrelevant study.",
  },
  {
    id: "pma-ppl-073", domain: "people", task: "People Task 8", approach: "Hybrid",
    prompt: "The exhibit compares median response time by stakeholder group during equal eight-week periods before and after reviews moved to a new portal. Each group submitted at least 30 requests in each period. The next design gate is in one week. What should the project manager do?",
    choices: [choice("a", "Report the combined median and continue the portal while collecting another eight weeks of data."), choice("b", "Investigate with the affected group, restore an accessible response route promptly, and report segmented outcomes and corrective measures."), choice("c", "Add a response-time target for the accessibility group while keeping the portal and support process unchanged."), choice("d", "Reopen email for every stakeholder group and compare results again after the gate.")],
    key: "b",
    explanation: "The segmented results show that aggregation would hide a material accessibility-group problem. B investigates with the affected stakeholders, promptly restores an accessible route, and closes the feedback loop with segmented outcomes and corrective measures. A conceals the disparity in a combined measure and delays action. C adds a target without changing the system causing the result. D changes the channel for every group without first diagnosing the affected group's needs.",
    media: mediaFor("R7"),
  },
  {
    id: "pma-prc-037", domain: "process", task: "Process Task 1", approach: "Hybrid",
    prompt: "A program plans to use an AI assistant to propose schedule-risk responses across twelve delivery teams. Historical data are incomplete for two teams, and governance requires a human owner to authorize baseline or funding changes. What should the project manager include in the integrated delivery plan?",
    choices: [choice("a", "Allow automatic responses above a team-defined confidence level while risk owners review exceptions."), choice("b", "Define data-quality checks, assumptions, human owners, validation measures, thresholds, and feedback for recalibration."), choice("c", "Keep every recommendation advisory and let each risk owner determine locally whether validation is necessary."), choice("d", "Pilot with the ten complete-data teams first and exclude the other two from shared monitoring until more history exists.")],
    key: "b",
    explanation: "B integrates the tool with the controls needed for reliable delivery: data-quality checks, explicit assumptions, accountable human owners, validation measures, thresholds, and feedback for recalibration. A permits automated action that bypasses the stated authorization requirement. C makes validation inconsistent despite known data limitations. D excludes two teams from system-level monitoring and prevents comparable evidence across the program.",
  },
  {
    id: "pma-prc-070", domain: "process", task: "Process Task 7", approach: "Hybrid",
    prompt: "A packaging team can replace a recyclable material that has a 6% seal-failure rate with a mixed material that has a 1% failure rate but cannot be processed by the customer's recycling stream. A third recyclable option can complete a two-week test before the decision gate in three weeks. Release is six weeks away, and the quality authority has defined a maximum 2% seal-failure rate. What should the project manager facilitate?",
    choices: [choice("a", "Adopt the mixed material for this release and open a later improvement item for recycling compatibility."), choice("b", "Continue the current recyclable material and increase inspection because the customer already processes it."), choice("c", "Test the third option against the seal threshold, regulatory, cost, schedule, and lifecycle criteria, then route the evidence to the quality authority."), choice("d", "Ask the supplier to recommend an option and accept it if the supplier warrants seal performance.")],
    key: "c",
    explanation: "C uses the available time to test the viable third option against quality, compliance, cost, schedule, and lifecycle criteria, then preserves the quality authority's decision rights. A meets the failure threshold but knowingly sacrifices the stated recycling outcome without an authorized tradeoff. B retains a known failure rate above the defined maximum. D delegates the decision to a supplier that does not own the project's full quality and sustainability obligations.",
  },
];

for (const item of replacements) {
  replace(item.id, {
    type: "mcq_single",
    domain: item.domain,
    prompt: item.prompt,
    payload: { choices: item.choices },
    answerKey: { correctChoiceId: item.key },
    explanation: item.explanation,
    ...(item.media ? { media: item.media } : {}),
    metadata: { primaryEcoTask: item.task, approach: item.approach, cognitiveLevel: "Apply/Analyze", sourceDraft: "staging/set-a-july-2026-alignment-review.md" },
  });
}

replace("pma-env-014", {
  type: "pull_down",
  prompt: "A central governance office must [choose an operating responsibility], while authority for day-to-day delivery remains with [choose a delivery owner]. Which combination best fits the stated governance need?",
  payload: { choices: [
    choice("a", "Set mandatory evidence and verify adherence; business-unit project managers retain day-to-day delivery."),
    choice("b", "Publish optional guidance; business-unit project managers retain day-to-day delivery."),
    choice("c", "Set mandatory evidence and verify adherence; the governance office assumes day-to-day delivery."),
    choice("d", "Directly manage delivery; external auditors assume day-to-day delivery."),
  ] },
  answerKey: { correctChoiceId: "a" },
  explanation: "For the first blank, setting mandatory evidence and verifying adherence supplies the required governance control; optional guidance would not ensure compliance, while directly managing delivery would exceed the stated role. For the second blank, business-unit project managers must retain day-to-day delivery authority. Therefore A is the only combination that provides mandatory oversight without transferring delivery responsibility.",
  metadata: { primaryEcoTask: "Business Environment Task 1", approach: "Predictive", cognitiveLevel: "Apply" },
});

for (const id of ["pma-prc-002", "pma-prc-003", "pma-prc-006", "pma-prc-011", "pma-prc-015", "pma-prc-025", "pma-prc-033", "pma-prc-036", "pma-prc-039", "pma-prc-047", "pma-prc-089"]) {
  replace(id, { media: mediaFor(id), metadata: { cognitiveLevel: "Apply/Analyze", mediaManifest: `${manifestPath}#${id}` } });
}

replace("pma-prc-089", {
  prompt: "A simulation for a contractual milestone produces P50 = August 24 and P80 = September 6. The contractual date is August 30, delay costs are $120,000 per week, and the sponsor's risk tolerance requires at least 80% confidence before committing. What should the project manager report?",
  payload: { choices: [
    choice("a", "Commit to August 24 because P50 is the most likely date."),
    choice("b", "Commit to August 30 because it lies between P50 and P80."),
    choice("c", "Explain that the contractual date has less than 80% confidence, describe the $120,000-per-week delay consequence, and evaluate response or contingency options with the sponsor."),
    choice("d", "Commit to September 6 without evaluating recovery because P80 is always the required promise."),
  ] },
  answerKey: { correctChoiceId: "c" },
  explanation: "P50 means a 50% probability of finishing on or before August 24; it is not a high-confidence commitment. Because the August 30 contractual date occurs before the P80 date of September 6, its confidence is below the sponsor's required 80%. C communicates that shortfall, states the known $120,000-per-week consequence, and evaluates response or contingency options with the decision owner. A and B overstate confidence. D treats P80 as an automatic commitment rather than an input to a risk-informed decision. The available data do not provide enough information to calculate a probability-weighted financial exposure.",
  media: mediaFor("pma-prc-089"),
  metadata: { primaryEcoTask: "Process Task 8", approach: "Predictive", cognitiveLevel: "Analyze" },
});

const editorialReplacements = new Map([
  ["pma-ppl-057", "A converts verified local evidence into a governed organizational improvement and shares it where it can prevent recurrence. The playbook owner can evaluate the evidence, update the controlled guidance, communicate the change, and verify adoption across teams. B and D keep useful learning local, so other projects remain exposed to the same problem. C may be well intentioned, but it bypasses the stated ownership and evidence-review process, creating competing guidance without authorization or traceability."],
  ["pma-prc-012", "The coverage is available and funded, and the $100,000 retained deductible is below the organization's stated $250,000 single-event limit. The project manager should obtain the sponsor's authorization rather than assume purchasing authority. The insurance transfers a defined financial consequence; it does not eliminate the event or the need to monitor the remaining exposure. A ignores the explicit risk appetite and leaves the full loss with the organization. C could avoid the exposure, but unilaterally removing essential transport could prevent delivery and is not justified by the facts. D may supplement the response, but the stated probability reduction alone does not bring the financial exposure within the organization's limit."],
  ["pma-prc-057", "The team knows the later work content and budget but lacks activity-level detail, so a planning package can hold it within the control account while near-term work is defined as work packages. As the planning horizon approaches, the team should refine the later work into appropriate work packages and schedule detail under its planning and control rules. B invents precision and would make measurement unreliable. C incorrectly requires one universal parent-child sequence; control accounts may contain planning packages, and work packages are associated with control accounts, but the exact decomposition depends on the work. D omits known approved scope and suggests bypassing change control."],
  ["pma-prc-038", "Building an unrequested extra does not authorize its inclusion. The project manager should prevent unapproved scope from entering a baselined release, consider the panel's value and its security and documentation impacts, and use the agreed decision authority if stakeholders want the change. A sacrifices required verification and assumes customer benefit. C records an unauthorized change after the fact rather than obtaining a decision first. D wrongly exempts team-initiated additions from scope control. The panel is both gold plating and an unauthorized scope addition; either way, it requires an authorized decision before inclusion."],
  ["pma-prc-059", "The users identified the first valuable behavior, and the team's capacity supports only that slice. A small vertical story with observable acceptance criteria allows feedback and delivery while the remaining work can be ordered by value. A leaves a multi-iteration item too large for the next planning horizon. C divides by technical layer, so the pieces may not independently deliver a user-facing outcome, although technical tasks may still support a story. D promises more than the stated capacity and removes verification."],
  ["pma-prc-039", "Weighted estimate = (optimistic + 4 × most likely + pessimistic) ÷ 6 = (6 + 4 × 10 + 20) ÷ 6 = 11 working days. Because the inspection cannot start until testing ends and is booked at day 10, the forecast signals a one-day mismatch. The project manager should examine uncertainty and feasible schedule or supplier responses rather than treat the point estimate as certain. A uses the most likely value instead of the specified weighted estimate. C uses an incorrect result and jumps to cancellation before assessing alternatives. D treats the pessimistic bound as the required forecast and similarly skips a contextual decision."],
]);

for (const question of questions) {
  if (editorialReplacements.has(question.id)) question.explanation = editorialReplacements.get(question.id);
  question.explanation = question.explanation
    .replace(/\s*\*\*Accessibility\/scoring:\*\*[^.]*\.(?:\s*|$)/gi, " ")
    .replace(/\s+(?:This (?:item|version)|The question|The decision) (?:tests|focuses|deliberately avoids|applies)[^.]*\.(?:\s*|$)/gi, " ")
    .replace(/\s+The legacy idea[^.]*\.(?:\s*|$)/gi, " ")
    .replace(/\s+The corrected[^.]*errata[^.]*\.(?:\s*|$)/gi, " ")
    .replace(/\s+C uses a different relationship and repeats the kind of predecessor\/successor confusion corrected in the errata\./gi, " C uses a different relationship and reverses the required predecessor/successor logic.")
    .replace(/\bthe candidate(?:s)?\b/gi, "the project manager")
    .replace(/\s+/g, " ")
    .trim();
  let answerLead = "";
  if (["mcq_single", "pull_down"].includes(question.type)) {
    answerLead = `Correct answer: ${question.answerKey.correctChoiceId.toUpperCase()}.`;
  } else if (question.type === "mcq_multi") {
    const labels = question.answerKey.correctChoiceIds.map((id) => id.toUpperCase());
    answerLead = `Correct answers: ${labels.slice(0, -1).join(", ")}${labels.length > 1 ? ` and ${labels.at(-1)}` : labels[0]}.`;
  } else if (question.type === "dnd_match") {
    const matches = Object.entries(question.answerKey.mapping).map(([prompt, answer]) => `${prompt.toUpperCase()}–${answer.toUpperCase()}`);
    answerLead = `Correct matches: ${matches.join(", ")}.`;
  } else if (question.type === "dnd_order") {
    answerLead = `Correct order: ${question.answerKey.orderedIds.map((id) => id.toUpperCase()).join(" → ")}.`;
  } else if (question.type === "hotspot") {
    answerLead = `Correct region: ${question.answerKey.correctRegionId}.`;
  }
  if (answerLead && !question.explanation.startsWith(answerLead)) {
    question.explanation = `${answerLead} ${question.explanation}`;
  }
  question.metadata = { ...question.metadata, explanationEditorialReview: "2026-10-21" };
}

writeFileSync(fixturePath, `${JSON.stringify(questions, null, 2)}\n`, "utf8");
console.log(`Updated ${questions.length} Set A questions: 9 replacements, 12 revisions, and 180 explanation reviews.`);
