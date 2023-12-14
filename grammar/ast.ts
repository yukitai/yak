import { ToStringable } from "../src/utils.ts";
import { Formatter } from "./formatter.ts";
import { Token } from "./token.ts";

abstract class AST {
  _display_item<T extends string & keyof this>(fmt: Formatter, key: T) {
    const item = this[key];
    if (item instanceof Array) {
      fmt.write_kl(key, item.length);
      fmt.indent();
      item.forEach((it: AST | ToStringable) => {
        if (it instanceof AST) {
          it.display(fmt);
        } else {
          fmt.write(it.toString());
        }
      });
      fmt.dedent();
    } else if (item instanceof AST) {
      fmt.write_kv(key);
      fmt.indent();
      item.display(fmt);
      fmt.dedent();
    } else if (item?.toString) {
      fmt.write_kv(key, item.toString());
    }
  }

  abstract display(fmt: Formatter): void;
}

class BadNode extends AST {
  display(fmt: Formatter) {
    fmt.write("BadNode");
  }
}

class File extends AST {
  defitions: Defition[];

  constructor() {
    super();
    this.defitions = [];
  }

  add(defition: Defition) {
    this.defitions.push(defition);
  }

  display(fmt: Formatter) {
    fmt.write("File");
    fmt.indent();
    this._display_item(fmt, "defitions");
    fmt.dedent();
  }
}

class Ident extends AST {
  name: Token;

  constructor(name: Token) {
    super();
    this.name = name;
  }

  display(fmt: Formatter) {
    fmt.write("Ident");
    fmt.indent();
    this._display_item(fmt, "name");
    fmt.dedent();
  }
}

type Value = BadNode | Literal | Ident;
type Expr = BadNode | Value | ExprCall | ExprS | ExprI | ExprD | ExprG;

class Literal extends AST {
  literal: Token;

  constructor(literal: Token) {
    super();
    this.literal = literal;
  }

  display(fmt: Formatter) {
    this._display_item(fmt, "literal");
  }
}

class ExprS extends AST {
  op: Token;
  expr: Expr;

  constructor(op: Token, expr: Expr) {
    super();
    this.op = op;
    this.expr = expr;
  }

  display(fmt: Formatter) {
    fmt.write("ExprS");
    fmt.indent();
    this._display_item(fmt, "op");
    this._display_item(fmt, "expr");
    fmt.dedent();
  }
}

class ExprD extends AST {
  lhs: Expr;
  op: Token;
  rhs: Expr;

  constructor(lhs: Expr, op: Token, rhs: Expr) {
    super();
    this.lhs = lhs;
    this.op = op;
    this.rhs = rhs;
  }

  display(fmt: Formatter) {
    fmt.write("ExprD");
    fmt.indent();
    this._display_item(fmt, "lhs");
    this._display_item(fmt, "op");
    this._display_item(fmt, "rhs");
    fmt.dedent();
  }
}

class ExprI extends AST {
  expr: Expr;
  lbracket: Token;
  index: Expr;
  rbracket: Token;

  constructor(expr: Expr, lbracket: Token, index: Expr, rbracket: Token) {
    super();
    this.expr = expr;
    this.lbracket = lbracket;
    this.index = index;
    this.rbracket = rbracket;
  }

  display(fmt: Formatter) {
    fmt.write("ExprG");
    fmt.indent();
    this._display_item(fmt, "expr");
    this._display_item(fmt, "lbracket");
    this._display_item(fmt, "index");
    this._display_item(fmt, "rbracket");
    fmt.dedent();
  }
}

class ExprCall extends AST {
  expr: Expr;
  lparen: Token;
  args: Expr[];
  rparen: Token;

  constructor(expr: Expr, lparen: Token, args: Expr[], rparen: Token) {
    super();
    this.expr = expr;
    this.lparen = lparen;
    this.args = args;
    this.rparen = rparen;
  }

  display(fmt: Formatter) {
    fmt.write("ExprCall");
    fmt.indent();
    this._display_item(fmt, "expr");
    this._display_item(fmt, "lparen");
    this._display_item(fmt, "args");
    this._display_item(fmt, "rparen");
    fmt.dedent();
  }
}

class ExprG extends AST {
  lparen: Token;
  expr: Expr;
  rparen: Token;

  constructor(lparen: Token, expr: Expr, rparen: Token) {
    super();
    this.lparen = lparen;
    this.expr = expr;
    this.rparen = rparen;
  }

  display(fmt: Formatter) {
    fmt.write("ExprG");
    fmt.indent();
    this._display_item(fmt, "lparen");
    this._display_item(fmt, "expr");
    this._display_item(fmt, "rparen");
    fmt.dedent();
  }
}

type Statement =
  | BadNode
  | ExprStatement
  | IfStatement
  | WhileStatement
  | ForInStatement
  | ReturnStatement;

class ExprStatement extends AST {
  expr: Expr;

  constructor(expr: Expr) {
    super();
    this.expr = expr;
  }

  display(fmt: Formatter) {
    fmt.write("ExprStatement");
    fmt.indent();
    this._display_item(fmt, "expr");
    fmt.dedent();
  }
}

