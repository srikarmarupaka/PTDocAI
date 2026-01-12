import { Severity } from "./types";

export const SEVERITY_COLORS = {
  [Severity.CRITICAL]: '#f7768e', // Redish
  [Severity.HIGH]: '#ff9e64',     // Orange
  [Severity.MEDIUM]: '#e0af68',   // Yellow
  [Severity.LOW]: '#7aa2f7',      // Blue
  [Severity.INFO]: '#9ece6a',     // Green
};

export const OWASP_CATEGORIES = [
  "A01:2021-Broken Access Control",
  "A02:2021-Cryptographic Failures",
  "A03:2021-Injection",
  "A04:2021-Insecure Design",
  "A05:2021-Security Misconfiguration",
  "A06:2021-Vulnerable and Outdated Components",
  "A07:2021-Identification and Authentication Failures",
  "A08:2021-Software and Data Integrity Failures",
  "A09:2021-Security Logging and Monitoring Failures",
  "A10:2021-Server-Side Request Forgery"
];