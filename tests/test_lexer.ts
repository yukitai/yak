import { assertEquals } from "https://deno.land/std@0.208.0/assert/assert_equals.ts";
import { Lexer } from "../grammar/lexer.ts";
import { YakContext } from "../src/context.ts";
import { Token, TokenType } from "../grammar/token.ts";

const assert_token_eq = (
  ty: TokenType,
  value: string | number,
  token: Token,
) => {
  assertEquals(value, token.value);
  assertEquals(ty, token.ty);
};

Deno.test({
  name: "test_if_ident_lexer_works",
  fn() {
    const context = new YakContext("a a::b r#+# r#if#::a a::r#if#", "test");
    const lexer = new Lexer(context);
    assert_token_eq(TokenType.Ident, "a", lexer.next_token() as Token);
    assert_token_eq(TokenType.Ident, "a::b", lexer.next_token() as Token);
    assert_token_eq(TokenType.Ident, "r#+#", lexer.next_token() as Token);
    assert_token_eq(TokenType.Ident, "r#if#::a", lexer.next_token() as Token);
    assert_token_eq(TokenType.Ident, "a::r#if#", lexer.next_token() as Token);
  },
});

Deno.test({
  name: "test_if_keyword_lexer_works",
  fn() {
    const context = new YakContext(
      "struct unsized use def if elif else while for in return",
      "test",
    );
    const lexer = new Lexer(context);
    assert_token_eq(TokenType.KStruct, "struct", lexer.next_token() as Token);
    assert_token_eq(TokenType.KUnsized, "unsized", lexer.next_token() as Token);
    assert_token_eq(TokenType.KUse, "use", lexer.next_token() as Token);
    assert_token_eq(TokenType.KDef, "def", lexer.next_token() as Token);
    assert_token_eq(TokenType.KIf, "if", lexer.next_token() as Token);
    assert_token_eq(TokenType.KElif, "elif", lexer.next_token() as Token);
    assert_token_eq(TokenType.KElse, "else", lexer.next_token() as Token);
    assert_token_eq(TokenType.KWhile, "while", lexer.next_token() as Token);
    assert_token_eq(TokenType.KFor, "for", lexer.next_token() as Token);
    assert_token_eq(TokenType.KIn, "in", lexer.next_token() as Token);
    assert_token_eq(TokenType.KReturn, "return", lexer.next_token() as Token);
  },
});

Deno.test({
  name: "test_if_operator_lexer_works",
  fn() {
    const context = new YakContext(
      "+-*/ // mod % ** and && or || not ! == != <> <=>= . =",
      "test",
    );
    const lexer = new Lexer(context);
    assert_token_eq(TokenType.OAdd, "+", lexer.next_token() as Token);
    assert_token_eq(TokenType.OSub, "-", lexer.next_token() as Token);
    assert_token_eq(TokenType.OMul, "*", lexer.next_token() as Token);
    assert_token_eq(TokenType.ODiv, "/", lexer.next_token() as Token);
    assert_token_eq(TokenType.OFloorDiv, "//", lexer.next_token() as Token);
    assert_token_eq(TokenType.OMod, "mod", lexer.next_token() as Token);
    assert_token_eq(TokenType.OMod, "%", lexer.next_token() as Token);
    assert_token_eq(TokenType.OPow, "**", lexer.next_token() as Token);
    assert_token_eq(TokenType.OAnd, "and", lexer.next_token() as Token);
    assert_token_eq(TokenType.OAnd, "&&", lexer.next_token() as Token);
    assert_token_eq(TokenType.OOr, "or", lexer.next_token() as Token);
    assert_token_eq(TokenType.OOr, "||", lexer.next_token() as Token);
    assert_token_eq(TokenType.ONot, "not", lexer.next_token() as Token);
    assert_token_eq(TokenType.ONot, "!", lexer.next_token() as Token);
    assert_token_eq(TokenType.OEq, "==", lexer.next_token() as Token);
    assert_token_eq(TokenType.ONe, "!=", lexer.next_token() as Token);
    assert_token_eq(TokenType.OLt, "<", lexer.next_token() as Token);
    assert_token_eq(TokenType.OGt, ">", lexer.next_token() as Token);
    assert_token_eq(TokenType.OLe, "<=", lexer.next_token() as Token);
    assert_token_eq(TokenType.OGe, ">=", lexer.next_token() as Token);
    assert_token_eq(TokenType.ODot, ".", lexer.next_token() as Token);
    assert_token_eq(TokenType.OAssign, "=", lexer.next_token() as Token);
  },
});

