describe('Main Compiler', () => {
    it('should init compiler', async () => {
        const originalArgv = process.argv;
        process.argv = [
            'node',
            'script.js',
            '--config=test/index/config.js',
            '--watch',
            '--verbose'
        ];

        await import('../../src/index');
        await new Promise(resolve => setTimeout(resolve, 1000));

        process.argv = originalArgv
    });
});