import { IR, Input } from '../scratch_ir/ir.ts'

const generate_json = (ir: IR): any => {
    const json = {}
    ir.generate_json(json)
    return json
}

const generate_input = (inp: Input): any => {
    return "UNK"
}

export { generate_json, generate_input }
