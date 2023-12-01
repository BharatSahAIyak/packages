import * as fs from 'fs';
import * as path from 'path';
import {StylingTag, XMessagePayload} from '@samagra-x/xmessage';

export class FileUtil {
  static isFileTypeImage(mimeType: string): boolean {
    if(!mimeType) return false;
    return mimeType.startsWith('image/');
  }

  static isFileTypeAudio(mimeType: string): boolean {
    if(!mimeType) return false;
    return mimeType.startsWith('audio/');
  }

  static isFileTypeVideo(mimeType: string): boolean {
    if(!mimeType) return false;
    return mimeType.startsWith('video/');
  }

  static isFileTypeDocument(mimeType: string): boolean {
    if(!mimeType) return false;
    // For simplicity, let's assume common document file extensions
    const documentExtensions = ['pdf', 'doc', 'docx', 'txt'];
    const lowerCaseMimeType = mimeType.toLowerCase();

    return documentExtensions.some(ext => lowerCaseMimeType.endsWith(`/${ext}`));
  }

  static async getInputBytesFromUrl(url: string): Promise<Uint8Array | null> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      return new Uint8Array(arrayBuffer);
    } catch (error: any) {
      console.error(`Error fetching input bytes: ${error}`);
      return null;
    }
  }

  static validateFileSizeByInputBytes(inputBytes: Uint8Array, maxSize: number): string {
    if (inputBytes === null) {
      return "Input bytes are null.";
    }

    const fileSizeInBytes = inputBytes.length;
    const maxSizeInBytes = maxSize; // Convert maxSize from MB to Bytes

    if (fileSizeInBytes > maxSizeInBytes) {
      return `File size exceeds the maximum allowed size of ${maxSize} bytes.`;
    }

    return "";
  }

  static getUploadedFileName(mimeType: string, messageId: string): string {
    // Example logic: Construct a filename based on the MIME type and message ID
    const sanitizedMimeType = mimeType.replace('/', '_');
    const parts = sanitizedMimeType.split('_');
    const fileName = `${sanitizedMimeType}_${messageId}.${parts[1]}`;

    return fileName;
  }

  static async fileToLocalFromBytes(inputBytes: Uint8Array | null, mimeType: string, name: string): Promise<string | null> {
    if (inputBytes === null) {
      console.error('Input bytes are null.');
      return null;
    }

    // Example: Save the file to a local directory
    const directoryPath = '/tmp/'; // Adjust the path accordingly
    const fileName = name;
    const filePath = path.join(directoryPath, fileName);

    try {
      await fs.promises.writeFile(filePath, inputBytes);
      console.log(`File saved to: ${filePath}`);
      return filePath;
    } catch (error) {
      console.error(`Error saving file: ${error}`);
      return null;
    }
  }

  static isStylingTagIntercativeType(stylingTag: StylingTag): boolean {
    return stylingTag === StylingTag.LIST || stylingTag === StylingTag.QUICKREPLYBTN;
  }

  static validateInteractiveStylingTag(payload: XMessagePayload): boolean {
    if (
      payload.stylingTag === StylingTag.LIST &&
      payload.buttonChoices &&
      payload.buttonChoices.length <= 10
    ) {
      for (const buttonChoice of payload.buttonChoices) {
        if (buttonChoice.text.length > 24) {
          return false;
        }
      }
      return true;
    } else if (
      payload.stylingTag === StylingTag.QUICKREPLYBTN &&
      payload.buttonChoices &&
      payload.buttonChoices.length <= 3
    ) {
      for (const buttonChoice of payload.buttonChoices) {
        if (buttonChoice.text.length > 20 || buttonChoice.key.length > 256) {
          return false;
        }
      }
      return true;
    } else {
      return false;
    }
  }
}