import type { Exercise } from "../../domain/models/exercise";
import type { MistakeEntry } from "../../domain/models/mistake";
import type { AppSettings } from "../../domain/models/settings";
import {
  generatePracticeSet,
  generateVariationPool,
} from "../../domain/services/exercise-generation-service";
import { createOpenAiCompatibleClient } from "../../llm/openai-client";

export async function buildPracticeExercises(
  mistakes: MistakeEntry[],
  size: number,
  settings: AppSettings,
): Promise<Exercise[]> {
  const baseExercises = generatePracticeSet(mistakes, size);

  if (
    settings.gradingStrategy === "rule_based_only" ||
    !settings.llm.apiKey ||
    mistakes.length === 0
  ) {
    return baseExercises;
  }

  try {
    const client = createOpenAiCompatibleClient({
      apiKey: settings.llm.apiKey,
      baseUrl: settings.llm.baseUrl ?? "https://api.openai.com/v1",
      model: settings.llm.model ?? "gpt-5-mini",
    });
    const variationCount = Math.min(3, Math.max(1, Math.ceil(size / Math.max(1, mistakes.length))));
    const llmGroups = await Promise.all(
      mistakes.slice(0, Math.min(size, mistakes.length)).map((mistake) =>
        client.generateVariationExercises({
          mistake,
          count: variationCount,
          preferredTypes: ["context_response", "minimal_pair", "fix_the_hebrew"],
        }),
      ),
    );
    const llmExercises = llmGroups.flat();
    const fallbackPool = generatePracticeSet(mistakes, size * 2);

    return [...llmExercises, ...fallbackPool, ...baseExercises].slice(0, size);
  } catch {
    return baseExercises;
  }
}
