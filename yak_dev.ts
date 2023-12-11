import { Lexer } from "./grammar/lexer.ts";
import { TokenType } from "./grammar/token.ts";
import { YakContext } from "./src/context.ts";
import { CLEAR, CYAN } from "./src/error/colors.ts";
import { YakError } from "./src/error/error.ts";
import { align } from "./src/utils.ts";

// const code = await Deno.readTextFile("./grammar/examples/example.yak")

const code = `\
@opcode("whengreenflagclicked")
def main():
  '''
    this is the standard indent of the file
  '''
   return "BrokenIndentHere!"`

const context = new YakContext(code, "example.yak")

const lexer = new Lexer(context)

while (true) {
    const token = lexer.next_token()

    if (token instanceof YakError) {
        console.error(token.toString())
    } else {
        console.log(`${CYAN}${align(16, `<${token.ty}>`)}${CLEAR}: "${token.value}"`)
        if (token.ty == TokenType.Eof) {
            break
        }
    }
}
