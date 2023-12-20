declare enum State {
    STARTING = 1,
    ONGOING = 2,
    COMPLETED = 3
}
declare class ConversationStage {
    stage: number;
    state: State;
}
declare class MessageId {
    Id?: string;
    channelMessageId: string;
    replyId?: string;
    constructor(builder: MessageIdBuilder);
    static builder(): MessageIdBuilder;
}
declare class MessageIdBuilder {
    id: string;
    channelMessageId: string;
    replyId: string;
    setId(id: string): MessageIdBuilder;
    setChannelMessageId(channelMessageId: string): MessageIdBuilder;
    setReplyId(replyId: string): MessageIdBuilder;
    build(): MessageId;
}
declare class SenderReceiverInfo {
    userID: string;
    groups?: Array<string>;
    campaignID?: string;
    formID?: string;
    bot?: boolean;
    broadcast?: boolean;
    meta?: Map<string, string>;
    deviceType?: DeviceType;
    deviceID?: string;
    encryptedDeviceID?: string;
}
declare enum DeviceType {
    PHONE = "PHONE"
}
declare class Transformer {
    id: string;
    metaData: Map<string, string>;
}
type XMessagePayload = {
    text?: string;
    media?: MessageMedia;
    location?: LocationParams;
    contactCard?: ContactCard;
    buttonChoices?: Array<ButtonChoice>;
    stylingTag?: StylingTag;
    flow?: string;
    questionIndex?: number;
    mediaCaption?: string;
    metaData?: string;
};
declare class XMessageThread {
    offset: number;
    startDate: string;
    lastMessageId: string;
}
declare class MessageMedia {
    category: MediaCategory;
    text: string;
    url: string;
    size?: number;
    messageMediaError?: MessageMediaError;
}
declare class LocationParams {
    longitude: number | null;
    latitude: number | null;
    address: String;
    url: String;
    name: String;
}
declare class ContactCard {
    address: Address;
    name: string;
}
declare class ButtonChoice {
    key: string;
    text: string;
    backmenu: boolean;
}
declare enum StylingTag {
    LIST = "LIST",
    QUICKREPLYBTN = "QUICKREPLYBTN",
    IMAGE = "IMAGE",
    IMAGE_URL = "IMAGE_URL",
    AUDIO = "AUDIO",
    VIDEO = "VIDEO"
}
declare enum MediaCategory {
    IMAGE_URL = "IMAGE_URL",
    AUDIO_URL = "AUDIO_URL",
    VIDEO_URL = "VIDEO_URL",
    IMAGE = "IMAGE",
    AUDIO = "AUDIO",
    VIDEO = "VIDEO",
    FILE = "FILE"
}
declare enum MessageMediaError {
    PAYLOAD_TOO_LARGE = "payloadTooLarge",
    EMPTY_RESPONSE = "emptyResponse"
}
declare class Address {
    city: string;
    country: string;
    countryCode: number;
}

declare enum MessageState {
    NOT_SENT = "NOT_SENT",
    FAILED_TO_DELIVER = "FAILED_TO_DELIVER",
    DELIVERED = "DELIVERED",
    READ = "READ",
    REPLIED = "REPLIED",
    ENQUEUED = "ENQUEUED",
    SENT = "SENT",
    OPTED_IN = "OPTED_IN",
    OPTED_OUT = "OPTED_OUT"
}
declare enum MessageType {
    HSM = "HSM",
    TEXT = "TEXT",
    HSM_WITH_BUTTON = "HSM_WITH_BUTTON",
    BROADCAST_TEXT = "BROADCAST_TEXT",
    IMAGE = "IMAGE",
    VIDEO = "VIDEO",
    AUDIO = "AUDIO",
    DOCUMENT = "DOCUMENT",
    LOCATION = "LOCATION",
    REPORT = "REPORT"
}
declare class XMessage {
    app?: string;
    messageType: MessageType;
    adapterId?: string;
    messageId: MessageId;
    to: SenderReceiverInfo;
    from: SenderReceiverInfo;
    channelURI: string;
    providerURI: string;
    timestamp: number;
    userState?: string;
    encryptionProtocol?: string;
    messageState: MessageState;
    lastMessageID?: string;
    conversationStage?: ConversationStage;
    conversationLevel?: Array<number>;
    transformers?: Transformer;
    thread?: XMessageThread;
    payload: XMessagePayload;
    toXML?(): string;
    getChannel?(): string;
    getProvider?(): string;
    secondsSinceLastMessage?(): number;
    setChannel?(channel: string): void;
    setProvider?(provider: string): void;
}

export { Address, ButtonChoice, ContactCard, ConversationStage, DeviceType, LocationParams, MediaCategory, MessageId, MessageIdBuilder, MessageMedia, MessageMediaError, MessageState, MessageType, SenderReceiverInfo, State, StylingTag, Transformer, XMessage, type XMessagePayload, XMessageThread };
