export type PwaBotMessage = {
    conversationId: string,
    body: string,
    media: string,
    userId: string,
    appId: string,
    channel: string,
    from: string,
    context: string,
    to: string,
    messageId: string,
    identifier: string,
    asrId: string,
    pdfId?: string
    messageType?: string
    replyId?: string;
}