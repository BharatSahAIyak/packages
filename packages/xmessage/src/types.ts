import { XMessage } from "./xMessage";

export enum State {
  STARTING = 1,
  ONGOING,
  COMPLETED,
}

export class ConversationStage {
  stage!: number;
  state!: State;
}

export class MessageId {
  public Id: string;
  public channelMessageId?: string;
  public replyId?: string;

  constructor(builder: MessageIdBuilder) {
    this.Id = builder.id;
    this.channelMessageId = builder.channelMessageId;
    this.replyId = builder.replyId;
  }

  static builder(): MessageIdBuilder {
    return new MessageIdBuilder();
  }
}

export class MessageIdBuilder {
  public id: string = '';
  public channelMessageId: string = '';
  public replyId: string = '';

  public setId(id: string): MessageIdBuilder {
    this.id = id;
    return this;
  }

  public setChannelMessageId(channelMessageId: string): MessageIdBuilder {
    this.channelMessageId = channelMessageId;
    return this;
  }

  public setReplyId(replyId: string): MessageIdBuilder {
    this.replyId = replyId;
    return this;
  }

  public build(): MessageId {
    return new MessageId(this);
  }
}

export class SenderReceiverInfo {
  // persist
  userID!: string; // PhoneNo
  groups?: Array<string>;
  campaignID?: string;
  formID?: string;
  bot?: boolean;
  broadcast?: boolean;
  meta?: Map<string, string>;
  deviceType?: DeviceType;
  deviceID?: string; // UUID
  encryptedDeviceID?: string; // Encrypted Device String
}

export enum DeviceType {
  PHONE = "PHONE",
}

export class Transformer {
  id?: string;
  metaData?: Record<string, any>;
}

export type XMessagePayload = {
  text?: string;
  media?: MessageMedia[];
  location?: LocationParams;
  contactCard?: Card;
  buttonChoices?: ButtonChoices;
  stylingTag?: StylingTag;
  flow?: string;
  questionIndex?: number;
  mediaCaption?: string;
  metaData?: Record<string, any>;
  subject?: string;
}

export class XMessageThread {
  offset!: number; // normal form or simple chat..
  startDate!: string;
  lastMessageId!: string; // last incoming msgId
}

export class MessageMedia {
  category?: MediaCategory; // category list {image, audio, document, video}
  caption?: string;
  url?: string;
  size?: number;
  mimeType?: string;
}

export class LocationParams {
  longitude!: number | null;
  latitude!: number | null;
  address!: String;
  url!: String;
  name!: String;
}

export type Card = {
  header?: Cell;
  footer?: Cell;
  content?: CardBody;
}

export class CardBody {
  columns?: number;
  cells?: Array<Cell>;
}

export type Cell = {
  title?: string;
  description?: string;
}

export type ButtonChoices = {
  isSearchable?: Boolean | undefined;
  choices: Array<ButtonChoice>;
}

export type ButtonChoice = {
  key: string;
  text: string;
  isEnabled?: Boolean | undefined;
  action?: string;
}

export enum StylingTag {
  LIST = "LIST",
  QUICKREPLYBTN = "QUICKREPLYBTN",
  IMAGE = "IMAGE",
  IMAGE_URL = "IMAGE_URL",
  AUDIO = "AUDIO",
  VIDEO = "VIDEO",
}

export enum MediaCategory {
  IMAGE_URL = "IMAGE_URL",
  AUDIO_URL = "AUDIO_URL",
  VIDEO_URL = "VIDEO_URL",
  IMAGE = "IMAGE",
  AUDIO = "AUDIO",
  VIDEO = "VIDEO",
  FILE="FILE"
}

export enum MessageMediaError {
  PAYLOAD_TOO_LARGE = "payloadTooLarge",
  EMPTY_RESPONSE = "emptyResponse",
}

export class Address {
  city!: string;
  country!: string;
  countryCode!: number;
}

export interface XMessageProvider {
  sendMessage(xmsg: XMessage): Promise<any>;
  convertMessageToXMsg?(msg: any): Promise<XMessage>;
  // This function only converts one type to another, and
  // does not send the actual message to user.
  convertXmsgToMsg?(xmsg: XMessage): Promise<any>;
}
