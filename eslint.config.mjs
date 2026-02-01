import antfu from '@antfu/eslint-config'

export default antfu({
  // Enable TypeScript support
  typescript: true,
  // Enable NestJS specific rules or overrides if needed
  ignores: [
    'dist',
    'node_modules',
    'coverage',
    'pnpm-lock.yaml',
  ],
  rules: {
    // NestJS often uses empty interfaces for DI tokens or markers
    'ts/no-empty-object-type': 'off',
    // NestJS uses dependency injection which often requires consistent usage of specific patterns
    'ts/consistent-type-imports': 'off',
    // Allow console.log for simple services or keep it strict (Antfu defaults to warn/error)
    'no-console': 'warn',
    // NestJS standard is often not strict on explicit return types for controllers
    'ts/explicit-function-return-type': 'off',
    'unused-imports/no-unused-vars': 'off',
    // Allow global process.env usage
    'node/prefer-global/process': 'off',
  },
})
