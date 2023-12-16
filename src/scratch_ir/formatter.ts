import { BOLD, CLEAR, CYAN, GRAY, ITALLIC, MAGENTA } from '../error/colors.ts'
import { align } from '../utils.ts'
import { Input } from './ir.ts'

class Formatter {
    indent_count: number
    leading_indent: string
    leading_indent2: string
    last_indent: string
    line_number: number

    constructor(indent = '  ', indent2 = '| ', last_indent = '+ ') {
        this.indent_count = 0
        this.leading_indent = indent
        this.line_number = 0
        this.leading_indent2 = indent2
        this.last_indent = last_indent
    }

    indent() {
        this.indent_count += 1
    }

    dedent() {
        this.indent_count -= 1
    }

    get_indent() {
        return this.leading_indent.repeat(this.indent_count)
    }

    get_indent_header() {
        if (this.indent_count > 0) {
            return this.leading_indent2.repeat(this.indent_count - 1) +
                this.last_indent
        } else {
            return ''
        }
    }

    write_header(header: string, desc = '') {
        console.log(
            '     ' +
                GRAY +
                this.get_indent_header() +
                CLEAR +
                MAGENTA +
                BOLD +
                header +
                CLEAR +
                '\t ' +
                GRAY +
                ITALLIC +
                desc +
                CLEAR,
        )
    }

    write_command(cmd: string, ...args: Input[]) {
        this.line_number += 1
        console.log(
            GRAY +
                align(4, this.line_number.toString()) +
                CLEAR +
                ' ' +
                this.get_indent() +
                CYAN +
                BOLD +
                cmd +
                CLEAR +
                ' ' +
                args.map((x) => x.toString()).join(' '),
        )
    }

    write_kv(key: string, value: Input) {
        console.log(
            '     ' +
                this.get_indent() +
                MAGENTA +
                BOLD +
                key +
                CLEAR +
                ' ' +
                value.toString(),
        )
    }
}

export { Formatter }
