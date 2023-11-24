// src/GupShupWhatsappAdapter.ts
import axios2 from "axios";

// src/utils.ts
import * as fs from "fs";
import * as path from "path";
var FileUtil = class _FileUtil {
  static isFileTypeImage(mimeType) {
    return mimeType.startsWith("image/");
  }
  static isFileTypeAudio(mimeType) {
    return mimeType.startsWith("audio/");
  }
  static isFileTypeVideo(mimeType) {
    return mimeType.startsWith("video/");
  }
  static isFileTypeDocument(mimeType) {
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
    const maxSizeInBytes = maxSize * 1024 * 1024;
    if (fileSizeInBytes > maxSizeInBytes) {
      return `File size exceeds the maximum allowed size of ${maxSize} MB.`;
    }
    return "null";
  }
  static getUploadedFileName(mimeType, messageId) {
    const sanitizedMimeType = mimeType.replace("/", "_");
    const fileName = `${sanitizedMimeType}_${messageId}`;
    return fileName;
  }
  static async fileToLocalFromBytes(inputBytes, mimeType, name) {
    if (inputBytes === null) {
      console.error("Input bytes are null.");
      return null;
    }
    const directoryPath = "your/local/directory/path";
    const fileName = _FileUtil.getUploadedFileName(mimeType, name);
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
    return stylingTag === "LIST" /* LIST */ || stylingTag === "QUICKREPLYBTN" /* QUICKREPLYBTN */;
  }
  static validateInteractiveStylingTag(payload) {
    if (payload.stylingTag === "LIST" /* LIST */ && payload.buttonChoices && payload.buttonChoices.length <= 10) {
      for (const buttonChoice of payload.buttonChoices) {
        if (buttonChoice.text.length > 24) {
          return false;
        }
      }
      return true;
    } else if (payload.stylingTag === "QUICKREPLYBTN" /* QUICKREPLYBTN */ && payload.buttonChoices && payload.buttonChoices.length <= 3) {
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
var Address = class {
};
var ButtonChoice = class {
};
var ContactCard = class {
};
var State = /* @__PURE__ */ ((State2) => {
  State2[State2["STARTING"] = 1] = "STARTING";
  State2[State2["ONGOING"] = 2] = "ONGOING";
  State2[State2["COMPLETED"] = 3] = "COMPLETED";
  return State2;
})(State || {});
var DeviceType = /* @__PURE__ */ ((DeviceType2) => {
  DeviceType2["PHONE"] = "PHONE";
  return DeviceType2;
})(DeviceType || {});
var StylingTag = /* @__PURE__ */ ((StylingTag2) => {
  StylingTag2["LIST"] = "LIST";
  StylingTag2["QUICKREPLYBTN"] = "QUICKREPLYBTN";
  StylingTag2["IMAGE"] = "IMAGE";
  StylingTag2["IMAGE_URL"] = "IMAGE_URL";
  StylingTag2["AUDIO"] = "AUDIO";
  StylingTag2["VIDEO"] = "VIDEO";
  return StylingTag2;
})(StylingTag || {});
var MediaCategory = /* @__PURE__ */ ((MediaCategory2) => {
  MediaCategory2["IMAGE_URL"] = "IMAGE_URL";
  MediaCategory2["AUDIO_URL"] = "AUDIO_URL";
  MediaCategory2["VIDEO_URL"] = "VIDEO_URL";
  MediaCategory2["IMAGE"] = "IMAGE";
  MediaCategory2["AUDIO"] = "AUDIO";
  MediaCategory2["VIDEO"] = "VIDEO";
  MediaCategory2["FILE"] = "FILE";
  return MediaCategory2;
})(MediaCategory || {});
var MessageMediaError = /* @__PURE__ */ ((MessageMediaError2) => {
  MessageMediaError2["PAYLOAD_TOO_LARGE"] = "payloadTooLarge";
  MessageMediaError2["EMPTY_RESPONSE"] = "emptyResponse";
  return MessageMediaError2;
})(MessageMediaError || {});
var MethodType = /* @__PURE__ */ ((MethodType2) => {
  MethodType2["SIMPLEMESSAGE"] = "SendMessage";
  MethodType2["MEDIAMESSAGE"] = "SendMediaMessage";
  MethodType2["OPTIN"] = "OPT_IN";
  return MethodType2;
})(MethodType || {});
var ConversationStage = class {
};
var LocationParams = class {
};
var MessageId = class {
  constructor(builder) {
    this.Id = builder.id;
    this.channelMessageId = builder.channelMessageId;
    this.replyId = builder.replyId;
  }
  static builder() {
    return new MessageIdBuilder();
  }
};
var MessageIdBuilder = class {
  constructor() {
    this.id = "";
    this.channelMessageId = "";
    this.replyId = "";
  }
  setId(id) {
    this.id = id;
    return this;
  }
  setChannelMessageId(channelMessageId) {
    this.channelMessageId = channelMessageId;
    return this;
  }
  setReplyId(replyId) {
    this.replyId = replyId;
    return this;
  }
  build() {
    return new MessageId(this);
  }
};
var MessageMedia = class {
};
var Provider = class {
};
var SenderReceiverInfo = class {
  // Encrypted Device String
};
var Transformer = class {
  // templateID, configID, userData
};
var XMessagePayload2 = class {
};
var XMessageThread = class {
  // last incoming msgId
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
import { URLSearchParams } from "url";

// ../../services/bot/src/bot.service.ts
import axios from "axios";

// ../../services/bot/src/botutil.ts
var _BotUtil = class _BotUtil {
  /**
   * Get true if bot is valid else invalid message, from JSON node data
   * @param data
   * @return
   */
  static getBotValidFromJsonNode(data) {
    const status = data["status"].toString();
    const startDate = data["startDate"].toString();
    const endDate = data["endDate"].toString();
    console.log(`Bot Status: ${status}, Start Date: ${startDate}, End Date: ${endDate}`);
    return _BotUtil.getBotValid(status, startDate, endDate);
  }
  /**
   * Get true if bot is valid else invalid message, by status, start date & end date
   * @param status
   * @param startDate
   * @param endDate
   * @return
   */
  static getBotValid(status, startDate, endDate) {
    if (!_BotUtil.checkBotLiveStatus(status)) {
      return `This conversation is not active yet. Please contact your state admin to seek help with this.`;
    } else if (startDate == null || startDate === "null" || startDate === "") {
      console.log("Bot start date is empty.");
      return `This conversation is not active yet. Please contact your state admin to seek help with this.`;
    } else if (!_BotUtil.checkBotStartDateValid(startDate)) {
      if (startDate == null || startDate === "null" || startDate === "") {
        return `This conversation is not active yet. It will be enabled on ${startDate}. Please try again then.`;
      }
      return `This conversation is not active yet. Please try again then.`;
    } else if (!_BotUtil.checkBotEndDateValid(endDate)) {
      return `This conversation has expired now. Please contact your state admin to seek help with this.`;
    }
    return "true";
  }
  /**
   * Check if bot is valid or not, by JSON node data
   * @param data
   * @return
   */
  static checkBotValidFromJsonNode(data) {
    const status = data["status"]?.toString();
    const startDate = data["startDate"]?.toString();
    const endDate = data["endDate"]?.toString();
    console.log(`Bot Status: ${status}, Start Date: ${startDate}, End Date: ${endDate}`);
    return _BotUtil.checkBotValid(status, startDate, endDate);
  }
  /**
   * Check if bot is valid or not, by status, start date & end date
   * @param status
   * @param startDate
   * @param endDate
   * @return
   */
  static checkBotValid(status, startDate, endDate) {
    return _BotUtil.checkBotLiveStatus(status) && _BotUtil.checkBotStartDateValid(startDate) && _BotUtil.checkBotEndDateValid(endDate) && !(startDate == null || startDate === "null" || startDate === "");
  }
  /**
   * Check if bot' status is live/enabled
   * @param status
   * @return
   */
  static checkBotLiveStatus(status) {
    status = status.toLowerCase();
    if (status === _BotUtil.botLiveStatus || status === _BotUtil.botEnabledStatus) {
      return true;
    }
    console.log("Bot is invalid as its status is not live or enabled.");
    return false;
  }
  /**
   * Check if bot's start date is valid (Should be less than or equal to the current date)
   * @param startDate
   * @return
   */
  static checkBotStartDateValid(startDate) {
    try {
      const currentDate = /* @__PURE__ */ new Date();
      const botStartDate = new Date(startDate);
      return currentDate >= botStartDate;
    } catch (error) {
      console.error("Error in checkBotStartDateValid:", error);
    }
    return false;
  }
  /**
   * Check if bot's end date is valid (Should be empty OR greater than or equal to the current date)
   * @param endDate
   * @return
   */
  static checkBotEndDateValid(endDate) {
    try {
      if (endDate == null || endDate === "null" || endDate === "") {
        console.log("Bot end date is empty.");
        return true;
      }
      const currentDate = /* @__PURE__ */ new Date();
      const botEndDate = new Date(endDate);
      botEndDate.setHours(23, 59, 59);
      return currentDate < botEndDate;
    } catch (error) {
      console.error("Error in checkBotEndDateValid:", error);
    }
    return false;
  }
};
_BotUtil.botEnabledStatus = "enabled";
_BotUtil.botLiveStatus = "live";
_BotUtil.adminUserId = "admin";
_BotUtil.transformerTypeBroadcast = "broadcast";
_BotUtil.transformerTypeGeneric = "generic";
/**
* Get value by key from bot json node
* @param botNode
* @param key
* @return
*/
_BotUtil.getBotNodeData = (botNode, key) => {
  if (botNode[key] !== void 0 && botNode[key] !== null && typeof botNode[key] === "string" && botNode[key] !== "null" && botNode[key] !== "") {
    return botNode[key];
  }
  return null;
};
var BotUtil = _BotUtil;

// ../../services/bot/src/botServiceConfig.ts
var BotServiceConfig = class _BotServiceConfig {
  constructor() {
    this.config = {};
  }
  static getInstance() {
    if (!_BotServiceConfig.instance) {
      _BotServiceConfig.instance = new _BotServiceConfig();
    }
    return _BotServiceConfig.instance;
  }
  setConfig(config) {
    this.config = { ...this.config, ...config };
  }
  getConfig(key) {
    return this.config[key];
  }
};
var botServiceConfig_default = BotServiceConfig.getInstance();

// ../../services/bot/src/bot.service.ts
var cache = /* @__PURE__ */ new Map();
var getAdapterByID = async (adapterID) => {
  const cacheKey = `adapter-by-id: ${adapterID}`;
  console.log(
    `BotService:getAdapterByID::Calling get adapter by id from uci api: ${adapterID}`
  );
  if (cache.has(cacheKey)) {
    console.log(`getAdapterByID from cache: ${cache.get(cacheKey)}`);
    return cache.get(cacheKey);
  } else {
    console.log(`getAdapterByID from webclient: ${cache.get(cacheKey)}`);
    try {
      const response = await axios.get(`${botServiceConfig_default.getConfig("baseUrl")}/admin/adapter/${adapterID}`);
      console.log(
        `BotService:getAdapterByID::Got Data From UCI Api : cache key : ${cacheKey} cache data : ${cache.get(
          cacheKey
        )}`
      );
      if (response.data !== null) {
        const root = response.data;
        if (root != null && root.result != null && root.result.id != null && root.result.id !== "") {
          return root.result;
        }
        return null;
      } else {
        return null;
      }
    } catch (error) {
      console.error(`BotService:getAdapterByID::Exception: ${error}`);
      return null;
    }
  }
};
var getAdapterCredentials = async (adapterID) => {
  const cacheKey = `adapter-credentials: ${adapterID}`;
  const adapter = await getAdapterByID(adapterID);
  console.log(`getAdapterByID: ${adapter}`);
  if (adapter !== null) {
    let vaultKey;
    try {
      vaultKey = adapter.logicIDs[0].adapter.config.credentials.vault;
    } catch (ex) {
      console.error(
        `Exception in fetching adapter variable from json node: ${ex}`
      );
      vaultKey = null;
    }
    if (vaultKey !== null && vaultKey !== "") {
      return await getVaultCredentials(vaultKey);
    }
  }
  return null;
};
var getVaultCredentials = async (secretKey) => {
  const adminToken = botServiceConfig_default.getConfig("vaultServiceToken");
  if (adminToken === null || adminToken === void 0 || adminToken === "") {
    return null;
  }
  const webClient = axios.create({
    baseURL: botServiceConfig_default.getConfig("vaultServiceUrl"),
    headers: {
      ownerId: "8f7ee860-0163-4229-9d2a-01cef53145ba",
      ownerOrgId: "org1",
      "admin-token": adminToken
    }
  });
  const cacheKey = `adapter-credentials-by-id: ${secretKey}`;
  console.log(
    `BotService:getVaultCredentials::Calling get vault credentials from uci api: ${secretKey}`
  );
  if (cache.has(cacheKey)) {
    console.log(`getVaultCredentials from cache : ${cache.get(cacheKey)}`);
    return cache.get(cacheKey);
  } else {
    console.log(`getVaultCredentials from axios : ${cache.get(cacheKey)}`);
    const response = await webClient.get(`/admin/secret/${secretKey}`);
    console.log(
      `BotService:getVaultCredentials::Got Data From UCI Api : cache key : ${cacheKey} cache data : ${cache.get(
        cacheKey
      )}`
    );
    if (response.data !== null) {
      try {
        const credentials = {};
        const root = response.data;
        if (root.result !== null && root.result.logicIDs[0].adapter.config.credentials !== null) {
          return root.result.logicIDs[0].adapter.config.credentials;
        }
        return null;
      } catch (e) {
        console.error(`BotService:getVaultCredentials::Exception: ${e}`);
        return null;
      }
    }
    return null;
  }
};

// src/minioClient.ts
import * as Minio from "minio";
import { FusionAuthClient } from "@fusionauth/typescript-client";
var fusionAuth = new FusionAuthClient("bf69486b-4733-4470-a592-f1bfce7af580", "https://local.fusionauth.io");
var minioLoginId = process.env.CDN_MINIO_LOGIN_ID || "";
var minioPassword = process.env.CDN_MINIO_PASSWORD || "";
var minioAppId = process.env.CDN_MINIO_APPLICATION_ID || "";
var minioBucketId = process.env.CDN_MINIO_BUCKET_ID || "";
var minioUrl = process.env.CDN_MINIO_URL || "";
var minioFAKey = process.env.CDN_MINIO_FA_KEY || "";
var minioFAUrl = process.env.CDN_MINIO_FA_URL || "";
var loadDefaultObjects = () => {
  console.log(`Minio details, loginID: ${minioLoginId}, password: ${minioPassword}, appId: ${minioAppId}, bucketId: ${minioBucketId}, faKey: ${minioFAKey}, faUrl: ${minioFAUrl}, url: ${minioUrl}`);
  let appID = null;
  if (minioAppId !== null) {
    appID = minioAppId;
  }
  if (!fusionAuth) {
    fusionAuth = new FusionAuthClient(minioFAKey, minioFAUrl);
  }
};
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
    loadDefaultObjects();
    const minioClient = new Minio.Client({
      endPoint: "play.min.io",
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
      messageState = "SENT" /* SENT */;
      break;
    case "DELIVERED":
      messageState = "DELIVERED" /* DELIVERED */;
      break;
    case "READ":
      messageState = "READ" /* READ */;
      break;
    default:
      messageState = "FAILED_TO_DELIVER" /* FAILED_TO_DELIVER */;
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
      console.log("interactive content node:", node);
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
  console.log("Inbound interactive text:", text);
  return text;
};
var getMediaCategoryByMimeType = (mimeType) => {
  let category = null;
  if (FileUtil.isFileTypeImage(mimeType)) {
    category = "IMAGE" /* IMAGE */;
  } else if (FileUtil.isFileTypeAudio(mimeType)) {
    category = "AUDIO" /* AUDIO */;
  } else if (FileUtil.isFileTypeVideo(mimeType)) {
    category = "VIDEO" /* VIDEO */;
  } else if (FileUtil.isFileTypeDocument(mimeType)) {
    category = "FILE" /* FILE */;
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
      console.log("media content node:", node);
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
  let messageType = "TEXT" /* TEXT */;
  if (category !== null) {
    if (category === "IMAGE" /* IMAGE */) {
      messageType = "IMAGE" /* IMAGE */;
    } else if (category === "AUDIO" /* AUDIO */) {
      messageType = "AUDIO" /* AUDIO */;
    } else if (category === "VIDEO" /* VIDEO */) {
      messageType = "VIDEO" /* VIDEO */;
    } else if (category === "FILE" /* FILE */) {
      messageType = "DOCUMENT" /* DOCUMENT */;
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
          result.error = "emptyResponse" /* EMPTY_RESPONSE */;
        }
      } else {
        result.size = inputBytes.length;
        result.error = "payloadTooLarge" /* PAYLOAD_TOO_LARGE */;
      }
    } else {
      result.size = 0;
      result.error = "emptyResponse" /* EMPTY_RESPONSE */;
    }
  } else {
    result.size = 0;
    result.error = "emptyResponse" /* EMPTY_RESPONSE */;
  }
  result.name = name;
  result.url = url;
  return result;
};
var getInboundMediaMessage = (message) => {
  const mediaInfo = getMediaInfo(message);
  const mediaData = uploadInboundMediaFile(
    message.messageId,
    mediaInfo.mediaUrl,
    mediaInfo.mime_type
  );
  const media = {
    text: mediaData.name.toString(),
    url: mediaData.url.toString(),
    category: mediaInfo.category
  };
  if (mediaData.error) {
    media.messageMediaError = mediaData.error;
  }
  if (mediaData.size) {
    media.size = mediaData.size;
  }
  return media;
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
      console.log("locationcontent node:", node);
      longitude = node.longitude !== void 0 ? parseFloat(node.longitude) : null;
      latitude = node.latitude !== void 0 ? parseFloat(node.latitude) : null;
      address = node.address !== void 0 ? node.address : "";
      name = node.name !== void 0 ? node.name : "";
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
    timestamp: message.timestamp || Date.now(),
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
  return first.toString() + "-" + second.toString();
}
var convertMessageToXMsg = async (msg) => {
  const message = msg;
  const from = { userID: "" };
  const to = { userID: "admin" };
  const messageState = ["REPLIED" /* REPLIED */];
  const messageIdentifier = { channelMessageId: "" };
  const messageType = "TEXT" /* TEXT */;
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
  } else if (message.type === "text") {
    from.userID = message.mobile.substring(2);
    console.log("hurray", messageIdentifier);
    messageIdentifier.replyId = message.replyId;
    messageState[0] = "REPLIED" /* REPLIED */;
    xmsgPayload.text = message.text;
    messageIdentifier.channelMessageId = message.messageId;
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
    messageState[0] = "REPLIED" /* REPLIED */;
    xmsgPayload.text = getInboundInteractiveContentText(message);
    messageIdentifier.channelMessageId = message.messageId;
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
    messageState[0] = "REPLIED" /* REPLIED */;
    xmsgPayload.location = getInboundLocationParams(message);
    xmsgPayload.text = "";
    messageIdentifier.channelMessageId = message.messageId;
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
    messageState[0] = "REPLIED" /* REPLIED */;
    xmsgPayload.text = "";
    xmsgPayload.media = getInboundMediaMessage(message);
    messageIdentifier.channelMessageId = message.messageId;
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
  optInBuilder.searchParams.append("phone_number", phoneNumber);
  optInBuilder.searchParams.append("messageId", "123456789");
  const expanded = optInBuilder.toString();
  console.log(expanded);
  try {
    const response = await axios2.get(expanded);
    console.log(response.data);
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
    this.webClient = axios2.create();
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
  const rows = xMsg.payload.buttonChoices.map(
    (choice) => createSectionRow(choice.key, choice.text)
  );
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
  xMsg.payload.buttonChoices.forEach((choice) => {
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
  const queryParams = new URLSearchParams();
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
  const adapterId = "44a9df72-3d7a-4ece-94c5-98cf26307324";
  try {
    const credentials = await getAdapterCredentials(adapterIdFromXML);
    if (credentials && !credentials.isEmpty()) {
      let text = xMsg.payload.text;
      let builder = getURIBuilder();
      if (xMsg.messageState === "OPTED_IN" /* OPTED_IN */) {
        text += renderMessageChoices(xMsg.payload.buttonChoices);
        builder = setBuilderCredentialsAndMethod(
          builder,
          "OPT_IN" /* OPTIN */.toString(),
          credentials["username2Way"].toString(),
          credentials["password2Way"].toString()
        );
        builder.set("channel", xMsg.channelURI.toLowerCase());
        builder.set("phone_number", "91" + xMsg.to.userID);
      } else if (xMsg.messageType !== null && xMsg.messageType === "HSM" /* HSM */) {
        optInUser(
          xMsg,
          credentials["usernameHSM"].toString(),
          credentials["passwordHSM"].toString(),
          credentials["username2Way"].toString(),
          credentials["password2Way"].toString()
        );
        text += renderMessageChoices(xMsg.payload.buttonChoices);
        builder = setBuilderCredentialsAndMethod(
          builder,
          "SendMessage" /* SIMPLEMESSAGE */.toString(),
          credentials["usernameHSM"].toString(),
          credentials["passwordHSM"].toString()
        );
        builder.set("send_to", "91" + xMsg.to.userID);
        builder.set("msg", text);
        builder.set("isHSM", "true");
        builder.set("msg_type", "HSM" /* HSM */.toString());
      } else if (xMsg.messageType !== null && xMsg.messageType === "HSM_WITH_BUTTON" /* HSM_WITH_BUTTON */) {
        optInUser(
          xMsg,
          credentials["usernameHSM"].toString(),
          credentials["passwordHSM"].toString(),
          credentials["username2Way"].toString(),
          credentials["password2Way"].toString()
        );
        text += renderMessageChoices(xMsg.payload.buttonChoices);
        builder = setBuilderCredentialsAndMethod(
          builder,
          "SendMessage",
          credentials["usernameHSM"].toString(),
          credentials["passwordHSM"].toString()
        );
        builder.set("send_to", "91" + xMsg.to.userID);
        builder.set("msg", text);
        builder.set("isTemplate", "true");
        builder.set("msg_type", "HSM" /* HSM */.toString());
      } else if (xMsg.messageState === "REPLIED" /* REPLIED */) {
        let plainText = true;
        let msgType = "TEXT" /* TEXT */;
        const stylingTag = xMsg.payload.stylingTag !== null ? xMsg.payload.stylingTag : null;
        builder = setBuilderCredentialsAndMethod(
          builder,
          "SendMessage" /* SIMPLEMESSAGE */.toString(),
          credentials["username2Way"].toString(),
          credentials["password2Way"].toString()
        );
        builder.set("send_to", "91" + xMsg.to.userID);
        builder.set("msg_type", "TEXT" /* TEXT */.toString());
        if (stylingTag !== null && FileUtil.isStylingTagIntercativeType(stylingTag) && FileUtil.validateInteractiveStylingTag(xMsg.payload)) {
          if (stylingTag === "LIST" /* LIST */) {
            const content = getOutboundListActionContent(xMsg);
            console.log("list content: ", content);
            if (content.length > 0) {
              builder.set("interactive_type", "list");
              builder.set("action", content);
              builder.set("msg", text);
              plainText = false;
            }
          } else if (stylingTag === "QUICKREPLYBTN" /* QUICKREPLYBTN */) {
            const content = getOutboundQRBtnActionContent(xMsg);
            console.log("QR btn content: ", content);
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
          builder.set("method", "SendMediaMessage" /* MEDIAMESSAGE */.toString());
          builder.set(
            "msg_type",
            getMessageTypeByMediaCategory(media.category).toString()
          );
          builder.set("media_url", media.url);
          builder.set("caption", media.text);
          builder.set("isHSM", "false");
          plainText = false;
        }
        if (plainText) {
          text += renderMessageChoices(xMsg.payload.buttonChoices);
          builder.set("msg", text);
        }
      }
      console.log(text);
      const expanded = new URL(builder.toString());
      console.log(expanded.toString());
      try {
        const response = await GSWhatsappService.getInstance().sendOutboundMessage(
          expanded.toString()
        );
        if (response !== null && response.response.status === "success") {
          xMsg.messageId = MessageId.builder().setChannelMessageId(response.response.id).build();
          xMsg.messageState = "SENT" /* SENT */;
          return xMsg;
        } else {
          console.error(
            "Gupshup Whatsapp Message not sent: ",
            response.response.details
          );
          xMsg.messageState = "NOT_SENT" /* NOT_SENT */;
          return xMsg;
        }
      } catch (error) {
        console.error("Error in Send GS Whatsapp Outbound Message", error);
      }
    } else {
      console.error("Credentials not found");
      xMsg.messageState = "NOT_SENT" /* NOT_SENT */;
      return xMsg;
    }
  } catch (error) {
    console.error("Error in processing outbound message", error);
    throw error;
  }
};
export {
  Address,
  ButtonChoice,
  ContactCard,
  ConversationStage,
  DeviceType,
  LocationParams,
  MediaCategory,
  MediaSizeLimit,
  MessageId,
  MessageIdBuilder,
  MessageMedia,
  MessageMediaError,
  MethodType,
  Provider,
  SenderReceiverInfo,
  State,
  StylingTag,
  Transformer,
  XMessagePayload2 as XMessagePayload,
  XMessageThread,
  convertMessageToXMsg,
  convertXMessageToMsg
};
