import { PosInfo } from "../../grammar/lexer.ts";

const to_span = (pos: PosInfo): Span => {
  return new Span(pos, pos);
};

class Span {
  start: PosInfo;
  end: PosInfo;

  constructor(start: PosInfo, end: PosInfo) {
    this.start = start;
    this.end = end;
  }
}

export { Span, to_span };
