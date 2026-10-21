# Set A July 2026 Alignment — Draft Review Package

Status: draft for PMP SME and independent validation. Not approved for staging or production.

## Replacement drafts (9)

### R1 — `pma-ppl-035` — People Task 3 — AI-assisted delegation

An experienced team uses an approved generative-AI assistant to draft customer-support workflows. Representative-user testing finds that the tool repeatedly omits a documented alternate route for customers who cannot use the standard digital flow. The team wants to keep using it because drafting is faster. What should the project manager do first?

- A. Pause this workflow until the vendor supplies a corrected model, while retaining the existing acceptance test.
- B. Analyze the failure, add accountable human review and measurable accessibility criteria, and validate the revised workflow with representative users.
- C. Continue the pilot with a warning for reviewers because the team remains accountable for the final workflow.
- D. Add a second automated checker and accept a workflow whenever the two tools agree.

Answer: **B**

Explanation: AI can accelerate work but does not replace accountable judgment. B addresses the observed failure against a known requirement and verifies the control with affected users. A makes remediation depend solely on the vendor. C leaves a known quality gap uncontrolled. D creates tool agreement, not evidence that the requirement is met.

### R2 — `pma-ppl-040` — People Task 3 — AI model-risk ownership

An AI-assisted forecast influences staffing recommendations. Operations owns staffing decisions, data engineering owns source quality, and a vendor maintains the model. After a market disruption, the model continues producing confident recommendations from unrepresentative historical data. No role owns the decision to suspend model use. What should the project manager do first?

- A. Ask the vendor to decide when the model should be suspended because it maintains the algorithm.
- B. Establish ownership and thresholds for data quality, suspension, human staffing decisions, escalation, and monitored re-entry.
- C. Let operations override individual recommendations while data engineering continues monitoring inputs.
- D. Suspend the model until the annual review and return staffing decisions to the project manager.

Answer: **B**

Explanation: The immediate gap is decision ownership across organizational boundaries. B establishes accountable authority and measurable thresholds. A delegates organizational accountability externally. C permits local overrides but leaves the suspension gap unresolved. D is disproportionate and assigns staffing authority to the project manager without support.

### R3 — `pma-ppl-065` — People Task 4 — Connected case AI-1

Scenario `case-ai-procurement`: A public agency is piloting an AI tool that summarizes supplier proposals. Procurement retains formal scoring authority. A pilot shows that the tool saves time but underrates proposals written by smaller suppliers whose evidence appears in nonstandard sections.

Which group should the project manager engage to assess the impact and define the next controlled action?

- A. Procurement decision owners and the vendor, using only aggregate supplier results until the next award cycle.
- B. Procurement decision owners, authorized small-supplier representatives, and AI/data and legal specialists under confidentiality rules.
- C. The sponsor and legal counsel, who can decide whether efficiency justifies continued use.
- D. The technical team and internal audit, who can correct the model before affected stakeholders are consulted.

Answer: **B**

Explanation: B includes accountable decision owners, authorized affected-party insight, and the specialists needed to investigate within procurement confidentiality controls. A lacks affected-party evidence. C omits technical and supplier perspectives. D attempts remediation before impact and user evidence are understood.

### R4 — `pma-ppl-066` — People Task 2 — Connected case AI-2

Scenario `case-ai-procurement`: The procurement lead wants to suspend the pilot. The innovation lead wants immediate expansion because average review time fell by 35%. Both accept facilitated discussion, and no live award has used the tool's output. What should the project manager do?

- A. Pause the pilot and escalate the competing recommendations with the existing evidence for a sponsor decision.
- B. Agree criteria covering procurement integrity, error disparity, benefit, and reversibility, then route a bounded next step through the decision owner.
- C. Expand only to low-value proposals while monitoring review time and supplier complaints.
- D. Continue the existing pilot without expansion until the vendor explains the error pattern.

Answer: **B**

Explanation: B addresses both interests and evidence, defines an acceptable outcome, and preserves authority. A escalates before developing decision-ready criteria. C lacks a fairness threshold. D continues exposure without a defined control or decision condition.

### R5 — `pma-ppl-068` — People Task 6 — Connected case AI-3

Scenario `case-ai-procurement`: After controls are added, review time remains 20% faster, but the small-supplier error rate remains above the pilot's approved tolerance. Policy requires documented human scoring and permits tools only as decision support. The governance board is deciding whether the pilot may continue. What should the project manager communicate?

