class GupshupWhatsappAdapterConfig {
  private static instance: GupshupWhatsappAdapterConfig;
  private config: Record<string, any>;

  private constructor() {
    this.config = {};
  }

  public static getInstance(): GupshupWhatsappAdapterConfig {
    if (!GupshupWhatsappAdapterConfig.instance) {
      GupshupWhatsappAdapterConfig.instance = new GupshupWhatsappAdapterConfig();
    }
    return GupshupWhatsappAdapterConfig.instance;
  }

  public setConfig(config: Record<string, any>): void {
    this.config = { ...this.config, ...config };
  }

  public getConfig(key: string): any {
    return this.config[key];
  }
}

export default GupshupWhatsappAdapterConfig.getInstance();
