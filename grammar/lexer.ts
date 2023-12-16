import { YakContext } from '../src/context.ts'
import { YakError } from '../src/error/error.ts'
import { DifferenceHelp } from '../src/error/help.ts'
import { PreviewInfo } from '../src/error/info.ts'
import { YakIndentError, YakSyntaxError } from '../src/error/kinds.ts'
import { Difference } from '../src/error/preview.ts'
import { Span } from '../src/error/span.ts'
import { Nullable } from '../src/utils.ts'
import { Token, TokenType } from './token.ts'

interface PosInfo {
    readonly overallPos: number
    readonly line: number
    readonly offset: number
}

class Lexer {
    overallPos: number
    line: number
    offset: number
    raw: string
    context: YakContext
    indent_size: Nullable<number>
    indent_span: Nullable<Span>

    constructor(context: YakContext) {
        this.overallPos = 0
        this.line = 1
        this.offset = 0
        this.raw = context.code
        this.context = context
        this.indent_size = null
        this.indent_span = null
    }

    private get_pos_info(): PosInfo {
        return {
            overallPos: this.overallPos,
            line: this.line,
            offset: this.offset,
        } as PosInfo
    }

    private move(step = 1) {
        this.overallPos += step
        this.offset += step
    }

    private nextline() {
        this.line += 1
        this.offset = 0
    }

    private next(): string {
        this.offset += 1
        return this.raw[this.overallPos++]
    }

    private peek(num = 1): string {
        return this.raw.slice(
            this.overallPos,
            this.overallPos + num,
        )
    }

    private value_from_range(
        start: PosInfo,
        end: PosInfo,
    ): string {
        return this.raw.slice(
            start.overallPos,
            end.overallPos,
        )
    }

    private get_indent(space: number, span: Span): number {
        if (space === 0) {
            return 0
        }
        if (!this.indent_size) {
            this.indent_size = space
            this.indent_span = span
        }
        const indent = space / this.indent_size
        if (indent % 1 !== 0) {
            return -indent
        }
        return indent
    }

    private static is_start_of_ident(ch: string): boolean {
        return /[a-zA-Z_]/.test(ch)
    }

    private static is_body_of_ident(ch: string): boolean {
        return /[a-zA-Z_0-9]/.test(ch)
    }

    private static is_number(ch: string): boolean {
        return /[0-9]/.test(ch)
    }

    private static is_whitespace(ch: string): boolean {
        return /[\r\t\f ]/.test(ch)
    }

    private static is_nextline(ch: string): boolean {
        return ch === '\n'
    }

