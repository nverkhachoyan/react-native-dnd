# @nverk/react-native-dnd

Lightweight Drag and Drop for React Native, powered by Reanimated & Gesture Handler

<!-- Placeholder for badges -->
<!-- ![NPM Version](...) -->
<!-- ![License](...) -->
<!-- ![Build Status](...) -->

[![npm version](https://img.shields.io/npm/v/@nverk/react-native-dnd)](https://www.npmjs.com/package/@nverk/react-native-dnd)
[![npm version](https://img.shields.io/npm/dm/@nverk/react-native-dnd)](https://www.npmjs.com/package/@nverk/react-native-dnd)
[![License](https://img.shields.io/npm/l/@nverk/react-native-dnd)](https://www.npmjs.com/package/@nverk/react-native-dnd)


## Overview

`@nverk/react-native-dnd` is a lightweight and performant drag-and-drop solution for React Native applications. It leverages the power of `react-native-gesture-handler` for robust gesture recognition and `react-native-reanimated` (v3 compatible) for smooth, native-feeling animations.

**Key Features:**

- Built with `react-native-gesture-handler` and `react-native-reanimated`.
- Smooth animations and precise gesture handling.
- Highly customizable drag and drop behavior.
- Lightweight and focused API.
- Type-safe with TypeScript.
- Supports snapping, swapping, capacity limits, and various drop behaviors.

## Documentation

You can find extensive documentation for the module [here](https://react-native-dnd.nverk.me).

## Installation

```bash
npm install @nverk/react-native-dnd
# or
yarn add @nverk/react-native-dnd
```

**Peer Dependencies:**

Ensure you have `react-native-gesture-handler` and `react-native-reanimated` installed and configured in your project.

- `react-native-gesture-handler >= 2.x.x`
- `react-native-reanimated >= 3.x.x`

Refer to their official installation guides for native setup:

- [React Native Gesture Handler Documentation](https://docs.swmansion.com/react-native-gesture-handler/docs/installation)
- [React Native Reanimated Documentation](https://docs.swmansion.com/react-native-reanimated/docs/installation) (ensure the Babel plugin is correctly set up)

**NOTE:** It's important to wrap your application with `GestureHandlerRootView` at the root, as shown in the example, for `react-native-gesture-handler` to work correctly.

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
