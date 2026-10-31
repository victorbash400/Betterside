# Profile and contribution goals

Account menu order is Profile, Settings, then the account system's sign-out action. Profile is an individual settings section alongside Appearance, Models and PayPal. The account-menu Profile shortcut opens that settings section. Profile owns contribution goals and payment-account actions. Goals default to monthly; one-time targets remain available. Goal targets are USD amounts, never inferred beneficiary counts. Source topics include Education and Children, but no unrelated demonstration project is presented as funding those activities.

Profiles are stored in the existing BetterSide table under the authenticated donor/account identity, separate from interests and PayPal identity records. Saves use revision checks. A goal's creation time is server-owned and its cause cannot be changed in place. Monthly progress uses the profile timezone (Africa/Nairobi by default) and actual payment capture timestamps; changing months does not rewrite receipts. A payment is assigned to at most one goal when its order is created. The checkout service verifies that the goal belongs to the current account and the sourced project matches its cause. Prepared, cancelled, failed and unrelated orders do not count. Partial refunds reduce progress; full refunds remove it. Progress bars cap at 100%, while the amount retains overfunding. The ledger reads every DynamoDB result page.

The current payment service remains PayPal Sandbox. Progress and UI amounts explicitly retain that qualification. Public organizations are sources and possible external donation destinations, not automatically authorized PayPal recipients. No goal claims children helped, schools funded or other outcomes from a dollar amount.

## PayPal account connection

The profile can link a PayPal identity using the official Log in with PayPal authorization-code flow. The app requests only `openid profile`. This connection does not save a payment method, enable unattended charges or grant payment approval. Every contribution still requires user approval in PayPal.

Enable Log in with PayPal on the existing sandbox application and register this app's callback. Set `PAYPAL_LOGIN_REDIRECT_URI` to the exact registered URL ending in `/api/paypal/account/callback`. Existing `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` are used server-side. The callback origin must match the application origin. Do not enable a redirect by setting an environment variable without registering it with PayPal.

Connection state is random, short-lived, HttpOnly and bound to the signed-in account. The callback consumes the state, exchanges the code server-side, verifies the user-info response with PayPal and persists only the returned identity and connection time. Access and refresh tokens are not persisted or returned to the browser. The profile never displays Connected before that verification. Disconnect removes the local identity association; it does not claim to alter the buyer's wallet or revoke PayPal-managed app permissions.

When Identity is not configured, the profile still provides checkout, contribution history and the official sandbox account-management link. The Connect PayPal action becomes available once configured. The application's existing credentials do not prove that Identity or vaulting has been enabled. Live Identity requires PayPal review; this implementation intentionally retains sandbox-only endpoints.

Official integration: https://developer.paypal.com/log-in/build . Button/consent URL: https://developer.paypal.com/log-in/build-button/ . Saved payment methods require a separate PayPal vaulting integration and approval: https://developer.paypal.com/docs/checkout/save-payment-methods/ .
