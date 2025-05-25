---
sidebar_position: 1
---

# @nverk/react-native-dnd

Intuitive Drag and Drop for React Native, powered by Reanimated & Gesture Handler

<!-- Placeholder for badges -->
<!-- ![NPM Version](...) -->
<!-- ![License](...) -->
<!-- ![Build Status](...) -->

## Overview

`@nverk/react-native-dnd` is a lightweight and performant drag-and-drop solution for React Native applications. It leverages the power of `react-native-gesture-handler` for robust gesture recognition and `react-native-reanimated` (v3 compatible) for smooth, native-feeling animations.

**Key Features:**

- Built with `react-native-gesture-handler` and `react-native-reanimated`.
- Smooth animations and precise gesture handling.
- Highly customizable drag and drop behavior.
- Lightweight and focused API.
- Type-safe with TypeScript.
- Supports snapping, swapping, capacity limits, and various drop behaviors.

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

## Core Concept: `DndProvider`

All drag-and-drop functionality must be wrapped within a `<DndProvider>`. This component sets up the context for draggables and droppables to communicate.

```jsx
import { DndProvider } from "@nverk/react-native-dnd";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { View, StyleSheet } from "react-native";

function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <DndProvider>
        {/* Your app components that use drag and drop */}
      </DndProvider>
    </GestureHandlerRootView>
  );
}

export default App;
```

**Note:** It's important to wrap your application with `GestureHandlerRootView` at the root, as shown in the example, for `react-native-gesture-handler` to work correctly.

## Main Components

### `<Draggable>`

Makes any child component draggable.

**Props:**

- `id: DndID` (Required): A unique identifier for the draggable item.
- `style?: ViewStyle`: Standard React Native style for the wrapping `Animated.View`.
- `children: ReactNode`: The content to be made draggable.
- `onEnter?: (draggedId: DndID, droppableId: DndID | null) => void`: Callback fired when this draggable enters a droppable area.
- `onLeave?: (draggedId: DndID, droppableId: DndID | null) => void`: Callback fired when this draggable leaves a droppable area.
- `onDrop?: (draggedId: DndID, droppableId: DndID | null) => void`: Callback fired when this draggable is dropped, whether on a droppable or not. `droppableId` will be `null` if not dropped on a valid target.
- `dropBehavior?: DraggableDropBehaviorType`: Defines behavior when dropped outside a valid droppable.
  - `'snapToHome'` (Default): Returns to its original starting position.
  - `'freeRoam'`: Stays at the drop location.
- `userAnimatedStyle?: (isDragging: boolean) => Record<string, unknown>`: A Reanimated worklet function that returns animated styles based on the dragging state.
  ```javascript
  // Example:
  const animatedStyle = (isDragging) => {
    "worklet";
    return {
      opacity: isDragging ? 0.7 : 1,
      transform: [{ scale: isDragging ? 1.1 : 1 }],
    };
  };
  ```
- `onDragStateChange?: (isDragging: boolean) => void`: Callback when the dragging state (isDragging) of this item changes.
- `springConfig?: WithSpringConfig`: Reanimated `withSpring` configuration for animations (e.g., snapping back to home or to a droppable).

**Basic Usage Example:**

```jsx
import { Draggable } from "@nverk/react-native-dnd";
import Animated, {
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { View, Text, StyleSheet } from "react-native";

const MyDraggableItem = ({ id }) => {
  const customAnimatedStyle = (isDragging) => {
    "worklet";
    return {
      opacity: withTiming(isDragging ? 0.7 : 1),
      transform: [{ scale: withTiming(isDragging ? 1.1 : 1) }],
    };
  };

  return (
    <Draggable
      id={id}
      userAnimatedStyle={customAnimatedStyle}
      onDrop={(draggedId, droppableId) =>
        console.log(`Item ${draggedId} dropped on ${droppableId}`)
      }
    >
      <Animated.View style={styles.draggableBox}>
        <Text>Drag Me ({id})</Text>
      </Animated.View>
    </Draggable>
  );
};

const styles = StyleSheet.create({
  draggableBox: {
    width: 100,
    height: 100,
    backgroundColor: "skyblue",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
  },
});
```

### `<Droppable>`

Creates an area where `<Draggable>` components can be dropped.

**Props:**

