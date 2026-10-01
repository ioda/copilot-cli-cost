export const benchmarkSource = Object.freeze({
  name: "Artificial Analysis Intelligence Index",
  url: "https://artificialanalysis.ai/leaderboards/models",
  verifiedAt: "2026-10-01",
  note: "Snapshot of published rounded scores. Missing scores are not inferred. Higher is better; index ratios are a selection heuristic, not measured accuracy ratios."
});

const adaptiveConfiguration = "Adaptive reasoning with default fallback";

export const modelBenchmarks = Object.freeze({
  "claude-opus-5.5": benchmark(
    { low: 42, medium: 51, high: 54, xhigh: 56, max: 58 },
    adaptiveConfiguration
  ),
  "claude-fable-5.1": benchmark(
    { low: 47, medium: 49, high: 51, xhigh: 53, max: 53 },
    adaptiveConfiguration
  ),
  "claude-sonnet-5.5": benchmark(
    { medium: 41, high: 47, xhigh: 52, max: 56 },
    adaptiveConfiguration
  ),
  "gpt-6-astra": benchmark({ low: 46, medium: 50, high: 51, xhigh: 52, max: 53 }),
  "gpt-6.1-sol": benchmark({ low: 42, medium: 48, high: 50, xhigh: 51, max: 52 }),
  "gpt-6-sol": benchmark({ none: 28, low: 34, medium: 40, high: 43, xhigh: 44, max: 48 }),
  "gpt-6-luna": benchmark({ none: 18, low: 21, medium: 29, high: 32, xhigh: 34, max: 37 }),
  "gpt-5.6-terra": benchmark({ none: 21, low: 27, medium: 30, high: 34, xhigh: 38, max: 42 }),
  "grok-4.7": benchmark({ low: 42, high: 46, xhigh: 46 }),
  "gemini-3.8-flash": benchmark({ low: 33, medium: 40, high: 41 }),
  "kimi-k3": benchmark({ low: 30, max: 44 }),
  "kimi-k2.7-code": Object.freeze({
    scores: Object.freeze({}),
    unspecifiedEffortScore: 26,
    configuration: "Published score has no specified reasoning effort; excluded from effort-specific comparisons."
  }),
  "gpt-5.3-codex": Object.freeze({
    scores: Object.freeze({ xhigh: 33 }),
    qualifiedEfforts: Object.freeze(["xhigh"]),
    configuration: "The source marks this score with an asterisk. It is shown for reference but excluded from recommendations until its qualification is resolved."
  })
});

function benchmark(scores, configuration = "Published reasoning-effort configuration") {
  return Object.freeze({ scores: Object.freeze(scores), configuration });
}
