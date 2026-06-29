import { NextResponse } from "next/server";
import { z } from "zod";
import { generateQuestions } from "@/lib/ai";
import { getSessionToken, verifyFirebaseToken } from "@/lib/auth";
import { createDocument } from "@/lib/firestore";
import type { Difficulty } from "@/lib/types";

const examSchema = z.object({
  topic: z.string().trim().min(2).max(120),
  difficulty: z.enum(["Dễ", "Trung bình", "Khó"]),
  count: z.coerce.number().int().min(5).max(30)
});

export async function POST(request: Request) {
  const token = await getSessionToken();
  const user = token ? await verifyFirebaseToken(token) : null;
  if (!token || !user) {
    return NextResponse.json({ message: "Vui lòng đăng nhập lại." }, { status: 401 });
  }

  const parsed = examSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ message: "Chủ đề, mức độ hoặc số lượng câu hỏi chưa hợp lệ." }, { status: 400 });
  }

  let generated;
  try {
    generated = await generateQuestions({
      topic: parsed.data.topic,
      difficulty: parsed.data.difficulty as Difficulty,
      count: parsed.data.count
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không thể tạo đề bằng AI.";
    return NextResponse.json({ message }, { status: 500 });
  }

  try {
    const now = new Date();
    const examId = await createDocument(token, "exams", {
      userId: user.id,
      topic: parsed.data.topic,
      difficulty: parsed.data.difficulty,
      questionCount: parsed.data.count,
      createdAt: now
    });

    await Promise.all(
      generated.map((question, index) =>
        createDocument(token, "ques_bank", {
          userId: user.id,
          examId,
          topic: parsed.data.topic,
          difficulty: parsed.data.difficulty,
          prompt: question.prompt,
          options: question.options,
          correctIndex: question.correctIndex,
          explanation: question.explanation,
          position: index + 1,
          createdAt: now
        })
      )
    );

    return NextResponse.json({ examId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không thể lưu đề vào Firestore.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
