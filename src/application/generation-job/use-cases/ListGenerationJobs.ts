import { toGenerationJobDTO, type GenerationJobDTO } from "@/application/generation-job/dto/GenerationJobDTO";
import type { GenerationJobRepository } from "@/application/generation-job/ports/GenerationJobRepository";

/** Fetches all generation jobs, newest first (FR-7, AC-6). */
export class ListGenerationJobs {
  constructor(private readonly repository: GenerationJobRepository) {}

  async execute(): Promise<GenerationJobDTO[]> {
    const jobs = await this.repository.listAll();
    return jobs.map(toGenerationJobDTO);
  }
}
