import yargs from 'yargs';
import {hideBin} from "yargs/helpers";
import {loader} from "./config/config";
import {Compiler} from "./compile/compile";


const main = async (): Promise<void> => {

    // Load configuration file
    const config = await loader();

    const compiler = Compiler.build();

    await compiler.compile(config);
}

const args = yargs(hideBin(process.argv));

console.log(args.argv);


main().then(() => {
    process.exit(0);
}).catch((err) => {
    console.error(err);
    process.exit(1);
});