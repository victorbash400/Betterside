# Contribution goal release verification

Verified 2026-10-31 against committed source and the deployed custom domain.

| Requirement | Evidence |
| --- | --- |
| Located conflict measurements | Live events response contains 2,014 UCDP candidate records: 1,487 event locations and 378 administrative reporting anchors. Locality uncertainty remains labelled; regional and country anchors never enter heatmap kernels. |
| Additional organization source | OCHA FTS snapshot supplies 14,555 directory records. Directory locations remain distinct from operating areas, causes and payment recipients. |
| Profile navigation | Account menu opens Profile; settings navigation has separate Profile, Goals, Appearance, Models and PayPal entries. |
| Goals and progress | Browser create/edit/save verified. AWS integration tests verify owner isolation, revisions, capture timestamps and net refunded progress. Monthly is the default; one-time targets remain available. |
| Agent goal management | Actual chat calls created a $123 Water goal, changed it to $175, and rendered live goal cards. Direct inline editing changed the saved target to $180; Profile showed the same value. Temporary QA goals were removed. |
| Reference design | SettingsGroup, SettingsRow, SettingsActionRow and SettingsInlineButton follow the actual Screening Room source. Goal creation and progress stay inside grouped surfaces. |
| PayPal account connection | Existing sandbox application enabled for Full Name only. Registered callback and deployed environment match the custom domain. Test buyer authorization returned to BetterSide and displayed Connected. Linked identity survived a subsequent page visit. |
| Hosted checkout | Real sandbox order opened PayPal's hosted login/approval screen. Cancellation returned to BetterSide with Contribution cancelled. No real-money payment was made. |
| Validation | Isolated committed-source production build passed. Current workspace unit suite: 121 passing. AWS profile/ledger integration tests and goal-tool ownership/revision/idempotency integration test passed. |
| Publication | Milestones pushed to main; deployed custom domain renders separate Goals and grouped PayPal settings. |

## Embedded checkout verification

The v6 embedded checkout core script loads, but createInstance waits during initialization. The SDK source initializes a hidden PayPal messaging iframe at this boundary. Browser automation reports that it is resolving a paused document response and disallows raw frame/network inspection; the frame body cannot be inspected through the available locator API either. The user subsequently confirmed that the embedded PayPal button appears after selecting a project in normal Chrome on the deployed custom domain. Button readiness is therefore verified by the user; the initialization timeout remains an automated-browser limitation. The visible timeout, manual retry and official hosted-checkout alternative remain available. A late SDK resolution can recover after the UI timeout. No SDK payment was approved or captured during browser QA; capture/refund accounting is covered by isolated AWS integration tests.

PayPal Identity connection grants basic profile access only. It does not establish application authentication, save payment methods or authorize future payments. Consent policy links are sandbox placeholders and require actual policies before live review. Account authentication work in the shared local checkout remains separate from these committed releases.
