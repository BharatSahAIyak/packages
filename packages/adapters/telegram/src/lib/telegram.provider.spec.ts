import { TelegramBotProvider } from './telegram.provider';

test('should trigger Discord provider correctly', async () => {
  const provider = new TelegramBotProvider({
    botToken: 'TEST_TOKEN'
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
    content: 'chat message',
  });
});
