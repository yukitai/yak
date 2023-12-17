// deno-lint-ignore-file no-explicit-any

import { Input, IR } from '../scratch_ir/ir.ts'

const generate_json = (ir: IR): any => {
    const json = {}
    ir.generate_json(json)
    return json
}

const generate_input = (_inp: Input): any => {
    return 'UNK'
}

export { generate_input, generate_json }
