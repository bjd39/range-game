import { describe, it, expect, vi, beforeEach } from "vitest";
import { validateQuestion, generateQuestion } from "../utils/gemini";

beforeEach(() => {
  vi.restoreAllMocks();
});

function mockFetch(body: object) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          candidates: [
            { content: { parts: [{ text: JSON.stringify(body) }] } },
          ],
        }),
    })
  );
}

describe("validateQuestion", () => {
  it("parses a valid answerable response", async () => {
    mockFetch({
      answerable: true,
      answer: 1483,
      source: "Wikipedia",
      note: "Coronation year",
    });

    const result = await validateQuestion("key", "When was Richard III coronated?");
    expect(result.answerable).toBe(true);
    expect(result.answer).toBe(1483);
    expect(result.source).toBe("Wikipedia");
  });

  it("parses an unanswerable response", async () => {
    mockFetch({
      answerable: false,
      answer: 0,
      source: "",
      note: "Ambiguous question",
    });

    const result = await validateQuestion("key", "What is life?");
    expect(result.answerable).toBe(false);
    expect(result.note).toBe("Ambiguous question");
  });

  it("handles markdown-fenced JSON in response", async () => {
    const body = { answerable: true, answer: 42, source: "Test" };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            candidates: [
              {
                content: {
                  parts: [{ text: "```json\n" + JSON.stringify(body) + "\n```" }],
                },
              },
            ],
          }),
      })
    );

    const result = await validateQuestion("key", "test");
    expect(result.answer).toBe(42);
  });

  it("throws on API error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: () => Promise.resolve("Unauthorized"),
      })
    );

    await expect(validateQuestion("bad", "test")).rejects.toThrow("401");
  });
});

describe("generateQuestion", () => {
  it("parses a generated question response", async () => {
    mockFetch({
      question: "How tall is the Eiffel Tower in meters?",
      answer: 330,
      source: "Wikipedia",
      initial_range_low: 100,
      initial_range_high: 500,
    });

    const result = await generateQuestion("key");
    expect(result.question).toContain("Eiffel Tower");
    expect(result.answer).toBe(330);
    expect(result.initial_range_low).toBe(100);
    expect(result.initial_range_high).toBe(500);
  });

  it("includes previous questions in the prompt", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      question: "Q",
                      answer: 1,
                      source: "S",
                      initial_range_low: 0,
                      initial_range_high: 10,
                    }),
                  },
                ],
              },
            },
          ],
        }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await generateQuestion("key", undefined, ["Previous Q1", "Previous Q2"]);

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    const prompt = body.contents[0].parts[0].text;
    expect(prompt).toContain("Previous Q1");
    expect(prompt).toContain("Previous Q2");
  });
});
