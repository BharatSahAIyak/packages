import {
    IEmailProvider,
    ISmsProvider,
    IChatProvider,
    IPushProvider
} from '@novu/stateless';
import { NodemailerProvider } from '../nodemailer/src';
import { MailgunEmailProvider } from '../mailgun/src';
import { MailjetEmailProvider } from '../mailjet/src';
import { MailtrapEmailProvider } from '../mailtrap/src';
import { TwilioSmsProvider } from '../twilio/src'
import { DiscordProvider } from '../discord/src';
import { SlackProvider } from '../slack/src';
import { TelegramBotProvider } from '../telegram/src';
import { GenericAdapterConfig } from './adapter.factory.config';

export class AdapterFactory {
    static getAdapter(
        consumerData: GenericAdapterConfig
    ): IEmailProvider | ISmsProvider | IChatProvider | IPushProvider | undefined {
        switch (consumerData.type) {
            case 'NodeMailer':
                return new NodemailerProvider(consumerData.config);
            case 'MailgunEmail':
                return new MailgunEmailProvider(consumerData.config);
            case 'MailjetEmail':
                return new MailjetEmailProvider(consumerData.config);
            case 'MailtrapEmail':
                return new MailtrapEmailProvider(consumerData.config);
            case 'TwilioSms':
                return new TwilioSmsProvider(consumerData.config);
            case 'Discord':
                return new DiscordProvider();
            case 'Slack':
                return new SlackProvider();
            case 'TelegramBot':
                return new TelegramBotProvider(consumerData.config);
            default:
                return undefined;
        }
    }
}