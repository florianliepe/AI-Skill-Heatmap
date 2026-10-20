# Zielmodus: two-sided AI design cards

## Objective
Support a private, searchable inventory of AI design cards with separate front
and reverse content, source references, explanations and an actionable backlog.

## Execution
1. Research the supplied board and inspect available card documents. Do not infer
   reverse-side wording from titles, method instructions or category labels.
2. Preserve the existing method extracts as a different record kind.
3. Add optional fields for the reverse side, explanations, tags, review state,
   backlog owner/action/date and proposed use-case applications.
4. Derive completeness from actual content; a review flag cannot make a missing
   side complete. Distinguish extracted wording from Studio explanations.
5. Search both sides and explanations; provide library and backlog views with
   clear coverage filters and source links.
6. Preserve existing links/data, test validation and legacy compatibility,
   deploy the authenticated backend and publish the frontend.

## Source coverage
The previous 75 records remain separate method extracts. The private deck inventory
contains 106 numbered cards, 13 category guides and a joker. Both PDF pages were
extracted for 98 numbered cards and 8 guides/joker records. Fourteen entries remain
source-pending: numbered cards 42–49 and guides A, C, E, F, G and L. Download actions
did not produce these files. Missing source wording is left blank, never inferred.
All imported entries start unreviewed; extraction is not approval. Studio guidance
is explicitly labeled as interpretation. Source references identify the private
board and original PDF filename/page pair. Original PDFs and extracted text are
excluded from the public repository and frontend assets.

## Validation
42 unit tests cover legacy compatibility, two-sided completeness, search, invalid
source/date/application data and existing mapping behavior. Authenticated storage
is backed up before the additive deployment. Further source review remains in the
card backlog, with owners, actions, due dates and planned use-case applications.
