export type SlackUpdateMessage = {
date: number,
 type: string; // The type of event, e.g., "message"
 user: string; // The user ID of the sender
 text: string; // The text of the message
 ts: string; // The timestamp of the message
 channel: string; // The ID of the channel where the message was sent
};