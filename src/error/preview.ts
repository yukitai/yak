import { PosInfo } from "../../grammar/lexer.ts";
import { align } from "../utils.ts";
import { BOLD, CLEAR, GRAY, GREEN, ITALLIC, RED, YELLOW } from "./colors.ts";
import { Lines } from "./error.ts";

const PREVIEW_LINES = 1

type SpanInfo = { start: number, len: number }[]

const get_span_info = (start: PosInfo, end: PosInfo, src: Lines, line: number): SpanInfo => {
    if (start.line === end.line) {
        return [
            { start: start.offset, len: end.offset - start.offset }
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
        result.push({ start: 0, len: end.offset})
        return result
    }
}

const render_preview = (
    start: PosInfo,
    end: PosInfo,
    src: Lines,
    preview_lines = PREVIEW_LINES,
): string => {
    let result = ""
    let line = Math.max(0, start.line - preview_lines)
    const line_max = Math.min(src.length, end.line + preview_lines)
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
        if (span_info[i].len > 0) {
            result += `${align(align_max + 5 + span_info[i].start, "")}${YELLOW}${"-".repeat(span_info[i].len)}${CLEAR}\n`
        }
        ++i
    }
    while (line < line_max) {
        render_line(false)
    }
    return result
}

type Difference = {
    operation: "add" | "modify" | "",
    value: string[],
}[]

const render_diff = (src: Lines, diffs: Difference) => {
    let result = ""
    src.forEach((content, line) => {
        const diff = diffs[line]
        switch (diff.operation) {
        case "add":
            diff.value.forEach(v => {
                result += `    ${GREEN}+ ${v}${CLEAR}\n`
            })
            result += `      ${content}${CLEAR}\n`
            break
        case "modify":
            diff.value.forEach(v => {
                result += `    ${GREEN}+ ${v}${CLEAR}\n`
            })
            result += `    ${RED}- ${content}${CLEAR}\n`
            break
        default:
            result += `      ${content}${CLEAR}\n`
        }
    })
    if (diffs[src.length]?.operation === "add") {
        diffs[src.length].value.forEach(v => {
            result += `    ${GREEN}+ ${v}${CLEAR}\n`
        })
    }
    return result
}

export {
    render_preview,
    type Difference,
    render_diff,
}