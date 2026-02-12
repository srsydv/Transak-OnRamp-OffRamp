export interface WebhookEvent {
  provider: string;
  eventId: string;
  eventType: string;
  signatureStatus: "valid" | "invalid";
  payloadHash: string;
  receivedAt: Date;
  processedAt?: Date | null;
}
