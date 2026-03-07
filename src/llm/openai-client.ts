import type {
  LlmClient,
  LlmGenerateTranslationReferenceInput,
  LlmGenerateTranslationReferenceOutput,
  LlmGenerateVariationInput,
  LlmGradeInput,
  LlmGradeOutput,
} from "./llm-client";
import { buildGradeAnswerPrompt } from "./prompts/grade-answer";
import { buildGenerateTranslationReferencePrompt } from "./prompts/generate-translation-reference";
import { buildGenerateVariationPrompt } from "./prompts/generate-variation";

interface OpenAiCompatibleClientOptions {
  apiKey: string;
  baseUrl: string;
  model: string;
}

interface ChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

interface JsonSchemaResponseFormat {
  type: "json_schema";
  json_schema: {
    name: string;
    strict: true;
    schema: Record<string, unknown>;
  };
}

interface JsonRequestOptions {
  schemaName?: string;
  schema?: Record<string, unknown>;
}

function logSchemaModeFailure(
  status: number,
  message: string,
  requestOptions: JsonRequestOptions,
): void {
  if (!requestOptions.schemaName) {
    return;
  }

  console.warn("[openai-client] json_schema request failed", {
    schemaName: requestOptions.schemaName,
    status,
    message,
  });
}

const ATTEMPT_ISSUE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    code: {
      type: "string",
      enum: [
        "spelling_error",
        "wrong_fragment",
        "missing_fragment",
        "structure_error",
        "register_mismatch",
        "near_miss",
      ],
    },
    message: { type: "string" },
    expectedFragment: { type: ["string", "null"] },
    actualFragment: { type: ["string", "null"] },
  },
  required: ["code", "message", "expectedFragment", "actualFragment"],
} as const;

const TEACHING_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    yourAnswer: { type: "string" },
    betterAnswer: { type: "string" },
    whatChanged: { type: "string" },
    whyPreferred: { type: "string" },
    why: { type: "string" },
    anotherExample: { type: ["string", "null"] },
  },
  required: [
    "yourAnswer",
    "betterAnswer",
    "whatChanged",
    "whyPreferred",
    "why",
    "anotherExample",
  ],
} as const;

const GENERATED_PRACTICE_ITEM_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    englishPrompt: { type: "string" },
    primaryTranslation: { type: "string" },
    acceptableTranslations: {
      type: "array",
      items: { type: "string" },
    },
    focusTokens: {
      type: "array",
      items: { type: "string" },
    },
    practiceRoots: {
      type: "array",
      items: { type: "string" },
    },
    register: { type: "string", enum: ["casual", "neutral", "formal"] },
    contexts: {
      type: "array",
      items: {
        type: "string",
        enum: ["casual_text", "formal_note", "office", "scheduling", "social"],
      },
    },
  },
  required: [
    "englishPrompt",
    "primaryTranslation",
    "acceptableTranslations",
    "focusTokens",
    "practiceRoots",
    "register",
    "contexts",
  ],
} as const;

const MISTAKE_ANALYSIS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    actualFragment: { type: "string" },
    expectedFragment: { type: "string" },
    issueCode: {
      type: "string",
      enum: [
        "spelling_error",
        "wrong_fragment",
        "missing_fragment",
        "structure_error",
        "register_mismatch",
        "near_miss",
      ],
    },
    shortExplanation: { type: "string" },
    whyPreferred: { type: "string" },
    practiceItems: {
      type: "array",
      items: GENERATED_PRACTICE_ITEM_SCHEMA,
    },
  },
  required: [
    "actualFragment",
    "expectedFragment",
    "issueCode",
    "shortExplanation",
    "whyPreferred",
    "practiceItems",
  ],
} as const;

