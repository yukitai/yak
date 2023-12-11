import { assertEquals } from "https://deno.land/std@0.208.0/testing/asserts.ts"
import { parse } from "../parser.ts";

Deno.test({
    name: "test_expression_parser_works",
    fn() {
        const { errs } = parse("1 *(2 + 3-4) / 7")
        assertEquals(errs, [], "failed")
    }
})

/*Deno.test({
    name: "test_ifelse_expr_parser_works",
    fn() {
        const { errs } = parse("1 if 2 else 3")
        assertEquals(errs, [], "failed")
    }
})*/

Deno.test({
    name: "test_prefix_expr_parser_works",
    fn() {
        const { errs } = parse("1 + -!--1")
        assertEquals(errs, [], "failed")
    }
})

Deno.test({
    name: "test_dot_and_call_expr_parser_works",
    fn() {
        const { errs } = parse("a.b().c(1)(2,3).d")
        assertEquals(errs, [], "failed")
    }
})

Deno.test({
    name: "test_literal_parser_works",
    fn() {
        {
            const { errs } = parse("1")
            assertEquals(errs, [], "int: failed")
        }
        {
            const { errs } = parse("1.2")
            assertEquals(errs, [], "float: failed")
        }
        {
            const { errs } = parse(".2")
            assertEquals(errs, [], "float_nonfirst: failed")
        }
        {
            const { errs } = parse("1.")
            assertEquals(errs, [], "float_nonsecond: failed")
        }
        /*{
            const { errs } = parse("123_456.789_123")
            assertEquals(errs, [], "spliter: failed")
        }*/
    }
})