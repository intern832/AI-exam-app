import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionToken, verifyFirebaseToken } from "@/lib/auth";
import {
  createDocument,
  deleteDocument,
  getExamWithQuestionsFromFirestore,
  setDocument
} from "@/lib/firestore";

const ImportedQuestion = z.object({
  question: z.string().min(5).optional(),
  prompt: z.string().min(5).optional(),
  options: z.array(z.string().min(1)).length(4),
  correctIndex: z.number().int().min(0).max(3).optional(),
  correctAnswer: z.string().optional(),
  "correct Answer": z.string().optional(),
  explanation: z.string().min(3)
});

const ImportPayload = z.object({
  questions: z.array(ImportedQuestion).min(1).max(100),
  replaceExisting: z.boolean().default(true)
});

function normalizeQuestion(input: z.infer<typeof ImportedQuestion>, index: number) {
  const prompt = input.prompt ?? input.question;
  if (!prompt) {
    throw new Error(`Cau ${index + 1} thieu truong question hoac prompt.`);
  }

  const correctAnswer = input.correctAnswer ?? input["correct Answer"];
  const correctIndex =
    typeof input.correctIndex === "number"
      ? input.correctIndex
      : correctAnswer
        ? input.options.findIndex((option) => option.trim() === correctAnswer.trim())
        : -1;

  if (correctIndex < 0 || correctIndex > 3) {
    throw new Error(`Cau ${index + 1} khong xac dinh duoc dap an dung.`);
  }

  return {
    prompt,
    options: input.options,
    correctIndex,
    explanation: input.explanation
  };
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const token = await getSessionToken();
  const user = token ? await verifyFirebaseToken(token) : null;
  if (!token || !user) {
    return NextResponse.json({ message: "Vui long dang nhap lai." }, { status: 401 });
  }

  const { id: examId } = await params;
  const body = await request.json().catch(() => null);
  const parsed = ImportPayload.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "JSON khong hop le. Can mang questions, moi cau co 4 options va explanation." },
      { status: 400 }
    );
  }

  const data = await getExamWithQuestionsFromFirestore(token, examId, user.id).catch(() => null);
  if (!data) {
    return NextResponse.json({ message: "Khong tim thay de thi cua ban." }, { status: 404 });
  }

  let questions;
  try {
    questions = parsed.data.questions.map(normalizeQuestion);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Khong the doc cau hoi.";
    return NextResponse.json({ message }, { status: 400 });
  }

  try {
    if (parsed.data.replaceExisting) {
      await Promise.all(data.questions.map((question) => deleteDocument(token, `ques_bank/${question.id}`)));
    }

    const startPosition = parsed.data.replaceExisting ? 1 : data.questions.length + 1;
    const now = new Date();
    await Promise.all(
      questions.map((question, index) =>
        createDocument(token, "ques_bank", {
          userId: user.id,
          examId,
          topic: data.exam.topic,
          difficulty: data.exam.difficulty,
          prompt: question.prompt,
          options: question.options,
          correctIndex: question.correctIndex,
          explanation: question.explanation,
          position: startPosition + index,
          createdAt: now
        })
      )
    );

    await setDocument(token, `exams/${examId}`, {
      questionCount: parsed.data.replaceExisting ? questions.length : data.questions.length + questions.length,
      updatedAt: now
    });

    return NextResponse.json({ imported: questions.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Khong the luu cau hoi vao Firestore.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
