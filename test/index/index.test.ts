describe('Main Compiler', () => {
    it('should init compiler', async () => {
        await import('../../src/index');
        await new Promise(resolve => setTimeout(resolve, 1000));
    });
});