import { useEffect } from "react";
import { LayoutRectangle, View } from "react-native";
import type { WithSpringConfig } from "react-native-reanimated";
import Animated, {
  AnimatedRef,
  runOnJS,
  runOnUI,
  useAnimatedReaction,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { DndContextType, useDndContext } from "../context/DndContext";
import { DndID } from "../types";

const MAX_MEASUREMENT_ATTEMPTS = 3;
const RETRY_DELAY_MS = 100;

// This worklet updates the draggable's layout and initial state in the D&D context.
// It is called from the JS thread via runOnUI after a successful measurement.
const updateContextWithLayoutWorklet = (
  dndContext: DndContextType,
  itemId: DndID,
  itemLayout: LayoutRectangle
) => {
  "worklet";
  const currentDraggables = dndContext.draggables.value;
  const existingEntry = currentDraggables[itemId];

  dndContext.draggables.value = {
    ...currentDraggables,
    [itemId]: {
      id: itemId,
      layout: itemLayout,
      // Preserve existing offset and start if the draggable item is re-measured;
      // otherwise, initialize to (0,0).
      offset: existingEntry?.offset || { x: 0, y: 0 },
      start: existingEntry?.start || { x: 0, y: 0 },
    },
  };
};

// This function runs on the JS thread to perform layout measurement.
// It uses measureLayout to get coordinates relative to the DndProvider.
const performMeasureLayoutJS = (
  elementRef: AnimatedRef<Animated.View>,
  providerViewRef: AnimatedRef<View>,
  itemId: DndID,
  dndContextInstance: DndContextType,
  attempt = 1
) => {
  if (!elementRef.current || !providerViewRef.current) {
    if (attempt < MAX_MEASUREMENT_ATTEMPTS) {
      setTimeout(
        () =>
          performMeasureLayoutJS(
            elementRef,
            providerViewRef,
            itemId,
            dndContextInstance,
            attempt + 1
          ),
        RETRY_DELAY_MS
      );
    }
    return;
  }

  elementRef.current.measureLayout(
    providerViewRef.current,
    (x, y, width, height) => {
      const providerRelativeLayout = { x, y, width, height };

      runOnUI(updateContextWithLayoutWorklet)(
        dndContextInstance,
        itemId,
        providerRelativeLayout
      );
    },
    () => {
      if (attempt < MAX_MEASUREMENT_ATTEMPTS) {
        setTimeout(
          () =>
            performMeasureLayoutJS(
              elementRef,
              providerViewRef,
              itemId,
              dndContextInstance,
              attempt + 1
            ),
          RETRY_DELAY_MS
        );
      }
    }
  );
};

function useDraggable(
  id: DndID,
  elementRef: AnimatedRef<Animated.View>,
  springConfig?: WithSpringConfig
) {
  const dndContext = useDndContext();
  const { draggables, currentDraggedId, providerViewRef } = dndContext;

  const offset = useSharedValue({ x: 0, y: 0 });

  // Syncs the local `offset` (for styling) with the draggable's offset in the global D&D context.
  // This ensures the Draggable component visually reflects its state (e.g., when reset or dropped).
  useAnimatedReaction(
    () => {
      return draggables.value[id]?.offset;
    },
    (contextOffset, previousContextOffset) => {
      if (contextOffset) {
        // Animate to the new position from context
        if (springConfig) {
          offset.value = withSpring(
            { x: contextOffset.x, y: contextOffset.y },
            springConfig
          );
        } else {
          offset.value = { x: contextOffset.x, y: contextOffset.y };
        }
      } else if (previousContextOffset && !contextOffset) {
        // Draggable might have been removed from context; animate back to origin or direct set.
        if (springConfig) {
          offset.value = withSpring({ x: 0, y: 0 }, springConfig);
        } else {
          offset.value = { x: 0, y: 0 };
        }
      }
    },
    [id, draggables, currentDraggedId, springConfig]
  );

  // Initial layout measurement is triggered by the Draggable component's onLayout prop.
  const onLayout = () => {
    "worklet";
    const measureLayout = () => {
      performMeasureLayoutJS(elementRef, providerViewRef, id, dndContext);
    };
    runOnJS(measureLayout)();
  };

  useEffect(() => {
    return () => {
      const cleanupWorklet = (
        itemIdToClean: DndID,
        context: DndContextType
      ) => {
        "worklet";
        if (context.draggables.value[itemIdToClean]) {
          delete context.draggables.value[itemIdToClean];
          context.draggables.value = { ...context.draggables.value };
        }
        if (context.currentDraggedId.value === itemIdToClean) {
          context.currentDraggedId.value = null;
        }
      };
      runOnUI(cleanupWorklet)(id, dndContext);
    };
  }, [id, dndContext]);

  return {
    offset,
    onLayout,
  };
}

export default useDraggable;
