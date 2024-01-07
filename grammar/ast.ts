import { Span, to_span } from '../src/error/span.ts'
import { ToStringable } from '../src/utils.ts'
import { Formatter } from './formatter.ts'
import { Token } from './token.ts'
import * as checker from '../src/checker/type.ts'

abstract class AST {
    abstract span: Span

    _display_item<T extends string & keyof this>(
        fmt: Formatter,
        key: T,
    ) {
        const item = this[key]
        if (item instanceof Array) {
            fmt.write_kl(key, item.length)
            fmt.indent()
            item.forEach((it: AST | ToStringable) => {
                if (it instanceof AST) {
                    it.display(fmt)
                } else {
                    fmt.write(it.toString())
                }
            })
            fmt.dedent()
        } else if (item instanceof AST) {
            fmt.write_kv(key)
            fmt.indent()
            item.display(fmt)
            fmt.dedent()
        } else if (item?.toString) {
            fmt.write_kv(key, item.toString())
        }
    }

    abstract display(fmt: Formatter): void
}

class Builtin extends AST {
    span = to_span({ overallPos: 0, line: 0, offset: 0 })

    display(fmt: Formatter) {
        fmt.write('Builtin')
    }
}

class BadNode extends AST {
    span = to_span({ overallPos: 0, line: 1, offset: 0 })

    display(fmt: Formatter) {
        fmt.write('BadNode', this)
    }
}

class File extends AST {
    span = to_span({ overallPos: 0, line: 1, offset: 0 })
    definitions: Definition[]

    constructor() {
        super()
        this.definitions = []
    }

    add(definition: Definition) {
        this.definitions.push(definition)
    }

    display(fmt: Formatter) {
        fmt.write('File', this)
        fmt.indent()
        this._display_item(fmt, 'definitions')
        fmt.dedent()
    }
}

class Ident extends AST {
    span: Span
    name: Token
    binding?: Definition
    generics?: GenericsSpecify

    constructor(name: Token, generics?: GenericsSpecify) {
        super()
        this.name = name
        this.generics = generics
        this.span = name.span
    }

    resolved() {
        return this.binding !== undefined
    }

    bind(def: Definition) {
        this.binding = def
    }

    display(fmt: Formatter) {
        fmt.write('Ident', this)
        fmt.indent()
        this._display_item(fmt, 'name')
        if (this.binding) {
            fmt.write_kr('binding', this.binding)
        }
        fmt.dedent()
    }
}

type Value = BadNode | Literal | Ident
type Expr =
    | BadNode
    | Value
    | ExprCall
    | ExprS
    | ExprI
    | ExprD
    | ExprG
    | StructConstruction

class Literal extends AST {
    span: Span
    literal: Token

    constructor(literal: Token) {
        super()
        this.literal = literal
        this.span = literal.span
    }

    display(fmt: Formatter) {
        this._display_item(fmt, 'literal')
    }
}

class ExprS extends AST {
    span: Span
    op: Token
    expr: Expr

    constructor(op: Token, expr: Expr) {
        super()
        this.op = op
        this.expr = expr
        this.span = op.span.merge(expr.span)
    }

    display(fmt: Formatter) {
        fmt.write('ExprS', this)
        fmt.indent()
        this._display_item(fmt, 'op')
        this._display_item(fmt, 'expr')
        fmt.dedent()
    }
}

type StructConstructionField = {
    name: Ident
    colon: Token
    expr: Expr
}

class StructConstruction extends AST {
    span: Span
    lbrace: Token
    fields: StructConstructionField[]
    rbrace: Token

    constructor(
        lbrace: Token,
        fields: StructConstructionField[],
        rbrace: Token,
    ) {
        super()
        this.lbrace = lbrace
        this.fields = fields
        this.rbrace = rbrace
        this.span = lbrace.span.merge(rbrace.span)
    }

    display(fmt: Formatter) {
        fmt.write('StructConstruction', this)
        fmt.indent()
        this._display_item(fmt, 'lbrace')
        this._display_item(fmt, 'fields')
        this._display_item(fmt, 'rbrace')
        fmt.dedent()
    }
}

class ExprD extends AST {
    span: Span
    lhs: Expr
    op: Token
    rhs: Expr

    constructor(lhs: Expr, op: Token, rhs: Expr) {
        super()
        this.lhs = lhs
        this.op = op
        this.rhs = rhs
        this.span = lhs.span.merge(rhs.span)
    }

