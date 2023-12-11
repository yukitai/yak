import { PosInfo } from "../../grammar/lexer.ts";

const to_span = (pos: PosInfo): Span => {
    return new Span(pos, pos)
}

class Span {
    public start: PosInfo
    public end: PosInfo

    public constructor (start: PosInfo, end: PosInfo) {
        this.start = start
        this.end = end
    }
}

export {
    to_span,
    Span,
}