- A. Recommend conditional continuation because required human scoring makes the remaining disparity acceptable.
- B. Report the time benefit, out-of-tolerance disparity, human-decision requirement, and measurable remediation or limited-pilot options.
- C. Report the out-of-tolerance result and recommend suspension without including the measured efficiency benefit.
- D. Report aggregate accuracy and review time because subgroup results could be commercially sensitive.

Answer: **B**

Explanation: B gives the board complete decision evidence and proportionate options. Human review does not automatically make an out-of-tolerance result acceptable. C omits a verified benefit. D uses aggregation to conceal a material subgroup outcome.

### R6 — `pma-ppl-070` — People Task 5 — Sustainability tradeoff

A sponsor favors the lowest-capital-cost construction option. Community and operations representatives favor lower operating emissions and better heat resilience at higher initial cost. Both options meet minimum regulation, the decision is open, and the governance board owns changes to success measures. What should the project manager do first?

- A. Ask the sponsor and operations lead to negotiate a preferred option before community evidence is considered.
- B. Facilitate measurable lifecycle cost, emissions, resilience, value, and risk criteria, then submit the analysis and any measure change to the board.
- C. Retain capital cost as the deciding measure and document emissions and resilience as secondary observations.
- D. Commission a technical lifecycle analysis before clarifying stakeholder priorities or decision criteria.

Answer: **B**

Explanation: B aligns conflicting expectations and makes the tradeoff decision-ready while preserving board authority. A excludes an affected perspective. C does not integrate material value evidence. D produces analysis before decision criteria and stakeholder needs are understood.

### R7 — `pma-ppl-073` — People Task 8 — Graphic-based communication

The exhibit compares median response time by stakeholder group during equal eight-week periods before and after reviews moved to a new portal. Each group submitted at least 30 requests in each period. The next design gate is in one week. What should the project manager do?

- A. Report the combined median and continue the portal while collecting another eight weeks of data.
- B. Investigate with the affected group, restore an accessible response route promptly, and report segmented outcomes and corrective measures.
- C. Add a response-time target for the accessibility group while keeping the portal and support process unchanged.
- D. Reopen email for every stakeholder group and compare results again after the gate.

Answer: **B**

Explanation: Aggregation hides a material stakeholder-access problem. B uses segmented evidence, restores an appropriate channel, and closes the feedback loop. A conceals the disparity. C penalizes the affected stakeholder. D changes the entire strategy without diagnosis.

Media draft: grouped bar chart with stakeholder group, prior response time, and portal response time; include a text-equivalent table and descriptive alternative text.

### R8 — `pma-prc-037` — Process Task 1 — AI integration strategy

A program plans to use an AI assistant to propose schedule-risk responses across twelve delivery teams. Historical data are incomplete for two teams, and governance requires a human owner to authorize baseline or funding changes. What should the project manager include in the integrated delivery plan?

- A. Allow automatic responses above a team-defined confidence level while risk owners review exceptions.
- B. Define data-quality checks, assumptions, human owners, validation measures, thresholds, and feedback for recalibration.
- C. Keep every recommendation advisory and let each risk owner determine locally whether validation is necessary.
- D. Pilot with the ten complete-data teams first and exclude the other two from shared monitoring until more history exists.

Answer: **B**

Explanation: B integrates the tool with governance, data quality, accountability, measurement, and learning. A bypasses authority. C is too weak for known data limitations. D prevents system-level oversight and comparable evidence.

### R9 — `pma-prc-070` — Process Task 7 — Sustainable quality decision

A packaging team can replace a recyclable material that has a 6% seal-failure rate with a mixed material that has a 1% failure rate but cannot be processed by the customer's recycling stream. A third recyclable option can complete a two-week test before the decision gate in three weeks. Release is six weeks away, and the quality authority has defined a maximum 2% seal-failure rate. What should the project manager facilitate?

- A. Adopt the mixed material for this release and open a later improvement item for recycling compatibility.
- B. Continue the current recyclable material and increase inspection because the customer already processes it.
- C. Test the third option against the seal threshold, regulatory, cost, schedule, and lifecycle criteria, then route evidence to the quality authority.
- D. Ask the supplier to recommend an option and accept it if the supplier warrants seal performance.

