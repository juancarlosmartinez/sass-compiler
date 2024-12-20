import path from "node:path";
import {exists} from "../util/fs";

const CONFIG_FILE_NAME = 'sass-compiler.config.js';

const DEFAULT_ENTRY: CompileEntry = {
    baseDir: '.',
    outputDir: '.'
}

const DEFAULT_CONFIG: SassCompilerConfig = {
    entries: [
        DEFAULT_ENTRY
    ]
}

export interface SassCompilerConfig {
    entries: CompileEntry[];
}

export interface CompileEntry {
    baseDir: string;
    outputDir: string;
}

export const loader = async (): Promise<SassCompilerConfig> => {
    const configPath = path.join(process.cwd(), CONFIG_FILE_NAME);

    let config: SassCompilerConfig;

    if (!await exists(configPath)) {
        config = DEFAULT_CONFIG;
    } else {
        const userConfig: SassCompilerConfig = require(configPath);

        if (userConfig.entries.length === 0) {
            config = DEFAULT_CONFIG;
        }

        userConfig.entries.forEach(entry => {
            if (!entry.outputDir) {
                entry.outputDir = entry.baseDir ?? DEFAULT_ENTRY.outputDir;
            }
            if (!entry.baseDir) {
                entry.baseDir = DEFAULT_ENTRY.baseDir;
            }
        });

        config = userConfig;
    }

    return config;
}