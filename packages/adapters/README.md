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


## Local Setup and Testing

To test out changes to any of the individual adapters which are being exposed and used using the [@samagra-x/uci-adapters-factory](./factory/) you can follow the below mentioned steps:

1. Make changes to your adapter and build the package and then link the package (we use `yarn` as our preferred package manager)
```bash
yarn build
yarn link
```

2. Navigate to the [factory](./factory/) folder and link the package you just built in step 1
```bash
yarn link <NAME_OF_YOUR_PACKAGE>
```

3. Build the UCI Adapters Factory using the `build` command and create the link for it.
```bash
yarn build
yarn link
```

4. Navigate to the project wherever you want to use uci-adapters and link the adapters factory
```bash
yarn link @samagra-x/uci-adapters-factory
```

## Publishing Adapters and Adapter Factory

In order to publish the changes to an adapter, do your changes and make sure to test them out using the steps above.

1. Navigate to the root of the adapter you want to publish, build the package using the `build` command (we use `yarn` as our preferred package manager)
```bash
yarn build
```

2. Publish the newer version of this package
```bash
npm publish --access=public
```

3. Navigate to [adapter factory](./factory/) and update the version of the said adapter
```bash
yarn remove <OLDER_VERSION_OF_ADPTER>
yarn add <NEWER_VERSION_OF_ADAPTER>
```

4. Build the [adapter factory](./factory/) using the `build` command
```bash
yarn build
```

5. Publish the [adapter factory](./factory/) with a newer version
```bash
npm publish --access=public
```

**Note**: While publishing, updating the version is a mandatory step, the `package.json` file has a key named `version` which follows [semantic-versioning](https://semver.org/) and the semantic version needs to be updated (incremented in most cases) for a new version to be published to the npm registr (npm will publish any version which is not already present in it's registry but a good convention is just to keep the version numbers incremental).


