import { useLayoutEffect } from "react";
import { LayoutChangeEvent, LayoutRectangle, View } from "react-native";
import Animated, {
  AnimatedRef,
  runOnJS,
  runOnUI,
} from "react-native-reanimated";
import { DndContextType, useDndContext } from "../context/DndContext";
import { DndID, DroppableCallbacks } from "../types";

const MAX_MEASUREMENT_ATTEMPTS = 3;
const RETRY_DELAY_MS = 100;

// This worklet updates the droppable's layout and properties (callbacks, capacity, swappable)
// in the D&D context. It's called from the JS thread via runOnUI after a successful measurement.
const updateContextWithLayoutWorklet = (
  dndContext: DndContextType,
  itemId: DndID,
  itemLayout: LayoutRectangle,
  itemCallbacks: DroppableCallbacks,
  itemCapacity?: number,
  itemSwappable?: boolean
) => {
  "worklet";
  const currentDroppables = dndContext.droppables.value;
  dndContext.droppables.value = {
    ...currentDroppables,
    [itemId]: {
      id: itemId,
      layout: itemLayout,
      callbacks: itemCallbacks,
      capacity: itemCapacity,
      swappable: itemSwappable,
    },
  };
};

// This function runs on the JS thread to perform layout measurement relative to the DndProvider.
const performMeasureLayoutJS = (
  elementRef: AnimatedRef<Animated.View>,
  providerViewRef: AnimatedRef<View>,
  itemId: DndID,
  dndContextInstance: DndContextType,
  callbacks: DroppableCallbacks,
  capacity?: number,
  swappable?: boolean,
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
            callbacks,
            capacity,
            swappable,
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
        providerRelativeLayout,
        callbacks,
        capacity,
        swappable
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
              callbacks,
              capacity,
              swappable,
              attempt + 1
            ),
          RETRY_DELAY_MS
        );
      }
    }
  );
};

function useDroppable(
  id: DndID,
  callbacks: DroppableCallbacks,
  elementRef: AnimatedRef<Animated.View>,
  capacity?: number,
  swappable?: boolean
) {
  const dndContext = useDndContext();
  const { currentDroppableId, providerViewRef } = dndContext;

  // Initial layout measurement is triggered by the Droppable component's onLayout prop.
  const onLayout = (_event: LayoutChangeEvent) => {
    "worklet";
    const measureLayout = () => {
      performMeasureLayoutJS(
        elementRef,
        providerViewRef,
        id,
        dndContext,
        callbacks,
        capacity,
        swappable
      );
    };
    runOnJS(measureLayout)();
  };

  useLayoutEffect(() => {
    return () => {
      const cleanupWorklet = (
        itemIdToClean: DndID,
        context: DndContextType
      ) => {
        "worklet";
        if (context.droppables.value[itemIdToClean]) {
          delete context.droppables.value[itemIdToClean];
          context.droppables.value = { ...context.droppables.value };
        }
      };
      runOnUI(cleanupWorklet)(id, dndContext);
    };
  }, [id, dndContext]);

  return {
    currentDroppableId,
    onLayout,
  };
}

export default useDroppable;
