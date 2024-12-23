import {Options} from "../../src/options/options";

describe("Tests for compiler options", () => {

    it('should parse default options', async () => {
        const options = Options.build();

        expect(options.watch).toBe(false);
        expect(options.verbose).toBe(false);
        expect(options.config).toBe(undefined);
    });

    it('should parse options with arguments', async () => {
        const originalArgv = process.argv;
        process.argv = [
            'node',
            'script.js',
            '--config=config.json',
            '--watch',
            '--verbose'
        ];

        const options = Options.build();

        expect(options.watch).toBe(true);
        expect(options.verbose).toBe(true);
        expect(options.config).toBe('config.json');

        process.argv = originalArgv;
    });
});