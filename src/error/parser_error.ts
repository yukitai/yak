/*import { YakContext } from "../context.ts";
import { YakError } from "./error.ts";
import { ListInfo } from "./info.ts";
import { YakSyntaxError } from "./kinds.ts";
import { to_span } from "./span.ts";

const handle_parser_error = (err: SyntaxErr, ctx: YakContext): YakError => {
    return new YakError(
        YakSyntaxError,
        `unexpected charactor \`${ctx.code[err.pos.overallPos]}\``,
        to_span(err.pos),
        ctx.lines,
        "example.yak",
        [
            new ListInfo(
                `there are some possible charactors the compiler expected:`,
                err.expmatches.map((item: MatchAttempt) => {
                    return item.kind === "EOF" ? "eof" : (item as RegexMatch).literal
                })
            )
        ]
    )
}

export {
    handle_parser_error,
}*/