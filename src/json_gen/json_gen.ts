// deno-lint-ignore-file no-explicit-any

import {
    Command,
    Input,
    IR,
    List,
    Opcode,
    StackVariable,
    Variable,
} from '../scratch_ir/ir.ts'

const generate_json = (ir: IR): any => {
    const json = {}
    ir.generate_json(json)
    return json
}

const generate_input = (inp: Input, json: any, callee: string): any => {
    if (typeof inp === 'number') {
        return [1, [4, inp]]
    } else if (typeof inp === 'string') {
        return [1, [10, inp]]
    } else if (typeof inp === 'boolean') {
        return [1, [4, inp ? 1 : 0]]
    } else if (inp instanceof StackVariable) {
        const input = inp.generate_input(json, callee)
        return [1, input ?? [4, 0]]
    } else if (inp instanceof Variable) {
        const input = inp.generate_input(json, callee)
        return [1, input ?? [4, 0]]
    } else if (inp instanceof List) {
        return [1, [13, inp.name, inp.id]]
    } else if (inp instanceof Opcode) {
        const id = inp.generate_json(json)
        return [1, id]
    } else if (inp instanceof Command) {
        const input = inp.generate_input(json)
        return [1, input ?? [4, 0]]
    }
}

export { generate_input, generate_json }
