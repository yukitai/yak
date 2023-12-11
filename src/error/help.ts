import { ToStringable } from "../utils.ts";
import { BOLD, CLEAR, GREEN } from "./colors.ts";
import { Lines } from "./error.ts";
import { Difference, render_diff } from "./preview.ts";

class Help {
    msg: ToStringable

    public constructor (msg: ToStringable) {
        this.msg = msg
    }

    public toString (): string {
        return `${GREEN}${BOLD}help${CLEAR}: ${this.msg}`
    }
}

class DifferenceHelp extends Help {
    public constructor (msg: ToStringable, src: Lines, difference: Difference) {
        const difference_code = render_diff(src, difference)

        super(`${msg}

${difference_code}`)
    }
}

export {
    Help,
    DifferenceHelp,
}