type JsonNode = Record<string, any>;
declare class Pair<T1, T2> {
    first: T1;
    second: T2;
    constructor(first: T1, second: T2);
}
declare const getBotNodeFromStartingMessage: (startingMessage: string) => Promise<any>;
declare const getBotNodeFromName: (botName: string) => Promise<any>;
declare const getBotNodeFromId: (botId: string) => Promise<any>;
declare const getBotIdFromBotName: (botName: string) => Promise<string | null>;
declare const updateUser: (userID: string, botName: string) => Promise<Pair<boolean, string>>;
declare const getAdapterByID: (adapterID: string) => Promise<JsonNode | null>;
declare const getAdapterCredentials: (adapterID: string) => Promise<JsonNode | null>;
declare const getVaultCredentials: (secretKey: string) => Promise<JsonNode | null>;
declare const getFirstFormByBotID: (botId: string) => Promise<string | null>;
declare const getBotNameByBotID: (botId: string) => Promise<string | null>;

declare class BotServiceConfig {
    private static instance;
    private config;
    private constructor();
    static getInstance(): BotServiceConfig;
    setConfig(config: Record<string, any>): void;
    getConfig(key: string): any;
}
declare const _default: BotServiceConfig;

export { _default as configService, getAdapterByID, getAdapterCredentials, getBotIdFromBotName, getBotNameByBotID, getBotNodeFromId, getBotNodeFromName, getBotNodeFromStartingMessage, getFirstFormByBotID, getVaultCredentials, updateUser };
