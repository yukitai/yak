import { Span } from "../src/error/span.ts";

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

    KDef     = "keyword def",
    KReturn  = "keyword return",
    KStruct  = "keyword struct",
    KUnsized = "keyword unsized",
    
    TUnit = "type unit",
    TList = "type list",

    NlIndent = "indent",

    Eof = "end of file"
}

interface Token {
    ty: TokenType,
    value: string | number,
    span: Span,
}

export {
    type Token,
    TokenType,
}