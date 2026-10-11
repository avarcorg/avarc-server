# AI Usage Policy

avarc-server has clear rules for AI usage:

- **Disclose all AI usage.** State the tool you used (for example Claude,
  Codex, Copilot or Cursor) and how much of the work it assisted. Put the
  disclosure in the pull request or issue description.

- **A human must fully understand every change.** If you cannot explain what
  your change does and how it interacts with the rest of the system without
  AI help, consider contributing in other ways: documentation, testing,
  discussion and feedback are all valuable.

- **Pull requests: AI is a tool, not a substitute for understanding.**
  AI-assisted code must be built, tested and verified by you before you
  submit it. If you are not familiar enough with the affected area to tell
  what could go wrong, ask questions first.

- **Issues and discussions: AI assistance is welcome, but stay in the loop.**
  Review and edit anything AI-generated before posting. AI tends toward
  verbosity; trim it and make sure it reflects your actual intent.

- **No AI-generated media** (art, images, video, audio, and so on). Text and
  code are the only acceptable AI-generated content, under the rules above.

- **Unreviewed AI output will be closed without further engagement.**
  Repeat offenders may be blocked. If your goal is to learn, slow down and
  ask; we are happy to help.

These rules apply to everyone, whether first-time contributor or maintainer.
No role exempts anyone from disclosure, review, testing or accountability for
AI-assisted work.

## Commit messages

Disclosure belongs in the pull request or issue, not in commit messages.
Commit messages must not contain AI tool names, AI-tool email addresses or
session identifiers. Commits carry a `Signed-off-by` trailer from the human
who is accountable for them.

## There are humans here

Every issue, discussion and pull request is read by people. Submitting
low-effort, unverified work shifts the burden of validation onto them, which
is disrespectful.

## Our philosophy on AI

Parts of this project are written with AI assistance, and we welcome AI as a
tool. The strictness of this policy is not an anti-AI stance. It addresses
the gap between what AI can produce and what a contributor can confidently
stand behind. Tools are not the problem; using them to skip understanding is.

Producing something with AI does not bring the judgment to decide whether it
is correct, safe, or right for the codebase: side effects, edge cases,
architectural fit and conventions still need a human who knows what they are
looking at. We are glad to help you become that person.

---

_Adapted from the [Grimmory AI Usage Policy](https://github.com/grimmory-tools/grimmory/blob/main/AI_POLICY.md),
which is itself adapted from the [Ghostty AI Usage Policy](https://github.com/ghostty-org/ghostty/blob/main/AI_POLICY.md),
with thanks to both projects._
