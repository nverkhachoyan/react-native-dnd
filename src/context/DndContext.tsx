import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
} from "react";
import { View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import {
  AnimatedRef,
  runOnJS,
  SharedValue,
  useAnimatedRef,
  useSharedValue,
} from "react-native-reanimated";
import { DndID, DraggableType, DroppableType } from "../types";

interface DndContextType {
  currentDraggedId: SharedValue<DndID | null>;
  currentDroppableId: SharedValue<DndID | null>;
  draggables: SharedValue<Record<DndID, DraggableType>>;
  droppables: SharedValue<Record<DndID, DroppableType>>;
  droppedItems: SharedValue<Record<DndID, DndID>>;
  providerViewRef: AnimatedRef<View>;
  requestResetItemPosition?: (itemId: DndID) => void;
}

export type { DndContextType };

export const DndContext = createContext<DndContextType | undefined>(undefined);

export function DndProvider({ children }: { children: ReactNode }) {
  const providerViewRef = useAnimatedRef<View>();

  const draggables = useSharedValue<Record<DndID, DraggableType>>({});
  const droppables = useSharedValue<Record<DndID, DroppableType>>({});
  const droppedItems = useSharedValue<Record<DndID, DndID>>({});

  const currentDraggedId = useSharedValue<DndID | null>(null);
  const currentDroppableId = useSharedValue<DndID | null>(null);
  const previousDroppableId = useSharedValue<DndID | null>(null);

  const getCurrentDraggableId = (x: number, y: number): DndID | null => {
    "worklet";
    const allDraggables = Object.values(draggables.value);

    for (const draggableItem of allDraggables) {
      const itemId = draggableItem.id;
      const itemLayout = draggableItem.layout;
      const itemOffset = draggableItem.offset;

      if (!itemLayout || !itemOffset) {
        continue;
      }

      if (itemLayout.width === 0 && itemLayout.height === 0) {
        continue;
      }

      const Lx = itemLayout.x + itemOffset.x;
      const Ly = itemLayout.y + itemOffset.y;

      if (
        x >= Lx &&
        x <= Lx + itemLayout.width &&
        y >= Ly &&
        y <= Ly + itemLayout.height
      ) {
        return itemId;
      }
    }
    return null;
  };

  const setDraggableToDroppablePosition = (
    draggableId: DndID,
    droppableId: DndID
  ) => {
    "worklet";
    const draggable = draggables.value[draggableId];
    const droppable = droppables.value[droppableId];
    if (!draggable || !droppable || !draggable.layout || !droppable.layout)
      return;
    if (draggable.layout.width === 0 || droppable.layout.width === 0) return;

    const newOffsetX =
      droppable.layout.x -
      draggable.layout.x +
      (droppable.layout.width - draggable.layout.width) / 2;
    const newOffsetY =
      droppable.layout.y -
      draggable.layout.y +
      (droppable.layout.height - draggable.layout.height) / 2;

    draggables.value = {
      ...draggables.value,
      [draggableId]: {
        ...draggable,
        offset: { x: newOffsetX, y: newOffsetY },
        start: { x: newOffsetX, y: newOffsetY },
      },
    };
  };

  const resetDraggableToHomePosition = useCallback(
    (id: DndID) => {
      "worklet";
      const draggable = draggables.value[id];
      if (!draggable) {
        return;
      }

      draggables.value = {
        ...draggables.value,
        [id]: {
          ...draggable,
          offset: { x: 0, y: 0 },
          start: { x: 0, y: 0 },
        },
      };
    },
    [draggables]
  );

  const findCurrentDroppable = () => {
    "worklet";
    const id = currentDraggedId.value;
    if (!id) return null;

    const draggable = draggables.value[id];
    if (!draggable || !draggable.layout || draggable.layout.width === 0) {
      return null;
    }

    const draggableX = draggable.layout.x + draggable.offset.x;
    const draggableY = draggable.layout.y + draggable.offset.y;
    const draggableWidth = draggable.layout.width;
    const draggableHeight = draggable.layout.height;

    let bestCenterMatch: { id: DndID; overlap: number } | null = null;
    let bestOverlapMatch: { id: DndID; overlap: number } | null = null;

    for (const [key, { layout }] of Object.entries(droppables.value)) {
      if (!layout || layout.width === 0) continue;

      const droppableX = layout.x;
      const droppableY = layout.y;
      const droppableWidth = layout.width;
      const droppableHeight = layout.height;

      const overlapX = Math.max(
        0,
        Math.min(draggableX + draggableWidth, droppableX + droppableWidth) -
          Math.max(draggableX, droppableX)
      );
      const overlapY = Math.max(
        0,
        Math.min(draggableY + draggableHeight, droppableY + droppableHeight) -
          Math.max(draggableY, droppableY)
      );
      const overlapArea = overlapX * overlapY;
      const draggableArea = draggableWidth * draggableHeight;
      if (draggableArea === 0) continue;
      const overlapPercentage = overlapArea / draggableArea;

      const centerX = draggableX + draggableWidth / 2;
      const centerY = draggableY + draggableHeight / 2;
      const centerInDroppable =
        centerX >= droppableX &&
        centerX <= droppableX + droppableWidth &&
        centerY >= droppableY &&
        centerY <= droppableY + droppableHeight;

      if (centerInDroppable) {
        if (!bestCenterMatch || overlapPercentage > bestCenterMatch.overlap) {
          bestCenterMatch = { id: key, overlap: overlapPercentage };
        }
      } else if (overlapArea > 0) {
        // Any positive overlap area considered for non-center matches
        if (!bestOverlapMatch || overlapPercentage > bestOverlapMatch.overlap) {
          bestOverlapMatch = { id: key, overlap: overlapPercentage };
        }
      }
    }

    if (bestCenterMatch) return bestCenterMatch.id;
    // Fallback to best overall overlap if no center match
    if (bestOverlapMatch) return bestOverlapMatch.id;

    return null;
  };

  const handleDrop = (draggedId: DndID, droppableId: DndID) => {
    "worklet";
    const droppableInfo = droppables.value[droppableId];
    if (!droppableInfo) {
      resetDraggableToHomePosition(draggedId);
      if (droppedItems.value[draggedId]) {
        const { [draggedId]: _removed, ...rest } = droppedItems.value;
        droppedItems.value = rest;
      }
      return;
    }

    const isSwappable = droppableInfo.swappable ?? true;
    const newDroppedItems = { ...droppedItems.value };

    if (isSwappable) {
      for (const itemIdInContext in newDroppedItems) {
        if (
          newDroppedItems[itemIdInContext] === droppableId &&
          itemIdInContext !== draggedId
        ) {
          const itemToReset = itemIdInContext;
          delete newDroppedItems[itemToReset];
          resetDraggableToHomePosition(itemToReset);
        }
      }
    }

    newDroppedItems[draggedId] = droppableId;
    droppedItems.value = newDroppedItems;

    setDraggableToDroppablePosition(draggedId, droppableId);

    const appOnDropCallback = droppableInfo.callbacks?.onDrop;
    if (appOnDropCallback) {
      runOnJS(appOnDropCallback)(draggedId);
    }
  };

  const handleEnterDroppable = (draggedId: DndID, droppableId: DndID) => {
    "worklet";
    const droppable = droppables.value[droppableId];
    if (droppable && droppable.callbacks?.onEnter) {
      runOnJS(droppable.callbacks.onEnter)(draggedId);
    }
  };

  const handleLeaveDroppable = (draggedId: DndID, droppableId: DndID) => {
    "worklet";
    const droppable = droppables.value[droppableId];
    if (droppable && droppable.callbacks?.onLeave) {
      runOnJS(droppable.callbacks.onLeave)(draggedId);
    }
  };

  const cleanupAndResetDraggable = (draggedId: DndID) => {
    "worklet";
    if (droppedItems.value[draggedId]) {
      const { [draggedId]: _removed, ...rest } = droppedItems.value;
      droppedItems.value = rest;
    }
    resetDraggableToHomePosition(draggedId);
  };

  const processDropOnValidTarget = (
    draggedId: DndID,
    targetDroppableId: DndID,
    droppableInfo: DroppableType
  ) => {
    "worklet";
    const capacity = droppableInfo.capacity ?? 1;
    const isSwappable = droppableInfo.swappable ?? true;

    let itemsCurrentlyInTargetCount = 0;
    let isDraggedItemAlreadyPhysicallyInTarget = false;

    // Calculate how many items are already in the target droppable
    // and if the currently dragged item was already one of them
    for (const [itemId, occupantsDroppableId] of Object.entries(
      droppedItems.value
    )) {
      if (occupantsDroppableId === targetDroppableId) {
        itemsCurrentlyInTargetCount++;
        if (itemId === draggedId) {
          isDraggedItemAlreadyPhysicallyInTarget = true;
        }
      }
    }

    // Determine if the item can be placed directly
    // If it was already in the target, it can stay if capacity allows (itemsCurrentlyInTargetCount <= capacity)
    // If it's new to the target, it can be placed if there's space (itemsCurrentlyInTargetCount < capacity)
    const canPlaceDirectly = isDraggedItemAlreadyPhysicallyInTarget
      ? itemsCurrentlyInTargetCount <= capacity
      : itemsCurrentlyInTargetCount < capacity;

    if (canPlaceDirectly) {
      handleDrop(draggedId, targetDroppableId);
    } else {
      // Cannot place directly (e.g., over capacity for a new item)
      if (isSwappable) {
        // If swappable, proceed with the drop (handleDrop will manage swapping)
        handleDrop(draggedId, targetDroppableId);
      } else {
        // Not swappable and cannot place directly, so reset the item
        cleanupAndResetDraggable(draggedId);
      }
    }
  };

  const gesture = Gesture.Pan()
    .onBegin((e) => {
      "worklet";
      const id = getCurrentDraggableId(e.x, e.y);
      if (!id) {
        return;
      }
      currentDraggedId.value = id;
      const draggable = draggables.value[id];
      if (draggable && draggable.offset) {
        draggable.start = { x: draggable.offset.x, y: draggable.offset.y };
      }
    })
    .onUpdate((e) => {
      "worklet";
      const id = currentDraggedId.value;
      if (id === null) return;
      const draggable = draggables.value[id];
      if (!draggable || !draggable.start || !draggable.offset) {
        return;
      }
      const newOffsetX = draggable.start.x + e.translationX;
      const newOffsetY = draggable.start.y + e.translationY;
      draggable.offset = { x: newOffsetX, y: newOffsetY };
      draggables.value = { ...draggables.value };

      const droppableId = findCurrentDroppable();
      if (droppableId !== previousDroppableId.value) {
        if (previousDroppableId.value) {
          handleLeaveDroppable(id, previousDroppableId.value);
        }
        if (droppableId) {
          handleEnterDroppable(id, droppableId);
        }
      }
      currentDroppableId.value = droppableId;
      previousDroppableId.value = droppableId;
    })
    .onEnd((_e) => {
      "worklet";
      const draggedId = currentDraggedId.value;
      if (draggedId === null) {
        // Ensure related state is also cleared if drag ended prematurely or was invalid
        currentDroppableId.value = null;
        previousDroppableId.value = null;
        return;
      }

      const targetDroppableId = currentDroppableId.value;

      if (targetDroppableId) {
        const droppableInfo = droppables.value[targetDroppableId];
        if (droppableInfo) {
          processDropOnValidTarget(draggedId, targetDroppableId, droppableInfo);
        } else {
          cleanupAndResetDraggable(draggedId);
        }
      } else {
        // Item is dropped outside of any droppable target
        cleanupAndResetDraggable(draggedId);
      }
    })
    .onFinalize(() => {
      "worklet";
      const id = currentDraggedId.value;
      if (id === null) return;
      if (currentDroppableId.value) {
        handleLeaveDroppable(id, currentDroppableId.value);
      }
      currentDraggedId.value = null;
      currentDroppableId.value = null;
      previousDroppableId.value = null;
    });

  const requestResetItemPosition = useCallback(
    (itemId: DndID) => {
      "worklet";
      resetDraggableToHomePosition(itemId);
    },
    [resetDraggableToHomePosition]
  );

  return (
    <DndContext.Provider
      value={{
        currentDraggedId,
        currentDroppableId,
        draggables,
        droppables,
        droppedItems,
        providerViewRef,
        requestResetItemPosition,
      }}
    >
      <GestureDetector gesture={gesture}>
        <View style={{ flex: 1 }} ref={providerViewRef} collapsable={false}>
          {children}
        </View>
      </GestureDetector>
    </DndContext.Provider>
  );
}

export function useDndContext(): DndContextType {
  const ctx = useContext(DndContext);
  if (!ctx) {
    throw new Error("useDndContext must be inside DndProvider");
  }
  return ctx as DndContextType;
}