Answer: **C**

Explanation: Quality planning should consider fitness, compliance, delivery constraints, cost, and sustainability. C uses the available time to produce decision evidence and preserves authority. A and B optimize one measure. D delegates the project decision to a party with incomplete accountability.

## Revision drafts (12)

The following retain their tested competency and answer logic but will be reformatted before approval.

1. `pma-env-014`: Replace taxonomy recall with an applied two-blank pull-down. Stem: “A central governance office must **[set mandatory evidence and verify adherence / publish optional guidance / directly manage delivery]**, while authority for day-to-day delivery remains with **[business-unit project managers / the governance office / external auditors]**.” Correct pair: **set mandatory evidence and verify adherence + business-unit project managers**. The explanation must resolve each blank independently and avoid naming unsupported PMO categories.
2. `pma-prc-002`: Add a small network diagram with text-equivalent path data; ask for the revised controlling path and forecast implication rather than arithmetic alone.
3. `pma-prc-003`: Present PV, EV, posted AC, and unposted invoice in a cost dashboard; retain the requirement to reconcile data before reporting.
4. `pma-prc-006`: Present BAC, EV, AC, one-time variance, and remaining fixed-price work in a forecast table; ask the candidate to choose and disclose the appropriate EAC assumption.
5. `pma-prc-011`: Add a schedule bar showing early/late dates and require interpretation of available float before authorizing the delay.
6. `pma-prc-015`: Convert the crashing data into a cost-per-day chart; retain the $16,000 optimum and add explicit governance/risk confirmation after selection.
7. `pma-prc-025`: Present BAC, EAC, and the escalation threshold in a forecast card; require both the correct VAC interpretation and governance action.
8. `pma-prc-033`: Present three threats in a probability-impact table; retain $30,000 EMV and clarify that EMV is an analytical input rather than the reserve decision.
9. `pma-prc-036`: Present work estimate, contingency, and management reserve in a layered budget graphic with accessible table fallback; retain baseline $960,000 and budget $1,050,000.
10. `pma-prc-039`: Merge with a visual three-point range and supplier milestone; retain the 11-day estimate and decision-oriented response.
11. `pma-prc-047`: Convert the two expansion options into a decision-tree diagram with accessible text equivalent; retain Option A EMV of $100,000 under the stated rule.
12. `pma-prc-089`: Replace the duplicate PERT item with this complete probability-range item. Stem: “A simulation for a contractual milestone produces P50 = August 24 and P80 = September 6. The contractual date is August 30, delay costs are $120,000 per week, and the sponsor's risk tolerance requires at least 80% confidence before committing. What should the project manager report?” Options: A) Commit to August 24 because P50 is the most likely date; B) Commit to August 30 because it lies between P50 and P80; C) Explain that the contractual date has less than 80% confidence, describe the $120,000-per-week delay consequence, and evaluate response or contingency options with the sponsor; D) Commit to September 6 without evaluating recovery because P80 is always the required promise. Correct: **C**. Explanation: P50 is not a high-confidence commitment, and the contract date falls before P80. The available data establish the confidence shortfall and the consequence rate, but not a probability-weighted financial exposure. C communicates what the evidence supports and routes response or contingency choices through the sponsor. Include a cumulative-confidence visual with August 24, August 30, and September 6 markers plus an accessible table.

## Reviewer decision fields

For every replacement and revision, reviewers must return: decision (`approve`, `revise`, or `reject`), ECO task fit, answer-key verdict, ambiguity finding, distractor verdict, accessibility finding, and required edit. No item may move to Set A until the owner approves it after both reviews.

## Required implementation metadata

Every completed item must include: ECO domain/task/enabler, delivery approach, cognitive level, source locator, scenario key/version where applicable, media manifest reference, authoring version, SME decision, validator decision, reviewer identifiers, and review date.

The connected items R3–R5 use `scenario_key: case-ai-procurement-v1`. The shared exhibit must contain only the agency pilot facts available before question 1. Each question must remain independently answerable and must not disclose or depend on an answer to another item.

Visual assets must be referenced through `staging/set-a-2026-visual-manifest.json`; every visual requires a text-equivalent table, concise alternative text, labels and units, non-color encoding, responsive rendering, 200% zoom verification, and screen-reader reading-order verification.
