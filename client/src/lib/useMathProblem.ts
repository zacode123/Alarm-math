import { useState, useCallback } from "react";

type Difficulty = "easy" | "medium" | "hard";

export function useMathProblem(difficulty: Difficulty) {
  const [problem, setProblem] = useState<{
    question: string;
    answer: number;
  } | null>(null);

  const generateProblem = useCallback(() => {
    const difficulties = {
      easy: { max: 10, ops: ["+", "-"] },
      medium: { max: 20, ops: ["+", "-", "*"] },
      hard: { max: 100, ops: ["+", "-", "*", "/"] },
    };

    const { max, ops } = difficulties[difficulty];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let a = Math.floor(Math.random() * max) + 1;
    let b = Math.floor(Math.random() * max) + 1;

    if (op === "/") {
      // Ensure division results in whole numbers
      b = Math.floor(Math.random() * 10) + 1;
      a = b * (Math.floor(Math.random() * 10) + 1);
    }

    let answer: number;
    switch (op) {
      case "+":
        answer = a + b;
        break;
      case "-":
        answer = a - b;
        break;
      case "*":
        answer = a * b;
        break;
      case "/":
        answer = a / b;
        break;
      default:
        answer = 0;
    }

    setProblem({
      question: `${a} ${op} ${b} = ?`,
      answer,
    });
  }, [difficulty]);

  const checkAnswer = useCallback((userAnswer: number) => {
    if (!problem) return false;
    return Math.abs(userAnswer - problem.answer) < 0.001;
  }, [problem]);

  return {
    problem,
    generateProblem,
    checkAnswer,
  };
}
