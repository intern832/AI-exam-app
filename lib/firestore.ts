import "server-only";
import type { Attempt, Difficulty, Exam, Question, User } from "@/lib/types";

type FirestoreValue =
  | { stringValue: string }
  | { integerValue: string }
  | { doubleValue: number }
  | { booleanValue: boolean }
  | { timestampValue: string }
  | { arrayValue: { values?: FirestoreValue[] } }
  | { mapValue: { fields: Record<string, FirestoreValue> } }
  | { nullValue: null };

type FirestoreDocument = {
  name: string;
  fields?: Record<string, FirestoreValue>;
  createTime?: string;
  updateTime?: string;
};

type RunQueryRow = {
  document?: FirestoreDocument;
};

function projectId() {
  const value = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
  if (!value) throw new Error("Chua cau hinh NEXT_PUBLIC_FIREBASE_PROJECT_ID.");
  return value;
}

function baseUrl() {
  return `https://firestore.googleapis.com/v1/projects/${projectId()}/databases/(default)/documents`;
}

function docId(name: string) {
  return name.split("/").pop() ?? "";
}

function toValue(value: unknown): FirestoreValue {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === "string") return { stringValue: value };
  if (typeof value === "number" && Number.isInteger(value)) return { integerValue: String(value) };
  if (typeof value === "number") return { doubleValue: value };
  if (typeof value === "boolean") return { booleanValue: value };
  if (value instanceof Date) return { timestampValue: value.toISOString() };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(toValue) } };
  if (typeof value === "object") {
    return {
      mapValue: {
        fields: Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, toValue(item)]))
      }
    };
  }
  return { stringValue: String(value) };
}

function fromValue(value: FirestoreValue | undefined): unknown {
  if (!value) return undefined;
  if ("stringValue" in value) return value.stringValue;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return value.doubleValue;
  if ("booleanValue" in value) return value.booleanValue;
  if ("timestampValue" in value) return value.timestampValue;
  if ("nullValue" in value) return null;
  if ("arrayValue" in value) return (value.arrayValue.values ?? []).map(fromValue);
  if ("mapValue" in value) {
    return Object.fromEntries(Object.entries(value.mapValue.fields ?? {}).map(([key, item]) => [key, fromValue(item)]));
  }
}

function fromFields(fields?: Record<string, FirestoreValue>) {
  return Object.fromEntries(Object.entries(fields ?? {}).map(([key, value]) => [key, fromValue(value)]));
}

function toFields(data: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(data).map(([key, value]) => [key, toValue(value)]));
}

async function firestoreFetch<T>(token: string, url: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    },
    cache: "no-store"
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Firestore ${response.status}: ${text}`);
  }

  if (response.status === 204) return null as T;
  return (await response.json()) as T;
}

export function getFirestoreErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("403") || message.includes("PERMISSION_DENIED")) {
    return "Firestore từ chối quyền truy cập. Nguyên nhân thường là Rules chưa cho phép user đọc/ghi theo userId hoặc phiên đăng nhập đã hết hạn.";
  }
  if (message.includes("NEXT_PUBLIC_FIREBASE_PROJECT_ID")) {
    return "Thiếu NEXT_PUBLIC_FIREBASE_PROJECT_ID trong .env.local.";
  }
  return "Có lỗi khi kết nối Firestore. Vui lòng thử đăng nhập lại hoặc kiểm tra cấu hình Firebase.";
}

export async function createDocument(token: string, collection: string, data: Record<string, unknown>, documentId?: string) {
  const url = new URL(`${baseUrl()}/${collection}`);
  if (documentId) url.searchParams.set("documentId", documentId);
  const doc = await firestoreFetch<FirestoreDocument>(token, url.toString(), {
    method: "POST",
    body: JSON.stringify({ fields: toFields(data) })
  });
  return docId(doc.name);
}

export async function setDocument(token: string, path: string, data: Record<string, unknown>) {
  const fields = Object.keys(data).map((key) => `updateMask.fieldPaths=${encodeURIComponent(key)}`).join("&");
  await firestoreFetch<FirestoreDocument>(token, `${baseUrl()}/${path}?${fields}`, {
    method: "PATCH",
    body: JSON.stringify({ fields: toFields(data) })
  });
}

export async function deleteDocument(token: string, path: string) {
  await firestoreFetch<null>(token, `${baseUrl()}/${path}`, {
    method: "DELETE"
  });
}

export async function getDocument<T extends Record<string, unknown>>(token: string, path: string) {
  const doc = await firestoreFetch<FirestoreDocument>(token, `${baseUrl()}/${path}`);
  return { id: docId(doc.name), ...(fromFields(doc.fields) as T) };
}

export async function queryByUser<T extends Record<string, unknown>>(token: string, collection: string, userId: string) {
  const result = await firestoreFetch<RunQueryRow[]>(token, `${baseUrl()}:runQuery`, {
    method: "POST",
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: collection }],
        where: {
          fieldFilter: {
            field: { fieldPath: "userId" },
            op: "EQUAL",
            value: { stringValue: userId }
          }
        }
      }
    })
  });

  return result
    .filter((row) => row.document)
    .map((row) => ({ id: docId(row.document!.name), ...(fromFields(row.document!.fields) as T) }));
}

export async function queryByFields<T extends Record<string, unknown>>(
  token: string,
  collection: string,
  filters: Array<{ field: string; value: string }>
) {
  const where =
    filters.length === 1
      ? {
          fieldFilter: {
            field: { fieldPath: filters[0].field },
            op: "EQUAL",
            value: { stringValue: filters[0].value }
          }
        }
      : {
          compositeFilter: {
            op: "AND",
            filters: filters.map((filter) => ({
              fieldFilter: {
                field: { fieldPath: filter.field },
                op: "EQUAL",
                value: { stringValue: filter.value }
              }
            }))
          }
        };

  const result = await firestoreFetch<RunQueryRow[]>(token, `${baseUrl()}:runQuery`, {
    method: "POST",
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: collection }],
        where
      }
    })
  });

  return result
    .filter((row) => row.document)
    .map((row) => ({ id: docId(row.document!.name), ...(fromFields(row.document!.fields) as T) }));
}

export async function getExamWithQuestionsFromFirestore(token: string, examId: string, userId: string) {
  const exam = await getDocument<Omit<Exam, "id">>(token, `exams/${examId}`);
  if (exam.userId !== userId) return null;
  const questions = await queryByFields<Omit<Question, "id">>(token, "ques_bank", [
    { field: "examId", value: examId },
    { field: "userId", value: userId }
  ]);

  return {
    exam: exam as Exam,
    questions: questions.sort((a, b) => a.position - b.position) as Question[]
  };
}

export function sortByCreatedAtDesc<T extends { createdAt?: string }>(items: T[]) {
  return items.sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime());
}

export type UserDoc = User & { createdAt?: string };
export type ExamDoc = Exam & { createdAt: string };
export type QuestionDoc = Question;
export type SubmissionDoc = Attempt & {
  topic: string;
  difficulty: Difficulty;
  answers: Array<{ questionId: string; selectedIndex: number | null; isCorrect: boolean }>;
};
