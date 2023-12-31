import { YakContext } from './context.ts'
import { display_errors } from './error/display.ts'
import { YakError, YakErrorNoLoc } from './error/error.ts'
import { YakCompilerError } from './error/kinds.ts'
import { Span } from './error/span.ts'

interface ToStringable {
    toString(): string
}

type Nullable<T> = T | null

const align = (a: number, s: string): string => {
    return ' '.repeat(a - s.length) + s
}

const todo = (
    msg: ToStringable = 'not implemented yet',
    errors: YakError[] = [],
    context?: YakContext,
    span?: Span,
): never => {
    display_errors(errors)

    let error: YakError | YakErrorNoLoc
    if (context && span) {
        error = new YakError(
            YakCompilerError,
            msg,
            span,
            context,
            [],
        )
    } else {
        error = new YakErrorNoLoc(
            YakCompilerError,
            msg,
            [],
        )
    }
    console.log(error.toString())
    throw 'compiler crashed error'
}

const unreachable = (
    msg: ToStringable = 'reached unreachable code',
    errors: YakError[] = [],
    context?: YakContext,
    span?: Span,
): never => {
    display_errors(errors)

    let error: YakError | YakErrorNoLoc
    if (context && span) {
        error = new YakError(
            YakCompilerError,
            msg,
            span,
            context,
            [],
        )
    } else {
        error = new YakErrorNoLoc(
            YakCompilerError,
            msg,
            [],
        )
    }
    console.log(error.toString())
    throw 'compiler crashed error'
}

export { align, type Nullable, todo, type ToStringable, unreachable }
