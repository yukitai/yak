import { YakContext } from '../src/context.ts'
import { YakError } from '../src/error/error.ts'
import { DifferenceHelp } from '../src/error/help.ts'
import { ListInfo } from '../src/error/info.ts'
import { YakIndentError, YakSyntaxError } from '../src/error/kinds.ts'
import { Difference } from '../src/error/preview.ts'
import { Nullable } from '../src/utils.ts'
import {
    ArrayType,
    BadNode,
    Block,
    BuiltinType,
    Definition,
    ElifCase,
    ElseCase,
    Expr,
    ExprCall,
    ExprD,
    ExprG,
    ExprI,
    ExprS,
    ExprStatement,
    File,
    ForInStatement,
    FuncDefinition,
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
    Statement,
    StructConstruction,
    StructConstructionField,
    StructDefinition,
    Type,
    TypedIdent,
    UnsizedType,
    UseDefinition,
    WhileStatement,
} from './ast.ts'
import { Lexer } from './lexer.ts'
import { Token, TokenType } from './token.ts'

class Parser {
    private offset: number
    private indent_count: number
    private lexer: Lexer
    private tokens: Token[]
    errors: YakError[]
    context: YakContext

    constructor(lexer: Lexer) {
        this.offset = 0
        this.indent_count = 0
        this.context = lexer.context
        this.lexer = lexer
        this.tokens = []
        this.errors = []
        while (true) {
            const token = lexer.next_token()

            if (token instanceof YakError) {
                this.errors.push(token)
            } else {
                this.tokens.push(token as Token)
                if ((token as Token).ty == TokenType.Eof) {
                    break
                }
            }
        }
    }

    private next() {
        return this.tokens[this.offset++]
    }

    private peek() {
        return this.tokens[this.offset]
    }

    private move(by = 1) {
        this.offset += by
    }

    private indent() {
        this.indent_count += 1
    }

    private dedent() {
        this.indent_count -= 1
    }

    private has_next(): boolean {
        return this.offset < this.tokens.length
    }

    private is_eof(): boolean {
        return !this.has_next() ||
            this.peek().ty === TokenType.Eof
    }

    private assert_next(ty: TokenType): Nullable<Token> {
        const token = this.peek()
        if (token.ty === ty) {
            this.move()
            return token
        }
        return null
    }

    private assert_next_error(
        ty: TokenType,
        expects?: TokenType[],
    ): Token {
        const token = this.peek()
        if (token.ty === ty) {
            this.move()
            return token
        }

        expects = expects ?? [ty]

        this.expected(token, expects)
        return token
    }

    private assert_ident_error(): Ident {
        const ident = this.assert_next_error(
            TokenType.Ident,
        )
        return new Ident(ident)
    }

    private expected(token: Token, expects: TokenType[]) {
        if (expects.length === 1) {
            this.errors.push(
                new YakError(
                    YakSyntaxError,
                    `unexpected token \`${token.ty}\`, expected \`${
                        expects[0]
                    }\``,
                    token.span,
                    this.context,
                    [],
                ),
            )
        } else {
            this.errors.push(
                new YakError(
                    YakSyntaxError,
                    `unexpected token \`${token.ty}\``,
                    token.span,
                    this.context,
                    [
                        new ListInfo(
                            'the compiler expected the tokens below:',
                            expects,
                        ),
                    ],
                ),
            )
        }
        // this.move_to_next_definition()
    }

    assert_indent(): boolean {
        const token = this.peek()
        if (token.ty !== TokenType.NlIndent) {
            return false
        }
        if (token.value as number !== this.indent_count) {
            return false
        }
        this.move()
        return true
    }

