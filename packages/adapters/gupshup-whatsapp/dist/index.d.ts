import { XMessage } from '@samagra-x/xmessage';

declare const convertMessageToXMsg: (msg: any) => Promise<XMessage>;
declare const convertXMessageToMsg: (xMsg: XMessage) => Promise<XMessage | undefined>;

type GSWhatsAppMessage = {
    waNumber: string;
    mobile: string;
    replyId?: string;
    messageId?: string;
    timestamp: number | string;
    name: string;
    version?: number;
    type: string;
    text?: string;
    image?: string;
    document?: string;
    voice?: string;
    audio?: string;
    video?: string;
    location?: string;
    response?: string;
    extra?: string;
    app?: string;
    interactive?: string;
};
declare enum MethodType {
    SIMPLEMESSAGE = "SendMessage",
    MEDIAMESSAGE = "SendMediaMessage",
    OPTIN = "OPT_IN"
}
declare class Provider {
    name: string;
}
declare class MediaSizeLimit {
    private readonly imageSize;
    private readonly audioSize;
    private readonly videoSize;
    private readonly documentSize;
    constructor(imageSize: number | undefined, audioSize: number | undefined, videoSize: number | undefined, documentSize: number | undefined);
    getMaxSizeForMedia(mimeType: string): number;
}

declare class GupShupWhatsappAdapterServiceConfig {
    private static instance;
    private config;
    private constructor();
    static getInstance(): GupShupWhatsappAdapterServiceConfig;
    setConfig(config: Record<string, any>): void;
    getConfig(key: string): any;
}
declare const _default: GupShupWhatsappAdapterServiceConfig;

export { type GSWhatsAppMessage, MediaSizeLimit, MethodType, Provider, convertMessageToXMsg, convertXMessageToMsg, _default as gupshupWhatsappAdapterServiceConfig };
