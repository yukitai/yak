import { Lines, to_lines } from "./error/error.ts";

class YakContext {
    public code: string
    public lines: Lines
    public file: string

    constructor (raw: string, file: string) {
        this.code = raw
        this.lines = to_lines(raw)
        this.file = file
    }
}

export {
    YakContext,
}