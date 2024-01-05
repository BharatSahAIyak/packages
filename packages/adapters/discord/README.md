# Nodejs Discord Bot Provider

A discord bot provider library for [@samagra-x/uci-adapters-factory](https://github.com/PraVriShti/packages/tree/main/packages/adapters/discord)

Taken from: [@novu/stateless](https://github.com/novuhq/novu)

## Usage

```javascript
import { AdapterFactory } from '@samagra-x/uci-adapters-factory';

const adapter = AdapterFactory.getAdapter({
    type: 'Discord',
});

await adapter.sendMessage({
    webhookUrl: 'WEBHOOK',
    content: 'CONTENT',
});
```
