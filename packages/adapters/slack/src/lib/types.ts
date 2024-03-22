export type SlackUpdateMessage = {
    user: string; // The user ID of the sender
    type?: string; // The type of event, e.g., "message"
    ts: string; // The timestamp of the message
    text: string; // The text of the message
};