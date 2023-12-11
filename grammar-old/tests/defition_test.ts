import { assertEquals, assertNotEquals } from "https://deno.land/std@0.208.0/testing/asserts.ts"
import { parse } from "../parser.ts";

Deno.test({
    name: "test_def_parser_works",
    fn() {
        const { errs } = parse(`\
def main():
    ...`)
        assertEquals(errs, [], "failed")
    }
})

Deno.test({
    name: "test_attr_parser_works",
    fn() {
        const { errs } = parse(`\
@whengreenflagclicked
def main():
    ...`)
        assertEquals(errs, [], "failed")
    }
})

Deno.test({
    name: "test_argument_and_return_type_parser_works",
    fn() {
        const { errs } = parse(`\
def main(a: unit) -> unit:
    ...`)
        assertEquals(errs, [], "failed")
    }
})

Deno.test({
    name: "test_return_parser_works",
    fn() {
        const { errs } = parse(`\
def main():
    return 10;
    ...`)
        assertEquals(errs, [], "failed")
    }
})

Deno.test({
    name: "test_auto_return_return_parser_works",
    fn() {
        const { errs } = parse(`\
def main():
    return 10`)
        assertNotEquals(errs, [], "failed")
    }
})

Deno.test({
    name: "test_auto_return_parser_works",
    fn() {
        const { errs } = parse(`\
def main():
    10`)
        assertEquals(errs, [], "failed")
    }
})