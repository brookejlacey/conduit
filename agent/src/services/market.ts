import type { Logger } from 'pino';

export interface MarketSnapshot {
  timestamp: number;
  fxRates: Record<string, number>;
  yieldRates: Record<string, number>;
  volatility: Record<string, number>;
}

export class MarketService {
  private cachedSnapshot: MarketSnapshot | null = null;
  private cacheExpiryMs = 60_000; // 1 minute
  private lastFetchTime = 0;

  constructor(private logger: Logger) {}

  async getMarketSnapshot(): Promise<MarketSnapshot> {
    const now = Date.now();
    if (this.cachedSnapshot && now - this.lastFetchTime < this.cacheExpiryMs) {
      return this.cachedSnapshot;
    }

    this.logger.debug('Fetching market snapshot...');

    // In production, fetch from real market data APIs (CoinGecko, exchange APIs, etc.)
    // For hackathon, return realistic mock data
    const snapshot: MarketSnapshot = {
      timestamp: now,
      fxRates: {
        'USD/EUR': 0.92,
        'USD/GBP': 0.79,
        'USD/JPY': 149.5,
        'USD/CHF': 0.88,
        'USD/SGD': 1.34,
      },
      yieldRates: {
        'USX-LENDING': 0.045, // 4.5% APY
        'USX-LP': 0.082, // 8.2% APY
        'TREASURY-BILL': 0.053, // 5.3% APY
      },
      volatility: {
        'USD/EUR': 0.06,
        'USD/GBP': 0.08,
        'USD/JPY': 0.12,
        SOL: 0.45,
      },
    };

    this.cachedSnapshot = snapshot;
    this.lastFetchTime = now;

    this.logger.debug({ pairs: Object.keys(snapshot.fxRates).length }, 'Market snapshot fetched');
    return snapshot;
  }

  async getFxRate(pair: string): Promise<number> {
    const snapshot = await this.getMarketSnapshot();
    const rate = snapshot.fxRates[pair];
    if (rate === undefined) {
      throw new Error(`FX rate not available for pair: ${pair}`);
    }
    return rate;
  }
}
