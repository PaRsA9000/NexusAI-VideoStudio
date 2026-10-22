import { VideoProvider, VideoRequest, VideoResult } from "./VideoProviderFactory";

export class RunwayAdapter implements VideoProvider {
  async generate(input: VideoRequest): Promise<VideoResult> {
    const key = process.env.RUNWAY_API_KEY;
    if (!key) throw new Error("Missing configuration: RUNWAY_API_KEY");
    const response = await fetch(process.env.RUNWAY_API_URL ?? "https://api.dev.runwayml.com/v1/text_to_video", {
      method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "X-Runway-Version": "2024-11-06" },
      body: JSON.stringify({ promptText: input.prompt, duration: input.duration, ratio: input.aspectRatio }),
    });
    if (!response.ok) throw new Error(`Runway API error (${response.status})`);
    const data = await response.json();
    return { taskId: String(data.id ?? data.task_id), status: "queued" };
  }
}
