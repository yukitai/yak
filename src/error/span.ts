import { PosInfo } from '../../grammar/lexer.ts'

const to_span = (pos: PosInfo): Span => {
    return new Span(pos, pos)
}

const compare_pos_info = (
    lhs: PosInfo,
    rhs: PosInfo,
): number => {
    return lhs.overallPos - rhs.overallPos
}

const max = (lhs: PosInfo, rhs: PosInfo): PosInfo => {
    return compare_pos_info(lhs, rhs) > 0 ? lhs : rhs
}

const min = (lhs: PosInfo, rhs: PosInfo): PosInfo => {
    return compare_pos_info(lhs, rhs) < 0 ? lhs : rhs
}

class Span {
    start: PosInfo
    end: PosInfo

    constructor(start: PosInfo, end: PosInfo) {
        this.start = start
        this.end = end
    }

    merge(other: Span) {
        const min_pos = min(this.start, other.start)
        const max_pos = max(this.end, other.end)
        return new Span(min_pos, max_pos)
    }

    toString(): string {
        return `${this.start.line},${this.start.offset},${this.start.overallPos};${this.end.line},${this.end.offset},${this.end.overallPos}`
    }
}

export { Span, to_span }
