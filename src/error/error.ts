import { RED, BOLD, CYAN, CLEAR, ITALLIC } from "./colors.ts"
import { Span } from "./span.ts";
import { render_preview } from "./preview.ts";
import { ToStringable } from "../utils.ts";
import { YakContext } from "../context.ts";

type Lines = string[]
interface YakErrorKind { id: string, name: string }

const to_lines = (raw: string): Lines => {
    return raw.split("\n")
}

class YakError {
    kind: YakErrorKind
    msg: ToStringable
    src: Lines
    loc: Span
    file: string
    extras: ToStringable[]

    public constructor (
        kind: YakErrorKind,
        msg: ToStringable,
        loc: Span,
        context: YakContext,
        extras: ToStringable[],
    ) {
        this.kind = kind
        this.msg = msg
        this.loc = loc
        this.src = context.lines
        this.file = context.file
        this.extras = extras
    }

    public toString () {
        const code_preview = render_preview(
            this.loc.start,
            this.loc.end,
            this.src
        )

        return `\
${RED}${BOLD}error[E${this.kind.id}] ${this.kind.name}${CLEAR}
    ${ITALLIC}${this.msg}${CLEAR} ${CYAN}[${this.file}:${this.loc.start.line}:${this.loc.start.offset}]${CLEAR}

${code_preview}
${this.extras.map(item => item.toString()).join("\n\n")}`
    }
}

export {
    type Lines,
    to_lines,
    YakError
}