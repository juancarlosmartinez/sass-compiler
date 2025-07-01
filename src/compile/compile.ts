import {CompilerOptions} from "../options/options";
import {CompileEntry, SassCompilerConfig} from "../config/config";
import {EntryCompiler} from "./entry-compiler";

export class Compiler {
    /* STATIC */
    public static build(options?: CompilerOptions): Compiler {
        return new Compiler(options);
    }

    /* INSTANCE */
    private readonly entryCompilers: EntryCompiler[] = [];
    private constructor(private readonly options?: CompilerOptions) {
    }

    /**
     * Process a single entry from the configuration file.
     * @param entry The entry to process
     * @param config The configuration to use
     * @private
     */
    private async processEntry(entry: CompileEntry, config: SassCompilerConfig): Promise<void> {
        const entryCompiler = EntryCompiler.build(entry, config, this.options);
        this.entryCompilers.push(entryCompiler);
        await entryCompiler.compile();
    }

    /**
     * Compile the Sass files in the configuration.
     * @param config The configuration to use
     */
    public async compile(config: SassCompilerConfig): Promise<void> {
        await Promise.all(config.entries.map(async entry => await this.processEntry(entry, config).catch(async (err) => {
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