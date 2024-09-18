import { ISideEffect } from "../common/sideEffect.interface";
import { Events, SideEffectData } from "../common/sideEffect.types";
const ivm = require('isolated-vm');
import { XMessage } from "@samagra-x/xmessage";

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
                [ JSON.stringify(xmsgCopy) ],
                {
                    arguments: { 
                        fetch: new ivm.Reference(async (url: string) => {
                          // Perform fetch in the main Node.js environment
                          const response = await fetch(url);
                          const contentType = response.headers.get('content-type');
                          let data;
                          
                          // Check the content type and parse accordingly
                          if (contentType && contentType.includes('application/json')) {
                            data = await response.json();
                          } else {
                            data = await response.text();
                          }
                          
                          return data; // Return the parsed data to the VM
                        }),
                      },
                      result: { promise: true } // Ensure we return promises
                }
            );
            console.log('CodeRunner sideEffect return:',codeResult);
            return true;
        } catch (error) {
            console.error("Error while executing code runner side-effect", error);
            return false;
        }
    }

}
