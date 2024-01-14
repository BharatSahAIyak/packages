# UCI Packages Repository

This repository holds various packages/components that collectively form the **Unified Communications Interface (UCI)**, providing a versatile and extensible solution for building conversational interfaces and chatbots.

The UCI Packages Repository is a collection of modular components designed to provide a comprehensive and flexible framework for developing conversational interfaces. Each package addresses a specific aspect of the UCI ecosystem, allowing for easy extensibility and customization.

Feel free to explore each package's documentation for detailed information on usage, configuration, and contribution guidelines. By combining these packages, developers can build powerful and adaptable conversational applications using the Unified Conversational Interface.

This repository is used directly by [inbound](https://github.com/PraVriShti/inbound-js.git) to provide APIs that seamlessly integrate the adapters present here.

The repository is organized into the following directories:

## packages/xmessage

The `xmessage` directory contains specifications for the `xmessage` type, a foundational structure used extensively within UCI services. `xmessage` serves as a common and fluid type, allowing seamless conversion of diverse data within the UCI ecosystem. Read more about xmessage [here](./packages/xmessage/README.md).

## packages/adapters

The `adapters` directory hosts plugin-like code responsible for enabling UCI to interact with multiple channels and providers. These adapters facilitate integration with various platforms, including but not limited to Gupshup, WhatsApp, Telegram Bot, Nodemailer, PWA, and more. Read more about adapters and how to create new adapters [here](./packages/adapters/README.md).

## packages/transformers

In the `transformers` directory, you'll find components that work on the [xstate](https://xstate.js.org/) library. These transformers govern the flow of a bot, applying rules and generating results based on prompts. They play a crucial role in orchestrating conversations within the UCI framework. Read more about transformers [here](./packages/transformers/README.md).
