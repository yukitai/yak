import { YakContext } from "../src/context.ts";
import { Span } from "../src/error/span.ts";
import { Token, TokenType } from "./token.ts";

interface PosInfo {
    readonly overallPos: number,
    readonly line: number,
    readonly offset: number,
}

class Lexer {
    overallPos: number
    line: number
    offset: number
    raw: string

    public constructor (context: YakContext) {
        this.overallPos = 0
        this.line = 1
        this.offset = 0
        this.raw = context.code
    }

    private get_pos_info () {
        return {
            overallPos: this.overallPos,
            line: this.line,
            offset: this.offset,
        } as PosInfo
    }

    private move (step = 1) {
        this.overallPos += step
        this.offset += step
    }

    private nextline () {
        this.line += 1
        this.offset = 0
    }

    private next () {
        return this.raw[this.overallPos++]
    }

    private peek (num = 1) {
        return this.raw.slice(this.overallPos, this.overallPos + num)
    }

    private has_next () {
        return this.overallPos < this.raw.length
    }

    private static is_start_of_ident (ch: string) {
        return ch.match(/[a-zA-Z_]/)
    }

    private static is_body_of_ident (ch: string) {
        return ch.match(/[a-zA-Z_0-9]/)
    }

    private value_from_range (start: PosInfo, end: PosInfo): string {
        return this.raw.slice(start.overallPos, end.overallPos)
    }

    public next_token () {
        const start = this.get_pos_info()
        let ty, end, value
        const ch = this.next()
        if (Lexer.is_start_of_ident(ch)) {
            while (true) {
                while (Lexer.is_body_of_ident(this.peek())) {
                    this.move()
                }
                if (this.peek(2) !== "::") break
                this.move(2)
            }
            ty = TokenType.Ident
            end = this.get_pos_info()
            value = this.value_from_range(start, end)
        }
        return {
            ty, value, span: new Span(start, end as PosInfo)
        } as Token
    }
}

export {
    type PosInfo,
    Lexer,
}