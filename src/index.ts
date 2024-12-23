import {loader} from "./config/config";
import {Compiler} from "./compile/compile";
import {Options} from "./options/options";
import {Log} from "./util/log";

const main = async (): Promise<void> => {
    const options = Options.build();

    Log.init(options);

    // Load configuration file
    const config = await loader(options);

    const compiler = Compiler.build(options);

    await compiler.compile(config);
}

main().then(() => {
}).catch((err) => {
    console.error(err);
    process.exit(1);
});