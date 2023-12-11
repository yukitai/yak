interface ToStringable { toString(): string }

type Nullable<T> = T | null

const align = (a: number, s: string): string => {
    return " ".repeat(a - s.length) + s
}

export {
    type ToStringable,
    type Nullable,
    align,
}