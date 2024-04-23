import { RecipeCompiler } from "./compiler";

// Contains redundant fields to match flowise output format
const mockLogicFlow = {
    "nodes": [
        {
            "data": {
                "id": "STT_0",
                "label": "STT",
                "name": "STT",
                "inputParams": [
                    {
                    "name": "model"
                    },
                    {
                    "name": "accessToken"
                    }
                ],
                "inputs": {
                    "speech": "",
                    "model": "xyz",
                    "accessToken": "aaaaa"
                }
            }
        },
        {
            "data": {
                "id": "Translation_0",
                "label": "Translation",
                "name": "Translation",
                "inputParams": [
                    {
                    "name": "text"
                    },
                    {
                    "name": "model"
                    },
                    {
                    "name": "accessToken"
                    },
                    {
                    "name": "sideEffects"
                    }
                ],
                "inputs": {
                    "text": "",
                    "model": "xyz",
                    "accessToken": "aaaaa",
                    "sideEffects": {
                        "Telemetry": {
                            "host": "TELEMETRY_HOST",
                        }
                    },
                }
            }
        },
        {
            "data": {
                "id": "TTS_0",
                "label": "TTS",
                "name": "TTS",
                "inputParams": [
                    {
                    "name": "text"
                    },
                    {
                    "name": "model"
                    },
                    {
                    "name": "accessToken"
                    }
                ],
                "inputs": {
                    "text": "",
                    "model": "xyz",
                    "accessToken": "aaaaa"
                }
            }
        },
        {
            "data": {
                "id": "STT_1",
                "label": "STT",
                "name": "STT",
                "inputParams": [
                    {
                    "name": "model"
                    },
                    {
                    "name": "accessToken"
                    }
                ],
                "inputs": {
                    "speech": "",
                    "model": "xyz",
                    "accessToken": "aaaaa"
                }
            }
        },
        {
            "data": {
                "id": "STT_2",
                "label": "STT",
                "name": "STT",
                "inputParams": [
                    {
                    "name": "model"
                    },
                    {
                    "name": "accessToken"
                    }
                ],
                "inputs": {
                    "speech": "",
                    "model": "xyz",
                    "accessToken": "aaaaa"
                }
            }
        },
        {
            "data": {
            "id": "RETRY_0",
            "label": "RETRY",
            "name": "RETRY",
            "inputParams": [
                {
                "name": "retry"
                },
                {
                "name": "delay"
                },
                {
                "name": "sideEffects"
                }
            ],
            "inputs": {
                "model": "xyz",
                "retry": "5",
                "delay": 10,
                "sideEffects": {
                    "CustomTelemetry": {
                        "eventId": "E000",
                        "host": "TELEMETRY_HOST",
                        "setters": {
                            "queryClass": "transformer.metaData.state"
                        }
                    }
                },
            }
            }
        },
        {
            "data": {
                "id": "CLASSIFIER_0",
                "label": "CLASSIFIER",
                "name": "CLASSIFIER",
                "inputParams": [
                    {
                    "name": "model"
                    },
                    {
                    "name": "supressLabel"
                    }
                ],
                "inputs": {
                    "model": "abcd",
                    "name": "supressLabel",
                    "abc": 10,
                }
            }
        },
    ],
    "edges": [
        {
            "source": "STT_0",
            "sourceHandle": "STT_0-output-onSuccess-xMessage",
            "target": "Translation_0",
            "targetHandle": "Translation-input-text-input",
            "type": "buttonedge",
            "id": "STT-STT-output-onSuccess-input-Translation-Translation-input-text-input",
            "data": {
            "label": ""
            }
        },
        {
            "source": "STT_0",
            "sourceHandle": "STT_0-output-onError-xMessage",
            "target": "TTS_0",
            "targetHandle": "Translation-input-text-input",
            "type": "buttonedge",
            "id": "STT-STT-output-onError-input-Translation-Translation-input-text-input",
            "data": {
            "label": ""
            }
        },
        {
            "source": "Translation_0",
            "sourceHandle": "STT_0-output-onSuccess-xMessage",
            "target": "STT_1",
            "targetHandle": "Translation-input-text-input",
            "type": "buttonedge",
            "id": "STT-STT-output-onError-input-Translation-Translation-input-text-input",
            "data": {
            "label": ""
            }
        },
        {
            "source": "TTS_0",
            "sourceHandle": "STT_0-output-onSuccess-xMessage",
            "target": "Translation_0",
            "targetHandle": "Translation-input-text-input",
            "type": "buttonedge",
            "id": "STT-STT-output-onError-input-Translation-Translation-input-text-input",
            "data": {
            "label": ""
            }
        },
        {
            "source": "TTS_0",
            "sourceHandle": "STT_0-output-onError-xMessage",
            "target": "RETRY_0",
            "targetHandle": "Translation-input-text-input",
            "type": "buttonedge",
            "id": "STT-STT-output-onError-input-Translation-Translation-input-text-input",
            "data": {
            "label": ""
            }
        },
        {
            "source": "RETRY_0",
            "sourceHandle": "STT_0-output-retry-xMessage",
            "target": "TTS_0",
            "targetHandle": "Translation-input-text-input",
            "type": "buttonedge",
            "id": "STT-STT-output-onError-input-Translation-Translation-input-text-input",
            "data": {
            "label": ""
            }
        },
        {
            "source": "STT_1",
            "sourceHandle": "STT_0-output-onSuccess-xMessage",
            "target": "CLASSIFIER_0",
            "targetHandle": "Translation-input-text-input",
            "type": "buttonedge",
            "id": "STT-STT-output-onError-input-Translation-Translation-input-text-input",
            "data": {
            "label": ""
            }
        },
        {
            "source": "STT_1",
            "sourceHandle": "STT_0-output-onError-xMessage",
            "target": "RETRY_0",
            "targetHandle": "Translation-input-text-input",
            "type": "buttonedge",
            "id": "STT-STT-output-onError-input-Translation-Translation-input-text-input",
            "data": {
            "label": ""
            }
        },
        {
            "source": "CLASSIFIER_0",
            "sourceHandle": "STT_0-output-label_0-xMessage",
            "target": "STT_2",
            "targetHandle": "Translation-input-text-input",
            "type": "buttonedge",
            "id": "STT-STT-output-onError-input-Translation-Translation-input-text-input",
            "data": {
            "label": ""
            }
        },
        {
            "source": "CLASSIFIER_0",
            "sourceHandle": "STT_0-output-label_1-xMessage",
            "target": "STT_2",
            "targetHandle": "Translation-input-text-input",
            "type": "buttonedge",
            "id": "STT-STT-output-onError-input-Translation-Translation-input-text-input",
            "data": {
            "label": ""
            }
        },
        {
            "source": "CLASSIFIER_0",
            "sourceHandle": "STT_0-output-label_2-xMessage",
            "target": "STT_1",
            "targetHandle": "Translation-input-text-input",
            "type": "buttonedge",
            "id": "STT-STT-output-onError-input-Translation-Translation-input-text-input",
            "data": {
            "label": ""
            }
        },
    ]
}

