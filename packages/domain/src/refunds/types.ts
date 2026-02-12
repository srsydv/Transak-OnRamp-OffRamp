export const refundStatuses = ["pending", "succeeded", "failed"] as const;

export type RefundStatus = (typeof refundStatuses)[number];

export interface Refund {
  id: string;
  chargeId: string;
  amount: number;
  reason?: string | null;
  status: RefundStatus;
  providerRefundId?: string | null;
}
