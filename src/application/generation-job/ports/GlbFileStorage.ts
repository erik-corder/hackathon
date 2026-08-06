/**
 * Application-layer port for storing/retrieving generated GLB binaries. The only
 * concrete implementation is `GlbFileSystemStorage` (Infrastructure layer, writes
 * under `data/glb-storage/`) — Application code never touches the filesystem
 * directly (targets AC-10/FR-11).
 */
export interface GlbFileStorage {
  save(jobId: string, glbBuffer: Buffer): Promise<{ filePath: string; sizeBytes: number }>;
  readStream(filePath: string): Promise<NodeJS.ReadableStream>;
  exists(filePath: string): Promise<boolean>;
}
