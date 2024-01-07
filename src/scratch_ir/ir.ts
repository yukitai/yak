// deno-lint-ignore-file no-explicit-any

import { BOLD, CYAN, GRAY, MAGENTA, RED, YELLOW } from '../error/colors.ts'
import { CLEAR } from '../error/colors.ts'
import { generate_input } from '../json_gen/json_gen.ts'
import { Nullable, ToStringable } from '../utils.ts'
import { Formatter } from './formatter.ts'
import { Id, next_id } from './id.ts'
import * as opcodes from './opcodes.ts'

type Offset = number
type ScratchValue = string | number | boolean
type Input = ScratchValue | Variable | List | Opcode | Command
type BlockInputs = Record<string, Input>
type BranchInputs = Record<string, Branch>

abstract class IR {
    abstract display(fmt: Formatter): void
    abstract generate_json(json: any): any

    _display_item<T extends string & keyof this>(
        fmt: Formatter,
        key: T,
    ) {
        const item = this[key]
        if (item instanceof Array) {
            fmt.write_header(key, item.length.toString())
            fmt.indent()
            item.forEach((it: IR | ToStringable) => {
                if (it instanceof IR) {
                    it.display(fmt)
                } else {
                    fmt.write_header(it.toString())
                }
            })
            fmt.dedent()
        } else if (item instanceof IR) {
            fmt.write_header(key)
            fmt.indent()
            item.display(fmt)
            fmt.dedent()
        } else if (item && typeof item === 'object') {
            const entries = Object.entries(item)
            fmt.write_header(key, entries.length.toString())
            fmt.indent()
            entries.forEach(([k, v]) => {
                if (v instanceof IR) {
                    fmt.write_header(k)
                    fmt.indent()
                    v.display(fmt)
                    fmt.dedent()
                } else {
                    fmt.write_header(k, v.toString())
                }
            })
            fmt.dedent()
        } else if (item?.toString) {
            fmt.write_header(key, item.toString())
        }
    }
}

class Project extends IR {
    sprites: Record<Id, Sprite>
    stage: Sprite
    global_variables: Record<Id, Variable>
    global_lists: Record<Id, List>
    global_definitions: Record<Id, Definition>

    constructor(
        sprites: Record<Id, Sprite>,
        stage: Sprite,
        global_variables: Record<Id, Variable>,
        global_lists: Record<Id, List>,
        global_definitions: Record<Id, Definition>,
    ) {
        super()
        this.sprites = sprites
        this.stage = stage
        this.global_variables = global_variables
        this.global_lists = global_lists
        this.global_definitions = global_definitions
    }

    display(fmt: Formatter) {
        fmt.write_header('Project')
        fmt.indent()
        this._display_item(fmt, 'sprites')
        this._display_item(fmt, 'stage')
        this._display_item(fmt, 'global_variables')
        this._display_item(fmt, 'global_lists')
        this._display_item(fmt, 'global_definitions')
        fmt.dedent()
    }

    generate_json(json: any): any {
        json.targets = []
        Object.values(this.sprites)
            .forEach((sp) => sp.generate_json(json.targets))
        this.stage.generate_json(json.target)
    }
}

class Sprite extends IR {
    name: string
    id: Id
    variables: Record<Id, Variable>
    lists: Record<Id, List>
    definitions: Record<Id, Definition>

    constructor(name: string) {
        super()
        this.name = name
        this.id = next_id()
        this.variables = {}
        this.lists = {}
        this.definitions = {}
    }

    display(fmt: Formatter) {
        fmt.write_header('Sprite')
        fmt.indent()
        this._display_item(fmt, 'name')
        this._display_item(fmt, 'id')
        this._display_item(fmt, 'variables')
        this._display_item(fmt, 'lists')
        this._display_item(fmt, 'definitions')
        fmt.dedent()
    }

    add_definition(def: Definition) {
        this.definitions[def.id] = def
    }

    add_variable(variable: Variable) {
        this.variables[variable.id] = variable
    }

    add_list(list: List) {
        this.lists[list.id] = list
    }

    generate_json(json: any): any {
        json.isStage = this.name === 'stage'
        json.name = this.name
        json.variables = {}
        json.lists = {}
        json.blocks = {}
        json.comments = {}
        Object.values(this.variables)
            .forEach((it) => it.generate_json(json))
        Object.values(this.lists)
            .forEach((it) => it.generate_json(json))
        Object.values(this.definitions)
            .forEach((it) => it.generate_json(json))
    }
}

