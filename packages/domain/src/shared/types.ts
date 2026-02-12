export type CurrencyCode = string;

export interface AuditContext {
  actorType: "merchant" | "system";
  actorId?: string;
  merchantId?: string;
}
