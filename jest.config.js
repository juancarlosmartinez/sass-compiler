/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
    testEnvironment: "node",
    transform: {
        "^.+.tsx?$": ["ts-jest",{}],
    },
    collectCoverage: true,
    collectCoverageFrom: ["src/**/*.ts"],
    coverageThreshold: {
        global: {
            branches: 82,
            functions: 82,
            lines: 85,
            statements: 85,
        }
    },
    coverageDirectory: "coverage",
};