class Definition extends IR {
    name: string
    id: Id
    inputs: Variable[]
    body: Branch
    scoped_variables: Record<Id, StackVariable>
    proccode: string
    argumentids: string
    ret_var: Variable

    constructor(name: string, inputs: Variable[], ret_var: Variable) {
        super()
        this.name = name
        this.id = next_id()
        this.inputs = inputs
        this.ret_var = ret_var
        this.body = new Branch()
        this.scoped_variables = {}
        this.proccode = `${name} ${inputs.map((_) => '%s').join(' ')}`
        this.argumentids = JSON.stringify(this.inputs.map((x) => {
            return this.id + '_argu_' + x.id
        }))
    }

    set_body(body: Branch) {
        this.body = body
    }

    display(fmt: Formatter) {
        fmt.write_command('define', this.name, ...this.inputs)
        this.body.display(fmt)
    }

    generate_json(json: any): any {
        const id = this.body.generate_json(json)
        json.blocks[id].parent = this.id
        json.blocks[this.id] = {
            opcode: 'procedures_definition',
            next: id,
            parent: null,
            inputs: { custom_block: [1, this.id + '_proto'] },
            fields: {},
            topLevel: true,
            x: 0,
            y: 0,
        }
        json.blocks[this.id + '_proto'] = {
            next: null,
            parent: this.id,
            opcode: 'procedures_prototype',
            inputs: Object.fromEntries(this.inputs.map((x) => {
                json.blocks[this.id + '_argu_' + x.id] = {
                    opcode: 'argument_reporter_string_number',
                    next: null,
                    parent: this.id,
                    inputs: {},
                    fields: { 'VALUE': [x.id + '_' + x.name, null] },
                    shadow: true,
                }
                return [x.name, [1, this.id + '_argu_' + x.id]]
            })),
            fields: {},
            shadow: true,
            mutation: {
                tagName: 'mutation',
                children: [],
                proccode: this.proccode,
                argumentids: this.argumentids,
                argumentnames: JSON.stringify(this.inputs.map((x) => {
                    return x.id + '_' + x.name
                })),
                argumentdefaults: `[${this.inputs.map((_) => '""').join(',')}]`,
                warp: 'true',
            },
        }
        return this.id
    }
}

class Variable extends IR {
    name: string
    id: Id
    init: ScratchValue
    is_param: boolean

    constructor(name: string, init: ScratchValue = '', is_param = false) {
        super()
        this.name = name
        this.id = next_id()
        this.init = init
        this.is_param = is_param
    }

    display(fmt: Formatter) {
        fmt.write_header(this.name, this.id)
    }

    toString() {
        return `(${YELLOW}${
            this.is_param ? 'param' : 'var'
        }${CLEAR}:${MAGENTA}${this.name}${CLEAR})`
    }

    generate_json(json: any): any {
        json.variables[this.id] = [this.name, this.init]
    }

    generate_input(json: any, callee: string): any {
        if (this.is_param) {
            const id = next_id()
            json.blocks[id] = {
                opcode: 'argument_reporter_string_number',
                next: null,
                parent: callee,
                inputs: {},
                fields: { 'VALUE': [this.id + '_' + this.name, null] },
            }
            return id
        } else {
            return [12, this.name, this.id]
        }
    }
}

class StackVariable extends Variable {
    name: string
    offset: Offset
    stack: List

    constructor(
        name: string,
        offset: Offset,
        stack: List,
        init?: ScratchValue,
    ) {
        super(name, init)
        this.name = name
        this.offset = offset
        this.stack = stack
    }

    display(fmt: Formatter) {
        fmt.write_header(this.name)
    }

    toString() {
        return `(${YELLOW}local${CLEAR}:${MAGENTA}${this.name}${CLEAR})`
    }

    generate_json(_json: any): any {
    }

    generate_input(json: any, callee: string): any {
        json.blocks[this.id] = {
            opcode: 'data_itemoflist',
            next: null,
            parent: callee,
            inputs: { INDEX: [1, [7, `${this.offset + 1}`]] },
            fields: { LIST: [this.stack.name, this.stack.id] },
        }
        return this.id
    }
}

