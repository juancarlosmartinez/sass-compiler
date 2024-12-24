import {CompilerOptions} from "../options/options";

let instance: Log|null = null;

export class Log {
    /* STATIC */
    public static init(options: CompilerOptions): Log {
        return instance = new Log(options);
    }

    /* INSTANCE */
    private constructor(public readonly options: CompilerOptions) {
    }

    public log(message: string): void {
        if (this.options.verbose) {
            console.log(message);
        }
    }
}


export const log = (message: string): void => {
    if (!instance) {
        throw new Error('Log not initialized');
    }
    return instance.log(message);
}