import { BOLD, CYAN, GRAY, MAGENTA, RED, YELLOW } from '../error/colors.ts'
import { CLEAR } from '../error/colors.ts'
import { ToStringable } from '../utils.ts'
import { Formatter } from './formatter.ts'
import { Id, next_id } from './id.ts'

type Offset = number
type ScratchValue = string | number | boolean
type Input = ScratchValue | Variable | List | Opcode | Command
type BlockInputs = Record<string, Input>
type BranchInputs = Record<string, Branch>

abstract class IR {
    abstract display(fmt: Formatter): void

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
}

class Definition extends IR {
    name: string
    id: Id
    inputs: Variable[]
    body: Branch
    scoped_variables: Record<Id, StackVariable>

    constructor(name: string, inputs: Variable[], body: Branch) {
        super()
        this.name = name
        this.id = next_id()
        this.inputs = inputs
        this.body = body
        this.scoped_variables = {}
    }

    display(fmt: Formatter) {
        fmt.write_command('define', this.name, ...this.inputs)
        this.body.display(fmt)
    }
}

class Variable extends IR {
    name: string
    id: Id
    init: ScratchValue

    constructor(name: string, init: ScratchValue = '') {
        super()
        this.name = name
        this.id = next_id()
        this.init = init
    }

    display(fmt: Formatter) {
        fmt.write_header(this.name, this.id)
    }

    toString() {
        return `(${YELLOW}var${CLEAR}:${MAGENTA}${this.name}${CLEAR})`
    }
}

class StackVariable extends Variable {
    name: string
    offset: Offset

    constructor(name: string, offset: Offset, init?: ScratchValue) {
        super(name, init)
        this.name = name
        this.offset = offset
    }

    display(fmt: Formatter) {
        fmt.write_header(this.name)
    }

    toString() {
        return `(${YELLOW}local${CLEAR}:${MAGENTA}${this.name}${CLEAR})`
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
}

class Opcode extends IR {
    opcode: string
    inputs: BlockInputs
    branches: BranchInputs

    constructor(opcode: string, inputs: BlockInputs, branches: BranchInputs) {
        super()
        this.opcode = opcode
        this.inputs = inputs
        this.branches = branches
    }

    display(fmt: Formatter) {
        fmt.write_command(this.opcode)
        fmt.indent()
        Object.entries(this.inputs).forEach(([k, v]) => {
            fmt.write_kv(k, v)
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
        })`
    }
}

class Unknown extends Opcode {
    constructor() {
        super('UNKNOWN', {}, {})
    }

    display(fmt: Formatter) {
        fmt.write_command(`${RED}${BOLD}UNKNOWN${CLEAR}`)
    }

    toString(): string {
        return `${RED}${BOLD}UNKNOWN${CLEAR}`
    }
}

class CallDefinition extends Opcode {
    definition: Definition
    raw_inputs: Input[]

    constructor(def: Definition, inputs: Input[]) {
        // actually this is wrong
        super('__call_definition', {}, {})
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
}

abstract class Command extends IR {
    constructor() {
        super()
    }
}

class CommandPushStack extends Command {
    value: Input

    constructor(value: Input) {
        super()
        this.value = value
    }

    display(fmt: Formatter) {
        fmt.write_command('PUSH_STACK', this.value)
    }

    toString() {
        return `(${RED}${BOLD}error${CLEAR} ${GRAY}PUSH_STACK${CLEAR})`
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
}

class CommandPopStack extends Command {
    constructor() {
        super()
    }

    display(fmt: Formatter) {
        fmt.write_command('POP_STACK')
    }

    toString() {
        return `(${RED}${BOLD}error${CLEAR} ${GRAY}POP_STACK${CLEAR})`
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
