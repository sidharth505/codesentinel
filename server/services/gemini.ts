import { GoogleGenAI } from '@google/genai';
import { CONFIG } from '../config.ts';
import { Finding, CodeSnippet } from '../types/index.ts';

let aiClient: GoogleGenAI | null = null;

function getClient(): GoogleGenAI | null {
  if (!CONFIG.GEMINI_API_KEY || CONFIG.GEMINI_API_KEY === 'MY_GEMINI_API_KEY') {
    return null;
  }
  if (!aiClient) {
    try {
      aiClient = new GoogleGenAI({ apiKey: CONFIG.GEMINI_API_KEY });
    } catch (err) {
      console.warn('Failed to initialize GoogleGenAI client:', err);
      return null;
    }
  }
  return aiClient;
}

export async function enrichFindingWithGemini(finding: Finding, contextSnippet?: string): Promise<Finding> {
  const client = getClient();
  if (!client) {
    // Keep the source-based finding when enrichment is unavailable.
    return finding;
  }

  const prompt = `You are CodeSentinel, an elite cybersecurity and software architecture auditor.
Analyze this code finding extracted from an AI-assisted codebase:
Title: ${finding.title}
Category: ${finding.category} (${finding.categoryName})
Severity: ${finding.severity}
Description: ${finding.description}
Evidence: ${JSON.stringify(finding.evidence)}
Context Code:
\`\`\`${finding.snippet.language}
${finding.snippet.lines.map(l => `${l.lineNum}: ${l.code}`).join('\n')}
\`\`\`

Return a strictly valid JSON object with the following keys:
{
  "whyItMatters": "Concise paragraph explaining the deep architectural risk and maintenance burden",
  "riskExplanation": "Concrete explanation of production failure modes (e.g., swallowed exceptions, cascading timeouts, drift)",
  "recommendation": "Prescriptive, actionable refactoring advice for the developer",
  "refactoredCode": "Clean, idiomatic refactored replacement code block"
}
Output only raw JSON, no markdown code fence.`;

  try {
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text?.trim();
    if (text) {
      const parsed = JSON.parse(text);
      return {
        ...finding,
        whyItMatters: parsed.whyItMatters || finding.whyItMatters,
        riskExplanation: parsed.riskExplanation || finding.riskExplanation,
        recommendation: parsed.recommendation || finding.recommendation
      };
    }
  } catch (err) {
    console.warn(`Gemini enrichment failed for finding ${finding.id}, using deterministic baseline:`, err);
  }

  return finding;
}

export async function generateRemediationCode(finding: Finding): Promise<{
  explanation: string;
  refactoredSnippet: CodeSnippet;
}> {
  const client = getClient();
  if (!client) {
    throw new Error('AI remediation is unavailable. Configure GEMINI_API_KEY to generate code.');
  }

  try {
    const prompt = `You are CodeSentinel. Refactor this problematic code to fix the detected security and architectural debt.
Finding: ${finding.title}
Issue: ${finding.description}
Original Code:
\`\`\`${finding.snippet.language}
${finding.snippet.lines.map(l => `${l.lineNum}: ${l.code}`).join('\n')}
\`\`\`

Return a valid JSON object:
{
  "explanation": "Summary of refactoring changes applied",
  "lines": [
    { "lineNum": 1, "code": "code line", "isHighlighted": true, "highlightReason": "why this line was added or improved" }
  ]
}`;

    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text?.trim();
    if (!text) {
      throw new Error('AI remediation returned an empty response.');
    }

    const parsed = JSON.parse(text);
    if (!parsed.explanation || !Array.isArray(parsed.lines) || parsed.lines.length === 0) {
      throw new Error('AI remediation response did not include an explanation and code lines.');
    }

    return {
      explanation: parsed.explanation,
      refactoredSnippet: {
        file: finding.snippet.file,
        startLine: finding.snippet.startLine,
        language: finding.snippet.language,
        lines: parsed.lines
      }
    };
  } catch (err) {
    console.warn('Gemini refactor generation error:', err);
    throw new Error(err instanceof Error ? err.message : 'AI remediation generation failed');
  }
}
