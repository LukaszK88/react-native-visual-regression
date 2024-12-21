/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
  testEnvironment: "node",
  transform: {
    "^.+.tsx?$": ["ts-jest", {}],
  },
  clearMocks: true,
  'moduleNameMapper': {
    '@/(.*)': '<rootDir>/src/$1'
}
 
};
