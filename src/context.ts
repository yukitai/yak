import { Lines, to_lines } from "./error/error.ts";

class YakContext {
    code: string
    lines: Lines
    file: string

    constructor (raw: string, file: string) {
        this.code = raw
        this.lines = to_lines(raw)
        this.file = file
    }
}

export {
    YakContext,
}