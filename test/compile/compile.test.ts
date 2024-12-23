import {Compiler} from "../../src/compile/compile";
import {exists} from "../../src/util/fs";
import {unlink, rm, writeFile, mkdir} from "node:fs/promises";
import {Log} from "../../src/util/log";

const scssContent = `
    body {
      .my-class {
        color: #000000;
      }
    }
`;

describe('Compiler', () => {

    beforeEach(async () => {
        Log.init({
            verbose: true
        });
        await mkdir('test/compile/scss', {
            recursive: true
        });
        await writeFile('test/compile/scss/test.scss', scssContent);
    });

    it('should build a new instance of Compiler', async () => {
        const compiler = Compiler.build();

        await compiler.compile({
            entries: [{
                baseDir: 'test/compile/scss',
                outputDir: 'test/compile/css/v1',
                filenames: /\.scss$/
            }]
        });

        expect(compiler).toBeInstanceOf(Compiler);

        expect(await exists('test/compile/css/v1')).toBe(true);
        expect(await exists('test/compile/css/v1/test.css')).toBe(true);

        await unlink('test/compile/scss/test.scss');

        expect(await exists('test/compile/scss//test.scss')).toBe(false);
        expect(await exists('test/compile/css/v1/test.css')).toBe(true);

        await compiler.compile({
            entries: [{
                baseDir: 'test/compile/scss',
                outputDir: 'test/compile/css/v1',
                filenames: /\.scss$/
            }]
        });

        expect(await exists('test/compile/css/v1/test.css')).toBe(false);

        await compiler.stop();
    });

    it('should build a new instance of Compiler with watch option', async () => {
        const compiler = Compiler.build({
            watch: true
        });

        expect(compiler).toBeInstanceOf(Compiler);

        await compiler.compile({
            entries: [{
                baseDir: 'test/compile/scss',
                outputDir: 'test/compile/css/v1',
                filenames: /\.scss$/
            }]
        });

        expect(await exists('test/compile/css/v1')).toBe(true);
        expect(await exists('test/compile/css/v1/test.css')).toBe(true);

        await unlink('test/compile/scss/test.scss');

        expect(await exists('test/compile/scss/test.scss')).toBe(false);
        expect(await exists('test/compile/css/v1/test.css')).toBe(true);

        await compiler.stop();
    });

    // it('should not exists baseDir', async () => {
    //     const compiler = Compiler.build();
    //
    //     await compiler.compile({
    //         entries: [{
    //             baseDir: 'test/non-existent',
    //             outputDir: 'test/compile/css/v1',
    //             filenames: /\.scss$/
    //         }]
    //     });
    //
    //     expect(compiler).toBeInstanceOf(Compiler);
    //
    //     await rm('test/compile/test.scss');
    //
    //     await compiler.stop();
    // });

    afterEach(async () => {
        await rm('test/compile/css', {
            recursive: true,
            force: true,
        });
    });
});