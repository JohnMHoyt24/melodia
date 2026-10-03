# Security policy

## Reporting a vulnerability

Please **do not** open a public issue for security problems.

Report vulnerabilities privately through GitHub:
**Security → Report a vulnerability** on this repository
([private vulnerability reporting](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability)).
Include steps to reproduce and the impact you expect. You should get a response within
a week.

## Supported versions

Melodia hasn't published releases yet. Security fixes go to the `main` branch.

## Notes for people running Melodia

- You bring your own credentials (Supabase, Last.fm, Gemini). Keep them in `.env`
  files, which are gitignored, and never commit them.
- The Supabase **anon** key is designed to be public and is used by the frontend.
  Never put the **service_role** key in the frontend or in this repo. The backend
  doesn't need it.
- The backend verifies Supabase access tokens against your project's public JWKS. It
  never handles passwords.
