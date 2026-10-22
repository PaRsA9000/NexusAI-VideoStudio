import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { WalletService } from "@/services/WalletService";
import { VideoProviderFactory, ProviderName } from "@/lib/providers/VideoProviderFactory";

const prisma = new PrismaClient();
const wallet = new WalletService(prisma);
const COST_PER_SECOND = 10;

export async function POST(request: NextRequest) {
  let taskId: string | undefined;
  try {
    // Replace this demo header with a verified session/JWT in production.
    const userId = request.headers.get("x-user-id");
    if (!userId) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    const body = await request.json();
    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
    const providerName = String(body.provider ?? "kling").toLowerCase() as ProviderName;
    const duration = Number(body.duration ?? 5);
    const aspectRatio = String(body.aspectRatio ?? "16:9");
    if (prompt.length < 3 || prompt.length > 2000) return NextResponse.json({ error: "Prompt must be 3–2000 characters" }, { status: 400 });
    if (!Number.isInteger(duration) || duration < 5 || duration > 10) return NextResponse.json({ error: "Duration must be 5–10 seconds" }, { status: 400 });
    const provider = VideoProviderFactory.create(providerName);
    const credits = duration * COST_PER_SECOND; taskId = randomUUID();
    await prisma.$transaction(async (tx) => {
      const debit = await tx.wallet.updateMany({ where: { userId, balance: { gte: credits } }, data: { balance: { decrement: credits } } });
      if (!debit.count) throw new Error("Insufficient wallet balance");
      await tx.videoTask.create({ data: { id: taskId!, userId, provider: providerName, prompt, credits, status: "processing" } });
    });
    try {
      const result = await provider.generate({ prompt, duration, aspectRatio });
      await prisma.videoTask.update({ where: { id: taskId }, data: { providerTaskId: result.taskId, status: result.status, outputUrl: result.outputUrl } });
      return NextResponse.json({ taskId, providerTaskId: result.taskId, status: result.status, creditsCharged: credits }, { status: 202 });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Provider request failed";
      await wallet.refundTask(taskId, message);
      return NextResponse.json({ taskId, error: message, refunded: true }, { status: 502 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed";
    return NextResponse.json({ error: message }, { status: message === "Insufficient wallet balance" ? 402 : 400 });
  }
}
