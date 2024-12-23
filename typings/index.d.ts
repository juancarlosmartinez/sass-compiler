declare module 'sass-compiler' {

    /**
     * Compile the Sass files in the configuration.
     * @param config The configuration to use
     */
    export function compile(config: SassCompilerConfig): Promise<void>;

    /**
     * The configuration for the Sass compiler.
     */
    export interface SassCompilerConfig {
        entries: CompileEntry[];
    }

    /**
     * An entry in the configuration.
     */
    export interface CompileEntry {
        baseDir: string;
        outputDir: string;
    }
}