import { DiscordProvider } from "./discord.provider";

describe("Discord adapter tests", () => {
  it("should trigger Discord provider correctly", async () => {
    const provider = new DiscordProvider({
      webhookUrl: "webhookUrl",
    });
    const spy = jest
      .spyOn(provider, "sendMessage")
      .mockImplementation(async () => {
        return {
          id: "12345",
          date: new Date().toISOString(),
        };
      });

    const data = {
      content: "chat message",
      webhookUrl: "webookUrl"
    };
    await provider.sendMessage(data);

    expect(spy).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith(data);
  });
});
