import { Span } from "../src/error/span.ts";
import { AST } from "./ast.ts";
import { Formatter } from "./formatter.ts";

enum TokenType {
    Ident = "ident",

    LiteralNumber = "literal number",
    LiteralString = "literal string",
    LiteralBool   = "literal bool",

    LParen   = "open paren",
    LBracket = "open bracket",
    LBrace   = "open brace",
    RParen   = "close paren",
    RBracket = "close bracket",
    RBrace   = "close brace",

    ThinArr = "thin arrow",
    Colon   = "colon",
    Comma   = "comma",
    Semi    = "semi",
    Or      = "or",
    At      = "symbol at",
    Nothing = "nothing",

    OAssign   = "operator assign",
    OAdd      = "operator +",
    OSub      = "operator -",
    OMul      = "operator *",
    ODiv      = "operator /",
    OFloorDiv = "operator //",
    OMod      = "operator %",
    OPow      = "operator **",
    ONot      = "operator not",
    OAnd      = "operator and",
    OOr       = "operator or",
    OEq       = "operator ==",
    ONe       = "operator !=",
    OLe       = "operator <=",
    OGe       = "operator >=",
    OLt       = "operator <",
    OGt       = "operator >",
    ODot      = "operator .",

    KUse     = "keyword use",
    KDef     = "keyword def",
    KReturn  = "keyword return",
    KStruct  = "keyword struct",
    KUnsized = "keyword unsized",
    KIf      = "keyword if",
    KElif    = "keyword elif",
    KElse    = "keyword else",
    KWhile   = "keyword while",
    KFor     = "keyword for",
    KIn      = "keyword in",
    
    /* TUnit = "type unit",
    TList = "type list",
    TNum  = "type num",
    TStr  = "type str",
    TBool = "type bool", */
    BuiltinType = "builtin type",

    NlIndent = "indent",

    Eof = "end of file"
}

class Token extends AST {
    ty: TokenType
    value: string | number
    span: Span

    constructor (ty: TokenType, value: string | number, span: Span) {
        super()
        this.ty = ty
        this.value = value
        this.span = span
    }

    display (fmt: Formatter) {
        fmt.write_kv("Token", this.value as string)
    }
}

export {
    Token,
    TokenType,
}