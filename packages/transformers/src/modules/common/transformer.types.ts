export enum TransformerType {
    HTTP_POST = 'HTTP_POST',
    HTTP_GET = 'HTTP_GET',
    LABEL_CLASSIFIER = 'LABEL_CLASSIFIER',
    RANDOM_BINARY = 'RANDOM_BINARY',
    SIMPLE_RETRY = 'SIMPLE_RETRY',
    NEURAL_COREFERENCE = 'NEURAL_COREFERENCE',
    DOC_RETRIEVER = 'DOC_RETRIEVER',
    LLM = 'LLM',
    USER_FEEDBACK_LOOP = 'USER_FEEDBACK_LOOP',
    TRANSLATE = 'TRANSLATE',
    SQLLLM = 'SQLLLM',
    CODE_RUNNER = 'CODE_RUNNER',
}

export enum TransformerClass {
    GenericTransformer = 'GenericTransformer',
    IfElseTransformer = 'IfElseTransformer',
    SwitchCaseTransformer = 'SwitchCaseTransformer',
    RetryTransformer = 'RetryTransformer',
    StateRestoreTransformer = 'StateRestoreTransformer',
}

export const TransformerMapping: Record<TransformerType, TransformerClass> = {
    [TransformerType.HTTP_POST]: TransformerClass.GenericTransformer,
    [TransformerType.HTTP_GET]: TransformerClass.GenericTransformer,
    [TransformerType.LABEL_CLASSIFIER]: TransformerClass.SwitchCaseTransformer,
    [TransformerType.RANDOM_BINARY]: TransformerClass.IfElseTransformer,
    [TransformerType.SIMPLE_RETRY]: TransformerClass.RetryTransformer,
    [TransformerType.NEURAL_COREFERENCE]: TransformerClass.GenericTransformer,
    [TransformerType.DOC_RETRIEVER]: TransformerClass.IfElseTransformer,
    [TransformerType.LLM]: TransformerClass.GenericTransformer,
    [TransformerType.USER_FEEDBACK_LOOP]: TransformerClass.StateRestoreTransformer,
    [TransformerType.TRANSLATE]: TransformerClass.GenericTransformer,
    [TransformerType.SQLLLM]: TransformerClass.GenericTransformer,
    [TransformerType.CODE_RUNNER]: TransformerClass.GenericTransformer,
};
