# React Native DND

A versatile drag and drop library for React Native.

## Installation

```bash
npm install @nverk/react-native-dnd
```

### Peer Deps

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

> Wrap DndProvider at the top level to preserve DND state after screen change.

```javascript
import {
  DndList,
  DndProvider,
  Draggable,
  Droppable,
} from "@nverk/react-native-dnd";
import { SafeAreaView, Text } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function HomeScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <GestureHandlerRootView>
        <Text>Drag and Drop Demo</Text>
        <DndProvider>
          <DndList>
            <Droppable key={"drop1"} id={"drop1"}>
              <Text>Drop Here</Text>
            </Droppable>
            <Draggable key={"drag1"} id="drag1">
              <Text>Drag Me</Text>
            </Draggable>
          </DndList>
        </DndProvider>
      </GestureHandlerRootView>
    </SafeAreaView>
  );
}
```

There is a better example at [example](example).

## Contributing

You're free to contribute to the project if you're willing to make sense of the mess I made ;)

## License

MIT
