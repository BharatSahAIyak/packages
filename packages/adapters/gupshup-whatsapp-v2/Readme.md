# Gupshup WhatsApp Adapter Documentation

This document describes the WhatsApp Adapter , which integrates with the Gupshup V2 APIs to send and receive WhatsApp messages in the **Samagra XMessage** ecosystem.

## Overview

The adapter uses `axios` to send outbound messages to Gupshup's REST API. It supports both **text** and **media** messages, including functionality for handling quick reply buttons, call-to-action (CTA) buttons, and campaign tracking. Let's dive into the code level details of the adapter.

## MessageBuilder Class

The `MessageBuilder` class constructs the query parameters needed for the Gupshup API requests.

### Constructor
Initializes the builder with default parameters.

```typescript
class MessageBuilder {
  private params: URLSearchParams;

  constructor() {
    this.params = new URLSearchParams();
    this.setDefaultParams();
  }

  private setDefaultParams(): void {
    this.params.append('v', '1.1');
    this.params.append('format', 'json');
    this.params.append('auth_scheme', 'plain');
    this.params.append('extra', 'Samagra');
    this.params.append('data_encoding', 'text');
    this.params.append('messageId', '123456789');
  }
}
```

### Methods

- **setCredentials**: Sets the username, password, and method for the API request.
- **setQuickReplyPayloads**: Adds quick reply options (up to 3).
- **setButtonParams**: Adds URL parameters for buttons.
- **setCampaignTracking**: Tracks campaign details.
- **setMessageParams**: Sets the recipient, message type, and message content.
- **getParams**: Returns the constructed URL parameters.

## GupshupWhatsappProvider Class

The `GupshupWhatsappProvider` class implements the `XMessageProvider` interface and handles sending messages to Gupshup.

### Constructor
Initializes the provider with an optional configuration.

```typescript
export class GupshupWhatsappProvider implements XMessageProvider {
  private readonly providerConfig?: IGSWhatsappConfig;
  private readonly baseUrl = 'https://media.smsgupshup.com/GatewayAPI/rest';

  constructor(config?: IGSWhatsappConfig) {
    this.providerConfig = config;
  }
}
```

### Methods

#### **sendMessage**
Sends an `XMessage` object to Gupshup.

```typescript
async sendMessage(xMsg: XMessage): Promise<XMessage | void> {
  if (!this.providerConfig) {
    console.error("Configuration not set for adapter!");
    return;
  }

  try {
    const builder = new MessageBuilder();

    if (xMsg.messageState === MessageState.REPLIED) {
      builder.setCredentials(
        this.providerConfig.username2Way,
        this.providerConfig.password2Way,
        MethodType.SIMPLEMESSAGE
      );

      this.handleTextMessage(xMsg, builder);
      this.handleMediaMessage(xMsg, builder);

      const url = new URL(`${this.baseUrl}?${builder.getParams()}`);

      try {
        const response: GSWhatsappOutBoundResponse = await this.sendOutboundMessage(url.toString());
        if (response?.response.status === 'success') {
          xMsg.messageId = MessageId.builder().setChannelMessageId(response.response.id).build();
          xMsg.messageState = MessageState.SENT;
        } else {
          console.error('Gupshup Whatsapp Message not sent:', response?.response.details);
          xMsg.messageState = MessageState.NOT_SENT;
        }
      } catch (error) {
        console.error('Error in Send Gupshup Whatsapp Outbound Message', error);
        xMsg.messageState = MessageState.NOT_SENT;
      }
    }

    return xMsg;
  } catch (error) {
    console.error('Error in processing outbound message', error);
    throw error;
  }
}
```

#### **handleTextMessage**
Processes text messages and adds quick reply or CTA button information.

```typescript
private handleTextMessage(xMsg: XMessage, builder: MessageBuilder): void {
  const extendedPayload = xMsg.payload as ExtendedXMessagePayload;
  let text = extendedPayload.text || '';

  const metadata = extendedPayload.metaData || {};
  
  if (metadata.qrPayload) {
    builder.setQuickReplyPayloads(metadata.qrPayload);
  }

  if (metadata.ctaButtonUrl) {
    builder.setButtonParams({
      ...extendedPayload,
      ctaButtonUrl: metadata.ctaButtonUrl
    });
  }

  if (metadata.campaignId) {
    builder.setCampaignTracking(metadata.campaignId);
  }

  text += this.renderMessageChoices(extendedPayload.buttonChoices?.choices || []);
  builder.setMessageParams(xMsg, text);
}
```

#### **handleMediaMessage**
Handles media messages like images, audio, video, and documents.

```typescript
private handleMediaMessage(xMsg: XMessage, builder: MessageBuilder): void {
  if (xMsg.payload.media?.[0]) {
    const media = xMsg.payload.media[0];
    const extendedPayload = xMsg.payload as ExtendedXMessagePayload;
    const metadata = extendedPayload.metaData || {};
    const params = builder.getParams();
    params.set('method', MethodType.MEDIAMESSAGE);
    params.set('msg_type', this.getMessageTypeByMediaCategory(media.category!));
    params.set('media_url', media.url!);
    params.set('isHSM', 'false');

    if (metadata.qrPayload) {
      params.set('isTemplate', 'true');
      builder.setQuickReplyPayloads(metadata.qrPayload);
    }

    if (metadata.ctaButtonUrl || metadata.buttonUrlParam) {
      builder.setButtonParams({
        ...extendedPayload,
        ctaButtonUrl: metadata.ctaButtonUrl,
        buttonUrlParam: metadata.buttonUrlParam
      });
    }

    if (metadata.campaignId) {
      builder.setCampaignTracking(metadata.campaignId);
    }

    if (media.caption) {
      params.set('caption', media.caption);
    }
    if (media.filename) {
      params.set('filename', media.filename);
    }
  }
}
```

#### **convertMessageToXMsg**
Converts a Gupshup message to an `XMessage` object.

```typescript
async convertMessageToXMsg(msg: GSWhatsAppMessage): Promise<XMessage> {
  const xMsg = new XMessage();
  xMsg.messageId = MessageId.builder().setChannelMessageId(msg.messageId || uuid4()).build();
  
  xMsg.to = new SenderReceiverInfo();
  xMsg.to.userID = msg.mobile.replace('91', '');

  xMsg.from.userID = "admin";

  xMsg.channelURI = 'whatsapp';
  xMsg.providerURI = 'gupshup';
  xMsg.timestamp = Date.now();
  xMsg.messageState = MessageState.REPLIED;

  const payload: ExtendedXMessagePayload = {
    text: msg.text || ''
  };

  xMsg.payload = payload;

  return xMsg;
}
```

### Utility Methods

- **renderMessageChoices**: Formats button choices into a string.
- **getMessageTypeByMediaCategory**: Returns the message type based on the media category.
