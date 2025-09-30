# Agent Guidelines for Kanta MCP Server

## Build/Lint/Test Commands

- **Build**: `npm run build` - Builds the MCP server for Smithery deployment using container runtime
- **Start**: `npm start` - Runs the built server locally
- **Dev**: `npm run dev` - Runs in development mode with Smithery CLI
- **Watch**: `npm run watch` - Runs in watch mode with tsx

No dedicated lint or test commands are configured. Run `npm run build` to check for TypeScript compilation errors.

## Code Style Guidelines

### TypeScript Configuration
- Strict TypeScript mode enabled with all strict checks
- ES modules (`"type": "module"`)
- Target ES2022, module resolution "bundler"
- Exact optional property types enabled

### Imports
- External library imports first (e.g., `@modelcontextprotocol/sdk`, `zod`)
- Local imports second, grouped by relative path
- Use absolute imports for local modules (e.g., `import { KantaClient } from './kanta-client.js'`)

### Naming Conventions
- **Variables/Functions**: camelCase (`kantaClient`, `handleCustomerTool`)
- **Classes/Types**: PascalCase (`KantaMCPServer`, `CustomerResourceSchema`)
- **Constants**: UPPER_SNAKE_CASE for enums and constants
- **Files**: kebab-case for tool files (`customers.ts`, `users.ts`)

### Code Structure
- **Classes**: Use class syntax with private methods prefixed with `#` when appropriate
- **Functions**: Async/await pattern throughout, prefer arrow functions for callbacks
- **Error Handling**: Try-catch blocks with specific error type checking (McpError, ZodError)
- **Switch Statements**: Used for tool routing, with default case throwing errors

### Formatting
- 2-space indentation
- No semicolons at statement ends
- Single quotes for strings
- Object destructuring and spread operators preferred
- Consistent spacing around operators and braces

### Types and Validation
- Extensive use of Zod schemas for runtime validation
- TypeScript interfaces/types derived from Zod schemas
- Input validation at function boundaries
- Transform functions in schemas for data normalization

### Error Handling Patterns
- MCP-specific errors using `McpError` with appropriate error codes
- Zod validation errors converted to MCP errors
- HTTP status code mapping to MCP error codes
- Graceful degradation for optional API calls

### Async Patterns
- Promise.all() for concurrent API calls
- Promise.allSettled() for resilient batch operations
- Proper error handling in async operations

### Comments
- Minimal comments, prefer self-documenting code
- French comments in some legacy sections
- TODO comments for incomplete features (clearly marked)

### Tool Organization
- Separate tool definition and handler functions
- Tool names follow `action_entity` pattern (`get_customers`, `create_customer`)
- Input schemas defined inline with tool definitions
- Handler functions use switch statements for routing