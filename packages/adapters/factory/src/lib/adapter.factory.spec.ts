import { DiscordProvider } from '@samagra-x/uci-adapters-discord';
import { MailgunEmailProvider } from '@samagra-x/uci-adapters-mailgun';
import { MailjetEmailProvider } from '@samagra-x/uci-adapters-mailjet';
import { MailtrapEmailProvider } from '@samagra-x/uci-adapters-mailtrap';
import { NodemailerProvider } from '@samagra-x/uci-adapters-nodemailer';
import { SlackProvider } from '@samagra-x/uci-adapters-slack';
import { TelegramBotProvider } from '@samagra-x/uci-adapters-telegram-bot';
import { TwilioSmsProvider } from '@samagra-x/uci-adapters-twilio-sms';
import { AdapterFactory } from './adapter.factory';

describe('Adaptor Factory Test', () => {

    it('NodeMailer Factory test', async () => {
        const adapter = AdapterFactory.getAdapter({
            type: 'NodeMailer',
            config: {
                from: 'test@gmail.com',
                host: 'smtp.gmail.com',
                port: 465,
                user: 'test@gmail.com',
                password: 'testpass',
            }
        });

        expect(adapter instanceof NodemailerProvider).toBeTruthy();

        const spy = jest
        .spyOn(adapter!, 'sendMessage')
        .mockImplementation(async () => {
            return {
                id: 'TEST_ID',
                date: 'TEST_DATE'
            };
        });

        const res = await adapter?.sendMessage({
            //@ts-ignore
            to: ['test@gmail.com'],
            html: 'Test Mail',
            subject: 'Testing'
        });

        expect(spy).toHaveBeenCalled();
        expect(spy).toHaveBeenCalledWith({
            to: ['test@gmail.com'],
            html: 'Test Mail',
            subject: 'Testing'
        });
        expect(res).toStrictEqual({
            id: 'TEST_ID',
            date: 'TEST_DATE'
        });
    })

    it('MailgunEmail Factory test', async () => {
        const adapter = AdapterFactory.getAdapter({
            type: 'MailgunEmail',
            config: {
                apiKey: 'TEST_API_KEY',
                username: 'test@gmail.com',
                domain: 'sandboxtest.mailgun.org',
                from: 'test@gmail.com'
            }
        });

        expect(adapter instanceof MailgunEmailProvider).toBeTruthy();

        const spy = jest
        .spyOn(adapter!, 'sendMessage')
        .mockImplementation(async () => {
            return {
                id: 'TEST_ID',
                date: 'TEST_DATE'
            };
        });

        const res = await adapter?.sendMessage({
            //@ts-ignore
            to: ['test@gmail.com'],
            html: 'Test Mail',
            subject: 'Testing'
        });

        expect(spy).toHaveBeenCalled();
        expect(spy).toHaveBeenCalledWith({
            to: ['test@gmail.com'],
            html: 'Test Mail',
            subject: 'Testing'
        });
        expect(res).toStrictEqual({
            id: 'TEST_ID',
            date: 'TEST_DATE'
        });
    })

    it('MailjetEmail Factory test', async () => {
        const adapter = AdapterFactory.getAdapter({
            type: 'MailjetEmail',
            config: {
                apiKey: 'API_KEY',
                apiSecret: 'API_SECRET',
                from: 'test@gmail.com',
                senderName: 'Test User'
            }
        });

        expect(adapter instanceof MailjetEmailProvider).toBeTruthy();

        const spy = jest
        .spyOn(adapter!, 'sendMessage')
        .mockImplementation(async () => {
            return {
                id: 'TEST_ID',
                date: 'TEST_DATE'
            };
        });

        const res = await adapter?.sendMessage({
            //@ts-ignore
            to: ['test@gmail.com'],
            html: 'Test Mail',
            subject: 'Testing'
        });

        expect(spy).toHaveBeenCalled();
        expect(spy).toHaveBeenCalledWith({
            to: ['test@gmail.com'],
            html: 'Test Mail',
            subject: 'Testing'
        });
        expect(res).toStrictEqual({
            id: 'TEST_ID',
            date: 'TEST_DATE'
        });
    })

    it('MailtrapEmail Factory test', async () => {
        const adapter = AdapterFactory.getAdapter({
            type: 'MailtrapEmail',
            config: {
                apiKey: 'API_KEY',
                from: 'test@gmail.com',
            }
        });

        expect(adapter instanceof MailtrapEmailProvider).toBeTruthy();

        const spy = jest
        .spyOn(adapter!, 'sendMessage')
        .mockImplementation(async () => {
            return {
                id: 'TEST_ID',
                date: 'TEST_DATE'
            };
        });

        const res = await adapter?.sendMessage({
            //@ts-ignore
            to: ['test@gmail.com'],
            html: 'Test Mail',
            subject: 'Testing'
        });

        expect(spy).toHaveBeenCalled();
        expect(spy).toHaveBeenCalledWith({
            to: ['test@gmail.com'],
            html: 'Test Mail',
            subject: 'Testing'
        });
        expect(res).toStrictEqual({
            id: 'TEST_ID',
            date: 'TEST_DATE'
        });
    })

    it('TwilioSmsProvider Factory test', async () => {
        const adapter = AdapterFactory.getAdapter({
            type: 'TwilioSms',
            config: {
                accountSid: 'ACTEST',
                authToken: 'AUTH_TOKEN',
                from: '+14999999999',
            }
        });
 
        expect(adapter instanceof TwilioSmsProvider).toBeTruthy();

        const spy = jest
        .spyOn(adapter!, 'sendMessage')
        .mockImplementation(async () => {
            return {
                id: 'TEST_ID',
                date: 'TEST_DATE'
            };
        });

        const res = await adapter?.sendMessage({
            //@ts-ignore
            to: '+919999999999',
            content: 'This Message',
        });

        expect(spy).toHaveBeenCalled();
        expect(spy).toHaveBeenCalledWith({
            to: '+919999999999',
            content: 'This Message',
        });
        expect(res).toStrictEqual({
            id: 'TEST_ID',
            date: 'TEST_DATE'
        });
    })

    it('DiscordProvider Factory test', async () => {
        const adapter = AdapterFactory.getAdapter({
            type: 'Discord',
        });
 
        expect(adapter instanceof DiscordProvider).toBeTruthy();

        const spy = jest
        .spyOn(adapter!, 'sendMessage')
        .mockImplementation(async () => {
            return {
                id: 'TEST_ID',
                date: 'TEST_DATE'
            };
        });

        //@ts-ignore
        const res = await adapter?.sendMessage({
            webhookUrl: 'TEST_WEBHOOK',
            content: 'TEST_CONTENT',
        });

        expect(spy).toHaveBeenCalled();
        expect(spy).toHaveBeenCalledWith({
            webhookUrl: 'TEST_WEBHOOK',
            content: 'TEST_CONTENT',
        });
        expect(res).toStrictEqual({
            id: 'TEST_ID',
            date: 'TEST_DATE'
        });
    })

    it('SlackProvider Factory test', async () => {
        const adapter = AdapterFactory.getAdapter({
            type: 'Slack',
        });
 
        expect(adapter instanceof SlackProvider).toBeTruthy();

        const spy = jest
        .spyOn(adapter!, 'sendMessage')
        .mockImplementation(async () => {
            return {
                id: 'TEST_ID',
                date: 'TEST_DATE'
            };
        });

        //@ts-ignore
        const res = await adapter?.sendMessage({
            webhookUrl: 'TEST_WEBHOOK',
            content: 'TEST_CONTENT',
        });

        expect(spy).toHaveBeenCalled();
        expect(spy).toHaveBeenCalledWith({
            webhookUrl: 'TEST_WEBHOOK',
            content: 'TEST_CONTENT',
        });
        expect(res).toStrictEqual({
            id: 'TEST_ID',
            date: 'TEST_DATE'
        });
    })

    it('TelegramBotProvider Factory test', async () => {
        const adapter = AdapterFactory.getAdapter({
            type: 'TelegramBot',
            config: {
                botToken: 'TEST_BOT_TOKEN'
            }
        });
 
        expect(adapter instanceof TelegramBotProvider).toBeTruthy();

        const spy = jest
        .spyOn(adapter!, 'sendMessage')
        .mockImplementation(async () => {
            return {
                id: 'TEST_ID',
                date: 'TEST_DATE'
            };
        });

        //@ts-ignore
        const res = await adapter?.sendMessage({
            channel: '9999999',
            content: 'TEST_CONTENT',
        });

        expect(spy).toHaveBeenCalled();
        expect(spy).toHaveBeenCalledWith({
            channel: '9999999',
            content: 'TEST_CONTENT',
        });
        expect(res).toStrictEqual({
            id: 'TEST_ID',
            date: 'TEST_DATE'
        });
    })
})
