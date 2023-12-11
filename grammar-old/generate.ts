import { generateParser } from "https://deno.land/x/tspeg@v3.1.0-deno-v0.0/mod.ts";

generateParser(
    "./grammar/yak.peg",
    "./grammar/parser.ts",
)