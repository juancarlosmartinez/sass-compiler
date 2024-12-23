import path from "node:path";
import {exists} from "../util/fs";
import {CompilerOptions} from "../options/options";
import {log} from "../util/log";

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

export const loader = async (options: CompilerOptions): Promise<SassCompilerConfig> => {
    log(`Loading configuration file: ${options.config || CONFIG_FILE_NAME}`);

    if (options.config && !await exists(options.config)) {
        return Promise.reject(new Error(`Configuration file not found: ${options.config}`));
    }

    const configPath =  path.join(process.cwd(), options.config || CONFIG_FILE_NAME);
    log(`Using configuration file: ${configPath}`);

    let config: SassCompilerConfig;

    if (!await exists(configPath)) {
        config = DEFAULT_CONFIG;
        log(`Configuration file not found, using default configuration`);
    } else {
        const userConfig: SassCompilerConfig = require(configPath);

        log(`Configuration file found, using user configuration: ${JSON.stringify(userConfig)}`);

        if (userConfig.entries.length === 0) {
            config = DEFAULT_CONFIG;
        }

        userConfig.entries.forEach(entry => {
            if (!entry.outputDir) {
                entry.outputDir = entry.baseDir || DEFAULT_ENTRY.outputDir;
            }
            if (!entry.baseDir) {
                entry.baseDir = DEFAULT_ENTRY.baseDir;
            }
        });

        config = userConfig;

        log(`Configuration file loaded: ${JSON.stringify(config)}`);
    }

    return config;
}