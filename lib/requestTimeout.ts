/**
 * Wraps a promise with a timeout. Rejects if the operation exceeds maxMs.
 * Use for long-running API handler logic to avoid indefinite hangs (DoS mitigation).
 */
const DEFAULT_TIMEOUT_MS = 30_000; // 30 seconds

export class RequestTimeoutError extends Error {
  constructor(ms: number) {
    super(`Request timed out after ${ms}ms`);
    this.name = "RequestTimeoutError";
  }
}

export function runWithTimeout<T>(
  promise: Promise<T>,
  maxMs: number = DEFAULT_TIMEOUT_MS
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new RequestTimeoutError(maxMs));
    }, maxMs);
    promise
      .then((result) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}