class IfStatement extends AST {
  if: Token;
  expr: Expr;
  colon: Token;
  body: Block;
  elif_cases: ElifCase[];
  else_case?: ElseCase;

  constructor(
    kif: Token,
    expr: Expr,
    colon: Token,
    body: Block,
    elif_cases: ElifCase[],
    else_case: ElseCase | undefined,
  ) {
    super();
    this.if = kif;
    this.expr = expr;
    this.colon = colon;
    this.body = body;
    this.elif_cases = elif_cases;
    this.else_case = else_case;
  }

  display(fmt: Formatter) {
    fmt.write("IfStatement");
    fmt.indent();
    this._display_item(fmt, "if");
    this._display_item(fmt, "expr");
    this._display_item(fmt, "colon");
    this._display_item(fmt, "body");
    this._display_item(fmt, "elif_cases");
    this.else_case && this._display_item(fmt, "else_case");
    fmt.dedent();
  }
}

class ElifCase extends AST {
  elif: Token;
  expr: Expr;
  colon: Token;
  body: Block;

  constructor(
    elif: Token,
    expr: Expr,
    colon: Token,
    body: Block,
  ) {
    super();
    this.elif = elif;
    this.expr = expr;
    this.colon = colon;
    this.body = body;
  }

  display(fmt: Formatter) {
    fmt.write("ElifCase");
    fmt.indent();
    this._display_item(fmt, "elif");
    this._display_item(fmt, "expr");
    this._display_item(fmt, "colon");
    this._display_item(fmt, "body");
    fmt.dedent();
  }
}

class ElseCase extends AST {
  else: Token;
  colon: Token;
  body: Block;

  constructor(
    kelse: Token,
    colon: Token,
    body: Block,
  ) {
    super();
    this.else = kelse;
    this.colon = colon;
    this.body = body;
  }

  display(fmt: Formatter) {
    fmt.write("ElseCase");
    fmt.indent();
    this._display_item(fmt, "else");
    this._display_item(fmt, "colon");
    this._display_item(fmt, "body");
    fmt.dedent();
  }
}

class WhileStatement extends AST {
  while: Token;
  expr: Expr;
  colon: Token;
  body: Block;

  constructor(
    kwhile: Token,
    expr: Expr,
    colon: Token,
    body: Block,
  ) {
    super();
    this.while = kwhile;
    this.expr = expr;
    this.colon = colon;
    this.body = body;
  }

  display(fmt: Formatter) {
    fmt.write("WhileStatement");
    fmt.indent();
    this._display_item(fmt, "while");
    this._display_item(fmt, "expr");
    this._display_item(fmt, "colon");
    this._display_item(fmt, "body");
    fmt.dedent();
  }
}

class ForInStatement extends AST {
  for: Token;
  pat: Ident; /* replace it with Pattern */
  in: Token;
  expr: Expr;
  colon: Token;
  body: Block;

  constructor(
    kfor: Token,
    pat: Ident,
    kin: Token,
    expr: Expr,
    colon: Token,
    body: Block,
  ) {
    super();
    this.for = kfor;
    this.pat = pat;
    this.in = kin;
    this.expr = expr;
    this.colon = colon;
    this.body = body;
  }

  display(fmt: Formatter) {
    fmt.write("ForInStatement");
    fmt.indent();
    this._display_item(fmt, "for");
    this._display_item(fmt, "pat");
    this._display_item(fmt, "in");
    this._display_item(fmt, "expr");
    this._display_item(fmt, "colon");
    this._display_item(fmt, "body");
    fmt.dedent();
  }
}

class ReturnStatement extends AST {
  return: Token;
  expr?: Expr;

  constructor(kreturn: Token, expr?: Expr) {
    super();
    this.return = kreturn;
    this.expr = expr;
  }

  display(fmt: Formatter) {
    fmt.write("ReturnStatement");
    fmt.indent();
    this._display_item(fmt, "return");
    this.expr && this._display_item(fmt, "expr");
    fmt.dedent();
  }
}

type Defition = BadNode | UseDefition | FuncDefition;

class UseDefition extends AST {
  use: Token;
  names: Ident[];

  constructor(use: Token) {
    super();
    this.use = use;
    this.names = [];
  }

  add(name: Ident) {
    this.names.push(name);
  }

  display(fmt: Formatter) {
    fmt.write("UseDefition");
    fmt.indent();
    this._display_item(fmt, "use");
    this._display_item(fmt, "names");
    fmt.dedent();
  }
}

class FuncDefition extends AST {
  def: Token;
  func_name: Ident;
  lparen: Token;
  args: TypedIdent[];
  rparen: Token;
  thinarr?: Token;
  ret_t: Type;
  colon: Token;
  body: Block;

  constructor(
    def: Token,
    func_name: Ident,
    lparen: Token,
    args: TypedIdent[],
    rparen: Token,
    colon: Token,
    body: Block,
    thinarr?: Token,
    ret_t?: Type,
  ) {
    super();
    this.def = def;
    this.func_name = func_name;
    this.lparen = lparen;
    this.args = args;
    this.rparen = rparen;
    this.colon = colon;
    this.thinarr = thinarr;
    this.ret_t = ret_t ?? new InferType(func_name.name);
    this.body = body;
  }

