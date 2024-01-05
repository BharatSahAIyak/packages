# Nodejs Custom SMTP Provider

A nodemailer email provider library for [@samagra-x/uci-adapters-factory](https://github.com/PraVriShti/packages/tree/main/packages/adapters/nodemailer)

Taken from: [@novu/stateless](https://github.com/novuhq/novu)

## Usage

```javascript
import { NodemailerProvider } from '@novu/nodemailer';

const adapter = AdapterFactory.getAdapter({
    type: 'NodeMailer',
    config: {
      from: process.env.NODEMAILER_FROM_EMAIL,
      host: process.env.NODEMAILER_HOST,
      user: process.env.NODEMAILER_USERNAME,
      password: process.env.NODEMAILER_PASSWORD,
      port: process.env.NODEMAILER_PORT,
      secure: process.env.NODEMAILER_SECURE,
    }
});
```

You can read more details of the different possible configurations in [Nodemailer documentation](https://nodemailer.com/smtp/#tls-options)
