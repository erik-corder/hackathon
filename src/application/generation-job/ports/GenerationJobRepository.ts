import type { GenerationJob } from "@/domain/generation-job/GenerationJob";

/**
 * Application-layer port for persisting/reading generation jobs. Concrete
 * implementations live in Infrastructure (e.g. `GenerationJobSqliteRepository`);
 * Application code depends only on this interface, never a concrete adapter.
 */
export interface GenerationJobRepository {
  create(job: GenerationJob): Promise<void>;
  update(job: GenerationJob): Promise<void>;
  findById(id: string): Promise<GenerationJob | null>;
  /** Newest first (by createdAt descending). */
  listAll(): Promise<GenerationJob[]>;
}
