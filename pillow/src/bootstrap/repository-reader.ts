import { access, readFile, stat, realpath, open } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import type { ArtifactDescriptor, LoadedArtifact } from "./types.js";

const EXCERPT_BYTES = 2048;

/** Read-only repository access — Bootstrap never writes (PILLOW-002). */
export class RepositoryReader {
  constructor(private readonly repositoryRoot: string) {}

  get root(): string {
    return this.repositoryRoot;
  }

  resolve(relativePath: string): string {
    return path.join(this.repositoryRoot, relativePath);
  }

  async exists(relativePath: string): Promise<boolean> {
    try {
      await access(this.resolve(relativePath), constants.R_OK);
      return true;
    } catch {
      return false;
    }
  }

  async loadArtifact(descriptor: ArtifactDescriptor): Promise<LoadedArtifact> {
    const absolutePath = this.resolve(descriptor.relativePath);
    let present = false;
    let sizeBytes = 0;
    let modifiedAt: string | null = null;
    let excerpt: string | null = null;

    try {
      const fileStat = await stat(absolutePath);
      if (fileStat.isFile()) {
        present = true;
        sizeBytes = fileStat.size;
        modifiedAt = fileStat.mtime.toISOString();
        const buffer = await readFile(absolutePath);
        excerpt = buffer.subarray(0, EXCERPT_BYTES).toString("utf8");
      }
    } catch {
      present = false;
    }

    return {
      descriptor,
      present,
      absolutePath,
      sizeBytes,
      modifiedAt,
      excerpt,
    };
  }

  /** Bounded context-only read: no traversal, symlinks or whole-file allocation. */
  async readBoundedText(relativePath: string, maxBytes: number): Promise<string | null> {
    const root = await realpath(this.repositoryRoot);
    const filename = path.resolve(root, relativePath);
    if (!filename.startsWith(root + path.sep) || !Number.isInteger(maxBytes) || maxBytes < 1 || maxBytes > 4001) throw new Error("Context path/budget refused");
    try {
      if (await realpath(filename) !== filename) throw new Error("Context symlink refused");
      const handle = await open(filename, constants.O_RDONLY | constants.O_NOFOLLOW);
      try {
        if (!(await handle.stat()).isFile()) throw new Error("Context source is not a file");
        const buffer = Buffer.alloc(maxBytes);
        const {bytesRead} = await handle.read(buffer, 0, maxBytes, 0);
        return buffer.subarray(0, bytesRead).toString("utf8");
      } finally { await handle.close(); }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw error;
    }
  }

  async readText(relativePath: string): Promise<string | null> {
    try {
      return await readFile(this.resolve(relativePath), "utf8");
    } catch {
      return null;
    }
  }

  async listFiles(relativeDir: string): Promise<string[]> {
    const { readdir } = await import("node:fs/promises");
    try {
      const entries = await readdir(this.resolve(relativeDir), {
        withFileTypes: true,
      });
      return entries.filter((e) => e.isFile()).map((e) => e.name);
    } catch {
      return [];
    }
  }

  async listSubdirs(relativeDir: string): Promise<string[]> {
    const { readdir } = await import("node:fs/promises");
    try {
      const entries = await readdir(this.resolve(relativeDir), {
        withFileTypes: true,
      });
      return entries.filter((e) => e.isDirectory()).map((e) => e.name);
    } catch {
      return [];
    }
  }
}
