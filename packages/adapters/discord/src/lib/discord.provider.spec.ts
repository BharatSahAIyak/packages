import { DiscordProvider } from "./discord.provider";
import { DiscordBotProviderConfig } from "./discord.bot.config";
import axios from "axios";
import * as fs from "fs";
import * as path from "path";
import { IChatOptions } from "@novu/stateless";
import { v4 as uuidv4 } from "uuid";
import FormData from "form-data";

jest.mock("axios");
jest.mock("fs");
jest.mock("uuid", () => ({
  v4: jest.fn(),
}));

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedFs = fs as jest.Mocked<typeof fs>;
const mockedUuidv4 = uuidv4 as jest.Mock;

describe("Discord adapter tests", () => {
  let discordProvider: DiscordProvider;
  const config: DiscordBotProviderConfig = {
    webhookUrl: "https://discord.com/api/webhooks/1234567890/abcdefg",
  };

  beforeEach(() => {
    discordProvider = new DiscordProvider(config);
  });

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
      webhookUrl: "webookUrl",
    };
    await provider.sendMessage(data);

    expect(spy).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith(data);
  });

  it("should send a message with content length <= 2000", async () => {
    const data: IChatOptions = {
      content: "Test message",
      webhookUrl:
        "https://discord.com/api/webhooks/1234567890/abcdefg?wait=true",
    };
    const response = {
      data: {
        id: "123456",
        timestamp: "2024-07-16T12:34:56.789Z",
      },
    };
    mockedAxios.post.mockResolvedValue(response);
    const result = await discordProvider.sendMessage(data);
    expect(mockedAxios.post).toHaveBeenCalledWith(
      "https://discord.com/api/webhooks/1234567890/abcdefg?wait=true",
      {
        content: data.content,
      }
    );
    expect(result).toEqual({
      id: response.data.id,
      date: response.data.timestamp,
    });
  });

  it("should send a message with content length > 2000", async () => {
    const longContent = "a".repeat(2001);
    const data: IChatOptions = {
      content: longContent,
      webhookUrl:
        "https://discord.com/api/webhooks/1234567890/abcdefg?wait=true",
    };

    const response = {
      data: {
        id: "654321",
        timestamp: "2024-07-16T12:34:56.789Z",
      },
    };

    const tempFilePath = path.join(__dirname, "test-uuid.txt");
    mockedUuidv4.mockReturnValue("test-uuid");
    mockedFs.writeFileSync.mockImplementation();
    mockedFs.createReadStream.mockReturnValue("fake-stream" as any);
    mockedAxios.create.mockReturnThis();
    mockedAxios.post.mockResolvedValue(response);
    mockedFs.unlinkSync.mockImplementation();
    const appendMock = jest.fn();
    const getHeadersMock = jest.fn()
      .mockReturnValue({ "Content-Type": "multipart/form-data" });
    jest.spyOn(FormData.prototype, "append").mockImplementation(appendMock);
    jest
      .spyOn(FormData.prototype, "getHeaders")
      .mockImplementation(getHeadersMock);

    const result = await discordProvider.sendMessage(data);

    expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
      tempFilePath,
      data.content,
      "utf-8"
    );
    expect(appendMock).toHaveBeenCalledWith("file", "fake-stream");
    expect(mockedAxios.post).toHaveBeenCalledWith(
      "https://discord.com/api/webhooks/1234567890/abcdefg?wait=true",
      expect.any(FormData),
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    expect(mockedFs.unlinkSync).toHaveBeenCalledWith(tempFilePath);

    expect(result).toEqual({
      id: response.data.id,
      date: response.data.timestamp,
    });
  });

  it("should throw an error if the response is not received", async () => {
    const data: IChatOptions = {
      content: "Test message",
      webhookUrl:
        "https://discord.com/api/webhooks/1234567890/abcdefg?wait=true",
    };

    mockedAxios.create.mockReturnThis();
    mockedAxios.post.mockRejectedValue(
      new Error("Failed to get a response from the server")
    );

    await expect(discordProvider.sendMessage(data)).rejects.toThrow(
      "Failed to get a response from the server"
    );
  });
});
