import { useEffect } from "react";
import { LayoutRectangle } from "react-native";
import type { WithSpringConfig } from "react-native-reanimated";
import Animated, {
  AnimatedRef,
  runOnUI,
  useAnimatedReaction,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useDndContext } from "../context/DndContext";
import { DndID, DraggableCallbacks, DraggableDropBehaviorType } from "../types";

function useDraggable(
  id: DndID,
  callbacks: DraggableCallbacks,
  elementRef: AnimatedRef<Animated.View>,
  springConfig?: WithSpringConfig,
  dropBehavior?: DraggableDropBehaviorType
) {
  const { draggables, currentDraggableId, providerViewRef } = useDndContext();

  const localOffset = useSharedValue({ x: 0, y: 0 });
  const localLayout = useSharedValue<LayoutRectangle>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });

  useAnimatedReaction(
    () => localLayout.value,
    (newLayout, _oldLayout) => {
      "worklet";
      if (newLayout && (newLayout.width > 0 || newLayout.height > 0)) {
        const capturedCallbacks = callbacks;
        const capturedDropBehavior = dropBehavior;

        const currentDraggablesState = draggables.value;
        const existingDraggable = currentDraggablesState[id];
        draggables.value = {
          ...currentDraggablesState,
          [id]: {
            id: id,
            layout: newLayout,
            offset: existingDraggable?.offset || { x: 0, y: 0 },
            start: existingDraggable?.start || { x: 0, y: 0 },
            callbacks: capturedCallbacks,
            dropBehavior: capturedDropBehavior,
          },
        };
      }
    },
    [id, draggables, callbacks, dropBehavior]
  );

  useAnimatedReaction(
    () => draggables.value[id]?.offset,
    (contextOffset, previousContextOffset) => {
      "worklet";
      if (contextOffset) {
        if (springConfig) {
          localOffset.value = withSpring(
            { x: contextOffset.x, y: contextOffset.y },
            springConfig
          );
        } else {
          localOffset.value = { x: contextOffset.x, y: contextOffset.y };
        }
      } else if (previousContextOffset && !contextOffset) {
        if (springConfig) {
          localOffset.value = withSpring({ x: 0, y: 0 }, springConfig);
        } else {
          localOffset.value = { x: 0, y: 0 };
        }
      }
    },
    [id, draggables, springConfig]
  );

  useEffect(() => {
    return () => {
      const cleanupWorklet = (itemIdToClean: DndID) => {
        "worklet";
        if (draggables.value[itemIdToClean]) {
          delete draggables.value[itemIdToClean];
          draggables.value = { ...draggables.value };
        }
        if (currentDraggableId.value === itemIdToClean) {
          currentDraggableId.value = null;
        }
      };
      runOnUI(cleanupWorklet)(id);
    };
  }, [id, draggables, currentDraggableId]);

  const onLayout = () => {
    if (!elementRef.current || !providerViewRef.current) {
      return;
    }
    elementRef.current.measureLayout(
      providerViewRef.current,
      (x, y, width, height) => {
        localLayout.value = { x, y, width, height };
      }
    );
  };

  return {
    offset: localOffset,
    onLayout,
  };
}

export default useDraggable;
