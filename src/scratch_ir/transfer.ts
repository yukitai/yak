import { Checker } from '../checker/checker.ts'
import {
    Block,
    Branch,
    CallDefinition,
    CommandReturn,
    Definition,
    Opcode,
    Sprite,
    StackVariable,
    Unknown,
    Value,
    Variable,
} from './ir.ts'
import * as ast from '../../grammar/ast.ts'
import { TokenType } from '../../grammar/token.ts'
import { TypeView } from './type_view.ts'

const OPCODE_MAP = {
    [TokenType.OAdd]: 'operator_add',
    [TokenType.OSub]: 'operator_sub',
    [TokenType.OMul]: 'operator_mul',
    [TokenType.ODiv]: 'operator_div',
    [TokenType.OMod]: 'operator_mod',
    [TokenType.OEq]: 'operator_equals',
    [TokenType.OLt]: 'operator_less',
    [TokenType.OGt]: 'operator_greater',
    [TokenType.OAnd]: 'operator_and',
    [TokenType.OOr]: 'operator_or',
    [TokenType.ONot]: 'operator_not',
}

class Transfer {
    checker: Checker
    ret_variables: Variable[]
    type_view_arg?: TypeView
    type_view_local?: TypeView
    type_view_global: TypeView
    args?: Variable[]
    locals?: StackVariable[]
    globals: Variable[]
    branch?: Branch
    sprite?: Sprite

    constructor(checker: Checker) {
        this.checker = checker
        this.ret_variables = []
        this.type_view_global = new TypeView()
        this.globals = []
    }

    get_ret(n: number) {
        if (this.ret_variables[n]) {
            return this.ret_variables[n]
        }
        while (!this.ret_variables[n]) {
            this.ret_variables.push(
                new Variable(`__${this.ret_variables.length}`),
            )
        }
        return this.ret_variables[n]
    }

    get_name(name: string): Value {
        if (this.type_view_local?.types[name]) {
            const offset = this.type_view_local.types[name].offset
            return this.locals![offset] ?? new Unknown()
        } else if (this.type_view_arg?.types[name]) {
            const offset = this.type_view_arg.types[name].offset
            return this.args![offset] ?? new Unknown()
        } else if (this.type_view_global?.types[name]) {
            const offset = this.type_view_global.types[name].offset
            return this.globals[offset] ?? new Unknown()
        }
        return new Unknown()
    }

    generate_ir_file(): Sprite {
        this.sprite = new Sprite('Yuki')
        ;(this.checker.ast as ast.File).definitions.forEach((it) => {
            if (it instanceof ast.FuncDefinition) {
                this.sprite!.add_definition(this.generate_ir_func(it))
            } else if (it instanceof ast.LetDefinition) {
                this.sprite!.add_variable(this.generate_ir_let(it))
            }
        })
        return this.sprite
    }

    generate_ir_func(def: ast.FuncDefinition): Definition {
        this.type_view_arg = new TypeView()
        this.type_view_local = new TypeView()
        this.args = []
        this.locals = []
        def.args.forEach((arg) => {
            const arg_name = arg.ident.name.value as string
            const field = this.type_view_arg!.add(arg_name, arg.resolved_type!)
            for (let i = 0; i < field.size; ++i) {
                this.args!.push(new Variable(arg_name))
            }
        })
        const func_name = def.func_name.name.value
        this.branch = new Branch()
        const body = this.generate_ir_block(def.body, this.branch)
        const definition = new Definition(
            `${func_name}${this.checker.types[func_name].short_name()}`,
            this.args,
            body,
        )
        return definition
    }

    generate_ir_let(def: ast.LetDefinition): Variable {
        const name = def.ident.ident.name.value as string
        const tv = this.type_view_global.add(name, def.ident.resolved_type!)
        for (let i = 0; i < tv.size; ++i) {
            this.globals.push(new Variable(name))
        }
        const variable = this.globals[tv.offset] ?? new Unknown()
        return variable
    }

    generate_ir_let_stmt(def: ast.LetDefinition): Block {
        const name = def.ident.ident.name.value as string
        const tv = this.type_view_local!.add(name, def.ident.resolved_type!)
        for (let i = 0; i < tv.size; ++i) {
            this.locals!.push(new StackVariable(name, tv.offset + i))
        }
        const variable = this.locals![tv.offset] ?? new Unknown()
        return new Opcode('setvariableto', {
            VARIABLE: variable,
            VALUE: this.generate_ir_expr(def.expr),
        }, {})
    }

    generate_ir_block(block: ast.Block, br?: Branch): Branch {
        const branch = br ?? new Branch()
        block.stmts.forEach((stmt) => {
            branch.blocks.push(this.generate_ir_stmt(stmt))
        })
        return branch
    }

    generate_ir_stmt(stmt: ast.Statement): Block {
        if (stmt instanceof ast.ExprStatement) {
            return this.generate_ir_expr(stmt.expr) as Block
        } else if (stmt instanceof ast.IfStatement) {
            return this.generate_ir_if_stmt(stmt)
        } else if (stmt instanceof ast.WhileStatement) {
            return this.generate_ir_while_stmt(stmt)
        } else if (stmt instanceof ast.ForInStatement) {
            return this.generate_ir_forin_stmt(stmt)
        } else if (stmt instanceof ast.ReturnStatement) {
            return this.generate_ir_return_stmt(stmt)
        } else if (stmt instanceof ast.LetDefinition) {
            return this.generate_ir_let_stmt(stmt)
        }
        return new Unknown()
    }