    private static is_start_of_string(ch: string): boolean {
        return /["']/.test(ch)
    }

    has_next(): boolean {
        return this.overallPos < this.raw.length
    }

    try_restore() {
        while (
            this.has_next() &&
            !Lexer.is_whitespace(this.peek())
        ) {
            this.move()
        }
    }

    escape_whitespace(): number {
        let num = 0
        while (
            this.has_next() &&
            Lexer.is_whitespace(this.peek())
        ) {
            this.move()
            num += 1
        }
        return num
    }

    next_token(): Token | YakError {
        this.escape_whitespace()
        const start = this.get_pos_info()
        let ty, end, value
        const ch = this.peek()
        if (!this.has_next()) {
            ty = TokenType.Eof
            end = this.get_pos_info()
            value = ''
        } else if (Lexer.is_nextline(ch)) {
            this.move()
            this.nextline()
            const space = this.escape_whitespace()
            end = this.get_pos_info()
            const span = new Span(start, end)
            value = this.get_indent(space, span)
            if (value < 0) {
                return new YakError(
                    YakIndentError,
                    `broken indent`,
                    span,
                    this.context,
                    [
                        new DifferenceHelp(
                            'current the indent, and it might be possiblely like this:',
                            this.context.lines.slice(
                                start.line,
                                end.line,
                            ),
                            [
                                {
                                    operation: 'modify',
                                    value: [
                                        ' '.repeat(
                                            this.indent_size! *
                                                Math.floor(
                                                    -value,
                                                ),
                                        ) +
                                        this.context
                                            .lines[
                                                start.line
                                            ].trim(),
                                    ],
                                },
                            ] as Difference,
                        ),
                        new PreviewInfo(
                            'the standard indent size defined here:',
                            this.indent_span!,
                            this.context,
                        ),
                    ],
                )
            }
            ty = TokenType.NlIndent
        } else if (ch === '(') {
            this.move()
            ty = TokenType.LParen
            value = '('
            end = this.get_pos_info()
        } else if (ch === ')') {
            this.move()
            ty = TokenType.RParen
            value = ')'
            end = this.get_pos_info()
        } else if (ch === '[') {
            this.move()
            ty = TokenType.LBracket
            value = '['
            end = this.get_pos_info()
        } else if (ch === ']') {
            this.move()
            ty = TokenType.RBracket
            value = ']'
            end = this.get_pos_info()
        } else if (ch === '{') {
            this.move()
            ty = TokenType.LBrace
            value = '{'
            end = this.get_pos_info()
        } else if (ch === '}') {
            this.move()
            ty = TokenType.RBrace
            value = '}'
            end = this.get_pos_info()
        } else if (ch === ':') {
            this.move()
            ty = TokenType.Colon
            value = ':'
            end = this.get_pos_info()
        } else if (ch === ',') {
            this.move()
            ty = TokenType.Comma
            value = ','
            end = this.get_pos_info()
        } else if (ch === '.') {
            this.move()
            if (this.peek(2) === '..') {
                this.move(2)
                ty = TokenType.Nothing
                value = '...'
            } else {
                ty = TokenType.ODot
                value = '.'
            }
            end = this.get_pos_info()
        } else if (ch === ';') {
            this.move()
            ty = TokenType.Semi
            value = ';'
            end = this.get_pos_info()
        } else if (ch === '+') {
            this.move()
            ty = TokenType.OAdd
            value = '+'
            end = this.get_pos_info()
        } else if (ch === '-') {
            this.move()
            if (this.peek() === '>') {
                this.move()
                ty = TokenType.ThinArr
                value = '->'
            } else {
                ty = TokenType.OSub
                value = '-'
            }
            end = this.get_pos_info()
        } else if (ch === '*') {
            this.move()
            if (this.peek() === '*') {
                this.move()
                ty = TokenType.OPow
                value = '**'
            } else {
                ty = TokenType.OMul
                value = '*'
            }
            end = this.get_pos_info()
        } else if (ch === '/') {
            this.move()
            if (this.peek() === '/') {
                this.move()
                ty = TokenType.OFloorDiv
                value = '//'
            } else {
                ty = TokenType.ODiv
                value = '/'
            }
            end = this.get_pos_info()
        } else if (ch === '%') {
            this.move()
            ty = TokenType.OMod
            value = '%'
            end = this.get_pos_info()
        } else if (this.peek(2) === '&&') {
            this.move(2)
            ty = TokenType.OAnd
            value = '&&'
            end = this.get_pos_info()
        } else if (ch === '|') {
            this.move()
            if (this.peek() === '|') {
                this.move()
                ty = TokenType.OOr
                value = '||'
            } else {
                ty = TokenType.Or
                value = '|'
            }
            end = this.get_pos_info()
        } else if (ch === '!') {
            this.move()
            if (this.peek() === '=') {
                this.move()
                ty = TokenType.ONe
                value = '!='
            } else {
                ty = TokenType.ONot
                value = '!'
            }
            end = this.get_pos_info()
        } else if (ch === '=') {
            this.move()
            if (this.peek() === '=') {
                this.move()
                ty = TokenType.OEq
                value = '=='
            } else {
                ty = TokenType.OAssign
                value = '='
            }
            end = this.get_pos_info()
        } else if (ch === '<') {
            this.move()
            if (this.peek() === '=') {
                this.move()
                ty = TokenType.OLe
                value = '<='
            } else {
                ty = TokenType.OLt
                value = '<'
            }
            end = this.get_pos_info()
        } else if (ch === '>') {
            this.move()
            if (this.peek() === '=') {
                this.move()
                ty = TokenType.OGe
                value = '>='
            } else {
                ty = TokenType.OGt
                value = '>'
            }
            end = this.get_pos_info()
        } else if (ch === '@') {
            this.move()
            ty = TokenType.At
            value = '@'
            end = this.get_pos_info()
        } else if (Lexer.is_start_of_string(ch)) {
            let en = false
            value = ''
            this.move()
            while (true) {
                const ch1 = this.next()
                if (ch1 === '\n') {
                    this.nextline()
                    value += '\n'
                }
                if (en) {
                    en = false
                    switch (ch1) {
                        case 'n':
                            value += '\n'
                            break
                        case 'r':
                            value += '\r'
                            break
                        case 't':
                            value += '\t'
                            break
                        default:
                            value += ch
                    }
                } else if (ch1 === '\\') {
                    en = true
                } else if (ch1 === ch) {
                    break
                } else {
                    value += ch1
                }
            }
            end = this.get_pos_info()
            ty = TokenType.LiteralString
        } else if (Lexer.is_start_of_ident(ch)) {
            while (true) {
                if (this.peek(2) === 'r#') {
                    this.move(2)
                    while (this.next() !== '#');
                } else {
                    while (
                        Lexer.is_body_of_ident(this.peek())
                    ) {
                        this.move()
                    }
                }
                if (this.peek(2) !== '::') break
                this.move(2)
            }
            end = this.get_pos_info()
            value = this.value_from_range(start, end)
            switch (value) {
                case '_':
                    ty = TokenType.Underline
                    break
                case 'use':
                    ty = TokenType.KUse
                    break
                case 'def':
                    ty = TokenType.KDef
                    break
                case 'return':
                    ty = TokenType.KReturn
                    break
                case 'struct':
                    ty = TokenType.KStruct
                    break
                case 'unsized':
                    ty = TokenType.KUnsized
                    break
                case 'mod':
                    ty = TokenType.OMod
                    break
                case 'if':
                    ty = TokenType.KIf
                    break
                case 'elif':
                    ty = TokenType.KElif
                    break
                case 'else':
                    ty = TokenType.KElse
                    break
                case 'while':
                    ty = TokenType.KWhile
                    break
                case 'for':
                    ty = TokenType.KFor
                    break
                case 'in':
                    ty = TokenType.KIn
                    break
                case 'and':
                    ty = TokenType.OAnd
                    break
                case 'or':
                    ty = TokenType.OOr
                    break
                case 'not':
                    ty = TokenType.ONot
                    break
                case 'unit':
                case 'list':
                case 'num':
                case 'str':
                case 'bool':
                case 'nil':
                    ty = TokenType.BuiltinType
                    break
                case 'True':
                case 'False':
                    ty = TokenType.LiteralBool
                    break
                default:
                    ty = TokenType.Ident
            }
        } else if (Lexer.is_number(ch)) {
            let float = false
            while (Lexer.is_number(this.peek())) {
                this.move()
                if (this.peek() === '.') {
                    if (float) {
                        this.try_restore()
                        end = this.get_pos_info()
                        const span = new Span(start, end)
                        return new YakError(
                            YakSyntaxError,
                            `invailed number literal`,
                            span,
                            this.context,
                            [],
                        )
                    } else {
                        float = true
                        this.move()
                    }
                }
            }
            ty = TokenType.LiteralNumber
            end = this.get_pos_info()
            value = this.value_from_range(start, end)
        }
        return new Token(
            ty!,
            value!,
            new Span(start, end as PosInfo),
        )
    }
}

export { Lexer, type PosInfo }
