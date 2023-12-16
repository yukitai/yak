import { Nullable, ToStringable } from '../utils.ts'

type UFSKey = number

class UnionFindSet<T extends ToStringable> {
    value: T[]
    pre: UFSKey[]

    constructor() {
        this.value = []
        this.pre = []
    }

    insert(value: T): UFSKey {
        const x = this.pre.length
        this.value.push(value)
        this.pre.push(x)
        return x
    }

    find(x: T): Nullable<UFSKey> {
        const idx = this.value.indexOf(x)
        return idx === -1 ? null : idx
    }

    get(x: UFSKey): T {
        return this.value[x]
    }

    root(x: UFSKey): UFSKey {
        if (this.pre[x] === x) return x
        return this.pre[x] = this.root(this.pre[x])
    }

    is_root(x: UFSKey): boolean {
        return this.pre[x] === x
    }

    union(x: UFSKey, y: UFSKey) {
        const fx = this.root(x)
        const fy = this.root(y)
        this.pre[fy] = fx
    }

    display() {
        console.log(`UnionFindSet(${this.pre.length}) {`)
        this.pre.forEach((_, i) => {
            if (this.is_root(i)) {
                this._display_from_root(i)
            }
        })
        console.log('}')
    }

    _display_from_root(x: UFSKey) {
        const set: string[] = []
        this.pre.forEach((_, i) => {
            if (this.root(i) === x) {
                set.push(this.get(i).toString())
            }
        })
        console.log(`    ${set.join(', ')}`)
    }

    to_sets(): T[][] {
        return this.pre
            .map((_, i) => {
                if (this.is_root(i)) {
                    return this.to_set_from_root(i)
                }
            })
            .filter((x) => x !== undefined) as T[][]
    }

    to_set_from_root(x: UFSKey): T[] {
        return this.pre
            .map((_, i) => {
                if (this.root(i) === x) {
                    return this.get(i)
                }
            })
            .filter((x) => x !== undefined) as T[]
    }
}

export { type UFSKey, UnionFindSet }
