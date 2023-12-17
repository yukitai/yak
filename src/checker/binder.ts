import {
    Block,
    Builtin,
    Definition,
    ExprD,
    FuncDefinition,
    Generics,
    Ident,
    LetDefinition,
    StructDefinition,
    TypedIdent,
    UseDefinition,
} from '../../grammar/ast.ts'
import { TokenType } from '../../grammar/token.ts'
import { YakError } from '../error/error.ts'
import { PreviewInfo } from '../error/info.ts'
import { YakNameError } from '../error/kinds.ts'
import { Nullable } from '../utils.ts'
import { Builtins } from './builtins.ts'
import { Checker } from './checker.ts'

interface Scope {
    [key: string]: Definition
}

class Binder {
    checker: Checker
    scope: Scope[]
    builtins: Builtins

    constructor(checker: Checker, builtins: Builtins) {
        this.checker = checker
        this.scope = []
        this.builtins = builtins
    }

    enter_scope() {
        this.scope.push({})
    }

    escape_scope() {
        this.scope.pop()
    }

    find_name(ident: Ident): Nullable<Definition> {
        for (let i = this.scope.length - 1; i >= 0; --i) {
            if (
                Object.hasOwn(
                    this.scope[i],
                    ident.name.value,
                )
            ) {
                return this.scope[i][ident.name.value]
            }
        }
        if (
            Object.hasOwn(this.builtins, ident.name.value)
        ) {
            return new Builtin()
        }
        return null
    }

    set_name(ident: Ident, definition: Definition) {
        if (
            Object.hasOwn(
                this.scope[this.scope.length - 1],
                ident.name.value,
            )
        ) {
            this.checker.errors.push(
                new YakError(
                    YakNameError,
                    `name \`${ident.name.value}\` is defined in twice`,
                    ident.span,
                    this.checker.context,
                    [
                        new PreviewInfo(
                            'the first definition is here:',
                            this.find_name(ident)!.span,
                            this.checker.context,
                        ),
                    ],
                ),
            )
            return
        }
        this.scope[this.scope.length - 1][
            ident.name.value
        ] = definition
    }

    bind() {
        this.enter_scope()
        this.checker.walk(this.checker.ast, (it, next) => {
            if (it instanceof UseDefinition) {
                it.names.forEach((name) => {
                    this.set_name(name, name)
                    name.bind(it)
                })
                return
            } else if (it instanceof Generics) {
                it.generics.forEach((generic) => {
                    this.set_name(generic, generic)
                    generic.bind(generic)
                })
                return
            } else if (it instanceof FuncDefinition) {
                this.set_name(it.func_name, it)
                it.func_name.bind(it)
                this.enter_scope()
                next()
                this.escape_scope()
                return
            } else if (it instanceof StructDefinition) {
                this.set_name(it.ident, it)
                it.ident.bind(it)
                it.fields.forEach((field) => {
                    field.ident.bind(field)
                })
            } else if (it instanceof TypedIdent) {
                this.set_name(it.ident, it)
                it.ident.bind(it)
                return
            } else if (it instanceof LetDefinition) {
                this.set_name(it.ident.ident, it)
                it.ident.ident.bind(it)
                return
            } else if (it instanceof Ident) {
                const definition = this.find_name(it)
                if (definition) {
                    it.bind(definition)
                }
                return
            } else if (it instanceof ExprD) {
                if (it.op.ty === TokenType.ODot) {
                    ;(it.rhs as Ident).bind(it.lhs)
                }
            } else if (it instanceof Block) {
                this.enter_scope()
                next()
                this.escape_scope()
                return
            }
            next()
        })
        this.checker.walk(this.checker.ast, (it, next) => {
            if (it instanceof Ident) {
                if (!it.resolved()) {
                    const definition = this.find_name(it)
                    if (definition) {
                        it.bind(definition)
                    } else {
                        this.checker.errors.push(
                            new YakError(
                                YakNameError,
                                `cannot find name \`${it.name.value}\``,
                                it.span,
                                this.checker.context,
                                [],
                            ),
                        )
                    }
                }
            }
            next()
        })
        this.escape_scope()
    }
}

export { Binder }