    display(fmt: Formatter) {
        fmt.write('ExprD', this)
        fmt.indent()
        this._display_item(fmt, 'lhs')
        this._display_item(fmt, 'op')
        this._display_item(fmt, 'rhs')
        fmt.dedent()
    }
}

class ExprI extends AST {
    span: Span
    expr: Expr
    lbracket: Token
    index: Expr
    rbracket: Token

    constructor(
        expr: Expr,
        lbracket: Token,
        index: Expr,
        rbracket: Token,
    ) {
        super()
        this.expr = expr
        this.lbracket = lbracket
        this.index = index
        this.rbracket = rbracket
        this.span = expr.span.merge(rbracket.span)
    }

    display(fmt: Formatter) {
        fmt.write('ExprG', this)
        fmt.indent()
        this._display_item(fmt, 'expr')
        this._display_item(fmt, 'lbracket')
        this._display_item(fmt, 'index')
        this._display_item(fmt, 'rbracket')
        fmt.dedent()
    }
}

class ExprCall extends AST {
    span: Span
    expr: Expr
    lparen: Token
    args: Expr[]
    rparen: Token

    constructor(
        expr: Expr,
        lparen: Token,
        args: Expr[],
        rparen: Token,
    ) {
        super()
        this.expr = expr
        this.lparen = lparen
        this.args = args
        this.rparen = rparen
        this.span = expr.span.merge(rparen.span)
    }

    display(fmt: Formatter) {
        fmt.write('ExprCall', this)
        fmt.indent()
        this._display_item(fmt, 'expr')
        this._display_item(fmt, 'lparen')
        this._display_item(fmt, 'args')
        this._display_item(fmt, 'rparen')
        fmt.dedent()
    }
}

class ExprG extends AST {
    span: Span
    lparen: Token
    expr: Expr
    rparen: Token

    constructor(lparen: Token, expr: Expr, rparen: Token) {
        super()
        this.lparen = lparen
        this.expr = expr
        this.rparen = rparen
        this.span = lparen.span.merge(rparen.span)
    }

    display(fmt: Formatter) {
        fmt.write('ExprG', this)
        fmt.indent()
        this._display_item(fmt, 'lparen')
        this._display_item(fmt, 'expr')
        this._display_item(fmt, 'rparen')
        fmt.dedent()
    }
}

type Statement =
    | BadNode
    | ExprStatement
    | IfStatement
    | WhileStatement
    | ForInStatement
    | ReturnStatement
    | LetDefinition

class ExprStatement extends AST {
    span: Span
    expr: Expr

    constructor(expr: Expr) {
        super()
        this.expr = expr
        this.span = expr.span
    }

    display(fmt: Formatter) {
        fmt.write('ExprStatement', this)
        fmt.indent()
        this._display_item(fmt, 'expr')
        fmt.dedent()
    }
}

class IfStatement extends AST {
    span: Span
    if: Token
    expr: Expr
    colon: Token
    body: Block
    elif_cases: ElifCase[]
    else_case?: ElseCase

    constructor(
        kif: Token,
        expr: Expr,
        colon: Token,
        body: Block,
        elif_cases: ElifCase[],
        else_case: ElseCase | undefined,
    ) {
        super()
        this.if = kif
        this.expr = expr
        this.colon = colon
        this.body = body
        this.elif_cases = elif_cases
        this.else_case = else_case
        this.span = kif.span.merge(body.span)
    }

    display(fmt: Formatter) {
        fmt.write('IfStatement', this)
        fmt.indent()
        this._display_item(fmt, 'if')
        this._display_item(fmt, 'expr')
        this._display_item(fmt, 'colon')
        this._display_item(fmt, 'body')
        this._display_item(fmt, 'elif_cases')
        this.else_case &&
            this._display_item(fmt, 'else_case')
        fmt.dedent()
    }
}

class ElifCase extends AST {
    span: Span
    elif: Token
    expr: Expr
    colon: Token
    body: Block

    constructor(
        elif: Token,
        expr: Expr,
        colon: Token,
        body: Block,
    ) {
        super()
        this.elif = elif
        this.expr = expr
        this.colon = colon
        this.body = body
        this.span = elif.span.merge(body.span)
    }

    display(fmt: Formatter) {
        fmt.write('ElifCase', this)
        fmt.indent()
        this._display_item(fmt, 'elif')
        this._display_item(fmt, 'expr')
        this._display_item(fmt, 'colon')
        this._display_item(fmt, 'body')
        fmt.dedent()
    }
}

class ElseCase extends AST {
    span: Span
    else: Token
    colon: Token
    body: Block

