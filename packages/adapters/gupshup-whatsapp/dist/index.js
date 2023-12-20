"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  MediaSizeLimit: () => MediaSizeLimit,
  MethodType: () => MethodType,
  Provider: () => Provider,
  convertMessageToXMsg: () => convertMessageToXMsg,
  convertXMessageToMsg: () => convertXMessageToMsg,
  gupshupWhatsappAdapterServiceConfig: () => gupshupWhatsappAdapterServiceConfig_default
});
module.exports = __toCommonJS(src_exports);

// src/GupShupWhatsappAdapter.ts
var import_axios = __toESM(require("axios"));

// src/utils.ts
var fs = __toESM(require("fs"));
var path = __toESM(require("path"));
var import_xmessage = require("@samagra-x/xmessage");
var FileUtil = class {
  static isFileTypeImage(mimeType) {
    if (!mimeType)
      return false;
    return mimeType.startsWith("image/");
  }
  static isFileTypeAudio(mimeType) {
    if (!mimeType)
      return false;
    return mimeType.startsWith("audio/");
  }
  static isFileTypeVideo(mimeType) {
    if (!mimeType)
      return false;
    return mimeType.startsWith("video/");
  }
  static isFileTypeDocument(mimeType) {
    if (!mimeType)
      return false;
    const documentExtensions = ["pdf", "doc", "docx", "txt"];
    const lowerCaseMimeType = mimeType.toLowerCase();
    return documentExtensions.some((ext) => lowerCaseMimeType.endsWith(`/${ext}`));
  }
  static async getInputBytesFromUrl(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      return new Uint8Array(arrayBuffer);
    } catch (error) {
      console.error(`Error fetching input bytes: ${error}`);
      return null;
    }
  }
  static validateFileSizeByInputBytes(inputBytes, maxSize) {
    if (inputBytes === null) {
      return "Input bytes are null.";
    }
    const fileSizeInBytes = inputBytes.length;
    const maxSizeInBytes = maxSize;
    if (fileSizeInBytes > maxSizeInBytes) {
      return `File size exceeds the maximum allowed size of ${maxSize} bytes.`;
    }
    return "";
  }
  static getUploadedFileName(mimeType, messageId) {
    const sanitizedMimeType = mimeType.replace("/", "_");
    const parts = sanitizedMimeType.split("_");
    const fileName = `${sanitizedMimeType}_${messageId}.${parts[1]}`;
    return fileName;
  }
  static async fileToLocalFromBytes(inputBytes, mimeType, name) {
    if (inputBytes === null) {
      console.error("Input bytes are null.");
      return null;
    }
    const directoryPath = "/tmp/";
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
  static isStylingTagIntercativeType(stylingTag) {
    return stylingTag === import_xmessage.StylingTag.LIST || stylingTag === import_xmessage.StylingTag.QUICKREPLYBTN;
  }
  static validateInteractiveStylingTag(payload) {
    if (payload.stylingTag === import_xmessage.StylingTag.LIST && payload.buttonChoices && payload.buttonChoices.length <= 10) {
      for (const buttonChoice of payload.buttonChoices) {
        if (buttonChoice.text.length > 24) {
          return false;
        }
      }
      return true;
    } else if (payload.stylingTag === import_xmessage.StylingTag.QUICKREPLYBTN && payload.buttonChoices && payload.buttonChoices.length <= 3) {
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
};

// src/types.ts
var MethodType = /* @__PURE__ */ ((MethodType2) => {
  MethodType2["SIMPLEMESSAGE"] = "SendMessage";
  MethodType2["MEDIAMESSAGE"] = "SendMediaMessage";
  MethodType2["OPTIN"] = "OPT_IN";
  return MethodType2;
})(MethodType || {});
var Provider = class {
};
var MediaSizeLimit = class {
  constructor(imageSize, audioSize, videoSize, documentSize) {
    this.imageSize = imageSize;
    this.audioSize = audioSize;
    this.videoSize = videoSize;
    this.documentSize = documentSize;
  }
  getMaxSizeForMedia(mimeType) {
    if (FileUtil.isFileTypeImage(mimeType) && this.imageSize !== void 0) {
      return 1024 * 1024 * this.imageSize;
    } else if (FileUtil.isFileTypeAudio(mimeType) && this.audioSize !== void 0) {
      return 1024 * 1024 * this.audioSize;
    } else if (FileUtil.isFileTypeVideo(mimeType) && this.videoSize !== void 0) {
      return 1024 * 1024 * this.videoSize;
    } else if (FileUtil.isFileTypeDocument(mimeType) && this.documentSize !== void 0) {
      return 1024 * 1024 * this.documentSize;
    } else {
      return -1;
    }
  }
};

// src/GupShupWhatsappAdapter.ts
var import_xmessage2 = require("@samagra-x/xmessage");
var import_url = require("url");

// src/minioClient.ts
var Minio = __toESM(require("minio"));

// src/gupshupWhatsappAdapterServiceConfig.ts
var GupShupWhatsappAdapterServiceConfig = class _GupShupWhatsappAdapterServiceConfig {
  constructor() {
    this.config = {};
  }
  static getInstance() {
    if (!_GupShupWhatsappAdapterServiceConfig.instance) {
      _GupShupWhatsappAdapterServiceConfig.instance = new _GupShupWhatsappAdapterServiceConfig();
    }
    return _GupShupWhatsappAdapterServiceConfig.instance;
  }
  setConfig(config) {
    this.config = { ...this.config, ...config };
  }
  getConfig(key) {
    return this.config[key];
  }
};
var gupshupWhatsappAdapterServiceConfig_default = GupShupWhatsappAdapterServiceConfig.getInstance();

// src/minioClient.ts
var minioBucketId = gupshupWhatsappAdapterServiceConfig_default.getConfig("CDN_MINIO_BUCKET_ID") || "";
var minioUrl = gupshupWhatsappAdapterServiceConfig_default.getConfig("CDN_MINIO_URL") || "";
var getFileSignedUrl = (name) => {
  if (minioUrl.length === 0 || minioBucketId.length === 0) {
    console.error(`Minio URL or Minio Bucket was null. Minio URL: ${minioUrl}, Minio Bucket: ${minioBucketId}`);
    return "";
  }
  if (name.length === 0) {
    console.error("Passed filename was empty.");
    return "";
  }
  if (minioUrl.charAt(minioUrl.length - 1) === "/") {
    minioUrl = minioUrl.substring(0, minioUrl.length - 1);
  }
  if (minioBucketId.charAt(minioBucketId.length - 1) === "/") {
    minioBucketId = minioBucketId.substring(0, minioBucketId.length - 1);
  }
  return `${minioUrl}/${minioBucketId}/${name}`;
};
async function uploadFileFromPath(filePath, name) {
  try {
    const minioClient = new Minio.Client({
      endPoint: minioUrl,
      port: 9e3,
      useSSL: true,
      accessKey: "Q3AM3UQ867SPQQA43P2F",
      secretKey: "zuf+tfteSlswRu7BJ86wekitnifILbZam1KYY3TG"
    });
    if (minioClient !== null) {
      console.log(`uploadFileFromPath:: filePath: ${filePath} Name : ${name}`);
      await minioClient.fPutObject(
        minioBucketId,
        name,
        filePath,
        (err) => {
          if (err) {
            console.error(`Error uploading file: ${err.message}`);
          } else {
            console.log(`File uploaded successfully`);
          }
        }
      );
      return getFileSignedUrl(name);
    } else {
      console.error(`uploadFileFromPath:: Minio client is null`);
    }
  } catch (ex) {
    console.error(`Exception in minio uploadFileFromPath: ${ex}`);
  }
  return "";
}

// src/GupShupWhatsappAdapter.ts
var getMessageState = (eventType) => {
  let messageState;
  switch (eventType) {
    case "SENT":
      messageState = import_xmessage2.MessageState.SENT;
      break;
    case "DELIVERED":
      messageState = import_xmessage2.MessageState.DELIVERED;
      break;
    case "READ":
      messageState = import_xmessage2.MessageState.READ;
      break;
    default:
      messageState = import_xmessage2.MessageState.FAILED_TO_DELIVER;
      break;
  }
  return messageState;
};
var isInboundMediaMessage = (type) => {
  return type === "image" || type === "audio" || type === "video" || type === "file";
};
var getInboundInteractiveContentText = (message) => {
  let text = "";
  const interactiveContent = message.interactive;
  if (interactiveContent && interactiveContent.length > 0) {
    try {
      const node = JSON.parse(interactiveContent);
      const type = node.type !== void 0 ? node.type : "";
      if (type.toLowerCase() === "list_reply") {
        text = node.list_reply !== void 0 && node.list_reply.title !== void 0 ? node.list_reply.title : "";
      } else if (type.toLowerCase() === "button_reply") {
        text = node.button_reply !== void 0 && node.button_reply.title !== void 0 ? node.button_reply.title : "";
      }
    } catch (error) {
      console.error("Exception in getInboundInteractiveContentText:", error);
    }
  }
  return text;
};
var getMediaCategoryByMimeType = (mimeType) => {
  let category = null;
  if (FileUtil.isFileTypeImage(mimeType)) {
    category = import_xmessage2.MediaCategory.IMAGE;
  } else if (FileUtil.isFileTypeAudio(mimeType)) {
    category = import_xmessage2.MediaCategory.AUDIO;
  } else if (FileUtil.isFileTypeVideo(mimeType)) {
    category = import_xmessage2.MediaCategory.VIDEO;
  } else if (FileUtil.isFileTypeDocument(mimeType)) {
    category = import_xmessage2.MediaCategory.FILE;
  }
  return category;
};
var getMediaInfo = async (message) => {
  const result = {};
  let mediaUrl = "";
  let mime_type = "";
  let category = null;
  let mediaContent = "";
  if (message.type === "image") {
    mediaContent = message.image || "";
  } else if (message.type === "audio") {
    mediaContent = message.audio || "";
  } else if (message.type === "voice") {
    mediaContent = message.voice || "";
  } else if (message.type === "video") {
    mediaContent = message.video || "";
  } else if (message.type === "document") {
    mediaContent = message.document || "";
  }
  if (mediaContent && mediaContent.length > 0) {
    try {
      const node = JSON.parse(mediaContent);
      const url = node.url || "";
      const signature = node.signature || "";
      mime_type = node.mime_type || "";
      mediaUrl = url + signature;
      category = getMediaCategoryByMimeType(mime_type);
    } catch (error) {
      console.error("Exception in getMediaInfo:", error);
    }
  }
  result.mediaUrl = mediaUrl;
  result.mime_type = mime_type;
  result.category = category;
  return result;
};
var getMessageTypeByMediaCategory = (category) => {
  let messageType = import_xmessage2.MessageType.TEXT;
  if (category !== null) {
    if (category === import_xmessage2.MediaCategory.IMAGE) {
      messageType = import_xmessage2.MessageType.IMAGE;
    } else if (category === import_xmessage2.MediaCategory.AUDIO) {
      messageType = import_xmessage2.MessageType.AUDIO;
    } else if (category === import_xmessage2.MediaCategory.VIDEO) {
      messageType = import_xmessage2.MessageType.VIDEO;
    } else if (category === import_xmessage2.MediaCategory.FILE) {
      messageType = import_xmessage2.MessageType.DOCUMENT;
    }
  }
  return messageType;
};
var uploadInboundMediaFile = async (messageId, mediaUrl, mime_type) => {
  const result = {};
  const mediaSizeLimit = new MediaSizeLimit(
    /* imageSize: */
    10,
    // 10 MB
    /* audioSize: */
    5,
    /* videoSize: */
    20,
    /* documentSize: */
    15
  );
  const maxSizeForMedia = mediaSizeLimit.getMaxSizeForMedia(mime_type);
  let name = "";
  let url = "";
  if (mediaUrl && mediaUrl.length > 0) {
    const inputBytes = await FileUtil.getInputBytesFromUrl(mediaUrl);
    if (inputBytes) {
      const sizeError = FileUtil.validateFileSizeByInputBytes(
        inputBytes,
        maxSizeForMedia
      );
      if (sizeError === "") {
        name = FileUtil.getUploadedFileName(mime_type, messageId);
        const filePath = await FileUtil.fileToLocalFromBytes(
          inputBytes,
          mime_type,
          name
        );
        if (filePath && filePath.length > 0) {
          url = await uploadFileFromPath(filePath, name);
        } else {
          result.size = 0;
          result.error = import_xmessage2.MessageMediaError.EMPTY_RESPONSE;
        }
      } else {
        result.size = inputBytes.length;
        result.error = import_xmessage2.MessageMediaError.PAYLOAD_TOO_LARGE;
      }
    } else {
      result.size = 0;
      result.error = import_xmessage2.MessageMediaError.EMPTY_RESPONSE;
    }
  } else {
    result.size = 0;
    result.error = import_xmessage2.MessageMediaError.EMPTY_RESPONSE;
  }
  result.name = name;
  result.url = url;
  return result;
};
var getInboundMediaMessage = async (message) => {
  try {
    const mediaInfo = await getMediaInfo(message);
    const mediaData = await uploadInboundMediaFile(
      message.messageId || "",
      mediaInfo.mediaUrl,
      mediaInfo.mime_type
    );
    const media = {
      text: mediaData.name,
      url: mediaData.url,
      category: mediaInfo.category
    };
    if (mediaData.error) {
      media.messageMediaError = mediaData.error;
    }
    if (mediaData.size) {
      media.size = mediaData.size;
    }
    return media;
  } catch (err) {
    console.log("Error in getInboundMediaMessage:", err);
    return {};
  }
};
var getInboundLocationParams = (message) => {
  let longitude = null;
  let latitude = null;
  let address = "";
  let name = "";
  let url = "";
  const locationContent = message.location;
  if (locationContent && locationContent.length > 0) {
    try {
      const node = JSON.parse(locationContent);
      longitude = node.longitude !== void 0 ? parseFloat(node.longitude) : null;
      latitude = node.latitude !== void 0 ? parseFloat(node.latitude) : null;
      address = node.address !== void 0 ? node.address : "";
      name = message.name;
      url = node.url !== void 0 ? node.url : "";
    } catch (error) {
      console.error("Exception in getInboundLocationParams:", error);
    }
  }
  const location = {
    latitude,
    longitude,
    address,
    url,
    name
  };
  return location;
};
var processedXMessage = (message, xmsgPayload, to, from, messageState, messageIdentifier, messageType) => {
  return {
    to,
    from,
    channelURI: "WhatsApp",
    providerURI: "gupshup",
    messageState,
    messageId: messageIdentifier,
    messageType,
    timestamp: parseInt(message.timestamp) || Date.now(),
    payload: xmsgPayload
  };
};
var renderMessageChoices = (buttonChoices) => {
  const processedChoicesBuilder = [];
  if (buttonChoices !== null) {
    for (const choice of buttonChoices) {
      processedChoicesBuilder.push(choice.text + "\n");
    }
    if (processedChoicesBuilder.length > 0) {
      return processedChoicesBuilder.join("").slice(0, -1);
    }
  }
  return "";
};
function generateNewMessageId() {
  const fMin = BigInt("4000000000000000000");
  const fMax = BigInt("4999999999999999999");
  const first = BigInt(
    Math.floor(Number(fMin) + Math.random() * (Number(fMax) - Number(fMin) + 1))
  );
  const sMin = BigInt("100000000000000000");
  const sMax = BigInt("999999999999999999");
  const second = BigInt(
    Math.floor(Number(sMin) + Math.random() * (Number(sMax) - Number(sMin) + 1))
  );
  return first + "-" + second;
}
var convertMessageToXMsg = async (msg) => {
  const message = msg;
  const from = { userID: "" };
  const to = { userID: "admin" };
  const messageState = [import_xmessage2.MessageState.REPLIED];
  const messageIdentifier = { channelMessageId: "" };
  const messageType = message.type?.toUpperCase() ?? import_xmessage2.MessageType.REPORT;
  const xmsgPayload = {};
  if (message.response == null && (message.messageId == null || message.messageId === "")) {
    message.messageId = generateNewMessageId();
  }
  if (message.response != null) {
    const reportResponse = message.response;
    const participantJsonList = JSON.parse(reportResponse);
    for (const reportMsg of participantJsonList) {
      const eventType = reportMsg.eventType;
      xmsgPayload.text = "";
      messageIdentifier.channelMessageId = reportMsg.externalId;
      from.userID = reportMsg.destAddr.substring(2);
      messageState[0] = getMessageState(eventType);
    }
    return processedXMessage(
      message,
      xmsgPayload,
      to,
      from,
      messageState[0],
      messageIdentifier,
      messageType
    );
  } else if (message.type === "text" && message.text) {
    from.userID = message.mobile.substring(2);
    messageIdentifier.replyId = message.replyId || "";
    messageState[0] = import_xmessage2.MessageState.REPLIED;
    xmsgPayload.text = message.text;
    messageIdentifier.channelMessageId = message.messageId || "";
    return processedXMessage(
      message,
      xmsgPayload,
      to,
      from,
      messageState[0],
      messageIdentifier,
      messageType
    );
  } else if (message.type === "interactive") {
    from.userID = message.mobile.substring(2);
    messageIdentifier.replyId = message.replyId;
    messageState[0] = import_xmessage2.MessageState.REPLIED;
    xmsgPayload.text = getInboundInteractiveContentText(message);
    messageIdentifier.channelMessageId = message.messageId || "";
    return processedXMessage(
      message,
      xmsgPayload,
      to,
      from,
      messageState[0],
      messageIdentifier,
      messageType
    );
  } else if (message.type === "location") {
    from.userID = message.mobile.substring(2);
    messageIdentifier.replyId = message.replyId;
    messageState[0] = import_xmessage2.MessageState.REPLIED;
    xmsgPayload.location = getInboundLocationParams(message);
    xmsgPayload.text = "";
    messageIdentifier.channelMessageId = message.messageId || "";
    return processedXMessage(
      message,
      xmsgPayload,
      to,
      from,
      messageState[0],
      messageIdentifier,
      messageType
    );
  } else if (isInboundMediaMessage(message.type)) {
    from.userID = message.mobile.substring(2);
    messageIdentifier.replyId = message.replyId;
    messageState[0] = import_xmessage2.MessageState.REPLIED;
    xmsgPayload.text = "";
    xmsgPayload.media = await getInboundMediaMessage(message);
    messageIdentifier.channelMessageId = message.messageId || "";
    return processedXMessage(
      message,
      xmsgPayload,
      to,
      from,
      messageState[0],
      messageIdentifier,
      messageType
    );
  } else if (message.type === "button") {
    from.userID = message.mobile.substring(2);
    return processedXMessage(
      message,
      xmsgPayload,
      to,
      from,
      messageState[0],
      messageIdentifier,
      messageType
    );
  }
  throw new Error("Invalid message type");
};
async function optInUser(xMsg, usernameHSM, passwordHSM, username2Way, password2Way) {
  const phoneNumber = "91" + xMsg.to.userID;
  const optInBuilder = new URL("https://media.smsgupshup.com/GatewayAPI/rest");
  optInBuilder.searchParams.append("v", "1.1");
  optInBuilder.searchParams.append("format", "json");
  optInBuilder.searchParams.append("auth_scheme", "plain");
  optInBuilder.searchParams.append("method", "OPT_IN");
  optInBuilder.searchParams.append("userid", usernameHSM);
  optInBuilder.searchParams.append("password", passwordHSM);
  optInBuilder.searchParams.append("channel", "WHATSAPP");
  optInBuilder.searchParams.append("send_to", phoneNumber);
  optInBuilder.searchParams.append("messageId", "123456789");
  const expanded = optInBuilder;
  try {
    const response = await import_axios.default.get(expanded.toString());
  } catch (error) {
    console.error("Error:", error.response?.data || error.message || error);
  }
}
function createSectionRow(id, title) {
  return {
    id,
    title
  };
}
var _GSWhatsappService = class _GSWhatsappService {
  constructor() {
    this.webClient = import_axios.default.create();
  }
  static getInstance() {
    if (_GSWhatsappService.gupshuupService === null) {
      _GSWhatsappService.gupshuupService = new _GSWhatsappService();
    }
    return _GSWhatsappService.gupshuupService;
  }
  sendOutboundMessage(url) {
    return new Promise((resolve, reject) => {
      this.webClient.get(url).then((response) => {
        resolve(response.data);
      }).catch((error) => {
        reject(error);
      });
    });
  }
};
_GSWhatsappService.gupshuupService = null;
var GSWhatsappService = _GSWhatsappService;
function getOutboundListActionContent(xMsg) {
  const rows = xMsg.payload.buttonChoices?.map(
    (choice) => createSectionRow(choice.key, choice.text)
  ) || [{ id: "", title: "" }];
  const action = {
    button: "Options",
    sections: [
      {
        title: "Choose an option",
        rows
      }
    ]
  };
  try {
    const content = JSON.stringify(action);
    const node = JSON.parse(content);
    const data = {};
    data.button = node.button || void 0;
    data.sections = node.sections || void 0;
    return JSON.stringify(data);
  } catch (error) {
    console.error(`Exception in getOutboundListActionContent: ${error}`);
  }
  return "";
}
function getOutboundQRBtnActionContent(xMsg) {
  const buttons = [];
  xMsg.payload.buttonChoices?.forEach((choice) => {
    const button = {
      type: "reply",
      reply: {
        id: choice.key,
        title: choice.text
      }
    };
    buttons.push(button);
  });
  const action = {
    buttons
  };
  try {
    const content = JSON.stringify(action);
    const node = JSON.parse(content);
    const data = {};
    data.buttons = node.buttons;
    return JSON.stringify(data);
  } catch (error) {
    console.error(`Exception in getOutboundQRBtnActionContent: ${error}`);
  }
  return "";
}
function getURIBuilder() {
  const queryParams = new import_url.URLSearchParams();
  queryParams.append("v", "1.1");
  queryParams.append("format", "json");
  queryParams.append("auth_scheme", "plain");
  queryParams.append("extra", "Samagra");
  queryParams.append("data_encoding", "text");
  queryParams.append("messageId", "123456789");
  return queryParams;
}
function setBuilderCredentialsAndMethod(queryParams, method, username, password) {
  queryParams.append("method", method);
  queryParams.append("userid", username);
  queryParams.append("password", password);
  return queryParams;
}
var convertXMessageToMsg = async (xMsg) => {
  const adapterIdFromXML = xMsg.adapterId;
  try {
    const credentials = gupshupWhatsappAdapterServiceConfig_default.getConfig("adapterCredentials");
    if (credentials && Object.keys(credentials).length !== 0) {
      let text = xMsg.payload.text || "";
      let builder = getURIBuilder();
      if (xMsg.messageState === import_xmessage2.MessageState.OPTED_IN) {
        text += renderMessageChoices(xMsg.payload.buttonChoices || []);
        builder = setBuilderCredentialsAndMethod(
          builder,
          "OPT_IN" /* OPTIN */,
          credentials["username2Way"],
          credentials["password2Way"]
        );
        builder.set("channel", xMsg.channelURI.toLowerCase());
        builder.set("send_to", "91" + xMsg.to.userID);
        builder.set("phone_number", "91" + xMsg.to.userID);
      } else if (xMsg.messageType !== null && xMsg.messageType === import_xmessage2.MessageType.HSM) {
        optInUser(
          xMsg,
          credentials["usernameHSM"],
          credentials["passwordHSM"],
          credentials["username2Way"],
          credentials["password2Way"]
        );
        text += renderMessageChoices(xMsg.payload.buttonChoices || []);
        builder = setBuilderCredentialsAndMethod(
          builder,
          "SendMessage" /* SIMPLEMESSAGE */,
          credentials["usernameHSM"],
          credentials["passwordHSM"]
        );
        builder.set("send_to", "91" + xMsg.to.userID);
        builder.set("msg", text);
        builder.set("isHSM", "true");
        builder.set("msg_type", import_xmessage2.MessageType.HSM);
      } else if (xMsg.messageType !== null && xMsg.messageType === import_xmessage2.MessageType.HSM_WITH_BUTTON) {
        optInUser(
          xMsg,
          credentials["usernameHSM"],
          credentials["passwordHSM"],
          credentials["username2Way"],
          credentials["password2Way"]
        );
        text += renderMessageChoices(xMsg.payload.buttonChoices || []);
        builder = setBuilderCredentialsAndMethod(
          builder,
          "OPT_IN" /* OPTIN */,
          credentials["usernameHSM"],
          credentials["passwordHSM"]
        );
        builder.set("send_to", "91" + xMsg.to.userID);
        builder.set("msg", text);
        builder.set("isTemplate", "true");
        builder.set("msg_type", import_xmessage2.MessageType.HSM);
      } else if (xMsg.messageState === import_xmessage2.MessageState.REPLIED) {
        let plainText = true;
        const stylingTag = xMsg.payload.stylingTag !== null ? xMsg.payload.stylingTag : void 0;
        builder = setBuilderCredentialsAndMethod(
          builder,
          "SendMessage" /* SIMPLEMESSAGE */,
          credentials["username2Way"],
          credentials["password2Way"]
        );
        builder.set("send_to", "91" + xMsg.to.userID);
        builder.set("phone_number", "91" + xMsg.to.userID);
        builder.set("msg_type", xMsg.messageType);
        builder.set("channel", "WHATSAPP");
        builder.set("msg_id", xMsg.messageId.channelMessageId);
        if (stylingTag !== void 0 && FileUtil.isStylingTagIntercativeType(stylingTag) && FileUtil.validateInteractiveStylingTag(xMsg.payload)) {
          if (stylingTag === import_xmessage2.StylingTag.LIST) {
            const content = getOutboundListActionContent(xMsg);
            if (content.length > 0) {
              builder.set("interactive_type", "list");
              builder.set("action", content);
              builder.set("msg", text);
              plainText = false;
            }
          } else if (stylingTag === import_xmessage2.StylingTag.QUICKREPLYBTN) {
            const content = getOutboundQRBtnActionContent(xMsg);
            if (content.length > 0) {
              builder.set("interactive_type", "dr_button");
              builder.set("action", content);
              builder.set("msg", text);
              plainText = false;
            }
          }
        }
        if (xMsg.payload.media && xMsg.payload.media.url) {
          const media = xMsg.payload.media;
          builder.set("method", "SendMediaMessage" /* MEDIAMESSAGE */);
          builder.set(
            "msg_type",
            getMessageTypeByMediaCategory(media.category)
          );
          builder.set("media_url", media.url);
          builder.set("caption", media.text);
          builder.set("isHSM", "false");
          plainText = false;
        }
        if (plainText) {
          text += renderMessageChoices(xMsg.payload.buttonChoices || []);
          builder.set("msg", text);
        }
      }
      console.log(text);
      const expanded = new URL(
        `https://media.smsgupshup.com/GatewayAPI/rest?${builder}`
      );
      try {
        const response = await GSWhatsappService.getInstance().sendOutboundMessage(
          expanded.toString()
        );
        if (response !== null && response.response.status === "success") {
          xMsg.messageId = import_xmessage2.MessageId.builder().setChannelMessageId(response.response.id).build();
          xMsg.messageState = import_xmessage2.MessageState.SENT;
          return xMsg;
        } else {
          console.error(
            "Gupshup Whatsapp Message not sent: ",
            response.response.details
          );
          xMsg.messageState = import_xmessage2.MessageState.NOT_SENT;
          return xMsg;
        }
      } catch (error) {
        console.error("Error in Send GS Whatsapp Outbound Message", error);
      }
    } else {
      console.error("Credentials not found");
      xMsg.messageState = import_xmessage2.MessageState.NOT_SENT;
      return xMsg;
    }
  } catch (error) {
    console.error("Error in processing outbound message", error);
    throw error;
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MediaSizeLimit,
  MethodType,
  Provider,
  convertMessageToXMsg,
  convertXMessageToMsg,
  gupshupWhatsappAdapterServiceConfig
});
