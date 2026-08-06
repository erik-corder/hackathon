import type Database from "better-sqlite3";

import type { GenerationJobRepository } from "@/application/generation-job/ports/GenerationJobRepository";
import { GenerationJob, type GenerationJobProps } from "@/domain/generation-job/GenerationJob";
import type { JobStatus } from "@/domain/generation-job/JobStatus";

interface GenerationJobRow {
  id: string;
  status: JobStatus;
  source_image_name: string;
  source_image_mime_type: string;
  source_image_size_bytes: number;
  glb_file_path: string | null;
  glb_size_bytes: number | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

function rowToProps(row: GenerationJobRow): GenerationJobProps {
  return {
    id: row.id,
    status: row.status,
    sourceImageName: row.source_image_name,
    sourceImageMimeType: row.source_image_mime_type,
    sourceImageSizeBytes: row.source_image_size_bytes,
    glbFilePath: row.glb_file_path,
    glbSizeBytes: row.glb_size_bytes,
    errorMessage: row.error_message,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

/**
 * Concrete `GenerationJobRepository` implementation backed by `better-sqlite3`.
 * The only place in the codebase that imports `better-sqlite3` for reading/
 * writing job rows (targets AC-10/FR-11) — Application/API code depends only on
 * the `GenerationJobRepository` port.
 */
export class GenerationJobSqliteRepository implements GenerationJobRepository {
  constructor(private readonly db: Database.Database) {}

  async create(job: GenerationJob): Promise<void> {
    const props = job.toProps();
    this.db
      .prepare(
        `INSERT INTO generation_jobs (
          id, status, source_image_name, source_image_mime_type, source_image_size_bytes,
          glb_file_path, glb_size_bytes, error_message, created_at, updated_at
        ) VALUES (@id, @status, @sourceImageName, @sourceImageMimeType, @sourceImageSizeBytes,
          @glbFilePath, @glbSizeBytes, @errorMessage, @createdAt, @updatedAt)`,
      )
      .run({
        id: props.id,
        status: props.status,
        sourceImageName: props.sourceImageName,
        sourceImageMimeType: props.sourceImageMimeType,
        sourceImageSizeBytes: props.sourceImageSizeBytes,
        glbFilePath: props.glbFilePath,
        glbSizeBytes: props.glbSizeBytes,
        errorMessage: props.errorMessage,
        createdAt: props.createdAt.toISOString(),
        updatedAt: props.updatedAt.toISOString(),
      });
  }

  async update(job: GenerationJob): Promise<void> {
    const props = job.toProps();
    this.db
      .prepare(
        `UPDATE generation_jobs SET
          status = @status,
          glb_file_path = @glbFilePath,
          glb_size_bytes = @glbSizeBytes,
          error_message = @errorMessage,
          updated_at = @updatedAt
        WHERE id = @id`,
      )
      .run({
        id: props.id,
        status: props.status,
        glbFilePath: props.glbFilePath,
        glbSizeBytes: props.glbSizeBytes,
        errorMessage: props.errorMessage,
        updatedAt: props.updatedAt.toISOString(),
      });
  }

  async findById(id: string): Promise<GenerationJob | null> {
    const row = this.db.prepare("SELECT * FROM generation_jobs WHERE id = ?").get(id) as
      | GenerationJobRow
      | undefined;
    if (!row) return null;
    return GenerationJob.fromProps(rowToProps(row));
  }

  async listAll(): Promise<GenerationJob[]> {
    const rows = this.db
      .prepare("SELECT * FROM generation_jobs ORDER BY created_at DESC")
      .all() as GenerationJobRow[];
    return rows.map((row) => GenerationJob.fromProps(rowToProps(row)));
  }
}
