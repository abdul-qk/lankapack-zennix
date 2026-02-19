import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  runWithTimeout,
  RequestTimeoutError,
} from "./requestTimeout";

describe("runWithTimeout", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("resolves with result when promise resolves before timeout", async () => {
    const promise = Promise.resolve("done");
    const resultPromise = runWithTimeout(promise, 5000);
    await vi.advanceTimersByTimeAsync(0);
    const result = await resultPromise;
    expect(result).toBe("done");
  });

  it("rejects with RequestTimeoutError when timeout is exceeded", async () => {
    const neverResolves = new Promise<string>(() => {});
    const resultPromise = runWithTimeout(neverResolves, 1000);
    vi.advanceTimersByTime(1001);
    await expect(resultPromise).rejects.toThrow(RequestTimeoutError);
    await expect(resultPromise).rejects.toThrow(/timed out after 1000ms/);
  });

  it("rejects with original error when promise rejects before timeout", async () => {
    const err = new Error("original failure");
    const promise = Promise.reject(err);
    const resultPromise = runWithTimeout(promise, 5000);
    await expect(resultPromise).rejects.toThrow("original failure");
  });

  it("clears timer when promise resolves", async () => {
    const resolveLater = new Promise<string>((resolve) => {
      setTimeout(() => resolve("ok"), 100);
    });
    const resultPromise = runWithTimeout(resolveLater, 5000);
    await vi.advanceTimersByTimeAsync(100);
    const result = await resultPromise;
    expect(result).toBe("ok");
  });
});

describe("RequestTimeoutError", () => {
  it("has correct name and message", () => {
    const err = new RequestTimeoutError(3000);
    expect(err.name).toBe("RequestTimeoutError");
    expect(err.message).toBe("Request timed out after 3000ms");
  });
});
