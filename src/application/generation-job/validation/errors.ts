/**
 * Application-layer error taxonomy (see `04-lld.md` §6). Route handlers (API layer)
 * map these to HTTP status codes; they are never thrown from Domain code.
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly field?: string,
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

export class UpstreamGenerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UpstreamGenerationError";
  }
}

export class TimeoutError extends UpstreamGenerationError {
  constructor(message: string) {
    super(message);
    this.name = "TimeoutError";
  }
}

/**
 * Thrown when the TRELLIS.2 Space rejects/fails a request specifically due to
 * quota/rate-limit exhaustion (FR-20/AC-24). Extends `UpstreamGenerationError`
 * (not a sibling class) so every existing `instanceof UpstreamGenerationError`
 * check keeps matching it unchanged — this is additive to the taxonomy, not a
 * restructuring of it.
 */
export class QuotaExceededError extends UpstreamGenerationError {
  constructor(message: string) {
    super(message);
    this.name = "QuotaExceededError";
  }
}

export class GlbNotReadyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GlbNotReadyError";
  }
}
