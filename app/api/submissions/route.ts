import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionToken, verifyFirebaseToken } from "@/lib/auth";
import { createDocument, getExamWithQuestionsFromFirestore } from "@/lib/firestore";

const submitSchema = z.object({
  examId: z.string().min(1),
  answers: z.record(z.coerce.number().int().min(0).max(3))
});

export async function POST(request: Request) {
  const token = await getSessionToken();
  const user = token ? await verifyFirebaseToken(token) : null;
  if (!token || !user) {
    return NextResponse.json({ message: "Vui lòng đăng nhập lại." }, { status: 401 });
  }

  const parsed = submitSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ message: "Dữ liệu nộp bài không hợp lệ." }, { status: 400 });
  }

  const data = await getExamWithQuestionsFromFirestore(token, parsed.data.examId, user.id);
  if (!data) {
    return NextResponse.json({ message: "Không tìm thấy đề thi của bạn." }, { status: 404 });
  }

  let score = 0;
  const answers = data.questions.map((question) => {
    const selectedIndex = parsed.data.answers[question.id] ?? null;
    const isCorrect = selectedIndex === question.correctIndex;
    if (isCorrect) score += 1;
    return { questionId: question.id, selectedIndex, isCorrect };
  });

  try {
    const submissionId = await createDocument(token, "submissions", {
      userId: user.id,
      examId: data.exam.id,
      topic: data.exam.topic,
      difficulty: data.exam.difficulty,
      score,
      total: data.questions.length,
      answers,
      createdAt: new Date()
    });

    return NextResponse.json({ submissionId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không thể lưu bài làm vào Firestore.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
