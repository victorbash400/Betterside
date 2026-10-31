# Profile and contribution goals

The account menu places Profile above Settings. Authentication owns its sign-out action. Profile is an individual settings section alongside Appearance, Models and PayPal. The account-menu Profile shortcut opens that settings section. Goals is a separate settings section alongside Profile, Appearance, Models and PayPal. PayPal owns connection and payment-account actions. Goals default to monthly; one-time targets remain available. Goal targets are USD amounts, never inferred beneficiary counts. Source topics include Education and Children, but no unrelated demonstration project is presented as funding those activities.

Profiles are stored in the existing BetterSide table under the server-resolved donor identity, separate from interests and PayPal identity records. Saves use revision checks. A goal's creation time is server-owned and its cause cannot be changed in place. Monthly progress uses the profile timezone (Africa/Nairobi by default) and actual payment capture timestamps; changing months does not rewrite receipts. A payment is assigned to at most one goal when its order is created. The checkout service verifies that the goal belongs to the current account and the sourced project matches its cause. Prepared, cancelled, failed and unrelated orders do not count. Partial refunds reduce progress; full refunds remove it. Progress bars cap at 100%, while the amount retains overfunding. The ledger reads every DynamoDB result page.

The current payment service remains PayPal Sandbox. Progress and UI amounts explicitly retain that qualification. Public organizations are sources and possible external donation destinations, not automatically authorized PayPal recipients. No goal claims children helped, schools funded or other outcomes from a dollar amount.

## PayPal account connection

PayPal settings can link a PayPal identity using the official Log in with PayPal authorization-code flow. The app requests only `openid profile`. This connection does not save a payment method, enable unattended charges or grant payment approval. Every contribution still requires user approval in PayPal.

Enable Log in with PayPal on the existing sandbox application and register this app's callback. Set `PAYPAL_LOGIN_REDIRECT_URI` to the exact registered URL ending in `/api/paypal/account/callback`. Existing `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` are used server-side. The callback origin must match the application origin. Do not enable a redirect by setting an environment variable without registering it with PayPal.

Connection state is random, short-lived, HttpOnly and bound to the initiating donor session. The callback consumes the state, exchanges the code server-side, verifies the user-info response with PayPal and persists only the returned identity and connection time. Access and refresh tokens are not persisted or returned to the browser. PayPal settings never display Connected before that verification. Disconnect removes the local identity association; it does not claim to alter the buyer's wallet or revoke PayPal-managed app permissions.

When Identity is not configured, PayPal settings still provide checkout, contribution history and the official sandbox account-management link. The Connect PayPal action becomes available once configured. The application's existing credentials do not prove that Identity or vaulting has been enabled. Live Identity requires PayPal review; this implementation intentionally retains sandbox-only endpoints.

Official integration: https://developer.paypal.com/log-in/build . Button/consent URL: https://developer.paypal.com/log-in/build-button/ . Saved payment methods require a separate PayPal vaulting integration and approval: https://developer.paypal.com/docs/checkout/save-payment-methods/ .

## Agent goal tools

`app/tools/list-goals.ts`, `create-goal.ts`, and `update-goal.ts` are registered separately from the agent. They scope every operation to the server-resolved current donor/account, never a model-supplied owner. Listing returns exact IDs, revision, capture-backed progress and available checkout categories. Creation uses a deterministic owner/tool-call ID to prevent duplicate execution of the same request. Edits require the current revision and preserve unspecified fields; changing cause requires a new goal. These tools never approve payments or schedule recurring charges.

Tool output renders `ChatGoalsWidget`, which reads the current profile and contribution ledger rather than treating persisted chat history as current state. It reuses Profile goal rows and editors. Saves and new tool results publish a profile-change event; mounted cards refresh through that event or window focus, without polling. Historical tool results do not replay writes. Checkout carries the saved goal ID, and the server verifies project-cause compatibility.

## Verified sandbox configuration

The existing BetterSide Sandbox application has Log in with PayPal enabled with Full Name selected. Its registered web return URL is `https://betterside.nairobilaboratories.com/api/paypal/account/callback`, matching the Production `PAYPAL_LOGIN_REDIRECT_URI`. Sandbox consent policy and agreement links temporarily use `https://example.com`, as permitted by PayPal's sandbox setup instructions. Replace them with actual policies before live review. Existing native-app return URLs were preserved.

Identity linking is separate from application authentication. The released donor session is an HttpOnly browser cookie; linking does not convert it into PayPal-based signup or cross-device authentication. A separate account integration can supply the server-resolved owner without changing goal or payment assignment semantics.

Sandbox authorization-code consent and server-side verification were completed on the deployed custom domain; the test buyer returned successfully with Connected shown. Identity linking does not resolve the separate v6 checkout SDK initialization timeout; hosted PayPal checkout remains available.
