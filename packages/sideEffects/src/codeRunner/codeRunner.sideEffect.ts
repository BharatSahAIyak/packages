import { ISideEffect } from "../common/sideEffect.interface";
import { Events, SideEffectData } from "../common/sideEffect.types";
const ivm = require('isolated-vm');
import { XMessage } from "@samagra-x/xmessage";
import fetch from 'node-fetch';

const AcceptedEvents: string[] = [
    Events.DEFAULT_TRANSFORMER_END_EVENT
];

export class CodeRunnerSideEffect implements ISideEffect {
    constructor(private readonly config: Record<string, any>) {}

    static getName(): string {
        return "codeRunner";
    }

    static doesConsumeEvent(eventName: string): Boolean {
        return AcceptedEvents.includes(eventName);
    }

    async execute(sideEffectData: SideEffectData): Promise<boolean> {
        try {
            let xmsg = sideEffectData.eventData;
            if (!this.config?.code) {
                throw new Error('config.code is required');
            }
            if (!xmsg.transformer) {
                xmsg.transformer = {
                    metaData: {}
                };
            }
            const isolate = new ivm.Isolate({ memoryLimit: 64 });
            const context = isolate.createContextSync();
            const jail = context.global;
            jail.setSync('global', jail.derefInto());
            const xmsgCopy: Partial<XMessage> = { };
            xmsgCopy.payload = xmsg.payload;
            xmsgCopy.transformer = xmsg.transformer;
            const codeResult = context.evalClosureSync(
                this.config.code,
                [ 
                    JSON.stringify(xmsgCopy),
                    (url:string='',requestOptions:any={
                        method:'GET',
                        headers: {'Content-Type': 'application/json'}
                    }) => {
                        fetch(url, requestOptions)
                            .then((result) => {
                                if (!result.ok) {
                                    // Handle specific HTTP errors
                                    return result.json().then((errorResponse:any) => {
                                    throw new Error(
                                        `HTTP error! status: ${result.status}, message: ${errorResponse?.message || result.statusText}`
                                    );
                                    });
                                }
                                // Attempt to parse JSON response
                                return result.json().catch(() => {
                                    // If the response body is not JSON, handle it as plain text
                                    throw new Error('Response is not in JSON format');
                                });
                            })
                            .then((response) => {
                                // Successful response
                                console.log("CodeRunner sideEffect: REST API call response =", response);
                                return response; // You can return or use the response as needed
                            })
                            .catch((error) => {
                                // Handle network or other errors
                                console.error("CodeRunner sideEffect: Error while executing REST API call:", error.message || error);
                                throw error; // Re-throw if needed for further error handling
                            });
                    }
                ],
                { }
            );
            console.log('CodeRunner sideEffect return:', codeResult);
            return true;
        } catch (error) {
            console.error("Error while executing code runner side-effect", error);
            return false;
        }
    }

}