Deno.test({
  name: "test_if_indent_lexer_works",
  fn() {
    {
      const context = new YakContext("\n  \n    ", "test_2spaces");
      const lexer = new Lexer(context);
      assert_token_eq(TokenType.NlIndent, 1, lexer.next_token() as Token);
      assert_token_eq(TokenType.NlIndent, 2, lexer.next_token() as Token);
    }
    {
      const context = new YakContext("\n    \n        ", "test_4spaces");
      const lexer = new Lexer(context);
      assert_token_eq(TokenType.NlIndent, 1, lexer.next_token() as Token);
      assert_token_eq(TokenType.NlIndent, 2, lexer.next_token() as Token);
    }
    {
      const context = new YakContext("\n\t\n\t\t", "test_1tab");
      const lexer = new Lexer(context);
      assert_token_eq(TokenType.NlIndent, 1, lexer.next_token() as Token);
      assert_token_eq(TokenType.NlIndent, 2, lexer.next_token() as Token);
    }
  },
});

Deno.test({
  name: "test_if_builtin_type_lexer_works",
  fn() {
    const context = new YakContext("num str bool unit list", "test");
    const lexer = new Lexer(context);
    assert_token_eq(TokenType.BuiltinType, "num", lexer.next_token() as Token);
    assert_token_eq(TokenType.BuiltinType, "str", lexer.next_token() as Token);
    assert_token_eq(TokenType.BuiltinType, "bool", lexer.next_token() as Token);
    assert_token_eq(TokenType.BuiltinType, "unit", lexer.next_token() as Token);
    assert_token_eq(TokenType.BuiltinType, "list", lexer.next_token() as Token);
  },
});

Deno.test({
  name: "test_if_brace_lexer_works",
  fn() {
    const context = new YakContext("([{}])", "test");
    const lexer = new Lexer(context);
    assert_token_eq(TokenType.LParen, "(", lexer.next_token() as Token);
    assert_token_eq(TokenType.LBracket, "[", lexer.next_token() as Token);
    assert_token_eq(TokenType.LBrace, "{", lexer.next_token() as Token);
    assert_token_eq(TokenType.RBrace, "}", lexer.next_token() as Token);
    assert_token_eq(TokenType.RBracket, "]", lexer.next_token() as Token);
    assert_token_eq(TokenType.RParen, ")", lexer.next_token() as Token);
  },
});

Deno.test({
  name: "test_if_symbol_lexer_works",
  fn() {
    const context = new YakContext("->,:;...@|", "test");
    const lexer = new Lexer(context);
    assert_token_eq(TokenType.ThinArr, "->", lexer.next_token() as Token);
    assert_token_eq(TokenType.Comma, ",", lexer.next_token() as Token);
    assert_token_eq(TokenType.Colon, ":", lexer.next_token() as Token);
    assert_token_eq(TokenType.Semi, ";", lexer.next_token() as Token);
    assert_token_eq(TokenType.Nothing, "...", lexer.next_token() as Token);
    assert_token_eq(TokenType.At, "@", lexer.next_token() as Token);
    assert_token_eq(TokenType.Or, "|", lexer.next_token() as Token);
  },
});

Deno.test({
  name: "test_if_literal_lexer_works",
  fn() {
    const context = new YakContext(
      `'hello world' "hello world" True False 0 0.1 0.`,
      "test",
    );
    const lexer = new Lexer(context);
    assert_token_eq(
      TokenType.LiteralString,
      "hello world",
      lexer.next_token() as Token,
    );
    assert_token_eq(
      TokenType.LiteralString,
      "hello world",
      lexer.next_token() as Token,
    );
    assert_token_eq(TokenType.LiteralBool, "True", lexer.next_token() as Token);
    assert_token_eq(
      TokenType.LiteralBool,
      "False",
      lexer.next_token() as Token,
    );
    assert_token_eq(TokenType.LiteralNumber, "0", lexer.next_token() as Token);
    assert_token_eq(
      TokenType.LiteralNumber,
      "0.1",
      lexer.next_token() as Token,
    );
    assert_token_eq(TokenType.LiteralNumber, "0.", lexer.next_token() as Token);
  },
});

Deno.test({
  name: "test_if_eof_lexer_works",
  fn() {
    const context = new YakContext("", "test");
    const lexer = new Lexer(context);
    assert_token_eq(TokenType.Eof, "", lexer.next_token() as Token);
  },
});
