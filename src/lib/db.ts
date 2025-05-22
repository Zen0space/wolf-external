// This file re-exports everything from the modular db directory
// This maintains backward compatibility with existing imports

// Re-export everything from the modular structure
export * from './db/index';

// Re-export the client as default
export { default } from './db/index';