    assert_indent_error(): boolean {
        const _error = () => {
            this.errors.push(
                new YakError(
                    YakIndentError,
                    'expected body',
                    token.span,
                    this.context,
                    [
                        new DifferenceHelp(
                            'add a mark here',
                            this.context.lines.slice(
                                token.span.start.line - 1,
                                token.span.end.line,
                            ),
                            [
                                {
                                    operation: 'add',
                                    value: [],
                                },
                                {
                                    operation: 'add',
                                    value: [
                                        ' '.repeat(
                                            this.indent_count *
                                                this.lexer
                                                    .indent_size!,
                                        ) +
                                        '...',
                                    ],
                                },
                            ] as Difference,
                        ),
                    ],
                ),
            )
        }
        const token = this.peek()
        if (token.ty !== TokenType.NlIndent) {
            _error()
            return false
        }
        if (token.value as number !== this.indent_count) {
            _error()
            return false
        }
        this.move()
        return true
    }

    has_error(): boolean {
        return this.errors.length > 0
    }

    parse_file(): File {
        this.move_to_next_definition()

        const ast = new File()
        while (!this.is_eof()) {
            if (this.has_error()) return ast
            ast.add(this.parse_definition())
            this.move_to_next_definition()
        }
        return ast
    }

    move_to_next_definition() {
        while (!this.is_eof()) {
            const token = this.peek()
            if (
                token.ty === TokenType.KDef ||
                token.ty === TokenType.KUse ||
                token.ty === TokenType.KLet ||
                token.ty === TokenType.KStruct
            ) break
            this.move()
        }
    }

    parse_if_generics(): Generics | undefined {
        let lt: Token
        if (!(lt = this.assert_next(TokenType.OLt)!)) return
        const generics = []
        let gt: Token | undefined
        if (!(gt = this.assert_next(TokenType.OGt)!)) {
            while (!this.is_eof()) {
                generics.push(this.assert_ident_error())
                if (this.assert_next(TokenType.Comma)) {
                    continue
                } else if ((gt = this.assert_next(TokenType.OGt)!)) {
                    break
                }
                this.expected(this.next(), [
                    TokenType.Comma,
                    TokenType.OGt,
                ])
            }
        }
        return new Generics(lt, generics, gt!)
    }

    parse_if_generics_specify(): GenericsSpecify | undefined {
        let lt: Token
        if (!(lt = this.assert_next(TokenType.OLt)!)) return
        const generics = []
        let gt: Token | undefined
        if (!(gt = this.assert_next(TokenType.OGt)!)) {
            while (!this.is_eof()) {
                generics.push(this.parse_type())
                if (this.assert_next(TokenType.Comma)) {
                    continue
                } else if ((gt = this.assert_next(TokenType.OGt)!)) {
                    break
                }
                this.expected(this.next(), [
                    TokenType.Comma,
                    TokenType.OGt,
                ])
            }
        }
        return new GenericsSpecify(lt, generics, gt!)
    }

    parse_definition(): Definition {
        const token = this.peek()
        switch (token.ty) {
            case TokenType.KDef:
                return this.parse_func_definition()
            case TokenType.KUse:
                return this.parse_use_definition()
            case TokenType.KStruct:
                return this.parse_struct_definition()
            case TokenType.KLet:
                return this.parse_let_definition()
            default:
                this.expected(token, [
                    TokenType.KUse,
                    TokenType.KDef,
                    TokenType.KStruct,
                ])
                return new BadNode()
        }
    }

    parse_func_definition(): FuncDefinition {
        const def = this.assert_next_error(TokenType.KDef)
        const func_name = this.assert_ident_error()
        const generics = this.parse_if_generics()
        const lparen = this.assert_next_error(
            TokenType.LParen,
        )
        const args = []
        let rparen: Token
        if (
            !(rparen = this.assert_next(TokenType.RParen)!)
        ) {
            while (!this.is_eof()) {
                args.push(this.parse_typed_ident())
                if (this.assert_next(TokenType.Comma)) {
                    continue
                } else if (
                    (rparen = this.assert_next(
                        TokenType.RParen,
                    )!)
                ) {
                    break
                }
                this.expected(this.peek(), [
                    TokenType.Comma,
                    TokenType.RParen,
                ])
            }
        }
        const thinarr = this.assert_next(TokenType.ThinArr)
        let ret_t: Type | undefined
        if (thinarr) {
            ret_t = this.parse_type()
        }
        const colon = this.assert_next_error(
            TokenType.Colon,
            [
                TokenType.Colon,
                TokenType.ThinArr,
            ],
        )
        const block = this.parse_block()
        return new FuncDefinition(
            def,
            func_name,
            lparen,
            args,
            rparen,
            colon,
            block,
            colon,
            ret_t,
            generics,
        )
    }

