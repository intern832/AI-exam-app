import Link from "next/link";
import { Clock, FileQuestion, Trophy } from "lucide-react";
import { CreateExamForm } from "@/components/CreateExamForm";
import { FirestoreNotice } from "@/components/FirestoreNotice";
import { Header } from "@/components/Header";
import { requireAuthToken } from "@/lib/auth";
import { getFirestoreErrorMessage, queryByUser, sortByCreatedAtDesc, type SubmissionDoc } from "@/lib/firestore";

export default async function DashboardPage() {
  const { token, user } = await requireAuthToken();
  const attemptsResult = await queryByUser<SubmissionDoc>(token, "submissions", user.id).catch((error) => error);
  const firestoreError = attemptsResult instanceof Error ? getFirestoreErrorMessage(attemptsResult) : null;
  const attempts = firestoreError ? [] : sortByCreatedAtDesc(attemptsResult as SubmissionDoc[]).slice(0, 12);
  const best = attempts.reduce((max, attempt) => Math.max(max, Math.round((attempt.score / attempt.total) * 100)), 0);

  return (
    <div className="min-h-screen">
      <Header user={user} />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-black">Xin chào, {user.name}</h1>
          <p className="mt-2 text-[#66736c]">Tạo đề thi bằng AI và tiếp tục theo dõi lịch sử làm bài của bạn.</p>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <div className="panel rounded-[8px] p-4">
            <FileQuestion className="mb-3 text-teal-700" size={22} />
            <p className="text-sm text-[#66736c]">Lượt đã làm</p>
            <p className="text-3xl font-black">{attempts.length}</p>
          </div>
          <div className="panel rounded-[8px] p-4">
            <Trophy className="mb-3 text-teal-700" size={22} />
            <p className="text-sm text-[#66736c]">Điểm tốt nhất</p>
            <p className="text-3xl font-black">{best}%</p>
          </div>
          <div className="panel rounded-[8px] p-4">
            <Clock className="mb-3 text-teal-700" size={22} />
            <p className="text-sm text-[#66736c]">Tài khoản</p>
            <p className="truncate text-2xl font-black">{user.email}</p>
          </div>
        </div>

        {firestoreError ? <FirestoreNotice message={firestoreError} /> : <CreateExamForm />}

        <section className="mt-6 panel rounded-[8px] p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold">Lịch sử gần đây</h2>
          </div>
          {attempts.length === 0 ? (
            <p className="rounded-[8px] border border-dashed border-[#cbd8d1] px-4 py-8 text-center text-[#66736c]">
              Chưa có bài làm nào. Hãy tạo đề đầu tiên để bắt đầu.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[#dfe5dc] text-left text-[#66736c]">
                    <th className="py-3 font-semibold">Chủ đề</th>
                    <th className="py-3 font-semibold">Mức độ</th>
                    <th className="py-3 font-semibold">Điểm</th>
                    <th className="py-3 font-semibold">Thời gian</th>
                    <th className="py-3 text-right font-semibold">Kết quả</th>
                  </tr>
                </thead>
                <tbody>
                  {attempts.map((attempt) => (
                    <tr key={attempt.id} className="border-b border-[#edf1ed]">
                      <td className="py-3 font-medium">{attempt.topic}</td>
                      <td className="py-3">{attempt.difficulty}</td>
                      <td className="py-3">
                        {attempt.score}/{attempt.total}
                      </td>
                      <td className="py-3">{new Date(attempt.createdAt).toLocaleString("vi-VN")}</td>
                      <td className="py-3 text-right">
                        <Link className="font-semibold text-teal-700 hover:text-teal-900" href={`/result/${attempt.id}`}>
                          Xem
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
