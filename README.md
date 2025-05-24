# React Native DND

A versatile drag and drop library for React Native.

## Installation

```bash
npm install @nverk/react-native-dnd
```

### Peer Dependencies

This library requires the following peer dependencies:

```bash
npm install react-native-gesture-handler react-native-reanimated
```

## Development

### Building the Library

```bash
# Build for production
npm run build

# Build with TypeScript only (for type checking)
npm run build:tsc

# Watch mode for development
npm run dev
```

### Linting

```bash
npm run lint
```

### Project Structure

- `src/` - Source code
  - `components/` - React components (Draggable, Droppable)
  - `context/` - React context for DND state management
  - `hooks/` - Custom hooks for drag and drop functionality
  - `types/` - TypeScript type definitions
- `dist/` - Built output (generated)

### Build Configuration

The project uses:

- **tsup** for fast bundling with ESBuild
- **TypeScript** for type checking and declaration generation
- **ESLint** for code linting
- Outputs both CommonJS and ESM formats
- Generates TypeScript declaration files

## Usage

```javascript
import { DndProvider, Draggable, Droppable } from "react-native-dnd";

// Your component code here
```

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT
