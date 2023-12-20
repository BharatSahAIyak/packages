import {
  ConversationStage,
  MessageId,
  SenderReceiverInfo,
  Transformer,
  XMessagePayload,
  XMessageThread,
} from "./types";

export enum MessageState {
  NOT_SENT = "NOT_SENT",
  FAILED_TO_DELIVER = "FAILED_TO_DELIVER",
  DELIVERED = "DELIVERED",
  READ = "READ",
  REPLIED = "REPLIED",
  ENQUEUED = "ENQUEUED",
  SENT = "SENT",
  OPTED_IN = "OPTED_IN",
  OPTED_OUT = "OPTED_OUT",
}

export enum MessageType {
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

export class XMessage {
  //Persist
  app?: string;
  messageType!: MessageType;
  adapterId?: string;

  //Persist
  messageId!: MessageId;
  to!: SenderReceiverInfo;

  from!: SenderReceiverInfo;
  channelURI!: string; // whatsapp
  providerURI!: string; // gupshup
  timestamp!: number;

  userState?: string;
  encryptionProtocol?: string;
  messageState!: MessageState;

  lastMessageID?: string;

  conversationStage?: ConversationStage;

  conversationLevel?: Array<number>;

  transformers?: Transformer; // -1 no transfer like ms3 transforms msg to next msg

  thread?: XMessageThread;
  payload!: XMessagePayload;

  public toXML?(): string {
    return "";
  }

  // public completeTransform() {
  //   this.transformers.pop();
  // }

  public getChannel?(): string {
    return this.channelURI;
  }

  public getProvider?(): string {
    return this.providerURI;
  }

  public secondsSinceLastMessage?(): number {
    if (this.timestamp != null) {
      const currentTimestamp = Date.now() / 1000;
      return currentTimestamp - this.timestamp;
    } else {
      return Number.MAX_VALUE;
    }
  }

  public setChannel?(channel: string) {
    this.channelURI = channel;
  }

  public setProvider?(provider: string) {
    this.providerURI = provider;
  }
}