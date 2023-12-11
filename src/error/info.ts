import { ToStringable } from "../utils.ts";
import { LIGHT, BOLD, CLEAR, GRAY, ITALLIC } from "./colors.ts";

class Info {
    msg: ToStringable

    public constructor (msg: ToStringable) {
        this.msg = msg
    }

    public toString (): string {
        return `${LIGHT}${BOLD}info${CLEAR}: ${this.msg}`
    }
}

class ListInfo extends Info {
    private static format_items (num: number): string {
        return num === 1 ? `${num} item` : `${num} items`
    }

    static spliter = `${GRAY},${CLEAR}\n    `

    public constructor (msg: ToStringable, list: ToStringable[], overflow: number = 6) {
        super(`\
${msg}
    ${list.length > overflow ?
        list.slice(0, overflow).map(item => `${BOLD}${item}${CLEAR}`).join(ListInfo.spliter)
            + `${ITALLIC} and ${ListInfo.format_items(list.length - overflow)} more ...${CLEAR}` :
        list.map(item => `${BOLD}${item}${CLEAR}`).join(ListInfo.spliter)}`)
    }
}

export {
    Info,
    ListInfo,
}