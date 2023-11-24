class BotServiceConfig {
  private static instance: BotServiceConfig;
  private config: Record<string, any>;

  private constructor() {
    this.config = {};
  }

  public static getInstance(): BotServiceConfig {
    if (!BotServiceConfig.instance) {
      BotServiceConfig.instance = new BotServiceConfig();
    }
    return BotServiceConfig.instance;
  }

  public setConfig(config: Record<string, any>): void {
    this.config = { ...this.config, ...config };
  }

  public getConfig(key: string): any {
    return this.config[key];
  }
}

export default BotServiceConfig.getInstance();
