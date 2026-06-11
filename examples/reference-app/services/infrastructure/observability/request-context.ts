import { AsyncLocalStorage } from "node:async_hooks";

type Store = {
    requestId: string;
};

const asyncLocalStorage = new AsyncLocalStorage<Store>();

export class RequestContext {

    static run(requestId: string, callback: () => Promise<any>) {
        return asyncLocalStorage.run({ requestId }, callback);
    }

    static getRequestId(): string | undefined {
        return asyncLocalStorage.getStore()?.requestId;
    }
}