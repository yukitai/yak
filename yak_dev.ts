import { Lexer } from "./grammar/lexer.ts";
import { YakContext } from "./src/context.ts";

// const code = await Deno.readTextFile("./grammar/examples/example.yak")

const code = "hello::world!"

const context = new YakContext(code)

const lexer = new Lexer(context)

console.log(lexer.next_token())

/*const { ast, errs } = parse(context.code)

if (errs) {
    errs.forEach(err => {
        console.log(handle_parser_error(err, context).toString())
    })
} else {
    console.log(ast)
}*/