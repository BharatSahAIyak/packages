export type DiscordMessage = {
    channelId: string,
    guildId: string,
    id: string,
    createdTimestamp: number,
    type: number,
    system: boolean,
    content: string,
    author: {
        id: string,
        bot: boolean,
        system: boolean,
        username: string,
        globalname: null,
        discriminator: string,
        avatar: string
    }
    embeds: [],
    components: [],
    attachments: [],
    stickers: []
};


// I didn't Add all the properties of reply message, here's how it looks complete version looks like:
// Message {
//     channelId: '1217491337390198876',
//     guildId: '1217491336815706225',
//     id: '1218887873261076553',
//     createdTimestamp: 1710675914827,
//     type: 0,
//     system: false,
//     content: 'hi',
//     author: User {
//       id: '760182963907985438',
//       bot: false,
//       system: false,
//       flags: UserFlagsBitField { bitfield: 0 },
//       username: 'anam9167',
//       globalName: null,
//       discriminator: '0',
//       avatar: 'e4d1b2c0215b4143ec14a5e70bedc401',
//       banner: undefined,
//       accentColor: undefined,
//       avatarDecoration: null
//     },
//     pinned: false,
//     tts: false,
//     nonce: '1218887866420035584',
//     embeds: [],
//     components: [],
//     attachments: Collection(0) [Map] {},
//     stickers: Collection(0) [Map] {},
//     position: null,
//     roleSubscriptionData: null,
//     resolved: null,
//     editedTimestamp: null,
//     reactions: ReactionManager { message: [Circular *1] },
//     mentions: MessageMentions {
//       everyone: false,
//       users: Collection(0) [Map] {},
//       roles: Collection(0) [Map] {},
//       _members: null,
//       _channels: null,
//       _parsedUsers: null,
//       crosspostedChannels: Collection(0) [Map] {},
//       repliedUser: null
//     },
//     webhookId: null,
//     groupActivityApplication: null,
//     applicationId: null,
//     activity: null,
//     flags: MessageFlagsBitField { bitfield: 0 },
//     reference: null,
//     interaction: null
//   }