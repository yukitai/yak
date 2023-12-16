import * as ast from '../../grammar/ast.ts'
import { TokenType } from '../../grammar/token.ts'
import { YakError } from '../error/error.ts'
import { PreviewInfo } from '../error/info.ts'
import { YakTypeError } from '../error/kinds.ts'
import { Nullable } from '../utils.ts'
import { Checker } from './checker.ts'
import { Scopes } from './scope.ts'
import {
    BuiltinType,
    BuiltinTypeEnum,
    from_ast,
    FuncType,
    GenericType,
    InferType,
    RecordFields,
    RecordType,
    Type,
    TypeWithGenerics,
} from './type.ts'
import { UFSKey, UnionFindSet } from './utils.ts'

class TypeInfer {
    checker: Checker
    ufs: UnionFindSet<Type>
    scopes: Scopes<UFSKey>
    types: Record<string, Type>

    _ty_num: UFSKey
    _ty_str: UFSKey
    _ty_bool: UFSKey
    _ty_nil: UFSKey

    constructor(checker: Checker) {
        this.checker = checker
        this.ufs = new UnionFindSet()
        this.scopes = new Scopes()
        this._ty_num = this.ufs.insert(
            new BuiltinType(BuiltinTypeEnum.Num),
        )
        this._ty_str = this.ufs.insert(
            new BuiltinType(BuiltinTypeEnum.Str),
        )
        this._ty_bool = this.ufs.insert(
            new BuiltinType(BuiltinTypeEnum.Bool),
        )
        this._ty_nil = this.ufs.insert(
            new BuiltinType(BuiltinTypeEnum.Nil),
        )
        this.types = checker.types
    }

    get_ident_type(ident: ast.Ident): Nullable<UFSKey> {
        const def = ident.binding!
        if (def instanceof ast.FuncDefinition) {
            return this.scopes.find(def.func_name.name.value as string)
        } else if (def instanceof ast.TypedIdent) {
            return this.scopes.find(def.ident.name.value as string)
        } else if (def instanceof ast.StructDefinition) {
            return this.scopes.find(def.ident.name.value as string)
        } else {
            const infer_t = this.ufs.insert(new InferType(def))
            return infer_t
        }
    }

    infer_func_definition(def: ast.FuncDefinition) {
        const ret_t = from_ast(def.ret_t, this.types)
        let func_t: Type = new FuncType(
            def.args.map((x) => from_ast(x, this.types)),
            ret_t,
            def,
        )
        if (def.generics) {
            func_t = new TypeWithGenerics(func_t, def.generics.generics, def)
        }
        const func_t_ = this.ufs.insert(func_t)
        this.scopes.set(
            def.func_name.name.value as string,
            func_t_,
        )
        this.types[def.func_name.name.value as string] = func_t
        this.scopes.enter_scope()
        def.args.forEach((arg) => {
            const arg_t = this.ufs.insert(
                from_ast(arg.type, this.types),
            )
            this.scopes.set(
                arg.ident.name.value as string,
                arg_t,
            )
        })
        const ret_t_ = this.ufs.insert(ret_t)
        this.scopes.set('$ret_t', ret_t_)
        const has_return = this.infer_block(def.body)
        if (!has_return) {
            this.ufs.union(ret_t_, this._ty_nil)
        }
        this.scopes.escape_scope()
    }

    infer_struct_definition(def: ast.StructDefinition) {
        const fields: RecordFields = {}
        for (const field of def.fields) {
            fields[field.ident.name.value as string] = from_ast(
                field.type,
                this.types,
            )
        }
        let record_t: Type = new RecordType(fields, def)
        if (def.generics) {
            record_t = new TypeWithGenerics(
                record_t,
                def.generics.generics,
                def,
            )
        }
        const record_t_ = this.ufs.insert(record_t)
        this.scopes.set(def.ident.name.value as string, record_t_)
        this.types[def.ident.name.value as string] = record_t
    }

    infer_block(block: ast.Block): boolean {
        this.scopes.enter_scope()
        let has_return = false
        block.stmts.forEach((stmt) => {
            if (this.infer_stmt(stmt)) {
                has_return = true
            }
        })
        this.scopes.escape_scope()
        return has_return
    }

