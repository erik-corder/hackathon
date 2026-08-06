/**
 * Base class for errors raised by invariant violations inside the Domain layer.
 * Application/API layers may catch this to distinguish domain-rule violations from
 * infrastructure/upstream failures (see `04-lld.md` §6 Error Taxonomy).
 */
export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DomainError";
  }
}
