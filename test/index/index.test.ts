describe('Main Compiler', () => {
    it('should init compiler', async () => {
        require('../../src/index');
        await new Promise(resolve => setTimeout(resolve, 1000));
    });
});