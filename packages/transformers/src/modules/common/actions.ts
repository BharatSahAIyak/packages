import { assign } from 'xstate';

const sendDiscordAlert = async (context: any,event: any) => {
 return "dicordAlertSent"
}

const recordError = assign<any, any>((context, event) => {
    return {
    ...context,
    error: event
  }})

export default {
    sendDiscordAlert,
    recordError
}