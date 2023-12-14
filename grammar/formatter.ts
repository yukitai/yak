import {
  BOLD,
  CLEAR,
  CYAN,
  GRAY,
  GREEN,
  ITALLIC,
  LIGHT,
  MAGENTA,
  UNDERLINE,
} from "../src/error/colors.ts";

class Formatter {
  indent_count: number;
  leading_indent: string;
  last_indent: string;

  constructor(indent = "| ", last_indent = "+ ") {
    this.indent_count = 0;
    this.leading_indent = indent;
    this.last_indent = last_indent;
  }

  indent() {
    this.indent_count += 1;
  }

  dedent() {
    this.indent_count -= 1;
  }

  get_indent() {
    if (this.indent_count > 0) {
      return this.leading_indent.repeat(this.indent_count - 1) +
        this.last_indent;
    } else {
      return "";
    }
  }

  write(s: string) {
    console.log(
      GRAY +
        this.get_indent() +
        CLEAR +
        LIGHT + BOLD +
        s +
        CLEAR,
    );
  }

  write_kv(k: string, v?: string) {
    console.log(
      GRAY +
        this.get_indent() +
        CLEAR +
        CYAN +
        k +
        CLEAR +
        ": " +
        (v === undefined ? "" : (ITALLIC +
          GREEN +
          JSON.stringify(v) +
          CLEAR)),
    );
  }

  write_kl(k: string, l: number) {
    console.log(
      GRAY +
        this.get_indent() +
        CLEAR +
        CYAN +
        k +
        CLEAR +
        ": " +
        MAGENTA +
        UNDERLINE +
        "len(" +
        l.toString() +
        ")" +
        CLEAR,
    );
  }
}

export { Formatter };
