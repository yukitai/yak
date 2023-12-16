/*import { Branch, CommandReturn, Definition, Opcode, Project, Sprite, Variable } from './src/scratch_ir/ir.ts'
import { Formatter } from './src/scratch_ir/formatter.ts'

const x = new Variable("x")
const y = new Variable("y")
const ret = new Variable("__0")

const def_body = new Branch()

const if_body = new Branch()

if_body.blocks.push(new Opcode("data_setvariableto", {
    VARIABLE: ret,
    VALUE: x
}, {}))
if_body.blocks.push(new CommandReturn())

def_body.blocks.push(new Opcode("control_if", {
    CONDITION: new Opcode("operater_greater", {
        LEFT: x,
        RIGHT: y,
    }, {})
}, {
    BRANCH: if_body,
}))

def_body.blocks.push(new Opcode("data_setvariableto", {
    VARIABLE: ret,
    VALUE: y
}, {}))
def_body.blocks.push(new CommandReturn())

const def = new Definition("Max", [x, y], def_body)

const ir = new Project(
    {},
    new Sprite(
        "stage"
    ),
    {},
    {},
    {
        [def.id]: def,
    }
)

ir.display(new Formatter())
*/

import { Lexer } from './grammar/lexer.ts'
import { Parser } from './grammar/parser.ts'
import { Checker } from './src/checker/checker.ts'
import { YakContext } from './src/context.ts'
import { display_errors } from './src/error/display.ts'
import { Formatter } from './src/scratch_ir/formatter.ts'
import { Transfer } from './src/scratch_ir/transfer.ts'

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

        if (parser.has_error()) {
            display_errors(parser.errors)
        } else {
            const transfer = new Transfer(checker)
            
            const ir = transfer.generate_ir_file()

            ir.display(new Formatter())
        }
    }
}