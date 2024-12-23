import {loader} from "./config/config";
import {Compiler} from "./compile/compile";
import {Options} from "./options/options";


const main = async (): Promise<void> => {
    const options = Options.build();

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