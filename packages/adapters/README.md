# Adapters

The `adapters` module comprises different adapter implementations that enable the Unified Conversational Interface (UCI) to interact with various channels and providers. These adapters implement one or more of the following interfaces:

- `IEmailProvider`
- `ISmsProvider`
- `IChatProvider`
- `XMessageProvider`

## IEmailProvider

The `IEmailProvider` interface defines the contract for email-related providers. Adapters implementing this interface facilitate sending emails through the UCI framework. An example of this type of provider would be [NodemailerProvider](./nodemailer/src/lib/nodemailer.provider.ts).

## ISmsProvider

The `ISmsProvider` interface outlines the requirements for Short Message Service (SMS) providers. Adapters implementing this interface enable sending SMS messages through the UCI framework. An example of this type of provider would be [TwilioSmsProvider](./twilio/src/lib/twilio.provider.ts).

## IChatProvider

The `IChatProvider` interface specifies the contract for chat providers. Adapters implementing this interface facilitate sending chat messages through the UCI framework. An example of this type of adapter would be [TelegramBotProvider](./telegram/src/lib/telegram.provider.ts).

## XMessageProvider

The `XMessageProvider` interface is essential for adapters that can directly work on xmessage without the need of converting the data into any other form. An example of this type of adapter would be [PWAProvider](./pwa/src/lib/pwa.provider.ts).

## Using Adapters

Take a look at [factory](./factory/README.md) on how to use different adapters.

## Creating adapters
Creating a new adapter is quite a simple process. Here is a step by step guide on how to create an adapter for a provider + channel.

- An adapter 'must' implement one of the following interfaces to integrate with UCI:
    - IEmailProvider
    - ISmsProvider
    - IChatProvider
    - XMessageProvider

- An adapter can either be used for one-way or two-way communication.

- For a one-way communication adapter (from UCI to Channel), the class implementing one of the interfaces must override the `sendMessage` method of the corresponding interface. The `sendMessage` method may accept an `IEmailOptions`, `IChatOptions`, `ISmsOptions` or `XMessage` corresponding to the interface being implemented.

- The `sendMessage` method is responsible for accepting data in a specific format and calling the respective APIs to send the message using a `provider` (for example, Gupshup) on a specific `channel` (for example, Whatsapp).

- For a two-way communication adapter (from Channel to UCI, and from UCI to channel), the class must override another method namely `convertMessageToXMsg` which is responsible for converting raw incoming data into an [XMessage](../xmessage/src/xMessage.ts) object. Take a look at [telegram inbound controller](https://github.com/PraVriShti/inbound-js/blob/dev/src/message/controllers/inbound/telegram.bot.controller.ts) to get a better understanding of how this is used.

- These two methods are then used by the [inbound](https://github.com/PraVriShti/inbound-js) service to enable communication with different channels.

- After implementing these methods, the adapter needs to be added to the [factory](./factory/src/lib/adapter.factory.ts) so that factory can create correct adapter instance out of this class.

## Note

A number of adapters here are taken from
https://github.com/novuhq/novu