    generate_ir_expr(expr: ast.Expr): Value {
        if (expr instanceof ast.ExprS) {
            return this.generate_ir_expr_s(expr)
        } else if (expr instanceof ast.ExprD) {
            return this.generate_ir_expr_d(expr)
        } else if (expr instanceof ast.ExprI) {
            return this.generate_ir_expr_i(expr)
        } else if (expr instanceof ast.ExprCall) {
            return this.generate_ir_expr_call(expr)
        } else if (expr instanceof ast.ExprG) {
            return this.generate_ir_expr_g(expr)
        } else if (expr instanceof ast.Ident) {
            return this.get_name(expr.name.value as string)
        } else if (expr instanceof ast.Literal) {
            return expr.literal.value
        }
        return new Unknown()
    }

    generate_ir_expr_s(expr: ast.ExprS): Value {
        const expr_ = this.generate_ir_expr(expr.expr)
        switch (expr.op.ty) {
            case TokenType.OAdd:
                return new Opcode(OPCODE_MAP[TokenType.OSub], {
                    LHS: expr_,
                    RHS: 0,
                }, {})
            case TokenType.OSub:
                return new Opcode(OPCODE_MAP[TokenType.OSub], {
                    LHS: 0,
                    RHS: expr_,
                }, {})
            case TokenType.ONot:
                return new Opcode(OPCODE_MAP[TokenType.ONot], {
                    VALUE: expr_,
                }, {})
        }
        return new Unknown()
    }

    generate_ir_expr_d(expr: ast.ExprD): Value {
        const lhs = this.generate_ir_expr(expr.lhs)
        const rhs = this.generate_ir_expr(expr.rhs)
        if (OPCODE_MAP[expr.op.ty as keyof typeof OPCODE_MAP]) {
            return new Opcode(
                OPCODE_MAP[expr.op.ty as keyof typeof OPCODE_MAP],
                {
                    LHS: lhs,
                    RHS: rhs,
                },
                {},
            )
        } else {
            switch (expr.op.ty) {
                case TokenType.OAssign:
                    return new Opcode('setvariableto', {
                        VARIABLE: new Unknown(),
                        VALUE: rhs,
                    }, {})
                case TokenType.OFloorDiv:
                    return new Opcode('__op_floor', {
                        VALUE: new Opcode(OPCODE_MAP[TokenType.ODiv], {
                            LHS: lhs,
                            RHS: rhs,
                        }, {}),
                    }, {})
                case TokenType.OPow:
                    return new Opcode('__op_exp', {
                        VALUE: new Opcode(OPCODE_MAP[TokenType.OMul], {
                            LHS: new Opcode('__op_log', {
                                VALUE: lhs,
                            }, {}),
                            RHS: rhs,
                        }, {}),
                    }, {})
                case TokenType.ONe:
                    return new Opcode(OPCODE_MAP[TokenType.ONot], {
                        VALUE: new Opcode(OPCODE_MAP[TokenType.OEq], {
                            LHS: lhs,
                            RHS: rhs,
                        }, {}),
                    }, {})
                case TokenType.OLe:
                    return new Opcode(OPCODE_MAP[TokenType.ONot], {
                        VALUE: new Opcode(OPCODE_MAP[TokenType.OGt], {
                            LHS: lhs,
                            RHS: rhs,
                        }, {}),
                    }, {})
                case TokenType.OGe:
                    return new Opcode(OPCODE_MAP[TokenType.ONot], {
                        VALUE: new Opcode(OPCODE_MAP[TokenType.OLt], {
                            LHS: lhs,
                            RHS: rhs,
                        }, {}),
                    }, {})
            }
        }
        return new Opcode('unknown', {
            LHS: lhs,
            RHS: rhs,
        }, {})
    }

    generate_ir_expr_i(_expr: ast.ExprI): Value {
        return new Unknown()
    }

    generate_ir_expr_call(expr: ast.ExprCall): Value {
        if (!(expr.expr instanceof ast.Ident)) {
            return new Unknown()
        }
        return new CallDefinition(
            this.sprite!.definitions[expr.expr.name.value as string],
            expr.args.map((arg) => this.generate_ir_expr(arg)),
        )
    }

    generate_ir_expr_g(expr: ast.ExprG): Value {
        return this.generate_ir_expr(expr.expr)
    }

    generate_ir_if_stmt(stmt: ast.IfStatement): Block {
        if (stmt.else_case) {
            return new Opcode('control_ifelse', {}, {})
        } else {
            return new Opcode('control_if', {
                CONDITION: this.generate_ir_expr(stmt.expr),
            }, {
                BRANCH: this.generate_ir_block(stmt.body),
            })
        }
    }

    generate_ir_while_stmt(_stmt: ast.WhileStatement): Block {
        return new Unknown()
    }

    generate_ir_forin_stmt(_stmt: ast.ForInStatement): Block {
        return new Unknown()
    }

    generate_ir_return_stmt(stmt: ast.ReturnStatement): Block {
        if (stmt.expr) {
            this.branch!.blocks.push(
                new Opcode('setvariableto', {
                    VARIABLE: this.get_ret(0),
                    VALUE: this.generate_ir_expr(stmt.expr),
                }, {}),
            )
        }
        return new CommandReturn()
    }
}

export { Transfer }
