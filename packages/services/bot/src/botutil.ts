type JsonNode = Record<string, any>;

export class BotUtil {
  public static botEnabledStatus: string = 'enabled';
  public static botLiveStatus: string = 'live';

  public static adminUserId: string = 'admin';
  public static transformerTypeBroadcast: string = 'broadcast';
  public static transformerTypeGeneric: string = 'generic';

  /**
   * Get true if bot is valid else invalid message, from JSON node data
   * @param data
   * @return
   */
  public static getBotValidFromJsonNode(data: JsonNode): string {
    const status: string = data['status'].toString();
    const startDate: string = data['startDate'].toString();
    const endDate: string = data['endDate'].toString();

    console.log(`Bot Status: ${status}, Start Date: ${startDate}, End Date: ${endDate}`);

    return BotUtil.getBotValid(status, startDate, endDate);
  }

  /**
   * Get true if bot is valid else invalid message, by status, start date & end date
   * @param status
   * @param startDate
   * @param endDate
   * @return
   */
  public static getBotValid(status: string, startDate: string, endDate: string): string {
    if (!BotUtil.checkBotLiveStatus(status)) {
      return `This conversation is not active yet. Please contact your state admin to seek help with this.`;
    } else if (startDate == null || startDate === 'null' || startDate === '') {
      console.log('Bot start date is empty.');
      return `This conversation is not active yet. Please contact your state admin to seek help with this.`;
    } else if (!BotUtil.checkBotStartDateValid(startDate)) {
      if (startDate == null || startDate === 'null' || startDate === '') {
        return `This conversation is not active yet. It will be enabled on ${startDate}. Please try again then.`;
      }
      return `This conversation is not active yet. Please try again then.`;
    } else if (!BotUtil.checkBotEndDateValid(endDate)) {
      return `This conversation has expired now. Please contact your state admin to seek help with this.`;
    }
    return 'true';
  }

  /**
   * Check if bot is valid or not, by JSON node data
   * @param data
   * @return
   */
  public static checkBotValidFromJsonNode(data: JsonNode): boolean {
    const status: string = data['status']?.toString();
    const startDate: string = data['startDate']?.toString();
    const endDate: string = data['endDate']?.toString();

    console.log(`Bot Status: ${status}, Start Date: ${startDate}, End Date: ${endDate}`);

    return BotUtil.checkBotValid(status, startDate, endDate);
  }

  /**
   * Check if bot is valid or not, by status, start date & end date
   * @param status
   * @param startDate
   * @param endDate
   * @return
   */
  public static checkBotValid(status: string, startDate: string, endDate: string): boolean {
    return (
      BotUtil.checkBotLiveStatus(status) &&
      BotUtil.checkBotStartDateValid(startDate) &&
      BotUtil.checkBotEndDateValid(endDate) &&
      !(startDate == null || startDate === 'null' || startDate === '')
    );
  }

  /**
   * Check if bot' status is live/enabled
   * @param status
   * @return
   */
  public static checkBotLiveStatus(status: string): boolean {
    status = status.toLowerCase();
    if (status === BotUtil.botLiveStatus || status === BotUtil.botEnabledStatus) {
      return true;
    }
    console.log('Bot is invalid as its status is not live or enabled.');
    return false;
  }

  /**
   * Check if bot's start date is valid (Should be less than or equal to the current date)
   * @param startDate
   * @return
   */
  public static checkBotStartDateValid(startDate: string): boolean {
    try {
      const currentDate = new Date();
      const botStartDate = new Date(startDate);

      return currentDate >= botStartDate;
    } catch (error: any) {
      console.error('Error in checkBotStartDateValid:', error);
    }
    return false;
  }

  /**
   * Check if bot's end date is valid (Should be empty OR greater than or equal to the current date)
   * @param endDate
   * @return
   */
  public static checkBotEndDateValid(endDate: string): boolean {
    try {
      if (endDate == null || endDate === 'null' || endDate === '') {
        console.log('Bot end date is empty.');
        return true;
      }

      const currentDate = new Date();
      const botEndDate = new Date(endDate);
      botEndDate.setHours(23, 59, 59); // Set end date to the end of the day

      return currentDate < botEndDate;
    } catch (error: any) {
      console.error('Error in checkBotEndDateValid:', error);
    }
    return false;
  }
  /**
 * Get value by key from bot json node
 * @param botNode
 * @param key
 * @return
 */
public static getBotNodeData = (botNode: JsonNode, key: string): string | null => {
  if (botNode[key] !== undefined && botNode[key] !== null && typeof botNode[key] === 'string' && botNode[key] !== 'null' && botNode[key] !== '') {
    return botNode[key];
  }
  return null;
};
}
