# XMessage

The `XMessage` class is a fundamental part of the Unified Conversational Interface (UCI) framework. It represents a versatile message structure used within the UCI ecosystem, facilitating communication between different channels and providers. Below is an overview of the key features and functionalities of the `XMessage` class.

## Class Structure

### Properties

- **app?: string**: Application identifier associated with the message.
- **messageType: MessageType**: Type of the message (e.g., TEXT, IMAGE, VIDEO).
- **adapterId?: string**: Identifier of the adapter responsible for handling the message.
- **messageId: MessageId**: Unique identifier for the message.
- **to: SenderReceiverInfo**: Information about the message recipient.
- **from: SenderReceiverInfo**: Information about the message sender.
- **channelURI: string**: Channel-specific URI (e.g., for WhatsApp).
- **providerURI: string**: Provider-specific URI (e.g., for Gupshup).
- **timestamp: number**: Timestamp indicating when the message was sent.
- **userState?: string**: Current state of the user associated with the message.
- **encryptionProtocol?: string**: Protocol used for message encryption.
- **messageState: MessageState**: Current state of the message (e.g., SENT, DELIVERED).
- **lastMessageID?: string**: Identifier of the last message in the conversation.
- **conversationStage?: ConversationStage**: Stage of the conversation.
- **conversationLevel?: Array<number>**: Array representing the conversation level.
- **transformers?: Transformer**: Transformation rules applied to the message.
- **thread?: XMessageThread**: Thread information for the message.
- **payload: XMessagePayload**: Payload containing the message content.

### Methods

- **toXML?(): string**: Converts the message to an XML representation.
- **getChannel?(): string**: Retrieves the channel associated with the message.
- **getProvider?(): string**: Retrieves the provider associated with the message.
- **secondsSinceLastMessage?(): number**: Calculates the time elapsed since the last message.
- **setChannel?(channel: string)**: Sets the channel associated with the message.
- **setProvider?(provider: string)**: Sets the provider associated with the message.

## Message Types

The `MessageType` enum defines different types of messages, such as:
- **HSM**: Highly Structured Message.
- **TEXT**: Text message.
- **HSM_WITH_BUTTON**: HSM message with buttons.
- **BROADCAST_TEXT**: Broadcast text message.
- **IMAGE**: Image message.
- **VIDEO**: Video message.
- **AUDIO**: Audio message.
- **DOCUMENT**: Document message.
- **LOCATION**: Location message.
- **REPORT**: Report message.

## Message States

The `MessageState` enum represents different states a message can be in, including:
- **NOT_SENT**
- **FAILED_TO_DELIVER**
- **DELIVERED**
- **READ**
- **REPLIED**
- **ENQUEUED**
- **SENT**
- **OPTED_IN**
- **OPTED_OUT**

## Conversion to Other Message Formats

Utility functions are provided to convert `XMessage` instances to specific formats:
- `convertXMessageToIEmailOptions(xmessage: XMessage): IEmailOptions`
- `convertXMessageToIChatOptions(xmessage: XMessage): IChatOptions`
- `convertXMessageToISmsOptions(xmessage: XMessage): ISmsOptions`

## Examples

### Creating an XMessage Instance

```typescript
const xmessage = new XMessage();
xmessage.messageType = MessageType.TEXT;
xmessage.to = { userID: 'recipient123' };
xmessage.from = { userID: 'sender456' };
// ... other properties ...

console.log(xmessage);
```

### Converting to Email Options
```typescript
const emailOptions = convertXMessageToIEmailOptions(xmessage);
console.log(emailOptions);
```

### Converting to Chat Options
```typescript
const chatOptions = convertXMessageToIChatOptions(xmessage);
console.log(chatOptions);
```

### Converting to SMS Options
```typescript
const smsOptions = convertXMessageToISmsOptions(xmessage);
console.log(smsOptions);
```
