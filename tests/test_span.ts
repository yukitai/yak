import { assertEquals } from 'https://deno.land/std@0.208.0/assert/assert_equals.ts'
import { Span } from '../src/error/span.ts'

Deno.test({
    name: 'test_if_span_merge_works',
    fn() {
        const span1 = new Span({
            overallPos: 114,
            line: 2,
            offset: 19,
        }, {
            overallPos: 810,
            line: 6,
            offset: 19,
        })
        const span2 = new Span({
            overallPos: 514,
            line: 3,
            offset: 8,
        }, {
            overallPos: 1919,
            line: 7,
            offset: 10,
        })
        const expect = new Span({
            overallPos: 114,
            line: 2,
            offset: 19,
        }, {
            overallPos: 1919,
            line: 7,
            offset: 10,
        })
        assertEquals(expect, span1.merge(span2))
        assertEquals(expect, span2.merge(span1))
    },
})
