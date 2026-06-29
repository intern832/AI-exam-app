import Link from "next/link";
import { Activity, FileQuestion, Users } from "lucide-react";
import { FirestoreNotice } from "@/components/FirestoreNotice";
import { Header } from "@/components/Header";
import { requireAuthToken } from "@/lib/auth";
import { getFirestoreErrorMessage, queryByUser, sortByCreatedAtDesc, type ExamDoc, type SubmissionDoc } from "@/lib/firestore";

export default async function AdminPage() {
  const { token, user } = await requireAuthToken();
  const [examResult, attemptResult] = await Promise.all([
    queryByUser<ExamDoc>(token, "exams", user.id).catch((error) => error),
    queryByUser<SubmissionDoc>(token, "submissions", user.id).catch((error) => error)
  ]);
  const firestoreError =
    examResult instanceof Error
      ? getFirestoreErrorMessage(examResult)
      : attemptResult instanceof Error
        ? getFirestoreErrorMessage(attemptResult)
        : null;
  const exams = firestoreError ? [] : sortByCreatedAtDesc(examResult as ExamDoc[]);
  const attempts = firestoreError ? [] : sortByCreatedAtDesc(attemptResult as SubmissionDoc[]);

  return (
    <div className="min-h-screen">
      <Header user={user} />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-teal-700">Quản trị</p>
          <h1 className="mt-2 text-3xl font-black">Tổng quan dữ liệu của bạn</h1>
          <p className="mt-2 text-[#66736c]">Trang này chỉ hiển thị đề thi và bài làm thuộc tài khoản đang đăng nhập.</p>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <div className="panel rounded-[8px] p-4">
            <Users className="mb-3 text-teal-700" size={22} />
            <p className="text-sm text-[#66736c]">Tài khoản</p>
            <p className="truncate text-2xl font-black">{user.email}</p>
          </div>
          <div className="panel rounded-[8px] p-4">
            <FileQuestion className="mb-3 text-teal-700" size={22} />
            <p className="text-sm text-[#66736c]">Đề đã tạo</p>
            <p className="text-3xl font-black">{exams.length}</p>
          </div>
          <div className="panel rounded-[8px] p-4">
            <Activity className="mb-3 text-teal-700" size={22} />
            <p className="text-sm text-[#66736c]">Lượt nộp bài</p>
            <p className="text-3xl font-black">{attempts.length}</p>
          </div>
        </div>

        {firestoreError ? <FirestoreNotice message={firestoreError} /> : null}

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="panel rounded-[8px] p-5">
            <h2 className="mb-4 text-xl font-bold">Đề thi gần đây</h2>
            <div className="space-y-3">
              {exams.length === 0 ? (
                <p className="rounded-[8px] border border-dashed border-[#cbd8d1] px-4 py-8 text-center text-[#66736c]">
                  Bạn chưa tạo đề nào.
                </p>
              ) : (
                exams.slice(0, 12).map((exam) => (
                  <Link
                    href={`/exam/${exam.id}`}
                    key={exam.id}
                    className="block rounded-[8px] border border-[#dfe5dc] bg-white px-3 py-3 hover:border-[#9cb3aa]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{exam.topic}</p>
                        <p className="text-sm text-[#66736c]">{exam.difficulty}</p>
                      </div>
                      <span className="rounded-[8px] bg-[#e8f5f2] px-2 py-1 text-sm font-bold text-teal-800">
                        {exam.questionCount} câu
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-[#66736c]">{new Date(exam.createdAt).toLocaleString("vi-VN")}</p>
                  </Link>
                ))
              )}
            </div>
          </section>

          <section className="panel rounded-[8px] p-5">
            <h2 className="mb-4 text-xl font-bold">Bài làm gần đây</h2>
            <div className="space-y-3">
              {attempts.length === 0 ? (
                <p className="rounded-[8px] border border-dashed border-[#cbd8d1] px-4 py-8 text-center text-[#66736c]">
                  Chưa có lượt nộp bài nào.
                </p>
              ) : (
                attempts.slice(0, 12).map((attempt) => (
                  <Link
                    href={`/result/${attempt.id}`}
                    key={attempt.id}
                    className="block rounded-[8px] border border-[#dfe5dc] bg-white px-3 py-3 hover:border-[#9cb3aa]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{attempt.topic}</p>
                        <p className="text-sm text-[#66736c]">{attempt.difficulty}</p>
                      </div>
                      <span className="rounded-[8px] bg-[#f3f6f2] px-2 py-1 text-sm font-bold">
                        {attempt.score}/{attempt.total}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-[#66736c]">
                      {new Date(attempt.createdAt).toLocaleString("vi-VN")}
                    </p>
                  </Link>
                ))
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
