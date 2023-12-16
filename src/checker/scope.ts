import { Nullable } from '../utils.ts'

interface Scope<T> {
    [key: string]: T
}

class Scopes<T> {
    scopes: Scope<T>[]

    constructor() {
        this.scopes = []
    }

    enter_scope() {
        this.scopes.push({})
    }

    escape_scope() {
        this.scopes.pop()
    }

    find(name: string): Nullable<T> {
        for (let i = this.scopes.length - 1; i >= 0; --i) {
            if (Object.hasOwn(this.scopes[i], name)) {
                return this.scopes[i][name]
            }
        }
        return null
    }

    set(name: string, value: T) {
        if (
            Object.hasOwn(
                this.scopes[this.scopes.length - 1],
                name,
            )
        ) {
            return
        }
        this.scopes[this.scopes.length - 1][name] = value
    }

    update(name: string, value: T) {
        for (let i = this.scopes.length - 1; i >= 0; --i) {
            if (this.scopes[i][name]) {
                this.scopes[i][name] = value
                return
            }
        }
        this.scopes[this.scopes.length - 1][name] = value
    }
}

export { type Scope, Scopes }
