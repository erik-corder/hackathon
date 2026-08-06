import { toGenerationJobDTO, type GenerationJobDTO } from "@/application/generation-job/dto/GenerationJobDTO";
import type { GenerationJobRepository } from "@/application/generation-job/ports/GenerationJobRepository";
import { NotFoundError } from "@/application/generation-job/validation/errors";

/** Fetches a single generation job by id (FR-8, AC-7). */
export class GetGenerationJob {
  constructor(private readonly repository: GenerationJobRepository) {}

  async execute(id: string): Promise<GenerationJobDTO> {
    const job = await this.repository.findById(id);
    if (!job) {
      throw new NotFoundError(`Generation job "${id}" not found.`);
    }
    return toGenerationJobDTO(job);
  }
}
