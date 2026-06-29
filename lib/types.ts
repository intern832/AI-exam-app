export type Role = "admin" | "user";

export type User = {
  id: string;
  email: string;
  name: string;
  role?: Role;
  createdAt?: string;
};

export type Difficulty = "Dễ" | "Trung bình" | "Khó";

export type Question = {
  id: string;
  examId: string;
  userId: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  position: number;
};

export type Exam = {
  id: string;
  userId: string;
  topic: string;
  difficulty: Difficulty;
  questionCount: number;
  createdAt: string;
};

export type Attempt = {
  id: string;
  examId: string;
  userId: string;
  score: number;
  total: number;
  createdAt: string;
};
