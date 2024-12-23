import {CompilerOptions} from "../options/options";
import {CompileEntry, SassCompilerConfig} from "../config/config";
import {EntryCompiler} from "./entry-compiler";

export class Compiler {
    /* STATIC */
    public static build(options?: CompilerOptions): Compiler {
        return new Compiler(options);
    }

    /* INSTANCE */
    private constructor(private readonly options?: CompilerOptions) {
    }

    /**
     * Process a single entry from the configuration file.
     * @param entry The entry to process
     * @private
     */
    private async processEntry(entry: CompileEntry): Promise<void> {
        await EntryCompiler.build(entry, this.options).compile();
    }

    public async compile(config: SassCompilerConfig): Promise<void> {
        await Promise.all(config.entries.map(entry => this.processEntry(entry).catch(async (err) => {
            console.error(`Error processing entry:`, err);
        })));
    }
}