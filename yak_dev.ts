import { Lexer } from './grammar/lexer.ts'
import { Parser } from './grammar/parser.ts'
import { Checker } from './src/checker/checker.ts'
import { YakContext } from './src/context.ts'
import { display_errors } from './src/error/display.ts'
import { Formatter } from './src/scratch_ir/formatter.ts'
import { Transfer } from './src/scratch_ir/transfer.ts'
import { Formatter as _Formatter } from './grammar/formatter.ts'
import { generate_json } from './src/json_gen/json_gen.ts'
import { BOLD, CLEAR, YELLOW } from './src/error/colors.ts'

const code = await Deno.readTextFile(
    './grammar/examples/example.yak',
)

const context = new YakContext(code, 'example.yak')

const lexer = new Lexer(context)

const parser = new Parser(lexer)

if (parser.has_error()) {
    display_errors(parser.errors)
} else {
    const ast = parser.parse_file()

    if (parser.has_error()) {
        display_errors(parser.errors)
    } else {
        const checker = new Checker(parser, ast)

        checker.check_file()

        // checker.ast.display(new _Formatter())

        if (parser.has_error()) {
            display_errors(parser.errors)
        } else {
            const transfer = new Transfer(checker)

            const ir = transfer.generate_ir_file()

            ir.display(new Formatter())

            console.log(`\n${YELLOW}${BOLD}ScratchJson Output${CLEAR}:`)
            console.dir(generate_json(ir))
        }
    }
}
