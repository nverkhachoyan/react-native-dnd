import { useEffect } from "react";
import { LayoutRectangle } from "react-native";
import Animated, {
  AnimatedRef,
  runOnUI,
  useAnimatedReaction,
  useSharedValue,
} from "react-native-reanimated";
import { useDndContext } from "../context/DndContext";
import { DndID, DroppableCallbacks, SnapBehaviorType } from "../types";

function useDroppable(
  id: DndID,
  callbacks: DroppableCallbacks,
  elementRef: AnimatedRef<Animated.View>,
  capacity?: number,
  swappable?: boolean,
  snapBehavior?: SnapBehaviorType
) {
  const { droppables, currentDroppableId, providerViewRef } = useDndContext();
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
        const capturedCapacity = capacity;
        const capturedSwappable = swappable;
        const capturedSnapBehavior = snapBehavior;

        const currentDroppables = droppables.value;
        droppables.value = {
          ...currentDroppables,
          [id]: {
            id: id,
            layout: newLayout,
            callbacks: capturedCallbacks,
            capacity: capturedCapacity,
            swappable: capturedSwappable,
            snapBehavior: capturedSnapBehavior,
          },
        };
      }
    },
    [id, droppables, callbacks, capacity, swappable, snapBehavior]
  );

  useEffect(() => {
    return () => {
      const cleanupWorklet = (itemIdToClean: DndID) => {
        "worklet";
        if (droppables.value[itemIdToClean]) {
          delete droppables.value[itemIdToClean];
          droppables.value = { ...droppables.value };
        }
      };
      runOnUI(cleanupWorklet)(id);
    };
  }, [id, droppables]);

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
    currentDroppableId,
    onLayout,
  };
}

export default useDroppable;
