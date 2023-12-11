import { Lines, to_lines } from "./error/error.ts";

class YakContext {
    public code: string
    public lines: Lines

    constructor (raw: string) {
        this.code = raw
        this.lines = to_lines(raw)
    }
}

export {
    YakContext,
}