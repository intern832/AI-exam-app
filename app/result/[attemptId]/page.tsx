import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, X } from "lucide-react";
import { FirestoreNotice } from "@/components/FirestoreNotice";
import { Header } from "@/components/Header";
import { requireAuthToken } from "@/lib/auth";
import {
  getDocument,
  getExamWithQuestionsFromFirestore,
  getFirestoreErrorMessage,
  type SubmissionDoc
} from "@/lib/firestore";
import type { Question } from "@/lib/types";

export default async function ResultPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const { token, user } = await requireAuthToken();
  const { attemptId } = await params;
  const attemptResult = await getDocument<SubmissionDoc>(token, `submissions/${attemptId}`).catch((error) => error);
  if (attemptResult instanceof Error) {
    return (
      <div className="min-h-screen">
        <Header user={user} />
        <main className="mx-auto max-w-4xl px-4 py-8">
          <FirestoreNotice message={getFirestoreErrorMessage(attemptResult)} />
        </main>
      </div>
    );
  }
  const attempt = attemptResult as SubmissionDoc;
  if (!attempt || attempt.userId !== user.id) notFound();

  const dataResult = await getExamWithQuestionsFromFirestore(token, attempt.examId, user.id).catch((error) => error);
  if (dataResult instanceof Error) {
    return (
      <div className="min-h-screen">
        <Header user={user} />
        <main className="mx-auto max-w-4xl px-4 py-8">
          <FirestoreNotice message={getFirestoreErrorMessage(dataResult)} />
        </main>
      </div>
    );
  }
  const data = dataResult as { questions: Question[]; exam: { topic: string; difficulty: string } };
  if (!data) notFound();
  const answerMap = new Map(attempt.answers.map((answer) => [answer.questionId, answer]));
  const percent = Math.round((attempt.score / attempt.total) * 100);

  return (
    <div className="min-h-screen">
      <Header user={user} />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <section className="panel mb-5 rounded-[8px] p-5">
          <Link href="/dashboard" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-teal-700">
            <ArrowLeft size={16} />
            Về bảng điều khiển
          </Link>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-teal-700">Kết quả</p>
              <h1 className="mt-2 text-3xl font-black">{data.exam.topic}</h1>
              <p className="mt-1 text-[#66736c]">
                {data.exam.difficulty} · {new Date(attempt.createdAt).toLocaleString("vi-VN")}
              </p>
            </div>
            <div className="rounded-[8px] bg-[#e8f5f2] px-5 py-4 text-center">
              <p className="text-sm text-teal-800">Điểm số</p>
              <p className="text-4xl font-black text-teal-900">
                {attempt.score}/{attempt.total}
              </p>
              <p className="font-semibold text-teal-800">{percent}%</p>
            </div>
          </div>
        </section>

        <div className="space-y-4">
          {data.questions.map((question, index) => {
            const answer = answerMap.get(question.id);
            return (
              <section key={question.id} className="panel rounded-[8px] p-5">
                <div className="mb-4 flex items-start gap-3">
                  <span
                    className={`flex size-8 shrink-0 items-center justify-center rounded-[8px] ${
                      answer?.isCorrect ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}
                  >
                    {answer?.isCorrect ? <Check size={18} /> : <X size={18} />}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-[#66736c]">Câu {index + 1}</p>
                    <h2 className="mt-1 text-lg font-semibold leading-relaxed">{question.prompt}</h2>
                  </div>
                </div>
                <div className="grid gap-2">
                  {question.options.map((option, optionIndex) => {
                    const isCorrect = optionIndex === question.correctIndex;
                    const isSelected = answer?.selectedIndex === optionIndex;
                    return (
                      <div
                        key={option}
                        className={`rounded-[8px] border px-3 py-2 ${
                          isCorrect
                            ? "border-green-300 bg-green-50"
                            : isSelected
                              ? "border-red-300 bg-red-50"
                              : "border-[#dfe5dc] bg-white"
                        }`}
                      >
                        <span className="font-medium">{option}</span>
                        {isCorrect ? <span className="ml-2 text-sm font-semibold text-green-700">Đúng</span> : null}
                        {isSelected && !isCorrect ? (
                          <span className="ml-2 text-sm font-semibold text-red-700">Bạn chọn</span>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
                <p className="mt-4 rounded-[8px] bg-[#f3f6f2] px-3 py-2 text-sm text-[#52625a]">
                  <span className="font-semibold text-[#17201d]">Giải thích: </span>
                  {question.explanation}
                </p>
              </section>
            );
          })}
        </div>
      </main>
    </div>
  );
}
