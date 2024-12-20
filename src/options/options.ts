import yargs from "yargs";
import {hideBin} from "yargs/helpers";
import {readFileSync} from "fs";
import path from "node:path";
import fs from "node:fs";

export interface CompilerOptions {
    config?: string;
}

export class Options implements CompilerOptions {
    /* STATIC */
    public static build(): CompilerOptions {
        const packageJSON = JSON.parse(fs.readFileSync('./package.json', "utf-8"));

        const userInputOptions = yargs(hideBin(process.argv))
            .usage('Usage: $0 [options]')
            .help('h')
            .version(packageJSON.version)
            .alias('help', 'h')
            .alias('version', 'v')
            .options({
                'config': {
                    describe: 'Path to the configuration file',
                    type: 'string',
                }
            })
        ;

        const args = userInputOptions.parseSync();

        return new Options({
            config: args.config,
        });
    }

    /* INSTANCE */
    private constructor(private readonly _data: CompilerOptions = {}) {
    }

    public get config(): string {
        return this._data.config ?? '';
    }


}