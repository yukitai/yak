import * as ast from '../../grammar/ast.ts'
import { TokenType } from '../../grammar/token.ts'
import {
    BOLD,
    CLEAR,
    CYAN,
    GRAY,
    LIGHT,
    MAGENTA,
    YELLOW,
} from '../error/colors.ts'
import { Offset } from '../scratch_ir/type_view.ts'
import { unreachable } from '../utils.ts'

type Type =
    | BuiltinType
    | InferType
    | ArrayType
    | GenericType
    | UnsizedType
    | FuncType
    | RecordType
    | TypeWithGenerics

const from_ast = <T extends ast.AST>(
    ast_: T,
    types: Record<string, Type>,
): Type => {
    if (ast_ instanceof ast.BuiltinType) {
        return BuiltinType.from_ast(ast_, types)
    } else if (ast_ instanceof ast.ArrayType) {
        return ArrayType.from_ast(ast_, types)
    } else if (ast_ instanceof ast.GenericType) {
        return GenericType.from_ast(ast_, types)
    } else if (ast_ instanceof ast.FuncType) {
        return FuncType.from_ast(ast_, types)
    } else if (ast_ instanceof ast.UnsizedType) {
        return UnsizedType.from_ast(ast_, types)
    } else if (ast_ instanceof ast.NameType) {
        const type = types[ast_.name.value] ?? new InferType(ast_)
        return type
    } else {
        return InferType.from_ast(ast_, types)
    }
}

enum BuiltinTypeEnum {
    Num = 'num',
    Str = 'str',
    Bool = 'bool',
    Unit = 'unit',
    List = 'list',
    Nil = 'nil',
}

class BuiltinType {
    target?: ast.AST
    type: BuiltinTypeEnum
    offset?: Offset

    constructor(type: BuiltinTypeEnum, target?: ast.AST) {
        this.type = type
        this.target = target
    }

    static from_ast(ast_: ast.BuiltinType, _types: Record<string, Type>) {
        return new BuiltinType(
            ast_.type.value as BuiltinTypeEnum,
            ast_,
        )
    }

    static from_literal(ast_: ast.Literal): BuiltinType {
        switch (ast_.literal.ty) {
            case TokenType.LiteralNumber:
                return new BuiltinType(BuiltinTypeEnum.Num, ast_)
            case TokenType.LiteralString:
                return new BuiltinType(BuiltinTypeEnum.Str, ast_)
            case TokenType.LiteralBool:
                return new BuiltinType(BuiltinTypeEnum.Bool, ast_)
            default:
                return new BuiltinType(BuiltinTypeEnum.Nil, ast_)
        }
    }

    toString(): string {
        return `${YELLOW}${this.type}${CLEAR}`
    }

    i_say_you_are(ty: Type): boolean {
        if (ty instanceof InferType) {
            if (ty.resolved()) {
                ty = ty.real!
            } else {
                return unreachable()
            }
        }
        if (!(ty instanceof BuiltinType)) {
            return false
        }
        if (this.target instanceof ast.InferType) {
            this.target.infer_result = ty
        }
        return this.type === ty.type
    }

    is_known(): boolean {
        return true
    }

    bind(_map: Record<string, Type>): Type {
        return this
    }

    short_name(): string {
        switch (this.type) {
            case BuiltinTypeEnum.Num:
                return 'n'
            case BuiltinTypeEnum.Str:
                return 's'
            case BuiltinTypeEnum.Bool:
                return 'b'
            case BuiltinTypeEnum.Unit:
                return 'u'
            case BuiltinTypeEnum.List:
                return 'l'
            case BuiltinTypeEnum.Nil:
                return '0'
            default:
                return 'U'
        }
    }
}

class ArrayType {
    target?: ast.AST
    type: Type
    size: number
    offset?: Offset

    constructor(
        type: Type,
        size: number,
        target?: ast.AST,
    ) {
        this.type = type
        this.size = size
        this.target = target
    }

    static from_ast(ast_: ast.ArrayType, types: Record<string, Type>) {
        return new ArrayType(
            from_ast(ast_.type, types),
            parseInt(ast_.llnum.value as string),
            ast_,
        )
    }

    toString(): string {
        return `[${this.type.toString()}; ${CYAN}${this.size}${CLEAR}]`
    }

    i_say_you_are(ty: Type): boolean {
        if (ty instanceof InferType) {
            if (ty.resolved()) {
                ty = ty.real!
            } else {
                return unreachable()
            }
        }
        if (!(ty instanceof ArrayType)) {
            return false
        }
        if (this.size !== ty.size) {
            return false
        }
        if (this.target instanceof ast.InferType) {
            this.target.infer_result = ty
        }
        return this.type.i_say_you_are(ty.type)
    }

    is_known(): boolean {
        return this.type.is_known()
    }

