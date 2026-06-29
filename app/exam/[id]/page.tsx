import { notFound } from "next/navigation";
import { ExamClient } from "@/components/ExamClient";
import { FirestoreNotice } from "@/components/FirestoreNotice";
import { Header } from "@/components/Header";
import { ImportJsonPanel } from "@/components/ImportJsonPanel";
import { requireAuthToken } from "@/lib/auth";
import { getExamWithQuestionsFromFirestore, getFirestoreErrorMessage } from "@/lib/firestore";

export default async function ExamPage({ params }: { params: Promise<{ id: string }> }) {
  const { token, user } = await requireAuthToken();
  const { id } = await params;
  const result = await getExamWithQuestionsFromFirestore(token, id, user.id).catch((error) => error);
  if (result instanceof Error) {
    return (
      <div className="min-h-screen">
        <Header user={user} />
        <main className="mx-auto max-w-4xl px-4 py-8">
          <FirestoreNotice message={getFirestoreErrorMessage(result)} />
        </main>
      </div>
    );
  }
  const data = result;
  if (!data) notFound();

  return (
    <div className="min-h-screen">
      <Header user={user} />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <ImportJsonPanel examId={data.exam.id} />
        <ExamClient exam={data.exam} questions={data.questions} />
      </main>
    </div>
  );
}
