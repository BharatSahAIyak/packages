class GupShupWhatsappAdapterServiceConfig {
  private static instance: GupShupWhatsappAdapterServiceConfig;
  private config: Record<string, any>;

  private constructor() {
    this.config = {};
  }

  public static getInstance(): GupShupWhatsappAdapterServiceConfig {
    if (!GupShupWhatsappAdapterServiceConfig.instance) {
      GupShupWhatsappAdapterServiceConfig.instance = new GupShupWhatsappAdapterServiceConfig();
    }
    return GupShupWhatsappAdapterServiceConfig.instance;
  }

  public setConfig(config: Record<string, any>): void {
    this.config = { ...this.config, ...config };
  }

  public getConfig(key: string): any {
    return this.config[key];
  }
}

export default GupShupWhatsappAdapterServiceConfig.getInstance();