    bind(map: Record<string, Type>): Type {
        return new ArrayType(
            this.type.bind(map),
            this.size,
            this.target,
        )
    }

    short_name(): string {
        return `a${this.type.short_name()}_${this.size}`
    }
}

class GenericType {
    target?: ast.AST
    type: Type
    generics: Type[]
    offset?: Offset

    constructor(
        type: Type,
        generics: Type[],
        target?: ast.AST,
    ) {
        this.type = type
        this.generics = generics
        this.target = target
    }

    static from_ast(ast_: ast.GenericType, types: Record<string, Type>) {
        return GenericType.create(
            from_ast(ast_.type, types),
            ast_.generics.map((x) => from_ast(x, types)),
            ast_,
        )
    }

    toString(): string {
        return `${this.type.toString()}<${
            this.generics.map((x) => x.toString()).join(', ')
        }>`
    }

    i_say_you_are(ty: Type): boolean {
        if (ty instanceof InferType) {
            if (ty.resolved()) {
                ty = ty.real!
            } else {
                return unreachable()
            }
        }
        if (!(ty instanceof GenericType)) {
            return false
        }
        if (this.generics.length !== ty.generics.length) {
            return false
        }
        let type_matched = this.type.i_say_you_are(ty.type)
        this.generics.forEach((type, i) => {
            type_matched &&= type.i_say_you_are((ty as GenericType).generics[i])
        })
        if (this.target instanceof ast.InferType) {
            this.target.infer_result = ty
        }
        return type_matched
    }

    is_known(): boolean {
        return this.type.is_known() && this.generics.every((x) => x.is_known())
    }

    static create(
        type: Type,
        generics: Type[],
        target?: ast.AST,
    ): Type {
        if (!(type instanceof TypeWithGenerics)) {
            return new GenericType(type, generics, target)
        }
        const created = type.create_type(generics)
        return created ?? new GenericType(type, generics, target)
    }

    bind(map: Record<string, Type>): Type {
        return new GenericType(
            this.type.bind(map),
            this.generics.map((x) => x.bind(map)),
            this.target,
        )
    }

    short_name(): string {
        return `g${this.type.short_name()}_${
            this.generics.map((x) => x.short_name()).join('_')
        }G`
    }
}

class TypeWithGenerics {
    target?: ast.AST
    type: Type
    generics: ast.Ident[]
    offset?: Offset

    constructor(
        type: Type,
        generics: ast.Ident[],
        target?: ast.AST,
    ) {
        this.type = type
        this.generics = generics
        this.target = target
    }

    static from_ast(ast_: ast.AST, types: Record<string, Type>) {
        return from_ast(ast_, types)
    }

    toString(): string {
        return `${this.type.toString()}<${
            this.generics.map((x) => `${LIGHT}${BOLD}${x.name.value}${CLEAR}`)
                .join(', ')
        }>`
    }

    i_say_you_are(_ty: Type): boolean {
        return false
    }

    is_known(): boolean {
        return false
    }

    create_type(generics: Type[]): Type {
        const generic_map: Record<string, Type> = {}
        this.generics.forEach((key, i) => {
            generic_map[key.name.value as string] = generics[i]
        })

        return this.type.bind(generic_map)
    }

    bind(_map: Record<string, Type>): Type {
        return this
    }

    short_name(): string {
        return `g${this.type.short_name()}_${
            this.generics.map((x) => x.name.value).join('_')
        }G`
    }
}

class UnsizedType {
    target?: ast.AST
    type: Type
    offset?: Offset

    constructor(type: Type, target?: ast.AST) {
        this.type = type
        this.target = target
    }

    static from_ast(ast_: ast.UnsizedType, types: Record<string, Type>) {
        return new UnsizedType(from_ast(ast_.type, types), ast_)
    }

    toString(): string {
        return `${MAGENTA}unsized${CLEAR} ${this.type.toString()}`
    }

    i_say_you_are(ty: Type): boolean {
        if (ty instanceof InferType) {
            if (ty.resolved()) {
                ty = ty.real!
            } else {
                return unreachable()
            }
        }
        if (!(ty instanceof UnsizedType)) {
            return false
        }
        if (this.target instanceof ast.InferType) {
            this.target.infer_result = ty
        }
        return this.type.i_say_you_are(ty.type)
    }

    is_known(): boolean {
        return this.type.is_known()
    }

    bind(map: Record<string, Type>): Type {
        return new UnsizedType(
            this.type.bind(map),
            this.target,
        )
    }

    short_name(): string {
        return `v${this.type.short_name()}`
    }
}

class FuncType {
    target?: ast.AST
    args: Type[]
    ret_t: Type
    offset?: Offset

    constructor(
        args: Type[],
        ret_t: Type,
        target?: ast.AST,
    ) {
        this.args = args
        this.ret_t = ret_t
        this.target = target
    }

