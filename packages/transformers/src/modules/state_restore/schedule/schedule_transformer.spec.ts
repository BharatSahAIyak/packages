import { XMessage } from "@samagra-x/xmessage";
import { ScheduleTransformer } from "./schedule_transformer";

jest.useFakeTimers();

describe('ScheduleTransformer', () => {
    let transformer: ScheduleTransformer;
    let xmsg: XMessage;

    beforeEach(() => {
        xmsg = {
            from: { userID: '9999999999' },
            channelURI: 'whatsapp',
            providerURI: 'gupshup',
            payload: { text: 'Initial message' },
            transformer: { metaData: {} }
        } as XMessage;

        transformer = new ScheduleTransformer({
            timerDuration: 5000,
            resetOnReply: true,
            resetState: 'resetState'
        });

        jest.spyOn(global, 'setTimeout');
        jest.spyOn(global, 'clearTimeout');
    });

    afterEach(() => {
        jest.clearAllTimers();
        jest.restoreAllMocks();
        ScheduleTransformer['timers'].clear();
    });

    it('should set a timer when transform is called', async () => {
        await transformer.transform(xmsg);

        expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 5000);
        const timerId = `timer_${xmsg.from.userID}_${xmsg.channelURI}_${xmsg.providerURI}`;
        expect(ScheduleTransformer['timers'].has(timerId)).toBe(true);
    });

    it('should clear existing timer and set a new one if transform is called again', async () => {
        await transformer.transform(xmsg);

        const timerId = `timer_${xmsg.from.userID}_${xmsg.channelURI}_${xmsg.providerURI}`;
        expect(ScheduleTransformer['timers'].has(timerId)).toBe(true);

        await transformer.transform(xmsg);

        expect(clearTimeout).toHaveBeenCalled();
        expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 5000);
        expect(ScheduleTransformer['timers'].has(timerId)).toBe(true);
    });

    it('should restore to resetState if resetOnReply is true', async () => {
        xmsg.transformer!.metaData!.restoreState = 'restoreState';

        await transformer.transform(xmsg);
        await transformer.transform(xmsg);

        expect(xmsg.transformer!.metaData!.state).toBe('resetState');
    });

    it('should restore state to restoreState if resetOnReply is false', async () => {
        transformer = new ScheduleTransformer({
            timerDuration: 5000,
            resetOnReply: false
        });

        xmsg.transformer!.metaData!.restoreState = 'restoreState';

        await transformer.transform(xmsg);
        jest.runAllTimers();

        expect(xmsg.transformer!.metaData!.state).toBe('restoreState');
    });

    it('should return xmsg after the timer completes', async () => {
        const completedMsg = await transformer.transform(xmsg);

        // Fast forward time to trigger the timer
        jest.runAllTimers();

        expect(completedMsg).toBe(xmsg);
    });
});
