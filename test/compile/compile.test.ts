import {Compiler} from "../../src/compile/compile";
import {exists} from "../../src/util/fs";
import {unlink} from "node:fs/promises";

describe('Compiler', () => {

    it('should build a new instance of Compiler', async () => {
        const compiler = Compiler.build();

        await compiler.compile({
            entries: [{
                baseDir: 'test/compile',
                outputDir: 'test/compile/css',
                filenames: /\.scss$/
            }]
        });

        expect(compiler).toBeInstanceOf(Compiler);

        expect(await exists('test/compile/css')).toBe(true);
        expect(await exists('test/compile/css/test.css')).toBe(true);

        await unlink('test/compile/test.scss');

        expect(await exists('test/compile/test.scss')).toBe(false);
        expect(await exists('test/compile/css/test.css')).toBe(true);

        await compiler.compile({
            entries: [{
                baseDir: 'test/compile',
                outputDir: 'test/compile/css',
                filenames: /\.scss$/
            }]
        });

        expect(await exists('test/compile/css/test.css')).toBe(false);
    });
});