    parse_typed_ident(): TypedIdent {
        const ident = this.assert_ident_error()
        const colon = this.assert_next(TokenType.Colon) ??
            undefined
        let type: Type | undefined
        if (colon) {
            type = this.parse_type()
        }
        return new TypedIdent(ident, colon, type)
    }

    parse_use_definition(): UseDefinition {
        const use = this.assert_next_error(TokenType.KUse)
        const ast = new UseDefinition(use)
        while (!this.is_eof()) {
            ast.add(this.assert_ident_error())
            if (!this.assert_next(TokenType.Comma)) {
                break
            }
        }
        return ast
    }

    parse_struct_definition(): StructDefinition {
        const struct = this.assert_next_error(TokenType.KStruct)
        const ident = this.assert_ident_error()
        const generics = this.parse_if_generics()
        const colon = this.assert_next_error(TokenType.Colon)
        const ast = new StructDefinition(struct, ident, colon, generics)
        this.indent()
        while (!this.is_eof()) {
            if (!this.assert_indent()) {
                break
            }
            ast.add(this.parse_typed_ident())
        }
        this.dedent()
        return ast
    }

    parse_let_definition(): LetDefinition {
        const klet = this.assert_next_error(TokenType.KLet)
        const ident = this.parse_typed_ident()
        const oassign = this.assert_next_error(TokenType.OAssign)
        const expr = this.parse_expr()
        return new LetDefinition(klet, ident, oassign, expr)
    }

    parse_type(): Type {
        return this.parse_type_generics()
    }

    parse_type_generics(): Type {
        const type = this.parse_type_binary()
        let lt: Token | undefined
        if (
            (lt = this.assert_next(TokenType.OLt) ??
                undefined)
        ) {
            const generics = []
            let gt: Token | undefined
            while (!this.is_eof()) {
                generics.push(this.parse_type())
                if (this.assert_next(TokenType.Comma)) {
                    continue
                } else if (
                    (gt = this.assert_next(TokenType.OGt)!)
                ) {
                    break
                }
                this.expected(this.peek(), [
                    TokenType.Comma,
                    TokenType.OGt,
                ])
            }
            return new GenericType(type, lt, generics, gt!)
        }
        return type
    }

    parse_unsized_type(): UnsizedType {
        const unsized = this.assert_next_error(
            TokenType.KUnsized,
        )
        const type = this.parse_type()
        return new UnsizedType(unsized, type)
    }

    parse_array_type(): ArrayType {
        const lbracket = this.assert_next_error(
            TokenType.LBracket,
        )
        const type = this.parse_type()
        const semi = this.assert_next_error(TokenType.Semi)
        const llnum = this.assert_next_error(
            TokenType.LiteralNumber,
        )
        const rbracket = this.assert_next_error(
            TokenType.RBracket,
        )
        return new ArrayType(
            lbracket,
            type,
            semi,
            llnum,
            rbracket,
        )
    }

    parse_type_binary(): Type {
        const token = this.peek()
        switch (token.ty) {
            case TokenType.Underline:
                this.move()
                return new InferType(token)
            case TokenType.KUnsized:
                return this.parse_unsized_type()
            case TokenType.LBracket:
                return this.parse_array_type()
            case TokenType.Ident:
                this.move()
                return new NameType(token)
            case TokenType.BuiltinType:
                this.move()
                return new BuiltinType(token)
            default:
                this.expected(token, [
                    TokenType.KUnsized,
                    TokenType.Ident,
                    TokenType.BuiltinType,
                ])
                return new BadNode()
        }
    }