- `id: DndID` (Required): A unique identifier for the droppable area.
- `style?: ViewStyle`: Standard React Native style for the wrapping `Animated.View`.
- `children: ReactNode`: Content of the droppable area. Can be used to display items currently dropped in it or placeholder content.
- `onEnter?: (droppableId: DndID, draggedId: DndID | null) => void`: Callback fired when a draggable enters this droppable area.
- `onLeave?: (droppableId: DndID, draggedId: DndID | null) => void`: Callback fired when a draggable leaves this droppable area.
- `onDrop?: (droppableId: DndID, draggedId: DndID | null) => void`: Callback fired when a draggable is dropped onto this droppable area.
- `capacity?: number`: (Default: `1`) Maximum number of draggables this droppable can hold.
- `swappable?: boolean`: (Default: `true`) If `true` and `capacity` is reached, dropping a new item will attempt to displace an existing item (the oldest one dropped). If `false` and capacity is reached, new items cannot be dropped.
- `snapBehavior?: SnapBehaviorType`: Defines how a dropped draggable snaps to this droppable.
  - `'center'` (Default): Draggable snaps to the center of the droppable.
  - `'topLeft'`, `'topCenter'`, `'topRight'`, `'middleLeft'`, `'middleRight'`, `'bottomLeft'`, `'bottomCenter'`, `'bottomRight'`: Draggable snaps to the respective corner/edge.
  - `'none'`: Draggable stays where it was dropped within the droppable boundaries (no snapping).
  - `{ x: number, y: number }`: Custom offset from the droppable's top-left corner for the draggable's top-left corner.
- `userAnimatedStyle?: (isHovered: boolean) => Record<string, unknown>`: A Reanimated worklet function that returns animated styles based on whether a draggable is hovering over this droppable.
  ```javascript
  // Example:
  const animatedStyle = (isHovered) => {
    "worklet";
    return {
      backgroundColor: isHovered ? "lightgreen" : "lightgrey",
    };
  };
  ```
- `onHoverStateChange?: (isHovered: boolean) => void`: Callback when the hover state (isHovered) of this droppable changes.

**Basic Usage Example:**

```jsx
import { Droppable } from "@nverk/react-native-dnd";
import Animated, {
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { View, Text, StyleSheet } from "react-native";

const MyDroppableArea = ({ id }) => {
  const customAnimatedStyle = (isHovered) => {
    "worklet";
    return {
      backgroundColor: withTiming(isHovered ? "lightblue" : "lightgrey"),
      borderColor: withTiming(isHovered ? "blue" : "grey"),
      borderWidth: 2,
    };
  };
  return (
    <Droppable
      id={id}
      style={styles.droppableArea}
      userAnimatedStyle={customAnimatedStyle}
    >
      <Text>Drop Here ({id})</Text>
    </Droppable>
  );
};

const styles = StyleSheet.create({
  droppableArea: {
    width: 200,
    height: 200,
    padding: 10,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
});
```

## Hooks

### `useDndContext()`

Provides access to the internal state and methods of the DND system. This is useful for advanced scenarios or building custom components that interact with the DND state.

**Return Value:**

- `currentDraggableId: SharedValue<DndID | null>`: The ID of the draggable currently being dragged, or `null`.
- `currentDroppableId: SharedValue<DndID | null>`: The ID of the droppable currently being hovered over by a draggable, or `null`.
- `draggables: SharedValue<Record<DndID, DraggableType>>`: A shared value record of all registered draggable items and their states.
- `droppables: SharedValue<Record<DndID, DroppableType>>`: A shared value record of all registered droppable areas and their states.
- `droppedItems: SharedValue<Record<DndID, DndID>>`: A shared value record mapping draggable IDs to the droppable ID they are currently occupying.
- `providerViewRef: AnimatedRef<View>`: A ref to the main provider view, used for layout measurements.
- `requestResetItemPosition?: (itemId: DndID) => void`: A worklet function to programmatically reset a draggable item to its home position.

**Conceptual Example:**

