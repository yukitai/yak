function* _g(leader: string, chars: string, count: number): Generator<string> {
    if (count === 0) {
        yield leader
        return
    }
    for (const char of chars) {
        const g = _g(leader, chars, count - 1)
        while (true) {
            const n = g.next()
            if (n.done) {
                break
            }
            yield char + n.value
        }
    }
}

type Id = string

function* IdGenerator(
    leader = '',
    chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
    count = 1,
): Generator<Id> {
    yield* _g(leader, chars, count)
    yield* IdGenerator(leader, chars, count + 1)
}

const _id = IdGenerator()

const next_id = (): Id => _id.next().value

const VAR_STACKTOP = '_st'
const LST_STACK = '_s'
const VAR_RET_LEADER = '__'

export {
    type Id,
    IdGenerator,
    LST_STACK,
    next_id,
    VAR_RET_LEADER,
    VAR_STACKTOP,
}
