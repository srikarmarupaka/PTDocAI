import { GoogleGenAI, Type } from "@google/genai";
import { AIAnalysisResult, Finding } from "../types";

// Helper to safely access API key in various environments (Vite/Node)
const getApiKey = () => {
    // Check process.env.API_KEY (System requirement)
    if (typeof process !== 'undefined' && process.env?.API_KEY) {
        return process.env.API_KEY;
    }
    // Check import.meta.env.VITE_GOOGLE_API_KEY (Vite standard)
    // Cast to any to avoid TS errors if types aren't set
    const metaEnv = (import.meta as any).env;
    if (metaEnv?.VITE_GOOGLE_API_KEY) {
        return metaEnv.VITE_GOOGLE_API_KEY;
    }
    // Check for non-prefixed API_KEY in import.meta.env (sometimes used)
    if (metaEnv?.API_KEY) {
        return metaEnv.API_KEY;
    }
    return '';
};

const apiKey = getApiKey();

const getAIClient = () => {
  if (!apiKey) {
    console.error("API Key is missing! Please set VITE_GOOGLE_API_KEY in your .env file.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeVulnerability = async (
  title: string,
  cveId?: string
): Promise<AIAnalysisResult | null> => {
  const ai = getAIClient();
  if (!ai) return null;

  const prompt = `
    You are an expert Penetration Tester and Technical Report Writer.
    
    Task: Enrich a vulnerability finding with authoritative data.
    Vulnerability Title: "${title}"
    ${cveId ? `CVE ID: "${cveId}"` : ''}

    Instructions:
    1. Map the vulnerability to the most specific CWE ID (e.g., CWE-79).
    2. Map the vulnerability to the correct OWASP Top 10 2021 category ID (format: "Axx:2021-Category Name", e.g., "A03:2021-Injection").
    3. Provide a "humanized" description: Start with a simple explanation of the risk for business stakeholders, followed by technical details for engineers.
    4. Provide specific, step-by-step remediation instructions.
    5. Include authoritative references (NVD, OWASP, vendor advisories).
    6. Determine the Severity (Critical, High, Medium, Low, Info) based on the nature of the vulnerability.

    Output Requirement:
    Return ONLY a valid JSON object.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        // Disabled googleSearch to ensure strict JSON response format as per guidelines
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
  const ai = getAIClient();
  if (!ai) return null;

  if (findings.length === 0) {
    return "No findings available to generate a summary.";
  }

  const findingsSummary = findings.map(f => `- ${f.title} (${f.severity}): ${f.status}`).join('\n');

  const prompt = `
    You are a Lead Penetration Tester writing a formal report for a client.
    
    Task: Write a concise, human-readable Executive Summary based on the following findings.
    Target Audience: Non-technical stakeholders (C-level executives, Managers).
    
    Findings List:
    ${findingsSummary}

    Requirements:
    1. Start with an assessment of the overall security posture.
    2. Highlight the most critical risks and their potential business impact (financial, reputational, operational).
    3. Provide high-level strategic recommendations for the roadmap.
    4. Avoid deep technical jargon; focus on risk and impact.
    5. Keep it concise (approx. 200-300 words).
    6. Use Markdown format (headers, bold text, lists).
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