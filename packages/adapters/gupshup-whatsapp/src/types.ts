import { FileUtil } from './utils'

export type GSWhatsAppMessage = {
  waNumber: string; // botNumber
  mobile: string; // user's number
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
}

export enum MethodType {
  SIMPLEMESSAGE = "SendMessage",
  MEDIAMESSAGE = "SendMediaMessage",
  OPTIN = "OPT_IN",
}

export class Provider {
  name!: string;
}

export class MediaSizeLimit {
  private readonly imageSize: number | undefined;
  private readonly audioSize: number | undefined;
  private readonly videoSize: number | undefined;
  private readonly documentSize: number | undefined;

  constructor(
    imageSize: number | undefined,
    audioSize: number | undefined,
    videoSize: number | undefined,
    documentSize: number | undefined
  ) {
    this.imageSize = imageSize;
    this.audioSize = audioSize;
    this.videoSize = videoSize;
    this.documentSize = documentSize;
  }

  public getMaxSizeForMedia(mimeType: string): number {
    if (FileUtil.isFileTypeImage(mimeType) && this.imageSize !== undefined) {
      return 1024 * 1024 * this.imageSize;
    } else if (FileUtil.isFileTypeAudio(mimeType) && this.audioSize !== undefined) {
      return 1024 * 1024 * this.audioSize;
    } else if (FileUtil.isFileTypeVideo(mimeType) && this.videoSize !== undefined) {
      return 1024 * 1024 * this.videoSize;
    } else if (FileUtil.isFileTypeDocument(mimeType) && this.documentSize !== undefined) {
      return 1024 * 1024 * this.documentSize;
    } else {
      return -1;
    }
  }
}