    infer_stmt(stmt: ast.Statement): boolean {
        if (stmt instanceof ast.ExprStatement) {
            this.infer_expr(stmt.expr)
        } else if (stmt instanceof ast.IfStatement) {
            const cond_t = this.infer_expr(stmt.expr)
            this.ufs.union(this._ty_bool, cond_t)
            this.infer_block(stmt.body)
            let has_return = false
            stmt.elif_cases.forEach((stmt) => {
                const has_return_ = this.infer_elif_case(stmt)
                if (!has_return) {
                    has_return = has_return_
                }
            })
            if (stmt.else_case) {
                return has_return || this.infer_else_case(stmt.else_case)
            }
            return has_return
        } else if (stmt instanceof ast.WhileStatement) {
            const cond_t = this.infer_expr(stmt.expr)
            this.ufs.union(this._ty_bool, cond_t)
            return this.infer_block(stmt.body)
        } else if (stmt instanceof ast.ForInStatement) {
            const _pat_t = this.get_ident_type(stmt.pat)
            const _expr_t = this.infer_expr(stmt.expr)
            return this.infer_block(stmt.body)
        } else if (stmt instanceof ast.ReturnStatement) {
            const expr_t = stmt.expr ? this.infer_expr(stmt.expr) : this._ty_nil
            this.ufs.union(
                this.scopes.find('$ret_t')!,
                expr_t,
            )
            return true
        }
        return false
    }

    infer_elif_case(elif_case: ast.ElifCase): boolean {
        const cond_t = this.infer_expr(elif_case.expr)
        this.ufs.union(this._ty_bool, cond_t)
        return this.infer_block(elif_case.body)
    }

    infer_else_case(else_case: ast.ElseCase): boolean {
        return this.infer_block(else_case.body)
    }

    infer_expr(expr: ast.Expr): UFSKey {
        if (expr instanceof ast.ExprS) {
            return this.infer_expr_s(expr)
        } else if (expr instanceof ast.ExprI) {
            return this.infer_expr_i(expr)
        } else if (expr instanceof ast.ExprG) {
            return this.infer_expr_g(expr)
        } else if (expr instanceof ast.ExprD) {
            return this.infer_expr_d(expr)
        } else if (expr instanceof ast.ExprCall) {
            return this.infer_expr_call(expr)
        } else if (expr instanceof ast.Literal) {
            const expr_t = BuiltinType.from_literal(expr)
            return this.ufs.insert(expr_t)
        } else if (expr instanceof ast.Ident) {
            if (expr.generics && this.types[expr.name.value]) {
                const generic_type = GenericType.create(
                    this.types[expr.name.value],
                    expr.generics.generics.map((x) => from_ast(x, this.types)),
                    expr,
                )
                return this.ufs.insert(generic_type)
            }
            const expr_t = this.get_ident_type(expr)
            return expr_t ? expr_t : this.ufs.insert(new InferType())
        } else {
            return this.ufs.insert(new InferType())
        }
    }

    infer_expr_s(expr: ast.ExprS): UFSKey {
        const expr_t = this.infer_expr(expr.expr)
        switch (expr.op.ty) {
            case TokenType.OAdd:
            case TokenType.OSub:
                this.ufs.union(this._ty_num, expr_t)
                return expr_t
            case TokenType.ONot:
                this.ufs.union(this._ty_bool, expr_t)
                return expr_t
            default:
                return this.ufs.insert(new InferType())
        }
    }

    infer_expr_i(_expr: ast.ExprI): UFSKey {
        return this.ufs.insert(new InferType())
    }

    infer_expr_g(expr: ast.ExprG): UFSKey {
        return this.infer_expr(expr)
    }

