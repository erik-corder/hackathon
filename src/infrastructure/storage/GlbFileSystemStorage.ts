import fs from "node:fs";
import path from "node:path";

import type { GlbFileStorage } from "@/application/generation-job/ports/GlbFileStorage";

/**
 * Concrete `GlbFileStorage` implementation backed by the local filesystem
 * (`{storageRoot}/{jobId}.glb`). The database stores only the relative file
 * path + size returned by `save`, never the GLB bytes themselves (see
 * `03-hld.md` §4 Alternatives Considered — filesystem vs. SQLite BLOB storage).
 */
export class GlbFileSystemStorage implements GlbFileStorage {
  constructor(private readonly storageRoot: string) {}

  async save(jobId: string, glbBuffer: Buffer): Promise<{ filePath: string; sizeBytes: number }> {
    fs.mkdirSync(this.storageRoot, { recursive: true });
    const relativeFilePath = `${jobId}.glb`;
    const absolutePath = path.join(this.storageRoot, relativeFilePath);
    fs.writeFileSync(absolutePath, glbBuffer);
    return { filePath: relativeFilePath, sizeBytes: glbBuffer.byteLength };
  }

  async readStream(filePath: string): Promise<NodeJS.ReadableStream> {
    const absolutePath = path.join(this.storageRoot, filePath);
    return fs.createReadStream(absolutePath);
  }

  async exists(filePath: string): Promise<boolean> {
    const absolutePath = path.join(this.storageRoot, filePath);
    return fs.existsSync(absolutePath);
  }
}
