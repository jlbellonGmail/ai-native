import { RequestContext } from "./request-context";

type LogLevel = "info" | "error" | "warn" | "debug";

export class Logger {

    static log(level: LogLevel, message: string, data?: any) {

        const requestId = RequestContext.getRequestId();

        const logEntry = {
            level,
            message,
            requestId,
            data,
            timestamp: new Date().toISOString(),
        };

        console.log(JSON.stringify(logEntry));
    }

    static info(message: string, data?: any) {
        this.log("info", message, data);
    }

    static error(message: string, data?: any) {
        this.log("error", message, data);
    }

    static warn(message: string, data?: any) {
        this.log("warn", message, data);
    }

    static debug(message: string, data?: any) {
        this.log("debug", message, data);
    }
}