    infer_expr_d(expr: ast.ExprD): UFSKey {
        const lhs_t = this.infer_expr(expr.lhs)
        let rhs_t: UFSKey
        switch (expr.op.ty) {
            case TokenType.OSub:
            case TokenType.OMul:
            case TokenType.ODiv:
            case TokenType.OFloorDiv:
            case TokenType.OMod:
            case TokenType.OPow:
                rhs_t = this.infer_expr(expr.rhs)
                this.ufs.union(lhs_t, rhs_t)
                this.ufs.union(this._ty_num, lhs_t)
                return lhs_t
            case TokenType.OAssign:
            case TokenType.OAdd:
                rhs_t = this.infer_expr(expr.rhs)
                this.ufs.union(lhs_t, rhs_t)
                return lhs_t
            case TokenType.OAnd:
            case TokenType.OOr:
                rhs_t = this.infer_expr(expr.rhs)
                this.ufs.union(lhs_t, rhs_t)
                this.ufs.union(this._ty_bool, lhs_t)
                return lhs_t
            case TokenType.OEq:
            case TokenType.ONe:
            case TokenType.OLe:
            case TokenType.OGe:
            case TokenType.OLt:
            case TokenType.OGt:
                rhs_t = this.infer_expr(expr.rhs)
                this.ufs.union(lhs_t, rhs_t)
                return this._ty_bool
            case TokenType.ODot: {
                const field_t = new InferType(expr)
                const fields: RecordFields = {}
                fields[(expr.rhs as ast.Ident).name.value as string] = field_t
                const lhs_t1 = new RecordType(fields, expr.lhs)
                const field_t_ = this.ufs.insert(field_t)
                const lhs_t1_ = this.ufs.insert(lhs_t1)
                this.ufs.union(lhs_t, lhs_t1_)
                return field_t_
            }
            default:
                return this.ufs.insert(new InferType())
        }
    }

    infer_expr_call(expr: ast.ExprCall): UFSKey {
        const callee = this.infer_expr(expr.expr)
        const ret_t = new InferType()
        const callee_t = this.ufs.insert(
            new FuncType(
                expr.args.map((arg) => {
                    const infer_t = new InferType()
                    const arg_t = this.infer_expr(arg)
                    this.ufs.union(this.ufs.insert(infer_t), arg_t)
                    return infer_t
                }),
                ret_t,
            ),
        )
        this.ufs.union(callee, callee_t)
        return this.ufs.insert(ret_t)
    }

    infer_file() {
        this.scopes.enter_scope()
        ;(this.checker.ast as ast.File).definitions.forEach(
            (it) => {
                if (it instanceof ast.FuncDefinition) {
                    this.infer_func_definition(it)
                } else if (it instanceof ast.StructDefinition) {
                    this.infer_struct_definition(it)
                }
            },
        )
        this.scopes.escape_scope()

        this.apply()
    }

    apply() {
        const sets = this.ufs.to_sets()
        for (let step = 2; step > 0; --step) {
            sets.forEach((set) => {
                const knowns = set.filter((it) => it.is_known())
                const known = knowns[0] // ?? set[0]
                if (!known) {
                    return
                }
                set.forEach((it) => {
                    if (!it.i_say_you_are(known) && step === 1) {
                        if (it.target) {
                            this.checker.errors.push(
                                new YakError(
                                    YakTypeError,
                                    `type \`${it.toString()}\` and \`${known.toString()}\` not matched`,
                                    it.target.span,
                                    this.checker.context,
                                    known.target
                                        ? [
                                            new PreviewInfo(
                                                `type not matched:`,
                                                known.target.span,
                                                this.checker.context,
                                            ),
                                        ]
                                        : [],
                                ),
                            )
                        } else if (known.target) {
                            this.checker.errors.push(
                                new YakError(
                                    YakTypeError,
                                    `type \`${it.toString()}\` and \`${known.toString()}\` not matched`,
                                    known.target.span,
                                    this.checker.context,
                                    [],
                                ),
                            )
                        }
                    }
                })
            })
        }

        this.checker.walk(this.checker.ast, (it, next) => {
            if (it instanceof ast.InferType) {
                if (!it.infer_result) {
                    this.checker.errors.push(
                        new YakError(
                            YakTypeError,
                            `cannot infer type: more information needed`,
                            it.target.span,
                            this.checker.context,
                            [],
                        ),
                    )
                }
                return
            }
            next()
        })

        // this.ufs.display()
    }
}

export { TypeInfer }