class List extends IR {
    name: string
    id: Id
    init: ScratchValue[]

    constructor(name: string, init?: ScratchValue[]) {
        super()
        this.name = name
        this.id = next_id()
        this.init = init ?? []
    }

    display(fmt: Formatter) {
        fmt.write_header(this.name, this.id)
    }

    toString() {
        return `(${YELLOW}list${CLEAR}:${MAGENTA}${this.name}${CLEAR})`
    }

    generate_json(json: any): any {
        json.lists[this.id] = [this.name, this.init]
    }
}

type FieldInputs = Record<string, [string, Nullable<string>]>

class Opcode extends IR {
    id: Id
    opcode: string
    inputs: BlockInputs
    branches: BranchInputs
    fields: FieldInputs

    constructor(
        opcode: string,
        inputs: BlockInputs,
        branches: BranchInputs,
        fields: FieldInputs,
    ) {
        super()
        this.id = next_id()
        this.opcode = opcode
        this.inputs = inputs
        this.branches = branches
        this.fields = fields
    }

    display(fmt: Formatter) {
        fmt.write_command(this.opcode)
        fmt.indent()
        Object.entries(this.inputs).forEach(([k, v]) => {
            fmt.write_kv(k, v)
        })
        Object.entries(this.fields).forEach(([k, v]) => {
            fmt.write_kv(k, JSON.stringify(v))
        })
        Object.entries(this.branches).forEach(([k, v]) => {
            fmt.write_kv(k, '')
            v.display(fmt)
        })
        fmt.dedent()
    }

    toString(): string {
        return `(${CYAN}${this.opcode}${CLEAR} ${
            Object.entries(this.inputs).map(([k, v]) => {
                return `${MAGENTA}${k}${CLEAR}: ${v.toString()}`
            }).join(', ')
        } ${
            Object.entries(this.fields).map(([k, v]) => {
                return `${MAGENTA}${k}${CLEAR}: ${v.toString()}`
            }).join(', ')
        })`
    }

    generate_json(json: any): any {
        json.blocks[this.id] = {
            opcode: this.opcode,
            inputs: Object.fromEntries([
                ...Object.entries(this.inputs)
                    .map(([k, v]) => [k, generate_input(v, json, this.id)]),
                ...Object.entries(this.branches)
                    .map(([k, v]) => {
                        const id = v.generate_json(json)
                        json.blocks[id].parent = this.id
                        return [k, [1, id]]
                    }),
            ]),
            fields: this.fields,
        }
        return this.id
    }
}

class Unknown extends Opcode {
    constructor() {
        super('UNKNOWN', {}, {}, {})
    }

    display(fmt: Formatter) {
        fmt.write_command(`${RED}${BOLD}UNKNOWN${CLEAR}`)
    }

    toString(): string {
        return `${RED}${BOLD}UNKNOWN${CLEAR}`
    }

    generate_json(_json: any): any {
        // should we emit an error block here?
    }
}

class CallDefinition extends Opcode {
    definition: Definition
    raw_inputs: Input[]

    constructor(def: Definition, inputs: Input[]) {
        super(opcodes.OPCODE_PROCEDURES_CALL, {}, {}, {})
        this.definition = def
        this.raw_inputs = inputs
    }

    display(fmt: Formatter) {
        fmt.write_command('call', this.definition.name, ...this.raw_inputs)
    }

    toString(): string {
        return `(${CYAN}${this.opcode}${CLEAR} ${
            this.raw_inputs.map((x) => x.toString()).join(', ')
        })`
    }

    generate_json(json: any): any {
        json.blocks[this.id] = {
            'opcode': 'procedures_call',
            'inputs': Object.fromEntries(this.definition.inputs.map((x, i) => {
                return [
                    this.definition.id + '_argu_' + x.id,
                    generate_input(this.raw_inputs[i], json, this.id),
                ]
            })),
            'fields': {},
            'shadow': false,
            'topLevel': false,
            'mutation': {
                'tagName': 'mutation',
                'children': [],
                'proccode': this.definition.proccode,
                'argumentids': this.definition.argumentids,
                'warp': 'true',
            },
        }
        return this.id
    }
}

abstract class Command extends IR {
    constructor() {
        super()
    }

    abstract generate_input(_json: any): any
}

