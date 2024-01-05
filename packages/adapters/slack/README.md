# Nodejs Slack Bot Provider

A slack bot provider library for [@samagra-x/uci-adapters-factory](https://github.com/PraVriShti/packages/tree/main/packages/adapters/slack)

Taken from: [@novu/stateless](https://github.com/novuhq/novu)

## Usage

```javascript
import { AdapterFactory } from '@samagra-x/uci-adapters-factory';

const adapter = AdapterFactory.getAdapter({
    type: 'Slack',
});

await adapter.sendMessage({
    webhookUrl: 'WEBHOOK',
    content: 'CONTENT',
});
```
