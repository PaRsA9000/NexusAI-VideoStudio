import { KlingAdapter } from "./KlingAdapter";
import { RunwayAdapter } from "./RunwayAdapter";

export type ProviderName = "kling" | "runway";
export interface VideoRequest { prompt: string; duration: number; aspectRatio: string }
export interface VideoResult { taskId: string; status: "queued" | "processing" | "completed"; outputUrl?: string }
export interface VideoProvider { generate(input: VideoRequest): Promise<VideoResult> }

/** Validates and constructs a provider adapter. Credentials stay server-side. */
export class VideoProviderFactory {
  static create(name: string): VideoProvider {
    switch (name.toLowerCase()) {
      case "kling": return new KlingAdapter();
      case "runway": return new RunwayAdapter();
      default: throw new Error(`Unsupported video provider: ${name}`);
    }
  }
}