class CommandPushStack extends Command {
    value: Input
    stack: List

    constructor(value: Input, stack: List) {
        super()
        this.value = value
        this.stack = stack
    }

    display(fmt: Formatter) {
        fmt.write_command('PUSH_STACK', this.value)
    }

    toString() {
        return `(${RED}${BOLD}error${CLEAR} ${GRAY}PUSH_STACK${CLEAR})`
    }

    generate_json(json: any): any {
        const id = next_id()
        json.blocks[id] = {
            opcode: 'data_insertatlist',
            inputs: {
                ITEM: generate_input(this.value, json, id),
                INDEX: [1, [7, '1']],
            },
            fields: { LIST: [this.stack.name, this.stack.id] },
        }
        return id
    }

    generate_input(_json: any): any {
        // error
    }
}

class CommandReturn extends Command {
    constructor() {
        super()
    }

    display(fmt: Formatter) {
        fmt.write_command('RETURN')
    }

    toString() {
        return `(${RED}${BOLD}error${CLEAR} ${GRAY}RETURN${CLEAR})`
    }

    generate_json(json: any): any {
        const id = next_id()
        json.blocks[id] = {
            opcode: 'control_stop',
            inputs: {},
            fields: { STOP_OPTION: ['this script', null] },
            mutation: {
                tagName: 'mutation',
                children: [],
                hasnext: 'false',
            },
        }
        return id
    }

    generate_input(_json: any): any {
        // error
    }
}

class CommandPopStack extends Command {
    stack: List

    constructor(stack: List) {
        super()
        this.stack = stack
    }

    display(fmt: Formatter) {
        fmt.write_command('POP_STACK')
    }

    toString() {
        return `(${RED}${BOLD}error${CLEAR} ${GRAY}POP_STACK${CLEAR})`
    }

    generate_json(json: any): any {
        const id = next_id()
        json.blocks[id] = {
            opcode: 'data_deleteoflist',
            inputs: { INDEX: [1, [7, '1']] },
            fields: { LIST: [this.stack.name, this.stack.id] },
        }
        return id
    }

    generate_input(_json: any): any {
    }
}

class CommandGetStack extends Command {
    offset: Input

    constructor(offset: Input) {
        super()
        this.offset = offset
    }

    display(fmt: Formatter) {
        fmt.write_command('GET_STACK', this.offset)
    }

    toString() {
        return `(${CYAN}GET_STACK${CLEAR} ${this.offset.toString()})`
    }

    generate_json(_json: any): any {
    }

    generate_input(_json: any): any {
    }
}

class CommandSetStack extends Command {
    offset: Input
    value: Input

    constructor(offset: Input, value: Input) {
        super()
        this.offset = offset
        this.value = value
    }

    display(fmt: Formatter) {
        fmt.write_command('SET_STACK', this.offset, this.value)
    }

    toString() {
        return `(${RED}${BOLD}error${CLEAR} ${GRAY}SET_STACK${CLEAR})`
    }

    generate_json(_json: any): any {
    }

    generate_input(_json: any): any {
        // error
    }
}

type Block = Opcode | Command
type Value = Input

class Branch extends IR {
    blocks: Block[]

    constructor() {
        super()
        this.blocks = []
    }

    display(fmt: Formatter) {
        fmt.indent()
        this.blocks.forEach((block) => {
            block.display(fmt)
        })
        fmt.dedent()
    }

    generate_json(json: any): any {
        let first_id: Nullable<string> = null
        let last_id: Nullable<string> = null
        this.blocks.forEach((it) => {
            const id = it.generate_json(json)
            if (!first_id) {
                first_id = id
            }
            if (json.blocks[id]) {
                json.blocks[id].next = null
                json.blocks[id].parent = last_id
                if (last_id) {
                    json.blocks[last_id].next = id
                }
                last_id = id
            }
        })
        return first_id
    }
}

export {
    type Block,
    type BlockInputs,
    Branch,
    type BranchInputs,
    CallDefinition,
    Command,
    CommandGetStack,
    CommandPopStack,
    CommandPushStack,
    CommandReturn,
    CommandSetStack,
    Definition,
    type Input,
    IR,
    List,
    Opcode,
    Project,
    type ScratchValue,
    Sprite,
    StackVariable,
    Unknown,
    type Value,
    Variable,
}
