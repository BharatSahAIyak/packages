import {
  ConversationStage,
  MessageId,
  SenderReceiverInfo,
  Transformer,
  XMessagePayload,
  XMessageThread,
} from "./types";

import {
  IEmailOptions,
  IChatOptions,
  ISmsOptions,
} from '@novu/stateless';

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
  REPORT = "REPORT",
  FEEDBACK_POSITIVE = "FEEDBACK_POSITIVE",
  FEEDBACK_NEGATIVE = "FEEDBACK_NEGATIVE",
  FEEDBACK_NEUTRAL = "FEEDBACK_NEUTRAL",
  REGISTRATION = "REGISTRATION",
}

export class XMessage {
  app?: string;
  messageType!: MessageType;
  adapterId?: string;
  orgId?: string;
  ownerId?: string;

  messageId!: MessageId;
  to!: SenderReceiverInfo;

  from!: SenderReceiverInfo;
  channelURI!: string;
  providerURI!: string;
  timestamp!: number;

  userState?: string;
  encryptionProtocol?: string;
  messageState!: MessageState;

  lastMessageID?: string;

  conversationStage?: ConversationStage;

  conversationLevel?: Array<number>;

  transformer?: Transformer;

  thread?: XMessageThread;
  payload!: XMessagePayload;

  public toXML?(): string {
    return "";
  }

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

// TODO: enable attachments
export function convertXMessageToIEmailOptions(
  xmessage: XMessage
): IEmailOptions {
  return {
    to: [ xmessage.to.userID ],
    html: xmessage.payload.text || '',
    subject: xmessage.payload.subject || '',
  }
}

export function convertXMessageToIChatOptions(
  xmessage: XMessage
): IChatOptions {
  return {
    content: xmessage.payload.text || '',
    // XMessage.channel and IChatOptions.channel
    // represent two different types of data.
    channel: xmessage.to.userID,
    // TODO: find a way to integrate changing of
    // webhook.
    webhookUrl: '',
  }
}

// TODO: enable attachments
export function convertXMessageToISmsOptions(
  xmessage: XMessage
): ISmsOptions {
  return {
    content: xmessage.payload.text || '',
    to: xmessage.to.userID,
  }
}
