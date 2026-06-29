import "server-only";
import { GoogleAuth } from "google-auth-library";
import OpenAI from "openai";
import { z } from "zod";
import type { Difficulty } from "@/lib/types";

const GeneratedQuestion = z.object({
  prompt: z.string().min(10),
  options: z.array(z.string().min(1)).length(4),
  correctIndex: z.number().int().min(0).max(3),
  explanation: z.string().min(8).max(500)
});

const GeneratedExam = z.object({
  questions: z.array(GeneratedQuestion)
});

export type GeneratedQuestion = z.infer<typeof GeneratedQuestion>;

const examJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["questions"],
  properties: {
    questions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["prompt", "options", "correctIndex", "explanation"],
        properties: {
          prompt: { type: "string" },
          options: {
            type: "array",
            minItems: 4,
            maxItems: 4,
            items: { type: "string" }
          },
          correctIndex: { type: "integer", minimum: 0, maximum: 3 },
          explanation: { type: "string" }
        }
      }
    }
  }
};

function buildPrompt(topic: string, difficulty: Difficulty, count: number) {
  return [
    "Bạn là chuyên gia ra đề trắc nghiệm tiếng Việt.",
    "Hãy tạo đề thi chính xác, không trùng lặp, không mơ hồ.",
    `Chủ đề: ${topic}`,
    `Mức độ: ${difficulty}`,
    `Số câu: ${count}`,
    "Mỗi câu có đúng 4 đáp án, chỉ 1 đáp án đúng, correctIndex là số 0-3.",
    "Giải thích ngắn gọn bằng tiếng Việt.",
    "Chỉ trả về JSON theo schema: { questions: [{ prompt, options, correctIndex, explanation }] }."
  ].join("\n");
}

function validateGeneratedExam(raw: unknown, count: number) {
  const parsed = GeneratedExam.parse(raw);
  if (parsed.questions.length !== count) {
    throw new Error("AI trả về sai số lượng câu hỏi.");
  }
  return parsed.questions;
}

function getVertexConfig() {
  return {
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID || process.env.VERTEX_PROJECT_ID,
    location: process.env.GOOGLE_CLOUD_LOCATION || process.env.VERTEX_AI_LOCATION || "us-central1",
    model: process.env.VERTEX_AI_MODEL || "gemini-2.5-flash",
    serviceAccountJson64: process.env.GOOGLE_SERVICE_ACCOUNT_JSON64 || process.env.SERVICE_ACCOUNT_JSON64
  };
}

function decodeServiceAccount(json64: string) {
  try {
    let normalized = json64.trim().replace(/\s+/g, "").replace(/-/g, "+").replace(/_/g, "/");
    while (normalized.length % 4 !== 0) normalized += "=";
    return JSON.parse(Buffer.from(normalized, "base64").toString("utf8")) as Record<string, unknown>;
  } catch {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON64 không hợp lệ. Hãy mã hóa base64 toàn bộ file service account JSON.");
  }
}

async function generateWithVertex({
  topic,
  difficulty,
  count
}: {
  topic: string;
  difficulty: Difficulty;
  count: number;
}) {
  const { projectId, location, model, serviceAccountJson64 } = getVertexConfig();
  if (!projectId || !location || !model || !serviceAccountJson64) {
    throw new Error(
      "Chưa cấu hình Vertex AI. Cần GOOGLE_CLOUD_PROJECT_ID, GOOGLE_CLOUD_LOCATION, VERTEX_AI_MODEL và GOOGLE_SERVICE_ACCOUNT_JSON64 trong .env.local."
    );
  }

  const credentials = decodeServiceAccount(serviceAccountJson64);
  const auth = new GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/cloud-platform"]
  });
  const accessToken = await auth.getAccessToken();
  if (!accessToken) {
    throw new Error("Không lấy được Google Cloud access token từ service account.");
  }

  const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:generateContent`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: buildPrompt(topic, difficulty, count) }]
        }
      ],
      generationConfig: {
        temperature: 0.4,
        responseMimeType: "application/json",
        responseSchema: {
          ...examJsonSchema,
          properties: {
            questions: {
              ...examJsonSchema.properties.questions,
              minItems: count,
              maxItems: count
            }
          }
        }
      }
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Vertex AI lỗi ${response.status}: ${text}`);
  }

  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? "";
  if (!text) {
    throw new Error("Vertex AI không trả về nội dung câu hỏi.");
  }

  return validateGeneratedExam(JSON.parse(text), count);
}

async function generateWithOpenAI({
  topic,
  difficulty,
  count
}: {
  topic: string;
  difficulty: Difficulty;
  count: number;
}) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Chưa cấu hình OPENAI_API_KEY trong .env.local.");
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const model = process.env.OPENAI_MODEL || "gpt-5.4-mini";

  const response = await client.responses.create({
    model,
    input: [
      {
        role: "system",
        content:
          "Bạn là chuyên gia ra đề trắc nghiệm tiếng Việt. Chỉ tạo câu hỏi chính xác, không trùng lặp, có giải thích ngắn gọn."
      },
      {
        role: "user",
        content: buildPrompt(topic, difficulty, count)
      }
    ],
    text: {
      format: {
        type: "json_schema",
        name: "generated_exam",
        strict: true,
        schema: {
          ...examJsonSchema,
          properties: {
            questions: {
              ...examJsonSchema.properties.questions,
              minItems: count,
              maxItems: count
            }
          }
        }
      }
    }
  });

  return validateGeneratedExam(JSON.parse(response.output_text), count);
}

export async function generateQuestions({
  topic,
  difficulty,
  count
}: {
  topic: string;
  difficulty: Difficulty;
  count: number;
}) {
  const provider = (process.env.AI_PROVIDER || "").toLowerCase();
  if (provider === "openai") {
    return generateWithOpenAI({ topic, difficulty, count });
  }

  return generateWithVertex({ topic, difficulty, count });
}
