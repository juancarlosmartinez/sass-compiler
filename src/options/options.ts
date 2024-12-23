import yargs from "yargs";
import {hideBin} from "yargs/helpers";
import fs from "node:fs";

export interface CompilerOptions {
    config?: string;
    watch?: boolean;
    verbose?: boolean;
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
                },
                'watch': {
                    describe: 'Watch for file changes',
                    type: 'boolean',
                },
                'verbose': {
                    describe: 'Show more information',
                    type: 'boolean',
                }
            })
        ;

        const args = userInputOptions.parseSync();

        return new Options({
            config: args.config,
            watch: args.watch,
            verbose: args.verbose,
        });
    }

    /* INSTANCE */
    private constructor(private readonly _data: CompilerOptions = {}) {
    }

    public get config(): string {
        return this._data.config ?? '';
    }

    public get watch(): boolean {
        return this._data.watch ?? false;
    }

    public get verbose(): boolean {
        return this._data.verbose ?? false;
    }
}