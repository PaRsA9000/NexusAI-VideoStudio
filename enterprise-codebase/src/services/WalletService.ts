import { Prisma, PrismaClient } from "@prisma/client";

/** Atomic credit operations. Refund is idempotent (refundedAt guards duplicates). */
export class WalletService {
  constructor(private readonly db: PrismaClient) {}

  async debitForTask(userId: string, taskId: string, credits: number) {
    if (!Number.isInteger(credits) || credits <= 0) throw new Error("Credits must be a positive integer");
    return this.db.$transaction(async (tx) => {
      const changed = await tx.wallet.updateMany({ where: { userId, balance: { gte: credits } }, data: { balance: { decrement: credits } } });
      if (changed.count !== 1) throw new Error("Insufficient wallet balance");
      return tx.videoTask.create({ data: { id: taskId, userId, provider: "pending", prompt: "", credits, status: "queued" } });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  async refundTask(taskId: string, reason: string) {
    return this.db.$transaction(async (tx) => {
      const task = await tx.videoTask.findUnique({ where: { id: taskId } });
      if (!task || task.refundedAt || task.status === "completed") return false;
      const marked = await tx.videoTask.updateMany({ where: { id: taskId, refundedAt: null }, data: { refundedAt: new Date(), status: "failed", errorMessage: reason } });
      if (!marked.count) return false;
      await tx.wallet.update({ where: { userId: task.userId }, data: { balance: { increment: task.credits } } });
      return true;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }
}
