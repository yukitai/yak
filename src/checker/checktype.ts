import { Checker } from './checker.ts'

class TypeChecker {
    checker: Checker

    constructor(checker: Checker) {
        this.checker = checker
    }

    check() {}
}

export { TypeChecker }
