import type { Comparator } from "@/types/workflow";

/**
 * Evaluates a condition against an input value using the specified comparator.
 * Uses explicit switch/case — no eval() or dynamic code execution.
 */
export function evaluateCondition(
  input: string,
  comparator: Comparator,
  value: string
): boolean {
  switch (comparator) {
    case "contains":
      return input.includes(value);

    case "equals":
      return input === value;

    case "starts_with":
      return input.startsWith(value);

    case "greater_than": {
      const inputNum = parseFloat(input);
      const valueNum = parseFloat(value);
      if (isNaN(inputNum) || isNaN(valueNum)) return false;
      return inputNum > valueNum;
    }

    case "less_than": {
      const inputNum = parseFloat(input);
      const valueNum = parseFloat(value);
      if (isNaN(inputNum) || isNaN(valueNum)) return false;
      return inputNum < valueNum;
    }

    default:
      return false;
  }
}
