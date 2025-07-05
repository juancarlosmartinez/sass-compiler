import {CompilerOptions} from "../options/options";
import {CompileEntry, SassCompilerConfig} from "../config/config";
import {EntryCompiler} from "./entry-compiler";
import {Manifest} from "../config/manifest";
import {log} from "../util/log";

export class Compiler {
    /* STATIC */
    public static build(options?: CompilerOptions): Compiler {
        return new Compiler(options);
    }

    /* INSTANCE */
    private readonly entryCompilers: EntryCompiler[] = [];
    private manifest?: Manifest;
    private constructor(private readonly options?: CompilerOptions) {
    }

    /**
     * Process a single entry from the configuration file.
     * @param entry The entry to process
     * @param config The configuration to use
     * @param manifest The manifest to use for tracking compiled files
     * @private
     */
    private async processEntry(entry: CompileEntry, config: SassCompilerConfig, manifest?: Manifest): Promise<void> {
        const entryCompiler = EntryCompiler.build(entry, config, {
            options: this.options,
            manifest,
        });
        this.entryCompilers.push(entryCompiler);
        await entryCompiler.compile();
    }

    /**
     * Compile the Sass files in the configuration.
     * @param config The configuration to use
     */
    public async compile(config: SassCompilerConfig): Promise<void> {
        if (config.output?.manifest) {
            this.manifest = Manifest.build(config.output.manifest);
            log(`Building manifest`)
        }

        await Promise.all(config.entries.map(async entry => await this.processEntry(entry, config, this.manifest).catch(async (err) => {
            console.error(`Error processing entry:`, err);
        })));
    }

    /**
     * Stop the compiler.
     */
    public async stop(): Promise<void> {
        await Promise.all(this.entryCompilers.map(entryCompiler => entryCompiler.stop()));
    }
}