    constructor(
        kelse: Token,
        colon: Token,
        body: Block,
    ) {
        super()
        this.else = kelse
        this.colon = colon
        this.body = body
        this.span = kelse.span.merge(body.span)
    }

    display(fmt: Formatter) {
        fmt.write('ElseCase', this)
        fmt.indent()
        this._display_item(fmt, 'else')
        this._display_item(fmt, 'colon')
        this._display_item(fmt, 'body')
        fmt.dedent()
    }
}

class WhileStatement extends AST {
    span: Span
    while: Token
    expr: Expr
    colon: Token
    body: Block

    constructor(
        kwhile: Token,
        expr: Expr,
        colon: Token,
        body: Block,
    ) {
        super()
        this.while = kwhile
        this.expr = expr
        this.colon = colon
        this.body = body
        this.span = kwhile.span.merge(body.span)
    }

    display(fmt: Formatter) {
        fmt.write('WhileStatement', this)
        fmt.indent()
        this._display_item(fmt, 'while')
        this._display_item(fmt, 'expr')
        this._display_item(fmt, 'colon')
        this._display_item(fmt, 'body')
        fmt.dedent()
    }
}

class ForInStatement extends AST {
    span: Span
    for: Token
    pat: Ident /* replace it with Pattern */
    in: Token
    expr: Expr
    colon: Token
    body: Block

    constructor(
        kfor: Token,
        pat: Ident,
        kin: Token,
        expr: Expr,
        colon: Token,
        body: Block,
    ) {
        super()
        this.for = kfor
        this.pat = pat
        this.in = kin
        this.expr = expr
        this.colon = colon
        this.body = body
        this.span = kfor.span.merge(body.span)
    }

    display(fmt: Formatter) {
        fmt.write('ForInStatement', this)
        fmt.indent()
        this._display_item(fmt, 'for')
        this._display_item(fmt, 'pat')
        this._display_item(fmt, 'in')
        this._display_item(fmt, 'expr')
        this._display_item(fmt, 'colon')
        this._display_item(fmt, 'body')
        fmt.dedent()
    }
}

class ReturnStatement extends AST {
    span: Span
    return: Token
    expr?: Expr

    constructor(kreturn: Token, expr?: Expr) {
        super()
        this.return = kreturn
        this.expr = expr
        this.span = expr ? kreturn.span.merge(expr.span) : kreturn.span
    }

    display(fmt: Formatter) {
        fmt.write('ReturnStatement', this)
        fmt.indent()
        this._display_item(fmt, 'return')
        this.expr && this._display_item(fmt, 'expr')
        fmt.dedent()
    }
}

type Definition =
    | BadNode
    | UseDefinition
    | FuncDefinition
    | StructDefinition
    | LetDefinition
    | TypedIdent

class UseDefinition extends AST {
    span: Span
    use: Token
    names: Ident[]

    constructor(use: Token) {
        super()
        this.use = use
        this.names = []
        this.span = use.span
    }

    add(name: Ident) {
        this.names.push(name)
        this.span = this.span.merge(name.span)
    }

    display(fmt: Formatter) {
        fmt.write('UseDefinition', this)
        fmt.indent()
        this._display_item(fmt, 'use')
        this._display_item(fmt, 'names')
        fmt.dedent()
    }
}

class FuncDefinition extends AST {
    span: Span
    def: Token
    func_name: Ident
    generics?: Generics
    lparen: Token
    args: TypedIdent[]
    rparen: Token
    thinarr?: Token
    ret_t: Type
    colon: Token
    body: Block

    constructor(
        def: Token,
        func_name: Ident,
        lparen: Token,
        args: TypedIdent[],
        rparen: Token,
        colon: Token,
        body: Block,
        thinarr?: Token,
        ret_t?: Type,
        generics?: Generics,
    ) {
        super()
        this.def = def
        this.func_name = func_name
        this.lparen = lparen
        this.args = args
        this.rparen = rparen
        this.colon = colon
        this.thinarr = thinarr
        this.ret_t = ret_t ?? new InferType(func_name.name)
        this.body = body
        this.span = def.span.merge(colon.span)
        this.generics = generics
    }

    display(fmt: Formatter) {
        fmt.write('FuncDefinition', this)
        fmt.indent()
        this._display_item(fmt, 'def')
        this._display_item(fmt, 'func_name')
        this.generics && this._display_item(fmt, 'generics')
        this._display_item(fmt, 'lparen')
        this._display_item(fmt, 'args')
        this._display_item(fmt, 'rparen')
        this.thinarr && this._display_item(fmt, 'thinarr')
        this._display_item(fmt, 'ret_t')
        this._display_item(fmt, 'colon')
        this._display_item(fmt, 'body')
        fmt.dedent()
    }
}

