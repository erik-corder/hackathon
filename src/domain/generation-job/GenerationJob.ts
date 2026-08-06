import { DomainError } from "./DomainError";
import { isTerminal, type JobStatus } from "./JobStatus";

export interface GenerationJobProps {
  id: string;
  status: JobStatus;
  sourceImageName: string;
  sourceImageMimeType: string;
  sourceImageSizeBytes: number;
  glbFilePath: string | null;
  glbSizeBytes: number | null;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProcessingInput {
  id: string;
  sourceImageName: string;
  sourceImageMimeType: string;
  sourceImageSizeBytes: number;
  now: Date;
}

/**
 * Domain entity for a single image → GLB generation job. Pure TypeScript, no
 * framework/HTTP/DB imports (Clean Architecture Domain layer, targets AC-10).
 */
export class GenerationJob {
  private constructor(private readonly props: GenerationJobProps) {}

  static createProcessing(input: CreateProcessingInput): GenerationJob {
    return new GenerationJob({
      id: input.id,
      status: "processing",
      sourceImageName: input.sourceImageName,
      sourceImageMimeType: input.sourceImageMimeType,
      sourceImageSizeBytes: input.sourceImageSizeBytes,
      glbFilePath: null,
      glbSizeBytes: null,
      errorMessage: null,
      createdAt: input.now,
      updatedAt: input.now,
    });
  }

  static fromProps(props: GenerationJobProps): GenerationJob {
    return new GenerationJob({ ...props });
  }

  markComplete(glbFilePath: string, glbSizeBytes: number, now: Date): GenerationJob {
    if (isTerminal(this.props.status)) {
      throw new DomainError(
        `Cannot mark job ${this.props.id} complete: it is already in a terminal state (${this.props.status}).`,
      );
    }
    return new GenerationJob({
      ...this.props,
      status: "complete",
      glbFilePath,
      glbSizeBytes,
      errorMessage: null,
      updatedAt: now,
    });
  }

  markFailed(errorMessage: string, now: Date): GenerationJob {
    if (isTerminal(this.props.status)) {
      throw new DomainError(
        `Cannot mark job ${this.props.id} failed: it is already in a terminal state (${this.props.status}).`,
      );
    }
    return new GenerationJob({
      ...this.props,
      status: "failed",
      errorMessage,
      updatedAt: now,
    });
  }

  get id(): string {
    return this.props.id;
  }

  get status(): JobStatus {
    return this.props.status;
  }

  toProps(): Readonly<GenerationJobProps> {
    return { ...this.props };
  }
}
