import { DiscordProvider } from './discord.provider';

describe("Discord adapter tests", async () => {
  it('should trigger Discord provider correctly', async () => {
    const provider = new DiscordProvider({
      webhookUrl: 'webhookUrl',
    });
    const spy = jest
      .spyOn(provider, 'sendMessage')
      .mockImplementation(async () => {
        return {
          dateCreated: new Date(),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any;
      });
    //@ts-ignore
    await provider.sendMessage({
      content: 'chat message',
    });

    expect(spy).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith({
      webhookUrl: 'webhookUrl',
      content: 'chat message',
    });
  });
})
