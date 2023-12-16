import {
    BOLD,
    CLEAR,
    CYAN,
    GRAY,
    GREEN,
    ITALLIC,
    LIGHT,
    MAGENTA,
    UNDERLINE,
    YELLOW,
} from '../src/error/colors.ts'
import { AST } from './ast.ts'

class Formatter {
    indent_count: number
    leading_indent: string
    last_indent: string
    refs: Record<string, number>
    ref_i: number

    constructor(indent = '| ', last_indent = '+ ') {
        this.indent_count = 0
        this.leading_indent = indent
        this.last_indent = last_indent
        this.refs = {}
        this.ref_i = 1
    }

    indent() {
        this.indent_count += 1
    }

    dedent() {
        this.indent_count -= 1
    }

    get_indent() {
        if (this.indent_count > 0) {
            return this.leading_indent.repeat(
                this.indent_count - 1,
            ) +
                this.last_indent
        } else {
            return ''
        }
    }

    write(s: string, ast?: AST) {
        if (ast) {
            this.refs[ast.span.toString()] = this.ref_i
            console.log(
                GRAY +
                    this.get_indent() +
                    CLEAR +
                    LIGHT + BOLD +
                    s +
                    CLEAR +
                    ITALLIC +
                    GRAY +
                    ` ref(${this.ref_i.toString()})` +
                    CLEAR,
            )
            this.ref_i += 1
        } else {
            console.log(
                GRAY +
                    this.get_indent() +
                    CLEAR +
                    LIGHT + BOLD +
                    s +
                    CLEAR,
            )
        }
    }

    write_kv(k: string, v?: string) {
        console.log(
            GRAY +
                this.get_indent() +
                CLEAR +
                CYAN +
                k +
                CLEAR +
                ': ' +
                (v === undefined ? '' : (ITALLIC +
                    GREEN +
                    JSON.stringify(v) +
                    CLEAR)),
        )
    }

    write_kl(k: string, l: number) {
        console.log(
            GRAY +
                this.get_indent() +
                CLEAR +
                CYAN +
                k +
                CLEAR +
                ': ' +
                MAGENTA +
                UNDERLINE +
                'len(' +
                l.toString() +
                ')' +
                CLEAR,
        )
    }

    write_kr(k: string, r: AST) {
        const ref = this.refs[r.span.toString()]
        if (ref) {
            console.log(
                GRAY +
                    this.get_indent() +
                    CLEAR +
                    CYAN +
                    k +
                    CLEAR +
                    ': ' +
                    YELLOW +
                    UNDERLINE +
                    'ref(' +
                    ref.toString() +
                    ')' +
                    CLEAR,
            )
        } else {
            console.log(
                GRAY +
                    this.get_indent() +
                    CLEAR +
                    CYAN +
                    k +
                    CLEAR +
                    ': ' +
                    YELLOW +
                    UNDERLINE +
                    'ref(builtin)' +
                    CLEAR,
            )
        }
    }
}

export { Formatter }
