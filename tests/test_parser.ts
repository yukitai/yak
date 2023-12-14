import { assertEquals } from "https://deno.land/std@0.208.0/assert/assert_equals.ts";
import { Parser } from "../grammar/parser.ts";
import { YakContext } from "../src/context.ts";
import { Lexer } from "../grammar/lexer.ts";
import { ArrayType, Block, BuiltinType, ElifCase, ElseCase, ExprD, ExprG, ExprS, ExprStatement, File, ForInStatement, FuncDefition, GenericType, Ident, IfStatement, InferType, Literal, NameType, ReturnStatement, TypedIdent, UnsizedType, UseDefition, WhileStatement } from "../grammar/ast.ts";
import { assert } from "https://deno.land/std@0.208.0/assert/assert.ts";
import { Token } from "../grammar/token.ts";

/*
* parse_file
  parse_defition
*   parse_func_defition
    parse_use_defition
* parse_type
* parse_block
  parse_statement
    parse_if_statement
    parse_while_statement
    parse_forin_statement
    parse_return_statement
  parse_expr
*/

// deno-lint-ignore no-explicit-any
const assert_ast_eq = (struct: any, ast: any) => {
    if (struct instanceof Array) {
        // deno-lint-ignore no-explicit-any
        struct.forEach((it: any, i: number) => {
            if (typeof it === "object") {
                assert_ast_eq(it, ast[i])
            } else {
                assertEquals(ast[i], it, `${it.ty.name}: index ${i} not matched`)
            }
        });
    } else {
        if (!(ast instanceof struct.ty)) {
            assert(false, `${struct.ty.name}: AST node not matched`)
        }
        for (const key in struct) {
            if (key === "ty") { continue }
            if (typeof struct[key] === "object") {
                assert_ast_eq(struct[key], ast[key])
            } else {
                assertEquals(ast[key], struct[key], `${struct.ty.name}: \`${key}\` not matched`)
            }
        }
    }
}

Deno.test({
    name: "test_if_file_parser_work",
    fn () {
        const context = new YakContext(`\
use a::b, c::d

def main():
    ...`, "test")
        const lexer = new Lexer(context)
        const parser = new Parser(lexer)
        const ast = parser.parse_file()

        assert_ast_eq({
            ty: File,
            defitions: [
                { ty: UseDefition },
                { ty: FuncDefition },
            ]
        }, ast)
    }
})

Deno.test({
    name: "test_if_funcdef_parser_work",
    fn () {
        const context = new YakContext(`\
def b(a: ty, b) -> ty:
    ...`, "test")
        const lexer = new Lexer(context)
        const parser = new Parser(lexer)
        const ast = parser.parse_func_defition()

        assert_ast_eq({
            ty: FuncDefition,
            func_name: { ty: Ident },
            args: [
                {
                    ty: TypedIdent,
                    ident: { ty: Ident },
                    type: { ty: NameType },
                },
                {
                    ty: TypedIdent,
                    ident: { ty: Ident },
                    type: { ty: InferType },
                },
            ],
            ret_t: { ty: NameType },
            body: { ty: Block },
        }, ast)
    }
})

Deno.test({
    name: "test_if_type_parser_work",
    fn () {
        const context = new YakContext(`\
list<unsized [a; 1]>`, "test")
        const lexer = new Lexer(context)
        const parser = new Parser(lexer)
        const ast = parser.parse_type()

        assert_ast_eq({
            ty: GenericType,
            type: { ty: BuiltinType },
            generics: [
                {
                    ty: UnsizedType,
                    type: {
                        ty: ArrayType,
                        type: { ty: NameType },
                        llnum: { ty: Token },
                    }
                }
            ]
        }, ast)
    }
})

Deno.test({
    name: "test_if_block_parser_work",
    fn () {
        const context = new YakContext(`\

    0
    1`, "test")
        const lexer = new Lexer(context)
        const parser = new Parser(lexer)
        const ast = parser.parse_block()

        assert_ast_eq({
            ty: Block,
            stmts: [
                { ty: ExprStatement },
                { ty: ExprStatement },
            ]
        }, ast)
    }
})

Deno.test({
    name: "test_if_if_parser_work",
    fn () {
        const context = new YakContext(`\
if a:
    ...
elif b:
    ...
else:
    ...`, "test")
        const lexer = new Lexer(context)
        const parser = new Parser(lexer)
        const ast = parser.parse_if_statement()

        assert_ast_eq({
            ty: IfStatement,
            expr: { ty: Ident },
            body: { ty: Block },
            elif_cases: [
                {
                    ty: ElifCase,
                    expr: { ty: Ident },
                    body: { ty: Block }
                }
            ],
            else_case: {
                ty: ElseCase,
                body: { ty: Block }
            }
        }, ast)
    }
})

Deno.test({
    name: "test_if_while_parser_work",
    fn () {
        const context = new YakContext(`\
while x:
    ...`, "test")
        const lexer = new Lexer(context)
        const parser = new Parser(lexer)
        const ast = parser.parse_while_statement()

        assert_ast_eq({
            ty: WhileStatement,
            expr: { ty: Ident },
            body: { ty: Block },
        }, ast)
    }
})

Deno.test({
    name: "test_if_forin_parser_work",
    fn () {
        const context = new YakContext(`\
for x in xs:
    ...`, "test")
        const lexer = new Lexer(context)
        const parser = new Parser(lexer)
        const ast = parser.parse_forin_statement()

        assert_ast_eq({
            ty: ForInStatement,
            pat: { ty: Ident },
            expr: { ty: Ident },
            body: { ty: Block },
        }, ast)
    }
})

Deno.test({
    name: "test_if_return_parser_work",
    fn () {
        const context = new YakContext(`\
return x`, "test")
        const lexer = new Lexer(context)
        const parser = new Parser(lexer)
        const ast = parser.parse_return_statement()

        assert_ast_eq({
            ty: ReturnStatement,
            expr: { ty: Ident },
        }, ast)
    }
})

Deno.test({
    name: "test_if_expr_parser_work",
    fn () {
        const context = new YakContext(`\
not a == b and 1 + 2 * 3 or (4 -7) ** 3`, "test")
        const lexer = new Lexer(context)
        const parser = new Parser(lexer)
        const ast = parser.parse_expr()

        assert_ast_eq({
            ty: ExprD,
            lhs: {
                ty: ExprD,
                lhs: {
                    ty: ExprS,
                    expr: {
                        ty: ExprD,
                        lhs: { ty: Ident },
                        op: {
                            ty: Token,
                            value: "=="
                        },
                        rhs: { ty: Ident }
                    }
                },
                op: {
                    ty: Token,
                    value: "and"
                },
                rhs: {
                    ty: ExprD,
                    lhs: { ty: Literal },
                    op: {
                        ty: Token,
                        value: "+"
                    },
                    rhs: {
                        ty: ExprD,
                        lhs: { ty: Literal },
                        op: {
                            ty: Token,
                            value: "*"
                        },
                        rhs: { ty: Literal }
                    }
                }
            },
            op: {
                ty: Token,
                value: "or"
            },
            rhs: {
                ty: ExprD,
                lhs: {
                    ty: ExprG,
                    expr: {
                        ty: ExprD,
                        lhs: { ty: Literal},
                        op: {
                            ty: Token,
                            value: "-"
                        },
                        rhs: { ty: Literal}
                    }
                },
                op: {
                    ty: Token,
                    value: "**"
                },
                rhs: { ty: Literal }
            }
        }, ast)
    }
})