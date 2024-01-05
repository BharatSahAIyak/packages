# Nodejs Mailtrap Provider

A mailtrap email provider library for [@samagra-x/uci-adapters-factory](https://github.com/PraVriShti/packages/tree/main/packages/adapters/mailgun)

Taken from: [@novu/stateless](https://github.com/novuhq/novu)

## Usage

```javascript
import { AdapterFactory } from '@samagra-x/uci-adapters-factory';

const adapter = AdapterFactory.getAdapter({
    type: 'MailtrapEmail',
    config: {
      apiKey: process.env.MAILTRAP_API_KEY
    }
});
```