    parse_block(): Block {
        this.indent()
        if (!this.assert_indent_error()) {
            this.dedent()
            return new BadNode() as unknown as Block
        }
        const ast = new Block(this.peek().span)
        let flag = true
        if (this.peek().ty === TokenType.Nothing) {
            this.move()
            flag = false
        }
        while (flag) {
            ast.add(this.parse_statement())
            const next = this.peek()
            if (next.ty === TokenType.Eof) {
                break
            } else if (next.ty !== TokenType.NlIndent) {
                this.expected(next, [TokenType.NlIndent])
            } else if (
                next.value as number > this.indent_count
            ) {
                const start = next.span.start
                const end = next.span.end
                this.errors.push(
                    new YakError(
                        YakIndentError,
                        `extra indent`,
                        next.span,
                        this.context,
                        [
                            new DifferenceHelp(
                                'current the indent, and it might be possiblely like this:',
                                this.context.lines.slice(
                                    start.line,
                                    end.line,
                                ),
                                [
                                    {
                                        operation: 'modify',
                                        value: [
                                            ' '.repeat(
                                                this.indent_count *
                                                    this.lexer
                                                        .indent_size!,
                                            ) +
                                            this.context
                                                .lines[
                                                    start
                                                        .line
                                                ]
                                                .trim(),
                                        ],
                                    },
                                ] as Difference,
                            ),
                        ],
                    ),
                )
                this.move()
            } else if (
                next.value as number < this.indent_count
            ) {
                break
            }
            this.move()
        }
        this.dedent()
        return ast
    }

    parse_statement(): Statement {
        const token = this.peek()
        switch (token.ty) {
            case TokenType.KIf:
                return this.parse_if_statement()
            case TokenType.KWhile:
                return this.parse_while_statement()
            case TokenType.KFor:
                return this.parse_forin_statement()
            case TokenType.KReturn:
                return this.parse_return_statement()
            case TokenType.KLet:
                return this.parse_let_definition()
            default:
                return new ExprStatement(this.parse_expr())
        }
    }

    parse_if_statement(): IfStatement {
        const kif = this.assert_next_error(TokenType.KIf)
        const expr = this.parse_expr()
        const colon = this.assert_next_error(
            TokenType.Colon,
        )
        const body = this.parse_block()
        const elif_cases = []
        this.move()
        if (
            this.peek().ty !== TokenType.KElif &&
            this.peek().ty !== TokenType.KElse
        ) {
            this.move(-1)
        }
        while (this.peek().ty === TokenType.KElif) {
            elif_cases.push(this.parse_elif_case())
            this.move()
        }
        let else_case: ElseCase | undefined
        if (this.peek().ty === TokenType.KElse) {
            else_case = this.parse_else_case()
        }
        return new IfStatement(
            kif,
            expr,
            colon,
            body,
            elif_cases,
            else_case,
        )
    }

    private parse_elif_case(): ElifCase {
        const kelif = this.assert_next_error(
            TokenType.KElif,
        )
        const expr = this.parse_expr()
        const colon = this.assert_next_error(
            TokenType.Colon,
        )
        const body = this.parse_block()
        return new ElifCase(kelif, expr, colon, body)
    }

    private parse_else_case(): ElseCase {
        const kelse = this.assert_next_error(
            TokenType.KElse,
        )
        const colon = this.assert_next_error(
            TokenType.Colon,
        )
        const body = this.parse_block()
        return new ElseCase(kelse, colon, body)
    }

    parse_while_statement(): WhileStatement {
        const kwhile = this.assert_next_error(
            TokenType.KWhile,
        )
        const expr = this.parse_expr()
        const colon = this.assert_next_error(
            TokenType.Colon,
        )
        const body = this.parse_block()
        return new WhileStatement(kwhile, expr, colon, body)
    }

