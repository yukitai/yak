import { Checker } from '../checker/checker.ts'
import {
    Block,
    Branch,
    CallDefinition,
    CommandPopStack,
    CommandPushStack,
    CommandReturn,
    Definition,
    List,
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
import * as opcodes from './opcodes.ts'

const OPCODE_MAP = {
    [TokenType.OAdd]: {
        opcode: opcodes.OPCODE_OPERATOR_ADD,
        lhs: 'NUM1',
        rhs: 'NUM2',
    },
    [TokenType.OSub]: {
        opcode: opcodes.OPCODE_OPERATOR_SUBTRACT,
        lhs: 'NUM1',
        rhs: 'NUM2',
    },
    [TokenType.OMul]: {
        opcode: opcodes.OPCODE_OPERATOR_MULTIPLY,
        lhs: 'NUM1',
        rhs: 'NUM2',
    },
    [TokenType.ODiv]: {
        opcode: opcodes.OPCODE_OPERATOR_DIVIDE,
        lhs: 'NUM1',
        rhs: 'NUM2',
    },
    [TokenType.OMod]: {
        opcode: opcodes.OPCODE_OPERATOR_MOD,
        lhs: 'NUM1',
        rhs: 'NUM2',
    },
    [TokenType.OEq]: {
        opcode: opcodes.OPCODE_OPERATOR_EQUALS,
        lhs: 'OPERAND1',
        rhs: 'OPERAND2',
    },
    [TokenType.OLt]: {
        opcode: opcodes.OPCODE_OPERATOR_LT,
        lhs: 'OPERAND1',
        rhs: 'OPERAND2',
    },
    [TokenType.OGt]: {
        opcode: opcodes.OPCODE_OPERATOR_GT,
        lhs: 'OPERAND1',
        rhs: 'OPERAND2',
    },
    [TokenType.OAnd]: {
        opcode: opcodes.OPCODE_OPERATOR_AND,
        lhs: 'BOOLEAN1',
        rhs: 'BOOLEAN2',
    },
    [TokenType.OOr]: {
        opcode: opcodes.OPCODE_OPERATOR_OR,
        lhs: 'BOOLEAN1',
        rhs: 'BOOLEAN2',
    },
    [TokenType.ONot]: {
        opcode: opcodes.OPCODE_OPERATOR_NOT,
        lhs: 'BOOLEAN1',
        rhs: 'BOOLEAN2',
    },
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
    definitions: Record<string, Definition>
    stack: List
    block_scope: number[]

    constructor(checker: Checker) {
        this.checker = checker
        this.ret_variables = []
        this.type_view_global = new TypeView()
        this.globals = []
        this.definitions = {}
        this.stack = new List('_st', [])
        this.block_scope = []
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
        this.ret_variables.forEach((it) => {
            this.sprite!.add_variable(it)
        })
        this.sprite.add_list(this.stack)
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
                this.args!.push(new Variable(arg_name, '', true))
            }
        })
        const func_name = def.func_name.name.value
        const definition = new Definition(
            `${func_name}${this.checker.types[func_name].short_name()}`,
            this.args,
            this.get_ret(0),
        )
        this.definitions[func_name] = definition
        this.branch = new Branch()
        const body = this.generate_ir_block(def.body, this.branch)
        definition.set_body(body)
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
            this.locals!.push(
                new StackVariable(name, tv.offset + i, this.stack),
            )
            this.block_scope[this.block_scope.length - 1] += 1
            this.branch!.blocks.push(new CommandPushStack('', this.stack))
        }
        const variable = this.locals![tv.offset] ?? new Unknown()
        let value: Value
        if (def.expr instanceof ast.ExprCall) {
            const def_name = (def.expr.expr as ast.Ident).name.value as string
            const definition = this.definitions[def_name]
            this.branch?.blocks.push(
                this.generate_ir_expr_call(def.expr) as CallDefinition,
            )
            value = definition.ret_var
        } else {
            value = this.generate_ir_expr(def.expr)
        }
        return new Opcode(
            opcodes.OPCODE_DATA_REPLACEITEMOFLIST,
            {
                INDEX: variable.offset + 1,
                ITEM: value,
            },
            {},
            {
                LIST: [this.stack.name, this.stack.id],
            },
        )
    }

    generate_ir_block(block: ast.Block, br?: Branch): Branch {
        const branch = br ?? new Branch()
        const ori_br = this.branch
        this.branch = branch
        this.block_scope.push(0)
        block.stmts.forEach((stmt) => {
            branch.blocks.push(this.generate_ir_stmt(stmt))
        })
        const number_scopes = this.block_scope.pop()!
        for (let i = 0; i < number_scopes; ++i) {
            this.branch!.blocks.push(new CommandPopStack(this.stack))
        }
        this.branch = ori_br
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
                return new Opcode(
                    OPCODE_MAP[TokenType.OSub].opcode,
                    {
                        NUM1: expr_,
                        NUM2: 0,
                    },
                    {},
                    {},
                )
            case TokenType.OSub:
                return new Opcode(
                    OPCODE_MAP[TokenType.OSub].opcode,
                    {
                        NUM1: 0,
                        NUM2: expr_,
                    },
                    {},
                    {},
                )
            case TokenType.ONot:
                return new Opcode(
                    OPCODE_MAP[TokenType.ONot].opcode,
                    {
                        VALUE: expr_,
                    },
                    {},
                    {},
                )
        }
        return new Unknown()
    }

    generate_ir_expr_d(expr: ast.ExprD): Value {
        const lhs = this.generate_ir_expr(expr.lhs)
        const rhs = this.generate_ir_expr(expr.rhs)
        const op = OPCODE_MAP[expr.op.ty as keyof typeof OPCODE_MAP]
        if (op) {
            return new Opcode(
                op.opcode,
                { [op.lhs]: lhs, [op.rhs]: rhs },
                {},
                {},
            )
        } else {
            switch (expr.op.ty) {
                case TokenType.OAssign: {
                    if (!(expr.lhs instanceof ast.Ident)) {
                        return new Unknown()
                    }
                    const variable = this.get_name(
                        expr.lhs.name.value as string,
                    )
                    let value: Value
                    if (expr.rhs instanceof ast.ExprCall) {
                        const def_name = (expr.rhs.expr as ast.Ident).name
                            .value as string
                        const definition = this.definitions[def_name]
                        this.branch?.blocks.push(
                            this.generate_ir_expr_call(
                                expr.rhs,
                            ) as CallDefinition,
                        )
                        value = definition.ret_var
                    } else {
                        value = rhs
                    }
                    if (variable instanceof Variable) {
                        return new Opcode(
                            opcodes.OPCODE_DATA_SETVARIABLETO,
                            {
                                VALUE: value,
                            },
                            {},
                            {
                                VARIABLE: [variable.name, variable.id],
                            },
                        )
                    } else if (variable instanceof StackVariable) {
                        return new Opcode(
                            opcodes.OPCODE_DATA_REPLACEITEMOFLIST,
                            {
                                INDEX: variable.offset + 1,
                                ITEM: value,
                            },
                            {},
                            {
                                LIST: [this.stack.name, this.stack.id],
                            },
                        )
                    }
                    return new Unknown()
                }
                case TokenType.OFloorDiv:
                    return new Opcode(
                        opcodes.OPCODE_OPERATOR_MATHOP,
                        {
                            NUM: new Opcode(
                                OPCODE_MAP[TokenType.ODiv].opcode,
                                {
                                    NUM1: lhs,
                                    NUM2: rhs,
                                },
                                {},
                                {
                                    OPERATOR: ['floor', null],
                                },
                            ),
                        },
                        {},
                        {},
                    )
                case TokenType.OPow:
                    return new Opcode(
                        opcodes.OPCODE_OPERATOR_MATHOP,
                        {
                            VALUE: new Opcode(
                                OPCODE_MAP[TokenType.OMul].opcode,
                                {
                                    NUM1: new Opcode(
                                        opcodes.OPCODE_OPERATOR_MATHOP,
                                        {
                                            VALUE: lhs,
                                        },
                                        {},
                                        {
                                            OPERATOR: ['log', null],
                                        },
                                    ),
                                    NUM2: rhs,
                                },
                                {},
                                {},
                            ),
                        },
                        {},
                        {
                            OPERATOR: ['e^', null],
                        },
                    )
                case TokenType.ONe:
                    return new Opcode(
                        OPCODE_MAP[TokenType.ONot].opcode,
                        {
                            VALUE: new Opcode(
                                OPCODE_MAP[TokenType.OEq].opcode,
                                {
                                    LHS: lhs,
                                    RHS: rhs,
                                },
                                {},
                                {},
                            ),
                        },
                        {},
                        {},
                    )
                case TokenType.OLe:
                    return new Opcode(
                        OPCODE_MAP[TokenType.ONot].opcode,
                        {
                            VALUE: new Opcode(
                                OPCODE_MAP[TokenType.OGt].opcode,
                                {
                                    LHS: lhs,
                                    RHS: rhs,
                                },
                                {},
                                {},
                            ),
                        },
                        {},
                        {},
                    )
                case TokenType.OGe:
                    return new Opcode(
                        OPCODE_MAP[TokenType.ONot].opcode,
                        {
                            VALUE: new Opcode(
                                OPCODE_MAP[TokenType.OLt].opcode,
                                {
                                    LHS: lhs,
                                    RHS: rhs,
                                },
                                {},
                                {},
                            ),
                        },
                        {},
                        {},
                    )
            }
        }
        return new Opcode(
            'unknown',
            {
                LHS: lhs,
                RHS: rhs,
            },
            {},
            {},
        )
    }

    generate_ir_expr_i(_expr: ast.ExprI): Value {
        return new Unknown()
    }

    generate_ir_expr_call(expr: ast.ExprCall): Value {
        if (!(expr.expr instanceof ast.Ident)) {
            return new Unknown()
        }
        const callee = expr.expr.name.value as string
        return new CallDefinition(
            this.definitions[callee],
            expr.args.map((arg) => this.generate_ir_expr(arg)),
        )
    }

    generate_ir_expr_g(expr: ast.ExprG): Value {
        return this.generate_ir_expr(expr.expr)
    }

    generate_ir_if_stmt(stmt: ast.IfStatement): Block {
        if (stmt.else_case || stmt.elif_cases.length > 0) {
            let last_case: Opcode
            const last_body = stmt.elif_cases[stmt.elif_cases.length - 1]
            if (stmt.else_case) {
                last_case = new Opcode(opcodes.OPCODE_CONTROL_IF_ELSE, {
                    CONDITION: this.generate_ir_expr(last_body.expr),
                }, {
                    SUBSTACK: this.generate_ir_block(last_body.body),
                    SUBSTACK2: this.generate_ir_block(stmt.else_case.body),
                }, {})
            } else {
                last_case = new Opcode(opcodes.OPCODE_CONTROL_IF, {
                    CONDITION: this.generate_ir_expr(last_body.expr),
                }, {
                    SUBSTACK: this.generate_ir_block(last_body.body),
                }, {})
            }
            return [stmt, ...stmt.elif_cases.slice(0, -1)].reduceRight(
                (p, v) => {
                    const branch = new Branch()
                    branch.blocks.push(p)
                    return new Opcode(opcodes.OPCODE_CONTROL_IF_ELSE, {
                        CONDITION: this.generate_ir_expr(v.expr),
                    }, {
                        SUBSTACK: this.generate_ir_block(v.body),
                        SUBSTACK2: branch,
                    }, {})
                },
                last_case,
            )
        } else {
            return new Opcode(opcodes.OPCODE_CONTROL_IF, {
                CONDITION: this.generate_ir_expr(stmt.expr),
            }, {
                SUBSTACK: this.generate_ir_block(stmt.body),
            }, {})
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
            const ret_var = this.get_ret(0)
            this.branch!.blocks.push(
                new Opcode(
                    opcodes.OPCODE_DATA_SETVARIABLETO,
                    {
                        VALUE: this.generate_ir_expr(stmt.expr),
                    },
                    {},
                    {
                        VARIABLE: [ret_var.name, ret_var.id],
                    },
                ),
            )
        }
        if (this.block_scope.length > 0) {
            const number_scopes = this.block_scope.pop()!
            for (let i = 0; i < number_scopes; ++i) {
                this.branch!.blocks.push(new CommandPopStack(this.stack))
            }
            this.block_scope.push(0)
        }
        return new CommandReturn()
    }
}

export { Transfer }
