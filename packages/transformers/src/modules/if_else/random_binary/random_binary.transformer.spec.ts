import { XMessage } from "@samagra-x/xmessage";
import { RandomBinaryTransformer } from "./random_binary.transformer";

describe("RandomBinaryTransformer", () => {
    describe("transform", () => {
        it("should generate 'if' or 'else' state randomly and attach it to metaData.state", async () => {
            const transformer = new RandomBinaryTransformer({});
            const xmsg = new XMessage();
            await transformer.transform(xmsg);
            expect(xmsg.transformer!.metaData!.state).toMatch(/^(if|else)$/);
        });

        it("should attach 'if' state when Math.random() > 0.5", async () => {
            jest.spyOn(Math, "random").mockReturnValue(0.6);
            const transformer = new RandomBinaryTransformer({});
            const xmsg = new XMessage();
            await transformer.transform(xmsg);
            expect(xmsg.transformer!.metaData!.state).toEqual("if");
            jest.restoreAllMocks();
        });

        it("should attach 'else' state when Math.random() <= 0.5", async () => {
            jest.spyOn(Math, "random").mockReturnValue(0.4);
            const transformer = new RandomBinaryTransformer({});
            const xmsg = new XMessage();
            await transformer.transform(xmsg);
            expect(xmsg.transformer!.metaData!.state).toEqual("else");
            jest.restoreAllMocks();
        });
    });
});