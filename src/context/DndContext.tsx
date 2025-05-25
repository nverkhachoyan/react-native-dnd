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
  currentDraggableId: SharedValue<DndID | null>;
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

  const currentDraggableId = useSharedValue<DndID | null>(null);
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
    const draggableItem = draggables.value[draggableId];
    const droppableInfo = droppables.value[droppableId];

    if (
      !draggableItem ||
      !droppableInfo ||
      !draggableItem.layout ||
      !droppableInfo.layout
    )
      return;
    if (draggableItem.layout.width === 0 && draggableItem.layout.height === 0)
      return;

    const snap = droppableInfo.snapBehavior ?? "center";
    let newOffsetX = draggableItem.offset.x;
    let newOffsetY = draggableItem.offset.y;

    if (snap === "none") {
      draggableItem.start.x = draggableItem.offset.x;
      draggableItem.start.y = draggableItem.offset.y;
      draggables.value = { ...draggables.value };
      return;
    }

    const dLayout = draggableItem.layout;
    const pLayout = droppableInfo.layout;

    if (
      typeof snap === "object" &&
      snap !== null &&
      "x" in snap &&
      "y" in snap
    ) {
      newOffsetX = pLayout.x - dLayout.x + snap.x;
      newOffsetY = pLayout.y - dLayout.y + snap.y;
    } else {
      switch (snap) {
        case "center":
          newOffsetX =
            pLayout.x - dLayout.x + (pLayout.width - dLayout.width) / 2;
          newOffsetY =
            pLayout.y - dLayout.y + (pLayout.height - dLayout.height) / 2;
          break;
        case "topLeft":
          newOffsetX = pLayout.x - dLayout.x;
          newOffsetY = pLayout.y - dLayout.y;
          break;
        case "topCenter":
          newOffsetX =
            pLayout.x - dLayout.x + (pLayout.width - dLayout.width) / 2;
          newOffsetY = pLayout.y - dLayout.y;
          break;
        case "topRight":
          newOffsetX = pLayout.x - dLayout.x + (pLayout.width - dLayout.width);
          newOffsetY = pLayout.y - dLayout.y;
          break;
        case "middleLeft":
          newOffsetX = pLayout.x - dLayout.x;
          newOffsetY =
            pLayout.y - dLayout.y + (pLayout.height - dLayout.height) / 2;
          break;
        case "middleRight":
          newOffsetX = pLayout.x - dLayout.x + (pLayout.width - dLayout.width);
          newOffsetY =
            pLayout.y - dLayout.y + (pLayout.height - dLayout.height) / 2;
          break;
        case "bottomLeft":
          newOffsetX = pLayout.x - dLayout.x;
          newOffsetY =
            pLayout.y - dLayout.y + (pLayout.height - dLayout.height);
          break;
        case "bottomCenter":
          newOffsetX =
            pLayout.x - dLayout.x + (pLayout.width - dLayout.width) / 2;
          newOffsetY =
            pLayout.y - dLayout.y + (pLayout.height - dLayout.height);
          break;
        case "bottomRight":
          newOffsetX = pLayout.x - dLayout.x + (pLayout.width - dLayout.width);
          newOffsetY =
            pLayout.y - dLayout.y + (pLayout.height - dLayout.height);
          break;
      }
    }

    draggableItem.offset.x = newOffsetX;
    draggableItem.offset.y = newOffsetY;
    draggableItem.start.x = newOffsetX;
    draggableItem.start.y = newOffsetY;
    draggables.value = { ...draggables.value };
  };

  const resetDraggableToHomePosition = useCallback(
    (id: DndID) => {
      "worklet";
      const draggableItem = draggables.value[id];
      if (!draggableItem) {
        return;
      }

      draggableItem.offset.x = 0;
      draggableItem.offset.y = 0;
      draggableItem.start.x = 0;
      draggableItem.start.y = 0;
      draggables.value = { ...draggables.value };
    },
    [draggables]
  );

  const findCurrentDroppable = () => {
    "worklet";
    const id = currentDraggableId.value;
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
        if (!bestOverlapMatch || overlapPercentage > bestOverlapMatch.overlap) {
          bestOverlapMatch = { id: key, overlap: overlapPercentage };
        }
      }
    }

    if (bestCenterMatch) return bestCenterMatch.id;
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

    const onDropDroppableCallback = droppableInfo.callbacks?.onDrop;
    const onDropDraggableCallback =
      draggables.value[draggedId]?.callbacks?.onDrop;
    if (onDropDroppableCallback) {
      runOnJS(onDropDroppableCallback)(droppableId, draggedId);
    }
    if (onDropDraggableCallback) {
      runOnJS(onDropDraggableCallback)(draggedId, droppableId);
    }
  };

  const handleEnterDroppable = (
    droppableId: DndID,
    draggedId: DndID | null
  ) => {
    "worklet";
    const droppable = droppables.value[droppableId];
    if (droppable && droppable.callbacks?.onEnter && draggedId) {
      runOnJS(droppable.callbacks.onEnter)(droppableId, draggedId);
    }
  };

  const handleLeaveDroppable = (
    droppableId: DndID,
    draggedId: DndID | null
  ) => {
    "worklet";
    const droppable = droppables.value[droppableId];
    if (droppable && droppable.callbacks?.onLeave && draggedId) {
      runOnJS(droppable.callbacks.onLeave)(droppableId, draggedId);
    }
  };

  const handleEnterDraggable = (
    draggedId: DndID,
    droppableId: DndID | null
  ) => {
    "worklet";
    const draggable = draggables.value[draggedId];
    if (draggable && draggable.callbacks?.onEnter && droppableId) {
      runOnJS(draggable.callbacks.onEnter)(draggedId, droppableId);
    }
  };

  const handleLeaveDraggable = (
    draggedId: DndID,
    droppableId: DndID | null
  ) => {
    "worklet";
    const draggable = draggables.value[draggedId];
    if (draggable && draggable.callbacks?.onLeave && droppableId) {
      runOnJS(draggable.callbacks.onLeave)(draggedId, droppableId);
    }
  };

  const cleanupAndResetDraggable = (draggedId: DndID) => {
    "worklet";
    const draggableItem = draggables.value[draggedId];
    if (!draggableItem) return;

    const behavior = draggableItem.dropBehavior ?? "snapToHome";

    if (droppedItems.value[draggedId]) {
      delete droppedItems.value[draggedId];
      droppedItems.value = { ...droppedItems.value };
    }

    if (behavior === "snapToHome") {
      resetDraggableToHomePosition(draggedId);
    } else if (behavior === "freeRoam") {
      if (draggableItem.offset) {
        draggableItem.start.x = draggableItem.offset.x;
        draggableItem.start.y = draggableItem.offset.y;
        draggables.value = { ...draggables.value };
      }
    }
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

    // Determine if the item can be placed directly.
    // - If the item was already in th  e target, it can stay if capacity allows (itemsCurrentlyInTargetCount <= capacity).
    // - If it's new to the target, it can be placed if there's space (itemsCurrentlyInTargetCount < capacity).
    const canPlaceDirectly = isDraggedItemAlreadyPhysicallyInTarget
      ? itemsCurrentlyInTargetCount <= capacity
      : itemsCurrentlyInTargetCount < capacity;

    if (canPlaceDirectly) {
      handleDrop(draggedId, targetDroppableId);
    } else {
      if (isSwappable) {
        handleDrop(draggedId, targetDroppableId);
      } else {
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
      currentDraggableId.value = id;
      const draggable = draggables.value[id];
      if (draggable && draggable.offset) {
        draggable.start = { x: draggable.offset.x, y: draggable.offset.y };
      }
    })
    .onUpdate((e) => {
      "worklet";
      const id = currentDraggableId.value;
      if (id === null) return;
      const draggable = draggables.value[id];
      if (!draggable || !draggable.start || !draggable.offset) {
        return;
      }
      const newOffsetX = draggable.start.x + e.translationX;
      const newOffsetY = draggable.start.y + e.translationY;

      draggable.offset.x = newOffsetX;
      draggable.offset.y = newOffsetY;
      // New object reference to notify Reanimated that draggables has changed
      draggables.value = { ...draggables.value };

      const droppableId = findCurrentDroppable();
      if (droppableId !== previousDroppableId.value) {
        if (previousDroppableId.value) {
          handleLeaveDroppable(previousDroppableId.value, id);
          handleLeaveDraggable(id, previousDroppableId.value);
        }
        if (droppableId) {
          handleEnterDroppable(droppableId, id);
          handleEnterDraggable(id, droppableId);
        }
      }
      currentDroppableId.value = droppableId;
      previousDroppableId.value = droppableId;
    })
    .onEnd(() => {
      "worklet";
      const draggedId = currentDraggableId.value;
      if (draggedId === null) {
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
          // This case should ideally not happen if targetDroppableId is valid
          // but as a fallback, treating as if dropped outside
          cleanupAndResetDraggable(draggedId);
        }
      } else {
        // Item is dropped outside of any droppable target
        cleanupAndResetDraggable(draggedId);
      }
    })
    .onFinalize(() => {
      "worklet";
      const id = currentDraggableId.value;
      if (id === null) return;
      if (currentDroppableId.value) {
        handleLeaveDroppable(currentDroppableId.value, id);
        handleLeaveDraggable(id, currentDroppableId.value);
      }
      currentDraggableId.value = null;
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
        currentDraggableId,
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