```jsx
import { useDndContext } from "@nverk/react-native-dnd";
import { useAnimatedReaction, runOnJS } from "react-native-reanimated";
import { Button } from "react-native";

function DndMonitor() {
  const { currentDraggableId, droppedItems, requestResetItemPosition } =
    useDndContext();

  useAnimatedReaction(
    () => currentDraggableId.value,
    (draggingId, _prevDraggingId) => {
      if (draggingId) {
        // runOnJS is needed if you want to call non-worklet functions like console.log
        runOnJS(console.log)("Item currently being dragged:", draggingId);
      }
    },
    [currentDraggableId] // Dependencies
  );

  const handleResetItem = (itemId) => {
    if (requestResetItemPosition) {
      // This needs to be called from a worklet context or wrapped with runOnUI if called from JS
      // For simplicity, assuming this button is part of a component that can trigger JS -> UI thread
      // In a real scenario, you might call this from a gesture handler or another UI-driven event.
      // For direct JS call to worklet: runOnUI(requestResetItemPosition)(itemId);
      console.log(`Requesting reset for item: ${itemId}`);
      // A simple way if not in worklet context
      // runOnUI(() => {
      //   requestResetItemPosition(itemId);
      // })();
    }
  };

  // Example: Button to reset a specific item (assuming 'item1' exists)
  // return <Button title="Reset Item 1" onPress={() => handleResetItem('item1')} />;
  return null; // Or render some monitoring UI
}
```

## Key Types

- `DndID: string | number`: Unique identifier for draggable and droppable components.
- `SnapBehaviorType: 'center' | 'topLeft' | 'topCenter' | 'topRight' | 'middleLeft' | 'middleRight' | 'bottomLeft' | 'bottomCenter' | 'bottomRight' | 'none' | { x: number; y: number }`: Defines how a draggable snaps to a droppable.
- `DraggableDropBehaviorType: 'snapToHome' | 'freeRoam'`: Defines draggable behavior when not dropped on a target.
- `DraggableType`: Internal representation of a draggable item's state and configuration.
  ```typescript
  type DraggableType = {
    id: DndID;
    layout: { x: number; y: number; width: number; height: number }; // Relative to DndProvider
    callbacks?: DraggableCallbacks;
    start: { x: number; y: number }; // Initial offset when drag starts
    offset: { x: number; y: number }; // Current offset from original position
    dropBehavior?: DraggableDropBehaviorType;
  };
  ```
- `DroppableType`: Internal representation of a droppable area's state and configuration.
  ```typescript
  interface DroppableType {
    id: DndID;
    layout: { x: number; y: number; width: number; height: number }; // Relative to DndProvider
    callbacks?: DroppableCallbacks;
    capacity?: number;
    swappable?: boolean;
    snapBehavior?: SnapBehaviorType;
  }
  ```
- `DraggableCallbacks`:
  ```typescript
  type DraggableCallbacks = {
    onEnter?: (draggedId: DndID, droppableId: DndID | null) => void;
    onLeave?: (draggedId: DndID, droppableId: DndID | null) => void;
    onDrop?: (draggedId: DndID, droppableId: DndID | null) => void;
  };
  ```
- `DroppableCallbacks`:
  ```typescript
  type DroppableCallbacks = {
    onEnter?: (droppableId: DndID, draggedId: DndID | null) => void;
    onLeave?: (droppableId: DndID, draggedId: DndID | null) => void;
    onDrop?: (droppableId: DndID, draggedId: DndID | null) => void;
  };
  ```

### Styling Dragging/Hover States

Utilize the `userAnimatedStyle` prop on both `<Draggable>` (receives `isDragging`) and `<Droppable>` (receives `isHovered`) to provide dynamic visual feedback. These functions are Reanimated worklets, allowing for direct manipulation of styles on the UI thread for maximum performance.

### Capacity and Swapping

- **`capacity`** on `<Droppable>`: Limits how many items can be in a droppable.
- **`swappable`** on `<Droppable>`:
  - If `true` (default) and `capacity` is met, dropping a new item will remove the oldest item currently in the droppable (which will then respect its own `dropBehavior`, e.g., snap to home).
  - If `false` and `capacity` is met, no new items can be dropped until space is available.

### Snap Behaviors (`snapBehavior` on `<Droppable>`)

- **Positional:** `'center'`, `'topLeft'`, `'topRight'`, etc., align the draggable relative to the droppable.
- **`'none'`:** The draggable remains at the exact position it was released within the droppable. The droppable still "captures" the item.
- **Custom `{ x: number, y: number }`:** Snaps the top-left of the draggable to this `(x, y)` offset relative to the top-left of the droppable.

### Draggable Drop Behaviors (`dropBehavior` on `<Draggable>`)

This prop determines what happens to a draggable if it's released _not_ over any valid droppable area.

- `'snapToHome'` (default): The draggable animates back to its original measured position.
- `'freeRoam'`: The draggable remains at the location where it was dropped. Its "home" position for future drags effectively updates to this new spot.

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## License

This library is licensed under the MIT License.