    static from_ast(ast_: ast.FuncType, types: Record<string, Type>) {
        return new FuncType(
            ast_.args.map((x) => from_ast(x, types)),
            from_ast(ast_.ret_t, types),
            ast_,
        )
    }

    toString(): string {
        return `|${
            this.args.map((x) => x.toString()).join(', ')
        }| -> ${this.ret_t.toString()}`
    }

    i_say_you_are(ty: Type): boolean {
        if (ty instanceof InferType) {
            if (ty.resolved()) {
                ty = ty.real!
            } else {
                return unreachable()
            }
        }
        if (!(ty instanceof FuncType)) {
            return false
        }
        if (this.args.length !== ty.args.length) {
            return false
        }
        let type_matched = this.ret_t.i_say_you_are(ty.ret_t)
        this.args.forEach((type, i) => {
            type_matched = type.i_say_you_are((ty as FuncType).args[i]) &&
                type_matched
        })
        if (this.target instanceof ast.InferType) {
            this.target.infer_result = ty
        }
        return type_matched
    }

    is_known(): boolean {
        return this.ret_t.is_known() && this.args.every((x) => x.is_known())
    }

    bind(map: Record<string, Type>): Type {
        return new FuncType(
            this.args.map((x) => x.bind(map)),
            this.ret_t.bind(map),
            this.target,
        )
    }

    short_name(): string {
        return `f${
            this.args.map((x) => x.short_name()).join('_')
        }_${this.ret_t.short_name()}F`
    }
}

type RecordFields = { [key: string]: Type }

class RecordType {
    target?: ast.AST
    fields: RecordFields
    offset?: Offset

    constructor(fields: RecordFields, target?: ast.AST) {
        this.target = target
        this.fields = fields
    }

    static from_ast(ast_: ast.AST, _types: Record<string, Type>) {
        return new InferType(ast_)
    }

    toString(): string {
        return `{ ${
            Object.entries(this.fields).map(([key, value]) => {
                return `${CYAN}${key}${CLEAR}: ${value.toString()}`
            }).join(', ')
        } }`
    }

    i_say_you_are(ty: Type): boolean {
        if (ty instanceof InferType) {
            if (ty.resolved()) {
                ty = ty.real!
            } else {
                return unreachable()
            }
        }
        if (!(ty instanceof RecordType)) {
            return false
        }
        let type_matched = true
        Object.keys(this.fields).forEach((key) => {
            if (type_matched) {
                type_matched = this.fields[key].i_say_you_are(
                    (ty as RecordType).fields[key],
                )
            }
        })
        return type_matched
    }

    is_known(): boolean {
        return Object.values(this.fields).every((x) => x.is_known())
    }

    bind(map: Record<string, Type>): Type {
        return new RecordType(
            Object.fromEntries(
                Object.entries(this.fields).map(([k, v]) => [k, v.bind(map)]),
            ),
            this.target,
        )
    }

    short_name(): string {
        return `r${
            Object.entries(this.fields).map(([k, v]) =>
                `${k}_${v.short_name()}`
            ).join('_')
        }R`
    }
}

class InferType {
    target?: ast.AST
    real?: Type
    offset?: Offset

    constructor(target?: ast.AST) {
        this.target = target
    }

    resolve(real: Type) {
        this.real = real
    }

    resolved(): boolean {
        return this.real !== undefined
    }

    static from_ast(ast_: ast.AST, _types: Record<string, Type>) {
        return new InferType(ast_)
    }

    toString(): string {
        return this.real
            ? `${MAGENTA}infer${CLEAR} ${this.real.toString()}`
            : `${GRAY}infer${CLEAR}`
    }

    i_say_you_are(ty: Type): boolean {
        if (ty instanceof InferType) {
            if (ty.resolved()) {
                ty = ty.real!
            } else {
                return unreachable()
            }
        }
        if (this.resolved()) {
            return this.real!.i_say_you_are(ty)
        } else {
            this.real = ty
            if (this.target instanceof ast.InferType) {
                this.target.infer_result = ty
            }
            return true
        }
    }

    is_known(): boolean {
        return this.resolved()
    }

    bind(map: Record<string, Type>): Type {
        if (this.target instanceof ast.NameType) {
            const name = this.target.name.value as string
            if (map[name]) {
                return map[name]
            }
        }
        const infer_t = new InferType(this.target)
        infer_t.real = this.real
        return infer_t
    }

    short_name(): string {
        return this.real?.short_name() ?? 'U'
    }
}

export {
    ArrayType,
    BuiltinType,
    BuiltinTypeEnum,
    from_ast,
    FuncType,
    GenericType,
    InferType,
    type RecordFields,
    RecordType,
    type Type,
    TypeWithGenerics,
    UnsizedType,
}