const GRADE_ANSWER_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    isCorrect: { type: "boolean" },
    score: { type: "number" },
    feedbackSummary: { type: "string" },
    correctedAnswer: { type: "string" },
    teaching: TEACHING_SCHEMA,
    semanticAccepted: { type: "boolean" },
    naturalnessAccepted: { type: "boolean" },
    targetedPatternHandled: { type: "boolean" },
    issues: {
      type: "array",
      items: ATTEMPT_ISSUE_SCHEMA,
    },
    mistakeAnalyses: {
      type: "array",
      items: MISTAKE_ANALYSIS_SCHEMA,
    },
  },
  required: [
    "isCorrect",
    "score",
    "feedbackSummary",
    "correctedAnswer",
    "teaching",
    "semanticAccepted",
    "naturalnessAccepted",
    "targetedPatternHandled",
    "issues",
    "mistakeAnalyses",
  ],
} as const;

const TRANSLATION_REFERENCE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    primaryTranslation: { type: "string" },
    acceptableTranslations: {
      type: "array",
      items: { type: "string" },
    },
    focusTokens: {
      type: "array",
      items: { type: "string" },
    },
    practiceRoots: {
      type: "array",
      items: { type: "string" },
    },
    register: { type: "string", enum: ["casual", "neutral", "formal"] },
    contexts: {
      type: "array",
      items: {
        type: "string",
        enum: ["casual_text", "formal_note", "office", "scheduling", "social"],
      },
    },
    ruleNote: { type: "string" },
  },
  required: [
    "primaryTranslation",
    "acceptableTranslations",
    "focusTokens",
    "practiceRoots",
    "register",
    "contexts",
    "ruleNote",
  ],
} as const;

function shouldRetryWithoutSchema(status: number, message: string): boolean {
  if (status === 400 || status === 404 || status === 422) {
    return true;
  }

  return /response_format|json_schema|schema|unsupported/i.test(message);
}

async function postJson<TResponse>(
  options: OpenAiCompatibleClientOptions,
  prompt: string,
  requestOptions: JsonRequestOptions = {},
): Promise<TResponse> {
  const buildBody = (useSchema: boolean) => ({
    model: options.model,
    messages: [
      {
        role: "system",
        content: "Return JSON only. No markdown fences.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.2,
    ...(useSchema && requestOptions.schema && requestOptions.schemaName
      ? {
          response_format: {
            type: "json_schema",
            json_schema: {
              name: requestOptions.schemaName,
              strict: true,
              schema: requestOptions.schema,
            },
          } satisfies JsonSchemaResponseFormat,
        }
      : {}),
  });

  const request = async (useSchema: boolean) =>
    fetch(`${options.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${options.apiKey}`,
      },
      body: JSON.stringify(buildBody(useSchema)),
    });

  let response = await request(Boolean(requestOptions.schema));

  if (!response.ok) {
    const message = await response.text();
    logSchemaModeFailure(response.status, message, requestOptions);
    if (
      requestOptions.schema &&
      shouldRetryWithoutSchema(response.status, message)
    ) {
      response = await request(false);
    } else {
      throw new Error(`LLM request failed with status ${response.status}`);
    }
  }

  if (!response.ok) {
    throw new Error(`LLM request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as ChatCompletionResponse;
  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("LLM returned no content");
  }

  return JSON.parse(content) as TResponse;
}

export function createOpenAiCompatibleClient(
  options: OpenAiCompatibleClientOptions,
): LlmClient {
  return {
    async gradeAnswer(input: LlmGradeInput): Promise<LlmGradeOutput> {
      return postJson<LlmGradeOutput>(options, buildGradeAnswerPrompt(input), {
        schemaName: "grade_answer",
        schema: GRADE_ANSWER_SCHEMA,
      });
    },

    async generateTranslationReference(
      input: LlmGenerateTranslationReferenceInput,
    ): Promise<LlmGenerateTranslationReferenceOutput> {
      return postJson<LlmGenerateTranslationReferenceOutput>(
        options,
        buildGenerateTranslationReferencePrompt(input),
        {
          schemaName: "translation_reference",
          schema: TRANSLATION_REFERENCE_SCHEMA,
        },
      );
    },

    async generateVariationExercises(input: LlmGenerateVariationInput) {
      return postJson(options, buildGenerateVariationPrompt(input));
    },
  };
}
