type TEvent = 'add' | 'change' | 'unlink' | 'unlinkDir';
type TAction = () => Promise<void>;
export class ChangeEvent {

    /* STATIC */

    /* INSTANCE */
    public constructor(
        public readonly event: TEvent,
        private readonly action: TAction,
    ) {
    }

    public async process(): Promise<void> {
        await this.action();
    }
}