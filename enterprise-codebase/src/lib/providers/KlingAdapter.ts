import { VideoProvider, VideoRequest, VideoResult } from "./VideoProviderFactory";

export class KlingAdapter implements VideoProvider {
  async generate(input: VideoRequest): Promise<VideoResult> {
    const key = process.env.KLING_API_KEY;
    if (!key) throw new Error("Missing configuration: KLING_API_KEY");
    const response = await fetch(process.env.KLING_API_URL ?? "https://api.klingai.com/v1/videos/text2video", {
      method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: input.prompt, duration: input.duration, aspect_ratio: input.aspectRatio }),
    });
    if (!response.ok) throw new Error(`Kling API error (${response.status})`);
    const data = await response.json();
    return { taskId: String(data.task_id ?? data.id), status: "queued" };
  }
}
