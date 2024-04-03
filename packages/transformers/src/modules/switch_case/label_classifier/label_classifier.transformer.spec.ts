import { XMessage } from "@samagra-x/xmessage";
import { LabelClassifierTransformer } from "./label_classifier.transformer";

const mockHttpResponse = [
    { label: "LABEL_0", score: "0.8" },
    { label: "LABEL_1", score: "0.6" },
    { label: "LABEL_2", score: "0.3" }
];

jest.mock("../../generic", () => {
    return {
        HttpPostTransformer: jest.fn().mockImplementation(() => {
            return {
                transform: jest.fn().mockResolvedValue({
                    transformer: {
                        metaData: {
                            httpResponse: [mockHttpResponse] 
                        }
                    }
                })
            };
        })
    };
});

describe("LabelClassifierTransformer", () => {
    describe("constructor", () => {
        it("should create an instance of LabelClassifierTransformer with provided config", () => {
            const config = {
                url: "https://example.com/api",
                prompt: "test prompt",
                existingLabel: "LABEL_0",
                suppressionThreshold: 0.99,
                persistLabel: true
            };
            const transformer = new LabelClassifierTransformer(config);
            expect(transformer.config).toEqual(config);
        });
    });

    describe("transform", () => {
        it("should transform XMessage and set metaData.state based on API response", async () => {
            const config = {
                url: "https://example.com/api",
                prompt: "test prompt",
                existingLabel: "LABEL_0",
                suppressionThreshold: 0.99,
                persistLabel: true
            };
            const transformer = new LabelClassifierTransformer(config);
            const xmsg = new XMessage();

            await transformer.transform(xmsg);

            expect(xmsg.transformer!.metaData!.state).toEqual("LABEL_0");
        });

        it("should handle case when no labels pass minimumThreshold", async () => {
            const config = {
                url: "https://example.com/api",
                prompt: "test prompt",
                minimumThreshold: 0.9
            };
            const transformer = new LabelClassifierTransformer(config);
            const xmsg = new XMessage();

            await transformer.transform(xmsg);

            expect(xmsg.transformer!.metaData!.state).toEqual("STATE_NOT_AVAILABLE");
        });

    });
});