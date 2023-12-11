import { assertEquals } from "https://deno.land/std@0.208.0/testing/asserts.ts"
import { parse, Expr, Ident, File } from "../parser.ts";

const ident_from_ast = (ast: File): string => {
    let e: any = ast!.body as Expr
    while (e.expr) {
        e = e.expr
    }
    return (e.bin as Ident).str
}

Deno.test({
    name: "test_simple_ident_parser_works",
    fn() {
        const { ast, errs } = parse("abc")
        assertEquals(errs, [], "failed")
        assertEquals(ident_from_ast(ast!), "abc")
    }
})

Deno.test({
    name: "test_complex_ident_parser_works",
    fn() {
        const { ast, errs } = parse("abc::def")
        assertEquals(errs, [], "failed")
        assertEquals(ident_from_ast(ast!), "abc::def")
    }
})

Deno.test({
    name: "test_raw_ident_parser_works",
    fn() {
        const { ast, errs } = parse("r#abc@:<{>}?'%$#")
        assertEquals(errs, [], "failed")
        assertEquals(ident_from_ast(ast!), "r#abc@:<{>}?'%$#")
    }
})

Deno.test({
    name: "test_complex_raw_ident_parser_works",
    fn() {
        const { ast, errs } = parse("a::r#abc@:<{>}?'%$#::r#+#")
        assertEquals(errs, [], "failed")
        assertEquals(ident_from_ast(ast!), "a::r#abc@:<{>}?'%$#::r#+#")
    }
})