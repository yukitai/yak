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

const visible_leading_whitespace = (s: string, c = "") => {
    let split = s.search(/\S/)
    split = split > 0 ? split : 0
    return GRAY + "·".repeat(split) + CLEAR + c + s.slice(split)
}

const render_preview = (
    start: PosInfo,
    end: PosInfo,
    src: Lines,
    preview_lines = PREVIEW_LINES,
): string => {
    let result = ""
    let line = Math.max(0, start.line - preview_lines)
    let line_max = Math.min(src.length, end.line + preview_lines)
    const align_max = line_max.toString().length
    const render_line = (clip: boolean): number => {
        let jump = 0
        if (clip && src[line] === "") {
            while (line < src.length - 1 && src[line] === "") {
                ++line; ++jump
            }
            result += `${GRAY}${align(align_max + 4, "...")}${CLEAR}\n`
        }
        const content = visible_leading_whitespace(src[line])
        result += `    ${GRAY}${BOLD}${align(align_max, (line + 1).toString())}${CLEAR} ${ITALLIC}${content}${CLEAR}\n`
        ++line
        return jump
    }
    while (line < start.line - 1 && line < line_max) {
        render_line(false)
    }
    const span_info = get_span_info(start, end, src, line)
    let i = 0
    while (line < end.line) {
        i += render_line(true)
        if (span_info[i]?.len > 0) {
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
    let content: string
    src.forEach((c, line) => {
        const diff = diffs[line]
        switch (diff.operation) {
        case "add":
            content = visible_leading_whitespace(c)
            diff.value.forEach(v => {
                const vv = visible_leading_whitespace(v, GREEN)
                result += `    ${GREEN}+ ${vv}${CLEAR}\n`
            })
            result += `      ${content}${CLEAR}\n`
            break
        case "modify":
            content = visible_leading_whitespace(c, RED)
            diff.value.forEach(v => {
                const vv = visible_leading_whitespace(v, GREEN)
                result += `    ${GREEN}+ ${vv}${CLEAR}\n`
            })
            result += `    ${RED}- ${content}${CLEAR}\n`
            break
        default:
            content = visible_leading_whitespace(c)
            result += `      ${content}${CLEAR}\n`
        }
    })
    if (diffs[src.length]?.operation === "add") {
        diffs[src.length].value.forEach(v => {
            const vv = visible_leading_whitespace(v, GREEN)
            result += `    ${GREEN}+ ${vv}${CLEAR}\n`
        })
    }
    return result
}

export {
    render_preview,
    type Difference,
    render_diff,
}