import { GoogleGenAI, Type } from "@google/genai";
import { AIAnalysisResult, Finding } from "../types";

const SYSTEM_PERSONA = `You are a Lead Offensive Security Consultant with deep expertise in penetration testing.
Your writing style is professional, direct, and humanized. 
Avoid "AI-isms" like "I hope this helps" or "Here is the enriched finding."
Write as if you are drafting a high-stakes report for a premium client:
- Use active voice and professional terminology.
- Prioritize business risk and impact over generic definitions.
- Provide highly specific, actionable remediation steps.
- Ensure the tone is authoritative yet pragmatic.`;

/**
 * Safely retrieves the API key from the environment.
 * Prioritizes VITE_GOOGLE_API_KEY as requested.
 */
const getApiKey = (): string => {
  try {
    if (typeof process !== 'undefined' && process.env) {
      return (process.env.VITE_GOOGLE_API_KEY as string) || (process.env.API_KEY as string) || '';
    }
    return '';
  } catch (e) {
    console.warn("PTDocAI: Environment variables are not accessible.");
    return '';
  }
};

/**
 * Utility to extract JSON from a string that might contain markdown blocks.
 */
const extractJson = (text: string): string => {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  return jsonMatch ? jsonMatch[0] : text;
};

export const analyzeVulnerability = async (
  title: string,
  cveId?: string
): Promise<AIAnalysisResult | null> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.error("PTDocAI: Gemini API Key is missing. Please ensure VITE_GOOGLE_API_KEY is set in your environment.");
    return null;
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    ${SYSTEM_PERSONA}
    
    Task: Contextualize and enrich the following vulnerability for a formal security report.
    Vulnerability: "${title}"
    ${cveId ? `Reference CVE: "${cveId}"` : ''}

    Requirements:
    1. Mapping: Accurate CWE ID and OWASP Top 10 (2021) category.
    2. Description: A narrative assessment. Start with the "Bottom Line Up Front" (the business risk), followed by a clear technical explanation of the vulnerability.
    3. Remediation: Specific technical instructions for developers to mitigate the risk effectively.
    4. Severity: Logical severity level (Critical, High, Medium, Low, Info).
    5. References: 2-3 high-quality technical URLs.

    Output format: STRICT JSON only. Do not wrap in markdown code blocks.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash', 
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            description: { type: Type.STRING },
            remediation: { type: Type.STRING },
            cweId: { type: Type.STRING },
            owaspId: { type: Type.STRING },
            cvssScore: { type: Type.NUMBER },
            severity: { type: Type.STRING },
            references: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["description", "remediation", "cweId", "owaspId", "severity"]
        }
      }
    });

    const text = response.text;
    if (!text) return null;
    
    // Clean potential markdown or extra whitespace
    const cleanJson = extractJson(text);
    return JSON.parse(cleanJson) as AIAnalysisResult;

  } catch (error) {
    console.error("PTDocAI: Gemini Analysis Failed:", error);
    return null;
  }
};

export const generateExecutiveSummary = async (findings: Finding[]): Promise<string | null> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.error("PTDocAI: Gemini API Key is missing.");
    return null;
  }

  const ai = new GoogleGenAI({ apiKey });

  if (findings.length === 0) return "No findings identified during this assessment.";

  const findingsSummary = findings.map(f => `- ${f.title} [${f.severity}]`).join('\n');

  const prompt = `
    ${SYSTEM_PERSONA}
    
    Task: Draft a concise Executive Summary for a security assessment report.
    Audience: Business Leaders and Technical Directors.
    
    Findings Identified:
    ${findingsSummary}

    Drafting Guidelines:
    1. Start with an executive assessment of the overall security posture.
    2. Focus on the most significant risks to the business.
    3. Conclude with 2-3 strategic recommendations.
    4. Keep the narrative under 300 words.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash', 
      contents: prompt,
    });

    return response.text || null;
  } catch (error) {
    console.error("PTDocAI: Gemini Summary Generation Failed:", error);
    return null;
  }
};