class StructDefinition extends AST {
    span: Span
    struct: Token
    ident: Ident
    generics?: Generics
    colon: Token
    fields: TypedIdent[]

    constructor(
        struct: Token,
        ident: Ident,
        colon: Token,
        generics?: Generics,
    ) {
        super()
        this.struct = struct
        this.ident = ident
        this.colon = colon
        this.fields = []
        this.generics = generics
        this.span = struct.span.merge(colon.span)
    }

    add(field: TypedIdent) {
        this.fields.push(field)
        this.span = this.span.merge(field.span)
    }

    display(fmt: Formatter) {
        fmt.write('StructDefinition', this)
        fmt.indent()
        this._display_item(fmt, 'struct')
        this._display_item(fmt, 'ident')
        this._display_item(fmt, 'colon')
        this._display_item(fmt, 'fields')
        fmt.dedent()
    }
}

class LetDefinition extends AST {
    span: Span
    let: Token
    ident: TypedIdent
    oassign: Token
    expr: Expr

    constructor(
        klet: Token,
        ident: TypedIdent,
        oassign: Token,
        expr: Expr,
    ) {
        super()
        this.let = klet
        this.ident = ident
        this.oassign = oassign
        this.expr = expr
        this.span = klet.span.merge(expr.span)
    }

    display(fmt: Formatter) {
        fmt.write('LetDefinition', this)
        fmt.indent()
        this._display_item(fmt, 'let')
        this._display_item(fmt, 'ident')
        this._display_item(fmt, 'oassign')
        this._display_item(fmt, 'expr')
        fmt.dedent()
    }
}

class FuncType extends AST {
    span: Span
    lor: Token
    args: Type[]
    ror: Token
    thinarr: Token
    ret_t: Type

    constructor(
        lor: Token,
        args: Type[],
        ror: Token,
        thinarr: Token,
        ret_t: Type,
    ) {
        super()
        this.lor = lor
        this.args = args
        this.ror = ror
        this.thinarr = thinarr
        this.ret_t = ret_t
        this.span = lor.span.merge(ret_t.span)
    }

    display(fmt: Formatter): void {
        fmt.write('FuncType', this)
        fmt.indent()
        this._display_item(fmt, 'lor')
        this._display_item(fmt, 'args')
        this._display_item(fmt, 'ror')
        this._display_item(fmt, 'thinarr')
        this._display_item(fmt, 'ret_t')
        fmt.dedent()
    }
}

class TypedIdent extends AST {
    span: Span
    ident: Ident
    colon?: Token
    type: Type
    resolved_type?: checker.Type

    constructor(ident: Ident, colon?: Token, type?: Type) {
        super()
        this.ident = ident
        this.colon = colon
        this.type = type ?? new InferType(ident.name)
        this.span = type ? ident.span.merge(type.span) : ident.span
    }

    display(fmt: Formatter) {
        fmt.write('TypedIdent', this)
        fmt.indent()
        this._display_item(fmt, 'ident')
        this.colon && this._display_item(fmt, 'colon')
        this._display_item(fmt, 'type')
        fmt.dedent()
    }
}

class Block extends AST {
    span: Span
    stmts: Statement[]

    constructor(span: Span) {
        super()
        this.stmts = []
        this.span = span
    }

    add(stmt: Statement) {
        this.stmts.push(stmt)
        this.span = this.span.merge(stmt.span)
    }

    display(fmt: Formatter) {
        fmt.write('Block', this)
        fmt.indent()
        this._display_item(fmt, 'stmts')
        fmt.dedent()
    }
}

class Generics extends AST {
    span: Span
    lt: Token
    generics: Ident[]
    gt: Token

    constructor(
        lt: Token,
        generics: Ident[],
        gt: Token,
    ) {
        super()
        this.lt = lt
        this.generics = generics
        this.gt = gt
        this.span = lt.span.merge(gt.span)
    }

    display(fmt: Formatter) {
        fmt.write('Generics', this)
        fmt.indent()
        this._display_item(fmt, 'lt')
        this._display_item(fmt, 'generics')
        this._display_item(fmt, 'gt')
        fmt.dedent()
    }
}

class GenericsSpecify extends AST {
    span: Span
    lt: Token
    generics: Type[]
    gt: Token

