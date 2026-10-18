---
id: AVARC-55
type: task
status: open
priority: low
area: auth
depends-on: [AVARC-54]
created: 2026-10-18
---

# TASK: Link provider accounts automatically by verified email

Spec: [SPEC-auth.md](../spec/SPEC-auth.md) ("Social login", "Linking")

[AVARC-54](TASK-social-login.md) keeps linking strict: a Google login whose
email belongs to an existing account is denied, and the user links Google
themselves under Account, Linked accounts, after signing in with the
password. That is safe but takes a step by the user. This item makes the link
automatic when the provider reports the email as verified, as the first
decision of AVARC-54 allowed, without opening the way to taking over an
account through an unverified email.

## To do

Decide between two ways, then record the decision in `SPEC-auth.md`:

- A small custom authenticator in the Keycloak image that reads the
  `email_verified` claim of the provider and links to the existing user only
  when it is true. It needs Java code in the image, built and kept up to date
  with Keycloak's versions.
- Outgoing mail for the realm, so that Keycloak's own step "verify existing
  account by email" works: the user confirms by a link in a mail sent to the
  address. It needs a mail service for the realm and its credentials in the
  secrets file, and it also lets the realm offer password reset by email.

Then change the first-login flow in `deploy/create-google-idp.sh` (safe to
repeat), update the spec's linking rule and test it against a throwaway
Keycloak with a second realm as a stand-in provider.

## Verification

A Google user whose email is verified and matches an existing local account
is linked to it at the first login and gets that account's roles. One whose
email is not reported as verified is not linked and gets the message of the
strict flow. A second login reuses the same user.
