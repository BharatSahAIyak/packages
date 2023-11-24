class UserServiceConfig {
  private static instance: UserServiceConfig;
  private config: Record<string, any>;

  private constructor() {
    this.config = {};
  }

  public static getInstance(): UserServiceConfig {
    if (!UserServiceConfig.instance) {
      UserServiceConfig.instance = new UserServiceConfig();
    }
    return UserServiceConfig.instance;
  }

  public setConfig(config: Record<string, any>): void {
    this.config = { ...this.config, ...config };
  }

  public getConfig(key: string): any {
    return this.config[key];
  }
}

export default UserServiceConfig.getInstance();
