import { MessageState, MessageType, XMessage } from "@samagra-x/xmessage";
import { SwitchCaseTransformer } from "./switch-case.transformer";

const eventBus = {
    pushEvent: jest.fn()
}

const xmsg = {
    messageType: MessageType.TEXT,
    messageId: {
        Id: "4305161194925220864-131632492725500592",
        channelMessageId: "4305161194925220864-131632492725500592",
    },
    to: {
        userID: "9999999999",
    },
    from: {
        userID: "admin",
        bot: true,
        meta: new Map(Object.entries({
            botMobileNumber: "919999999999",
        })),
    },
    channelURI: "",
    providerURI: "",
    timestamp: 4825,
    messageState: MessageState.REPLIED,
    payload: {
        text: "Testing bot",
    },
    transformer: {
        metaData: {
          value: 'test'
        }
    }
};

describe("SwitchCaseTransformer", () => {
    describe("constructor", () => {
        it("should create an instance of SwitchCaseTransformer with provided config", () => {
            const config = {
                target: 'transformer.metaData.value',
                eventBus
            };
            const transformer = new SwitchCaseTransformer(config);
            expect(transformer.config).toEqual(config);
        });
    });

    describe("transform", () => {
        it("should transform XMessage and set metaData.state based on target key value", async () => {
            const config = {
                target: 'transformer.metaData.value',
                eventBus
            };
            const transformer = new SwitchCaseTransformer(config);

            const stateXmsg = await transformer.transform(xmsg);

            expect(stateXmsg.transformer!.metaData!.state).toEqual("test");
        });

        it("should handle case when target is not found", async () => {
            const config = {
                target: 'transformer.metaData.notFound',
                eventBus
            };
            const transformer = new SwitchCaseTransformer(config);
            const stateXmsg = await transformer.transform(xmsg);
            expect(stateXmsg.transformer!.metaData!.state).toEqual("STATE_NOT_AVAILABLE");
        });

        it("should handle case when no target is passed", async () => {
            const config = {
                target: undefined,
                eventBus
            };
            const transformer = new SwitchCaseTransformer(config);
            const stateXmsg = await transformer.transform(xmsg);
            expect(stateXmsg.transformer!.metaData!.state).toEqual("Testing bot");
        });

    });
});