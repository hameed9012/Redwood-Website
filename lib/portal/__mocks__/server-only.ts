// Test-only stub for the `server-only` package. The real package throws on
// import unless Next.js's build system aliases it away for server bundles;
// under vitest there is no such aliasing, so it always throws. This stub
// lets pure-loader tests import server-only modules (like serverClient.ts)
// without pulling in a real Next.js build.
export {};
