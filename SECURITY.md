# Security Policy

CourseHub is composed of multiple components running in diverse environments, so securing the system as a whole is complex but essential.

The CourseHub API (backend) and database are the most critical elements, as all clients communicate with them. Fortunately, these components are relatively straightforward to update quickly.

(Future) CourseHub client apps (Windows, macOS, Linux, Android, iOS) are less vulnerable from a security standpoint because they only interact with the API and run locally on users’ devices. Updates for clients are more challenging, as new builds may be distributed with delays, and users often update slower than desired. Nevertheless, there is a solution to manage this effectively.

The CourseHub website is always deployed with the latest version and implements standard web security protections such as CORS restrictions, Content Security Policy (CSP), HSTS, and other modern security headers.

## Supported client versions

Clients may become unsupported due to security vulnerabilities or compatibility issues. On app startup, each client checks its version with the API. If the version is unsupported, the user will be prompted to update to a secure and compatible release.

## Reporting a Vulnerability

If you discover a vulnerability, please **DO NOT** report it as a regular bug. Instead, contact me directly via [email](mailto:barni@sigsegv.hu) or draft a [security advisory](https://github.com/BrNi05/CourseHub/security/advisories).

## What not to report

- Vulnerabilities affecting **unsupported versions** of CourseHub.

- Dependency vulnerabilities that are already publicly disclosed and reported by automated tools such as Dependabot.

## Response and solution

Security issues are top priority and I will do my best to find a solution as fast as possible. Expect a response within 24 hours and a resolution within a few days.

## The following components are in scope

- CourseHub API
- CourseHub website
- CourseHub client applications
- CourseHub infrastructure
