import {
    ArrayType,
    BuiltinType,
    BuiltinTypeEnum,
    FuncType,
    InferType,
    RecordType,
    Type,
} from '../checker/type.ts'
import { Nullable } from '../utils.ts'

type Offset = number
type Index = string | number

class TypeDescription {
    type: Type

    constructor(type: Type) {
        this.type = type
        this.init()
    }

    init() {}

    index(_indexes: Index[]): Offset {
        return 0
    }
}

type TypeViewField = {
    offset: Offset
    type: Type
    size: number
    desc: TypeDescription
}

class TypeView {
    types: Record<string, TypeViewField>
    offset: Offset

    constructor() {
        this.types = {}
        this.offset = 0
    }

    add(name: string, type: Type): TypeViewField {
        const offset = this.offset
        const desc = new TypeDescription(type)
        const size = TypeView.size_of(type) ?? 0
        const field = { offset, type, size, desc }
        this.types[name] = field
        this.offset += size
        return field
    }

    static size_of(type: Type): Nullable<number> {
        if (type instanceof BuiltinType) {
            switch (type.type) {
                case BuiltinTypeEnum.Num:
                case BuiltinTypeEnum.Str:
                case BuiltinTypeEnum.Bool:
                case BuiltinTypeEnum.Unit:
                    return 1
                case BuiltinTypeEnum.List:
                    return null
                case BuiltinTypeEnum.Nil:
                    return 0
            }
        } else if (type instanceof FuncType) {
            return 1
        } else if (type instanceof ArrayType) {
            return type.size * TypeView.size_of(type.type)!
        } else if (type instanceof InferType) {
            return type.real ? TypeView.size_of(type.real) : null
        } else if (type instanceof RecordType) {
            return Object.values(type.fields)
                .map(TypeView.size_of)
                .reduce((a, b) => a! + b!)
        }
        return null
    }
}

export { type Offset, TypeDescription, TypeView }
