import { describe, it, expect } from "vitest";
import { evaluateCondition } from "@/lib/condition-evaluator";

describe("evaluateCondition", () => {
  describe("contains", () => {
    it("returns true when input contains the value", () => {
      expect(evaluateCondition("Hello World", "contains", "World")).toBe(true);
    });

    it("returns false when input does not contain the value", () => {
      expect(evaluateCondition("Hello World", "contains", "Goodbye")).toBe(false);
    });
  });

  describe("equals", () => {
    it("returns true for an exact match", () => {
      expect(evaluateCondition("exact match", "equals", "exact match")).toBe(true);
    });

    it("returns false when strings differ", () => {
      expect(evaluateCondition("abc", "equals", "xyz")).toBe(false);
    });
  });

  describe("starts_with", () => {
    it("returns true when input starts with the value", () => {
      expect(evaluateCondition("NextFlow Builder", "starts_with", "Next")).toBe(true);
    });

    it("returns false when input does not start with the value", () => {
      expect(evaluateCondition("NextFlow Builder", "starts_with", "Flow")).toBe(false);
    });
  });

  describe("greater_than / less_than", () => {
    it("returns true when numeric input is greater than numeric value", () => {
      expect(evaluateCondition("42", "greater_than", "10")).toBe(true);
    });

    it("returns true when numeric input is less than numeric value", () => {
      expect(evaluateCondition("5", "less_than", "100")).toBe(true);
    });

    it("returns false for non-numeric inputs", () => {
      expect(evaluateCondition("hello", "greater_than", "10")).toBe(false);
      expect(evaluateCondition("42", "less_than", "world")).toBe(false);
    });
  });

  describe("branch skip logic", () => {
    it("condition result determines which branch is active", () => {
      // Simulates the execution engine's logic:
      // If condition evaluates to true, false_branch is inactive (skipped)
      // If condition evaluates to false, true_branch is inactive (skipped)
      const input = "The product is Urgent";
      const result = evaluateCondition(input, "contains", "Urgent");
      expect(result).toBe(true);

      const inactiveHandle = result ? "false_branch" : "true_branch";
      expect(inactiveHandle).toBe("false_branch");

      // Verify the opposite case
      const result2 = evaluateCondition("Normal product", "contains", "Urgent");
      expect(result2).toBe(false);

      const inactiveHandle2 = result2 ? "false_branch" : "true_branch";
      expect(inactiveHandle2).toBe("true_branch");
    });
  });
});
