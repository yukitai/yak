import { AST, File } from '../../grammar/ast.ts'
import { Parser } from '../../grammar/parser.ts'
import { YakContext } from '../context.ts'
import { YakError } from '../error/error.ts'
import { Binder } from './binder.ts'
import { builtins } from './builtins.ts'
import { TypeChecker } from './checktype.ts'
import { Type } from './type.ts'
import { TypeInfer } from './typeinfer.ts'

class Checker {
    parser: Parser
    context: YakContext
    errors: YakError[]
    types: Record<string, Type>
    ast: AST

    constructor(parser: Parser, ast: File) {
        this.parser = parser
        this.context = parser.context
        this.errors = parser.errors
        this.ast = ast
        this.types = {}
    }

    walk<T extends AST>(
        ast: T,
        f: (item: AST, next: () => void) => void,
    ) {
        f(ast, () => {
            const ast__ = ast
            for (const key of Object.keys(ast__)) {
                if (key === 'binding') continue
                const item = ast__[key as keyof typeof ast__]
                if (item instanceof AST) {
                    this.walk(item, f)
                } else if (item instanceof Array) {
                    item.forEach((it) => {
                        this.walk(it, f)
                    })
                }
            }
        })
    }

    check_file() {
        // 1st step: bind all idents to its definition
        const binder = new Binder(this, builtins)
        binder.bind()

        // 2nd step: infer all types
        const infer = new TypeInfer(this)
        infer.infer_file()

        // 3rd step: check if types are vaild
        const typechecker = new TypeChecker(this)
        typechecker.check()
    }
}

export { Checker }
