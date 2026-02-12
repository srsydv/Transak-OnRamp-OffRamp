import type { ProviderAdapter } from "../interfaces/providerAdapter.js";
import { MockProviderAdapter } from "./mock/mockProvider.js";
import { StripeProviderAdapter } from "./stripe/stripeProvider.js";

export class ProviderRegistry {
  private readonly providers = new Map<string, ProviderAdapter>();

  constructor(adapters?: ProviderAdapter[]) {
    const initialAdapters = adapters ?? [new MockProviderAdapter(), new StripeProviderAdapter()];
    for (const adapter of initialAdapters) {
      this.providers.set(adapter.provider, adapter);
    }
  }

  get(provider: string): ProviderAdapter {
    const adapter = this.providers.get(provider);
    if (!adapter) {
      throw new Error(`Unknown provider: ${provider}`);
    }

    return adapter;
  }
}
