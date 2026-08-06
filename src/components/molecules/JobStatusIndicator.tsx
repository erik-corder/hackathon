import { Spinner } from "@/components/atoms/Spinner";
import { StatusBadge } from "@/components/atoms/StatusBadge";
import type { JobStatus } from "@/components/shared/types/generationJob";

export interface JobStatusIndicatorProps {
  status: JobStatus;
}

/** `StatusBadge` + `Spinner` composed for a job — purely presentational, driven by props. */
export function JobStatusIndicator({ status }: JobStatusIndicatorProps) {
  return (
    <div className="flex items-center gap-2">
      <StatusBadge status={status} />
      {status === "processing" ? <Spinner label="Generating 3D model" /> : null}
    </div>
  );
}
