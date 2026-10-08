# Set A staging conversion notes

This staging file contains 52 reviewed replacement/repair drafts from seven cited source draft documents. It is not a publishable 180-question form and does not change the live database or seed bank. The existing IDs are replacement targets; publication still needs versioning, source and independent editorial approval, whole-form blueprint review, and rendered/scored checks.

## Format and asset gaps

- `pma-env-009`: The draft's Markdown comparison table is now staged as a structured, captioned table exhibit with the same North/South cost, impact, and permit values. Its response type remains `mcq_single`. Verify rendered accessibility and decision equivalence before using it as visual-format coverage.
- `pma-prc-088`: The draft's EV and AC values are now staged in a structured, captioned table exhibit, with the same values and rationale. Its response type remains `mcq_single`. Verify rendering and calculation with the exhibit visible.
- `pma-prc-090`: The draft's Markdown activity table is now staged as a structured, captioned table with the same early/late-start values. This is not yet the originally proposed network diagram; do not claim network-graphic coverage without creating and testing that asset.
- `pma-env-014`: The draft calls this a pull-down candidate. It is staged as the app-supported `pull_down` type using the same four choices and key. Acceptance of `pull_down` by the live database schema has not been verified; do not publish until that migration/constraint and the admin, render, review, and scoring paths are verified in the target environment.
- `pma-prc-073`: Staged as `mcq_multi`, with exactly two selections and strict scoring, preserving the draft's “Which TWO” instruction and A/C key.
- `pma-prc-069`: Batch 3's “Which TWO” item is staged as `mcq_multi`, with exactly two selections and strict scoring, preserving its A/D key.
- `pma-ppl-061`: Batch 4's “Which three” item is staged as `mcq_multi`, with exactly three selections and strict scoring, preserving its A/C/D key. Verify that the live renderer enforces this selection limit and presents the instruction clearly.
- `pma-prc-076`: Batch 3 describes this as an enhanced-matching candidate, but only text matching is supplied and the engine currently supports `dnd_match`, not an independently verified enhanced-matching experience. The four P1–P4 proposals and C1–C4 controls are represented in `payload.prompts` and `payload.answers`, with their identifiers prefixed to visible text so the detailed rationale remains understandable. The answer key maps P1→C3, P2→C1, P3→C2, and P4→C4. Do not claim enhanced-matching coverage until the interaction meets the ECO format and keyboard, screen-reader, mobile, and scoring checks pass.

Plain-text display versions remove Markdown emphasis markers without dropping words. The three table candidates use structured table media rather than raw Markdown in their staged prompts. No image asset or new explanatory claim was invented. Rendered accessibility and responsive-layout checks remain necessary.

## Metadata interpretation

`primaryEcoTask` and `domain` follow the first stated ECO assignment in each draft, even when it differs from the legacy ID prefix; secondary tasks remain in the source draft rather than becoming a second primary task. `approach` and `sourceLocator` preserve the draft's wording. `editorialStatus: provisionally_approved` records review-stage status only, not PMI endorsement, psychometric validation, or authorization to publish.

Batch 3 source text still labels itself an editorial draft. Its inclusion here reflects a separate independent SME-style review of the revised items, not a change to that source document's publication warning. Its staged explanations preserve the source meaning after plain-text formatting normalization.

Batch 4 adds six items from `docs/2026-set-a-batch4-solo-drafts.md`, six from `docs/2026-set-a-batch4-business.md`, and eight from `docs/2026-set-a-batch4-people.md` after independent review. All three source documents retain their pre-review warning language; staging does not override the publication gate. The revised `pma-ppl-008` warehouse-handoff scenario is included. The People-writer items remain single-response; `pma-ppl-003` is primarily People Task 2, while `pma-ppl-025` is primarily Process Task 4 despite its legacy People ID. Markdown bold emphasis in batch 4's display text was removed without changing words or answer keys.
