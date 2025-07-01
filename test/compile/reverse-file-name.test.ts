import {EntryCompiler} from "../../src/compile/entry-compiler";

describe('buildReverseOutputFileName', () => {


    it('devuelve el nombre .scss cuando el filename es simple', async () => {
        const entries = [{
            baseDir: 'test/compile/scss',
            outputDir: 'test/compile/css/v1',
            filenames: /\.s[ca]ss$/
        }];

        const output = {
            entries,
            output: {
                filename: '[name].css'
            }
        };

        const entry = EntryCompiler.build(entries[0], output);

        expect(entry['getBaseName']('archivo.css', '.css')).toBe('archivo');
    });

    it('devuelve el nombre .scss cuando el filename es con hash', async () => {
        const entries = [{
            baseDir: 'test/compile/scss',
            outputDir: 'test/compile/css/v1',
            filenames: /\.s[ca]ss$/
        }];

        const output = {
            entries,
            output: {
                filename: '[name].[hash].css'
            }
        };

        const entry = EntryCompiler.build(entries[0], output);

        expect(entry['getBaseName']('archivo.123456.css', '.css')).toBe('archivo');
    });
});