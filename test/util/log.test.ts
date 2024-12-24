import { log } from '../../src/util/log';

describe('Util Log tests', () => {
    it('trow error on log not initialized', () => {
        expect(() => {
            log('test');
        }).toThrow('Log not initialized');
    });
});