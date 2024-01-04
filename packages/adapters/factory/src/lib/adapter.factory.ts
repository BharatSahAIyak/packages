import {
    IEmailProvider,
    ISmsProvider,
    IChatProvider,
    IPushProvider
} from '@novu/stateless';
import { NodemailerProvider } from '../../../nodemailer/src';
import { MailgunEmailProvider } from '../../../mailgun/src';
import { MailjetEmailProvider } from '../../../mailjet/src';
import { MailtrapEmailProvider } from '../../../mailtrap/src';
import { TwilioSmsProvider } from '../../../twilio/src'
import { DiscordProvider } from '../../../discord/src';
import { SlackProvider } from '../../../slack/src';
import { TelegramBotProvider } from '../../../telegram/src';
import { GupshupWhatsappProvider } from '../../../gupshup-whatsapp/src';

import { GenericAdapterConfig } from './adapter.factory.config';


export enum AdapterType {
    EMAIL,
    SMS,
    CHAT,
    GUPSHUP_WHATSAPP
}

const emailTypes: string[] = [
    'NodeMailer',
    'MailgunEmail',
    'MailtrapEmail',
    'MailjetEmail',
];
const smsTypes: string[] = [
    'TwilioSms'
];
const chatTypes: string[] = [
    'Discord',
    'Slack',
    'TelegramBot'
];
const gupshupWhatsappType: string[] = [
    'GupshupWhatsapp'
];

// TODO: Extract GupshupWhatsappProvider into a more generic
// type of providers, that directly work on XMessage.
export class AdapterFactory {
    static getAdapter(
        consumerData: GenericAdapterConfig
    ): IEmailProvider | ISmsProvider | IChatProvider | IPushProvider | GupshupWhatsappProvider | undefined {
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
            case 'GupshupWhatsapp':
                return new GupshupWhatsappProvider(consumerData.config);
            default:
                return undefined;
        }
    }

    static getAdapterType(
        type: string
    ): AdapterType | undefined {
        if (emailTypes.includes(type)) {
            return AdapterType.EMAIL;
        }
        else if (smsTypes.includes(type)) {
            return AdapterType.SMS;
        }
        else if (chatTypes.includes(type)) {
            return AdapterType.CHAT;
        }
        else if (gupshupWhatsappType.includes(type)) {
            return AdapterType.GUPSHUP_WHATSAPP;
        }
        else {
            return undefined;
        }
    }
}