    parse_forin_statement(): ForInStatement {
        const kfor = this.assert_next_error(TokenType.KFor)
        const ident = this.assert_ident_error()
        const kin = this.assert_next_error(TokenType.KIn)
        const expr = this.parse_expr()
        const colon = this.assert_next_error(
            TokenType.Colon,
        )
        const body = this.parse_block()
        return new ForInStatement(
            kfor,
            ident,
            kin,
            expr,
            colon,
            body,
        )
    }

    parse_return_statement(): ReturnStatement {
        const kreturn = this.assert_next_error(
            TokenType.KReturn,
        )
        let expr: Expr | undefined
        if (this.peek().ty !== TokenType.NlIndent) {
            expr = this.parse_expr()
        }
        return new ReturnStatement(kreturn, expr)
    }

    parse_expr(): Expr {
        return this.parse_expr_assign()
    }

    parse_expr_assign(): Expr {
        const lhs = this.parse_expr_or()
        const op = this.assert_next(TokenType.OAssign)
        if (op) {
            const rhs = this.parse_expr()
            return new ExprD(lhs, op, rhs)
        }
        return lhs
    }

    parse_expr_or(): Expr {
        let expr = this.parse_expr_and()
        while (!this.is_eof()) {
            const op = this.peek()
            if (op.ty === TokenType.OOr) {
                this.move()
                const rhs = this.parse_expr_and()
                expr = new ExprD(expr, op, rhs)
            } else {
                break
            }
        }
        return expr
    }

    parse_expr_and(): Expr {
        let expr = this.parse_expr_not()
        while (!this.is_eof()) {
            const op = this.peek()
            if (op.ty === TokenType.OAnd) {
                this.move()
                const rhs = this.parse_expr_not()
                expr = new ExprD(expr, op, rhs)
            } else {
                break
            }
        }
        return expr
    }

    parse_expr_not(): Expr {
        const ops = []
        while (!this.is_eof()) {
            const op = this.peek()
            if (op.ty === TokenType.ONot) {
                this.move()
                ops.push(op)
            } else {
                break
            }
        }
        let expr = this.parse_expr_compare()
        ops.toReversed().forEach((op) => {
            expr = new ExprS(op, expr)
        })
        return expr
    }

    parse_expr_compare(): Expr {
        let expr = this.parse_expr_term()
        while (!this.is_eof()) {
            const op = this.peek()
            if (
                op.ty === TokenType.OEq ||
                op.ty === TokenType.ONe ||
                op.ty === TokenType.OLt ||
                op.ty === TokenType.OGt ||
                op.ty === TokenType.OLe ||
                op.ty === TokenType.OGe
            ) {
                this.move()
                const rhs = this.parse_expr_term()
                expr = new ExprD(expr, op, rhs)
            } else {
                break
            }
        }
        return expr
    }

    parse_expr_term(): Expr {
        let expr = this.parse_expr_factor()
        while (!this.is_eof()) {
            const op = this.peek()
            if (
                op.ty === TokenType.OAdd ||
                op.ty === TokenType.OSub
            ) {
                this.move()
                const rhs = this.parse_expr_factor()
                expr = new ExprD(expr, op, rhs)
            } else {
                break
            }
        }
        return expr
    }

    parse_expr_factor(): Expr {
        let expr = this.parse_expr_pow()
        while (!this.is_eof()) {
            const op = this.peek()
            if (
                op.ty === TokenType.OMul ||
                op.ty === TokenType.ODiv ||
                op.ty === TokenType.OFloorDiv ||
                op.ty === TokenType.OMod
            ) {
                this.move()
                const rhs = this.parse_expr_pow()
                expr = new ExprD(expr, op, rhs)
            } else {
                break
            }
        }
        return expr
    }

