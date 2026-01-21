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

export const analyzeVulnerability = async (
  title: string,
  cveId?: string
): Promise<AIAnalysisResult | null> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

  const prompt = `
    ${SYSTEM_PERSONA}
    
    Task: Contextualize and enrich the following vulnerability for a formal security report.
    Vulnerability: "${title}"
    ${cveId ? `Reference CVE: "${cveId}"` : ''}

    Requirements:
    1. Mapping: Accurate CWE ID and OWASP Top 10 (2021) category.
    2. Description: A narrative assessment. Start with the "Bottom Line Up Front" (the business risk), followed by a clear technical explanation of the vulnerability. Avoid bullet points in this field.
    3. Remediation: Specific technical instructions for developers to mitigate the risk effectively.
    4. Severity: Logical severity level (Critical, High, Medium, Low, Info).
    5. References: 2-3 high-quality technical URLs.

    Output format: STRICT JSON only. Do not wrap in markdown code blocks. Do not use special characters or markdown bolding inside the JSON string values.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', // Switched to Flash as requested
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
    return JSON.parse(text) as AIAnalysisResult;

  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    return null;
  }
};

export const generateExecutiveSummary = async (findings: Finding[]): Promise<string | null> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

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
    2. Focus on the most significant risks to the business (financial, operational, or data-related).
    3. Conclude with 2-3 strategic recommendations for long-term security improvement.
    4. Keep the narrative under 300 words.
    5. Avoid generic boilerplate. Be specific to the severity of the findings provided.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', 
      contents: prompt,
    });

    return response.text || null;
  } catch (error) {
    console.error("Gemini Summary Generation Failed:", error);
    return null;
  }
};