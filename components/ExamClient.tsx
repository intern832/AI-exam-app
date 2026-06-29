"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Send } from "lucide-react";
import type { Exam, Question } from "@/lib/types";

export function ExamClient({ exam, questions }: { exam: Exam; questions: Question[] }) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const answered = Object.keys(answers).length;
  const percent = useMemo(
    () => (questions.length === 0 ? 0 : Math.round((answered / questions.length) * 100)),
    [answered, questions.length]
  );

  async function submit() {
    setPending(true);
    setMessage(null);
    try {
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examId: exam.id, answers })
      });
      const data = (await response.json().catch(() => null)) as { submissionId?: string; message?: string } | null;
      if (!response.ok || !data?.submissionId) throw new Error(data?.message ?? "Không thể nộp bài.");
      router.push(`/result/${data.submissionId}`);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không thể nộp bài.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="panel sticky top-0 z-10 rounded-[8px] p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">{exam.topic}</h1>
            <p className="text-sm text-[#66736c]">
              {exam.difficulty} · {questions.length} câu hỏi · Đã trả lời {answered}/{questions.length}
            </p>
          </div>
          <button
            type="button"
            onClick={submit}
            disabled={pending}
            className="btn-primary focus-ring flex items-center justify-center gap-2 rounded-[8px] px-4 py-3 font-semibold disabled:cursor-wait disabled:opacity-70"
          >
            <Send size={18} />
            {pending ? "Đang nộp..." : "Nộp bài"}
          </button>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#e1e8e3]">
          <div className="h-full bg-teal-600 transition-all" style={{ width: `${percent}%` }} />
        </div>
        {message ? (
          <div className="mt-4 rounded-[8px] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {message}
          </div>
        ) : null}
      </div>

      {questions.length === 0 ? (
        <section className="panel rounded-[8px] p-5 text-center text-[#66736c]">
          De thi nay chua co cau hoi. Hay dung nut Import JSON de them cau hoi.
        </section>
      ) : null}

      {questions.map((question, index) => (
        <section key={question.id} className="panel rounded-[8px] p-5">
          <div className="mb-4 flex items-start gap-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-[8px] bg-[#e8f5f2] text-sm font-bold text-teal-700">
              {index + 1}
            </span>
            <h2 className="text-lg font-semibold leading-relaxed">{question.prompt}</h2>
          </div>
          <div className="grid gap-3">
            {question.options.map((option, optionIndex) => {
              const selected = answers[question.id] === optionIndex;
              return (
                <label
                  key={option}
                  className={`focus-within:ring-3 flex cursor-pointer items-center gap-3 rounded-[8px] border p-3 transition ${
                    selected
                      ? "border-teal-500 bg-[#e8f5f2] ring-teal-100"
                      : "border-[#dfe5dc] bg-white hover:border-[#9cb3aa]"
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    value={optionIndex}
                    className="size-4 accent-teal-600"
                    onChange={() => setAnswers((current) => ({ ...current, [question.id]: optionIndex }))}
                  />
                  <span className="flex-1">{option}</span>
                  {selected ? <CheckCircle2 className="text-teal-600" size={18} /> : null}
                </label>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
