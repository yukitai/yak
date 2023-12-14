import { Formatter } from "./grammar/formatter.ts";
import { Lexer } from "./grammar/lexer.ts";
import { Parser } from "./grammar/parser.ts";
import { YakContext } from "./src/context.ts";
import { display_errors } from "./src/error/display.ts";

const code = await Deno.readTextFile("./grammar/examples/example.yak")

/* const code = `\
def main(name):
    log("Hello,", name)` */

const context = new YakContext(code, "example.yak")

const lexer = new Lexer(context)

const parser = new Parser(lexer)

if (parser.has_error()) {
    display_errors(parser.errors)
} else {
    const ast = parser.parse_file()

    ast.display(new Formatter())

    display_errors(parser.errors)
}