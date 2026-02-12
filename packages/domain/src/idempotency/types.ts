export interface IdempotencyRecord {
  key: string;
  merchantId: string;
  requestHash: string;
  responseSnapshot: {
    statusCode: number;
    body: unknown;
  };
  expiresAt: Date;
}
