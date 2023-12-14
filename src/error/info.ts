import { YakContext } from "../context.ts";
import { ToStringable } from "../utils.ts";
import { LIGHT, BOLD, CLEAR, GRAY, ITALLIC } from "./colors.ts";
import { render_preview } from "./preview.ts";
import { Span } from "./span.ts";

class Info {
    msg: ToStringable

    constructor (msg: ToStringable) {
        this.msg = msg
    }

    toString (): string {
        return `${LIGHT}${BOLD}info${CLEAR}: ${this.msg}`
    }
}

class ListInfo extends Info {
    private static format_items (num: number): string {
        return num === 1 ? `${num} item` : `${num} items`
    }

    static spliter = `${GRAY},${CLEAR}\n    `

    constructor (msg: ToStringable, list: ToStringable[], overflow: number = 6) {
        super(`${msg}
    ${list.length > overflow ?
        list.slice(0, overflow).map(item => `${BOLD}${item}${CLEAR}`).join(ListInfo.spliter)
            + `${ITALLIC} and ${ListInfo.format_items(list.length - overflow)} more ...${CLEAR}` :
        list.map(item => `${BOLD}${item}${CLEAR}`).join(ListInfo.spliter)}`)
    }
}

class PreviewInfo extends Info {
    constructor (msg: ToStringable, span: Span, context: YakContext) {
        const code_preview = render_preview(span.start, span.end, context.lines)
        
        super(`${msg}

${code_preview}`)
    }
}

export {
    Info,
    ListInfo,
    PreviewInfo
}