  display(fmt: Formatter) {
    fmt.write("FuncDefition");
    fmt.indent();
    this._display_item(fmt, "def");
    this._display_item(fmt, "func_name");
    this._display_item(fmt, "lparen");
    this._display_item(fmt, "args");
    this._display_item(fmt, "rparen");
    this.thinarr && this._display_item(fmt, "thinarr");
    this._display_item(fmt, "ret_t");
    this._display_item(fmt, "colon");
    this._display_item(fmt, "body");
    fmt.dedent();
  }
}

class TypedIdent extends AST {
  ident: Ident;
  colon?: Token;
  type: Type;

  constructor(ident: Ident, colon?: Token, type?: Type) {
    super();
    this.ident = ident;
    this.colon = colon;
    this.type = type ?? new InferType(ident.name);
  }

  display(fmt: Formatter) {
    fmt.write("TypedIdent");
    fmt.indent();
    this._display_item(fmt, "ident");
    this.colon && this._display_item(fmt, "colon");
    this._display_item(fmt, "type");
    fmt.dedent();
  }
}

class Block extends AST {
  stmts: Statement[];

  constructor() {
    super();
    this.stmts = [];
  }

  add(stmt: Statement) {
    this.stmts.push(stmt);
  }

  display(fmt: Formatter) {
    fmt.write("Block");
    fmt.indent();
    this._display_item(fmt, "stmts");
    fmt.dedent();
  }
}

type Type =
  | BadNode
  | BuiltinType
  | ArrayType
  | GenericType
  | UnsizedType
  | NameType
  | InferType;

class BuiltinType extends AST {
  type: Token;

  constructor(type: Token) {
    super();
    this.type = type;
  }

  display(fmt: Formatter) {
    fmt.write("BuiltinType");
    fmt.indent();
    this._display_item(fmt, "type");
    fmt.dedent();
  }
}

class GenericType extends AST {
  type: Type;
  lt: Token;
  generics: Type[];
  gt: Token;

  constructor(type: Type, lt: Token, generics: Type[], gt: Token) {
    super();
    this.type = type;
    this.lt = lt;
    this.generics = generics;
    this.gt = gt;
  }

  display(fmt: Formatter) {
    fmt.write("GenericType");
    fmt.indent();
    this._display_item(fmt, "type");
    this._display_item(fmt, "lt");
    this._display_item(fmt, "generics");
    this._display_item(fmt, "gt");
    fmt.dedent();
  }
}

class UnsizedType extends AST {
  unsized: Token;
  type: Type;

  constructor(unsized: Token, type: Type) {
    super();
    this.unsized = unsized;
    this.type = type;
  }

  display(fmt: Formatter) {
    fmt.write("UnsizedType");
    fmt.indent();
    this._display_item(fmt, "unsized");
    this._display_item(fmt, "type");
    fmt.dedent();
  }
}

class ArrayType extends AST {
  lbracket: Token;
  type: Type;
  semi: Token;
  llnum: Token;
  rbracket: Token;

  constructor(
    lbracket: Token,
    type: Type,
    semi: Token,
    llnum: Token,
    rbracket: Token,
  ) {
    super();
    this.lbracket = lbracket;
    this.type = type;
    this.semi = semi;
    this.llnum = llnum;
    this.rbracket = rbracket;
  }

  display(fmt: Formatter) {
    fmt.write("UnsizedType");
    fmt.indent();
    this._display_item(fmt, "lbracket");
    this._display_item(fmt, "type");
    this._display_item(fmt, "semi");
    this._display_item(fmt, "llnum");
    this._display_item(fmt, "rbracket");
    fmt.dedent();
  }
}

class NameType extends AST {
  name: Token;

  constructor(name: Token) {
    super();
    this.name = name;
  }

  display(fmt: Formatter) {
    fmt.write("NameType");
    fmt.indent();
    this._display_item(fmt, "name");
    fmt.dedent();
  }
}

class InferType extends AST {
  infer_result?: Type;
  target: Token;

  constructor(target: Token) {
    super();
    this.target = target;
  }

  display(fmt: Formatter) {
    fmt.write("InferType");
    fmt.indent();
    this._display_item(fmt, "target");
    this.infer_result && this._display_item(fmt, "infer_result");
    fmt.dedent();
  }
}

export {
  ArrayType,
  AST,
  BadNode,
  Block,
  BuiltinType,
  type Defition,
  ElifCase,
  ElseCase,
  type Expr,
  ExprCall,
  ExprD,
  ExprG,
  ExprI,
  ExprS,
  ExprStatement,
  File,
  ForInStatement,
  FuncDefition,
  GenericType,
  Ident,
  IfStatement,
  InferType,
  Literal,
  NameType,
  ReturnStatement,
  type Statement,
  type Type,
  TypedIdent,
  UnsizedType,
  UseDefition,
  type Value,
  WhileStatement,
};