    constructor(
        lt: Token,
        generics: Type[],
        gt: Token,
    ) {
        super()
        this.lt = lt
        this.generics = generics
        this.gt = gt
        this.span = lt.span.merge(gt.span)
    }

    display(fmt: Formatter) {
        fmt.write('GenericsSpecif', this)
        fmt.indent()
        this._display_item(fmt, 'lt')
        this._display_item(fmt, 'generics')
        this._display_item(fmt, 'gt')
        fmt.dedent()
    }
}

type Type =
    | BadNode
    | BuiltinType
    | ArrayType
    | GenericType
    | UnsizedType
    | NameType
    | InferType

class BuiltinType extends AST {
    span: Span
    type: Token

    constructor(type: Token) {
        super()
        this.type = type
        this.span = type.span
    }

    display(fmt: Formatter) {
        fmt.write('BuiltinType', this)
        fmt.indent()
        this._display_item(fmt, 'type')
        fmt.dedent()
    }
}

class GenericType extends AST {
    span: Span
    type: Type
    lt: Token
    generics: Type[]
    gt: Token

    constructor(
        type: Type,
        lt: Token,
        generics: Type[],
        gt: Token,
    ) {
        super()
        this.type = type
        this.lt = lt
        this.generics = generics
        this.gt = gt
        this.span = type.span.merge(gt.span)
    }

    display(fmt: Formatter) {
        fmt.write('GenericType', this)
        fmt.indent()
        this._display_item(fmt, 'type')
        this._display_item(fmt, 'lt')
        this._display_item(fmt, 'generics')
        this._display_item(fmt, 'gt')
        fmt.dedent()
    }
}

class UnsizedType extends AST {
    span: Span
    unsized: Token
    type: Type

    constructor(unsized: Token, type: Type) {
        super()
        this.unsized = unsized
        this.type = type
        this.span = unsized.span.merge(type.span)
    }

    display(fmt: Formatter) {
        fmt.write('UnsizedType', this)
        fmt.indent()
        this._display_item(fmt, 'unsized')
        this._display_item(fmt, 'type')
        fmt.dedent()
    }
}

class ArrayType extends AST {
    span: Span
    lbracket: Token
    type: Type
    semi: Token
    llnum: Token
    rbracket: Token

    constructor(
        lbracket: Token,
        type: Type,
        semi: Token,
        llnum: Token,
        rbracket: Token,
    ) {
        super()
        this.lbracket = lbracket
        this.type = type
        this.semi = semi
        this.llnum = llnum
        this.rbracket = rbracket
        this.span = lbracket.span.merge(rbracket.span)
    }

    display(fmt: Formatter) {
        fmt.write('UnsizedType', this)
        fmt.indent()
        this._display_item(fmt, 'lbracket')
        this._display_item(fmt, 'type')
        this._display_item(fmt, 'semi')
        this._display_item(fmt, 'llnum')
        this._display_item(fmt, 'rbracket')
        fmt.dedent()
    }
}

class NameType extends AST {
    span: Span
    name: Token

    constructor(name: Token) {
        super()
        this.name = name
        this.span = name.span
    }

    display(fmt: Formatter) {
        fmt.write('NameType', this)
        fmt.indent()
        this._display_item(fmt, 'name')
        fmt.dedent()
    }
}

class InferType extends AST {
    span: Span
    infer_result?: checker.Type
    target: Token

    constructor(target: Token) {
        super()
        this.target = target
        this.span = target.span
    }

    display(fmt: Formatter) {
        fmt.write('InferType', this)
        fmt.indent()
        this._display_item(fmt, 'target')
        if (this.infer_result) {
            fmt.write_kv('infer_result', this.infer_result.toString())
        }
        fmt.dedent()
    }
}

export {
    ArrayType,
    AST,
    BadNode,
    Block,
    Builtin,
    BuiltinType,
    type Definition,
    ElifCase,
    ElseCase,
    type Expr,
    ExprCall,
    ExprD,
    ExprG,
    ExprI,
    ExprS,
    ExprStatement,
    File,
    ForInStatement,
    FuncDefinition,
    FuncType,
    Generics,
    GenericsSpecify,
    GenericType,
    Ident,
    IfStatement,
    InferType,
    LetDefinition,
    Literal,
    NameType,
    ReturnStatement,
    type Statement,
    StructConstruction,
    type StructConstructionField,
    StructDefinition,
    type Type,
    TypedIdent,
    UnsizedType,
    UseDefinition,
    type Value,
    WhileStatement,
}