const mockLogicDef = {
    id: "abc",
    transformers: [
        {
            id: "STT_0",
            type: "STT",
            config: {
                model: "xyz",
                accessToken: "aaaaa",
            },
            states: {
                onSuccess: "Translation_0",
                onError: "TTS_0",
            },
        },
        {
            id: "Translation_0",
            type: "Translation",
            config: {
                text: "",
                model: "xyz",
                accessToken: "aaaaa",
            },
            states: {
                onSuccess: "STT_1",
            },
            sideEffects: {
                Telemetry: {
                    host: "TELEMETRY_HOST",
                }
            },
        },
        {
            id: "TTS_0",
            type: "TTS",
            config: {
                text: "",
                model: "xyz",
                accessToken: "aaaaa",
            },
            states: {
                onSuccess: "Translation_0",
                onError: "RETRY_0",
            },
        },
        {
            id: "STT_1",
            type: "STT",
            config: {
                model: "xyz",
                accessToken: "aaaaa",
            },
            states: {
            onSuccess: "CLASSIFIER_0",
            onError: "RETRY_0",
            },
        },
        {
            id: "STT_2",
            type: "STT",
            config: {
                model: "xyz",
                accessToken: "aaaaa",
            },
            states: {
            },
        },
        {
            id: "RETRY_0",
            type: "RETRY",
            config: {
                retry: "5",
                delay: 10,
            },
            states: {
                retry: "TTS_0",
            },
            sideEffects: {
                CustomTelemetry: {
                    eventId: "E000",
                    host: "TELEMETRY_HOST",
                    setters: {
                        "queryClass": "transformer.metaData.state"
                    }
                }
            }
        },
        {
            id: "CLASSIFIER_0",
            type: "CLASSIFIER",
            config: {
                model: "abcd",
            },
            states: {
                label_0: "STT_2",
                label_1: "STT_2",
                label_2: "STT_1",
            },
        },
    ],
}

describe(('RecipeCompiler test'), () => {
    let recipeCompiler: RecipeCompiler;

    beforeEach(() => {
        recipeCompiler = new RecipeCompiler();
    });

    it('Recipe to LogicDef conversion works as expected', async () => {
        // Ignore ts check to intentionally accept noisy data
        //@ts-ignore
        const logicDef = await recipeCompiler.compileLogic(mockLogicFlow);
        expect(logicDef.id).toBeDefined();
        logicDef.id = "abc";
        expect(logicDef).toStrictEqual(mockLogicDef);
    })
})
