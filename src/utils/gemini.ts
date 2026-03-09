import type { AIValidationResult, AIGeneratedQuestion } from "../types";

async function callGemini(apiKey: string, prompt: string): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1 },
      }),
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Gemini API error (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("No response from Gemini");
  return text;
}

function parseJSON<T>(text: string): T {
  // Strip markdown fences if present
  const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
  return JSON.parse(cleaned);
}

export async function validateQuestion(
  apiKey: string,
  question: string
): Promise<AIValidationResult> {
  const prompt = `You are the referee for a trivia game where answers are always single numbers.

Question: "${question}"

Look up the answer. Respond in JSON only, no markdown fences:
{
  "answerable": true/false,
  "answer": <number>,
  "source": "<short source description, e.g. 'Wikipedia — Richard III of England'>",
  "note": "<optional brief clarification if the question is ambiguous>",
  "type": "date" or "number"
}

Set "type" to "date" if the answer is a year or date (e.g. when something happened, was founded, was born, etc.). For date answers, express the answer as a decimal year (e.g. July 6 1483 = 1483.51). Set "type" to "number" for all other numeric answers.

If the question cannot be resolved to a single number, set answerable to false and explain in note.`;

  const text = await callGemini(apiKey, prompt);
  return parseJSON<AIValidationResult>(text);
}

export async function generateQuestion(
  apiKey: string,
  topicHint?: string,
  previousQuestions?: string[]
): Promise<AIGeneratedQuestion> {
  const recentQuestions = previousQuestions?.slice(-100) ?? [];
  const avoidSection = recentQuestions.length > 0
    ? `\nDo NOT repeat or closely resemble any of these previously asked questions:\n${recentQuestions.map((q) => `- ${q}`).join("\n")}\n`
    : "";

  const prompt = `Generate a trivia question for a guessing game where the answer must be a single number (a year, a quantity, a measurement, a distance, etc.).

${topicHint ? `Topic/category hint: "${topicHint}"` : "Choose an interesting and varied topic."}
${avoidSection}

The question should be:
- Unambiguous and resolvable via a quick lookup
- Interesting and fun for a group of adults
- Not too obscure but not trivially easy
- IMPORTANT: The question must be neutrally worded. Do NOT include hints, clues, or adjectives that give away the magnitude of the answer. For example, do NOT say "lived an incredibly long life" when asking about someone's age at death. Just ask the factual question directly.

Respond in JSON only, no markdown fences:
{
  "question": "<the question>",
  "answer": <the number>,
  "source": "<short source>",
  "initial_range_low": <number — should be wide enough to be non-trivial>,
  "initial_range_high": <number>,
  "type": "date" or "number"
}

Set "type" to "date" if the answer is a year or date (e.g. when something happened, was founded, was born, etc.). For date answers, express the answer as a decimal year (e.g. July 6 1483 = 1483.51). Set "type" to "number" for all other numeric answers.`;

  const text = await callGemini(apiKey, prompt);
  return parseJSON<AIGeneratedQuestion>(text);
}
