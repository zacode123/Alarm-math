import { useState, useCallback } from "react";

type Difficulty = "easy" | "medium" | "hard";

const difficulties = {
  easy: { max: 10, ops: ["+", "-"] },
  medium: { max: 20, ops: ["+", "-", "*"] },
  hard: { max: 100, ops: ["+", "-", "*", "/"] },
} as const;

export function useMathProblem(difficulty: Difficulty) {
  const [problem, setProblem] = useState<{
    question: string;
    answer: number;
  } | null>(null);

  const generateProblem = useCallback(() => {
    try {
      // Validate difficulty
      if (!difficulties[difficulty]) {
        throw new Error(`Invalid difficulty level: ${difficulty}`);
      }

      const { max, ops } = difficulties[difficulty];
      const op = ops[Math.floor(Math.random() * ops.length)];

      // Generate numbers based on operation
      let a: number, b: number;
      if (op === "/") {
        // For division, ensure whole number results
        b = Math.floor(Math.random() * 9) + 2; // Avoid division by 1
        const quotient = Math.floor(Math.random() * 10) + 1;
        a = b * quotient; // This ensures whole number division
      } else {
        a = Math.floor(Math.random() * max) + 1;
        b = Math.floor(Math.random() * max) + 1;

        // For subtraction, ensure positive results
        if (op === "-" && b > a) {
          [a, b] = [b, a];
        }
      }

      // Calculate answer
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
          throw new Error(`Invalid operation: ${op}`);
      }

      setProblem({
        question: `${a} ${op} ${b} = ?`,
        answer: Math.round(answer), // Ensure integer answers
      });
    } catch (error) {
      console.error("Error generating math problem:", error);
      // Set a fallback easy addition problem
      setProblem({
        question: "2 + 2 = ?",
        answer: 4,
      });
    }
  }, [difficulty]);

  const checkAnswer = useCallback((userAnswer: number | string): boolean => {
    if (!problem) return false;

    // Convert string input to number if necessary
    const numericAnswer = typeof userAnswer === "string" 
      ? parseInt(userAnswer, 10) 
      : userAnswer;

    // Check if input is valid number
    if (isNaN(numericAnswer)) return false;

    return numericAnswer === problem.answer;
  }, [problem]);

  return {
    problem,
    generateProblem,
    checkAnswer,
  };
}