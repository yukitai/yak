import { PosInfo } from "../../grammar/lexer.ts";
import { BOLD, CLEAR, GRAY, ITALLIC, YELLOW } from "./colors.ts";
import { Lines } from "./error.ts";

const PREVIEW_LINES = 1

const align = (a: number, s: string): string => {
    return " ".repeat(a - s.length) + s
}

type SpanInfo = { start: number, len: number }[]

const get_span_info = (start: PosInfo, end: PosInfo, src: Lines, line: number): SpanInfo => {
    if (start.line === end.line) {
        return [
            { start: start.offset, len: end.offset - start.offset + 1 }
        ]
    } else {
        const result = [
            { start: start.offset, len: src[line].length - start.offset }
        ]
        ++line
        while (line + 1 < end.line) {
            result.push({ start: 0, len: src[line].length})
            ++line
        }
        result.push({ start: 0, len: end.offset + 1})
        return result
    }
}

const render_preview = (
    start: PosInfo,
    end: PosInfo,
    src: Lines
): string => {
    let result = ""
    let line = Math.max(0, start.line - PREVIEW_LINES - 1)
    const line_max = Math.min(src.length, end.line + PREVIEW_LINES)
    const align_max = line_max.toString().length
    const render_line = (clip: boolean) => {
        let jump = 0
        if (clip && src[line] === "") {
            while (src[line] === "") {
                ++line; ++jump
            }
            result += `${GRAY}${align(align_max + 4, "...")}${CLEAR}\n`
        }
        result += `    ${GRAY}${BOLD}${align(align_max, (line + 1).toString())}${CLEAR} ${ITALLIC}${src[line]}${CLEAR}\n`
        ++line
        return jump
    }
    while (line < start.line - 1) {
        render_line(false)
    }
    const span_info = get_span_info(start, end, src, line)
    let i = 0
    while (line < end.line) {
        i += render_line(true)
        result += `${align(align_max + 5 + span_info[i].start, "")}${YELLOW}${"-".repeat(span_info[i].len)}${CLEAR}\n`
        ++i
    }
    while (line < line_max) {
        render_line(false)
    }
    return result
}

export {
    render_preview,
}