    parse_expr_pow(): Expr {
        let expr = this.parse_expr_call()
        while (!this.is_eof()) {
            const op = this.peek()
            if (op.ty === TokenType.OPow) {
                this.move()
                const rhs = this.parse_expr_call()
                expr = new ExprD(expr, op, rhs)
            } else {
                break
            }
        }
        return expr
    }

    parse_expr_call(): Expr {
        let expr = this.parse_expr_unary()
        while (!this.is_eof()) {
            const next = this.peek()
            if (next.ty === TokenType.LParen) {
                this.move()
                const args = []
                let rparen: Token | undefined
                if (!(rparen = this.assert_next(TokenType.RParen)!)) {
                    while (!this.is_eof()) {
                        args.push(this.parse_expr())
                        if (this.assert_next(TokenType.Comma)) {
                            continue
                        } else if (
                            (rparen = this.assert_next(
                                TokenType.RParen,
                            )!)
                        ) {
                            break
                        }
                        this.expected(this.peek(), [
                            TokenType.Comma,
                            TokenType.RParen,
                        ])
                    }
                }
                expr = new ExprCall(
                    expr,
                    next,
                    args,
                    rparen!,
                )
            } else if (next.ty === TokenType.LBracket) {
                this.move()
                const index = this.parse_expr()
                const rbracket = this.assert_next_error(
                    TokenType.RBracket,
                )
                expr = new ExprI(
                    expr,
                    next,
                    index,
                    rbracket,
                )
            } else if (next.ty === TokenType.ODot) {
                this.move()
                const rhs = this.parse_expr()
                expr = new ExprD(expr, next, rhs)
            } else {
                break
            }
        }
        return expr
    }

    parse_expr_unary(): Expr {
        const ops = []
        while (!this.is_eof()) {
            const op = this.peek()
            if (
                op.ty === TokenType.OAdd ||
                op.ty === TokenType.OSub
            ) {
                this.move()
                ops.push(op)
            } else {
                break
            }
        }
        let expr = this.parse_expr_binary()
        ops.toReversed().forEach((op) => {
            expr = new ExprS(op, expr)
        })
        return expr
    }

    parse_expr_binary(): Expr {
        const token = this.peek()
        switch (token.ty) {
            case TokenType.LiteralNumber:
            case TokenType.LiteralString:
            case TokenType.LiteralBool:
                this.move()
                return new Literal(token)
            case TokenType.Ident: {
                this.move()
                let generics: GenericsSpecify | undefined
                if (this.assert_next(TokenType.DColon)) {
                    generics = this.parse_if_generics_specify()
                }
                return new Ident(token, generics)
            }
            case TokenType.LParen:
                this.move()
                return new ExprG(
                    token,
                    this.parse_expr(),
                    this.assert_next_error(
                        TokenType.RParen,
                    ),
                )
            case TokenType.LBrace: {
                this.move()
                const fields: StructConstructionField[] = []
                let rbrace: Token | undefined
                if (!(rbrace = this.assert_next(TokenType.RBrace)!)) {
                    while (!this.is_eof()) {
                        const name = this.assert_ident_error()
                        const colon = this.assert_next_error(TokenType.Colon)
                        const expr = this.parse_expr()
                        fields.push({ name, colon, expr })
                        if (this.assert_next(TokenType.Comma)) {
                            continue
                        } else if (
                            (rbrace = this.assert_next(TokenType.RBrace)!)
                        ) {
                            break
                        }
                        this.expected(this.peek(), [
                            TokenType.Comma,
                            TokenType.RBrace,
                        ])
                    }
                }
                return new StructConstruction(token, fields, rbrace!)
            }
            default:
                this.move()
                this.expected(token, [
                    TokenType.LiteralNumber,
                    TokenType.LiteralString,
                    TokenType.LiteralBool,
                    TokenType.Ident,
                    TokenType.LParen,
                ])
                return new BadNode()
        }
    }
}

export { Parser }
