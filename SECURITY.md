# Security Policy

## Reporting a vulnerability

If you believe you have found a security vulnerability in Loopflo, please
report it privately to **loopflo.contact@gmail.com**.

Do **not** open a public GitHub issue for security-sensitive reports.

Please include:
- A clear description of the issue
- Steps to reproduce
- The impact as you understand it
- Any suggested mitigation

We aim to acknowledge reports within 48 hours and to provide a remediation
timeline within 7 days.

## Scope

In scope:
- loopflo.app and all subdomains
- The workflow execution engine
- Authentication, session handling, and user data storage
- Third-party integrations handled by Loopflo (Stability AI, ElevenLabs, Groq, Gmail OAuth, etc.)

Out of scope:
- Third-party services themselves (report to the provider)
- Social engineering of Loopflo staff or users
- Physical attacks
- Denial of service through traffic volume alone

## Incident response

In the event of a confirmed breach affecting personal data:

1. Contain the incident and revoke compromised credentials
2. Assess the scope of exposed data
3. Notify affected users within 72 hours
4. Notify the CNIL within 72 hours when required by RGPD
   (https://notifications.cnil.fr/notifications/index)
5. Publish a post-mortem after remediation

## Supported versions

Only the latest `main` branch deployed at loopflo.app is supported.
