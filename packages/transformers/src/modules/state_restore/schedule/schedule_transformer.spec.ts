import { XMessage } from "@samagra-x/xmessage";
import { ScheduleTransformer } from "./schedule_transformer";

jest.useFakeTimers();

describe('ScheduleTransformer', () => {
    let transformer: ScheduleTransformer;
    let xmsg: XMessage;

    beforeEach(() => {
        xmsg = {
            from: { userID: '9999999999' },
            payload: { text: 'Initial message' },
            transformer: { metaData: {} }
        } as XMessage;

        transformer = new ScheduleTransformer({
            timerDuration: 5000,
            immediateRestore: true
        });

        jest.spyOn(global, 'clearTimeout');
        jest.spyOn(global, 'setTimeout');
    });

    afterEach(() => {
        jest.clearAllTimers();
        jest.restoreAllMocks();
    });

    it('should set a timer when transform is called', async () => {
        await transformer.transform(xmsg);

        expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 5000);
        expect(transformer['timers'].has('9999999999_timer')).toBe(true);
    });

    it('should clear existing timer and set a new one if transform is called again', async () => {
        await transformer.transform(xmsg);
        expect(transformer['timers'].has('9999999999_timer')).toBe(true);

        await transformer.transform(xmsg);

        expect(clearTimeout).toHaveBeenCalled();
        expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 5000);
        expect(transformer['timers'].has('9999999999_timer')).toBe(true);
    });

    it('should restore state if immediateRestore is true', async () => {
        xmsg.transformer!.metaData!.restoreState = 'restoredState';

        await transformer.transform(xmsg);
        await transformer.transform(xmsg); // stimulating flow execution after second xmessage

        expect(xmsg.transformer!.metaData!.state).toBe('restoredState');
    });

    it('should not restore state if immediateRestore is false', async () => {
        transformer = new ScheduleTransformer({
            timerDuration: 5000,
            immediateRestore: false
        });

        xmsg.transformer!.metaData!.restoreState = 'restoredState';

        await transformer.transform(xmsg);

        expect(xmsg.transformer!.metaData!.state).toBeUndefined();
    });

    it('should return xmsg after the timer completes', async () => {
        const completedMsg = await transformer.transform(xmsg);

        // Fast forward time to trigger the timer
        jest.runAllTimers();

        expect(completedMsg).toBe(xmsg);
    });
});
