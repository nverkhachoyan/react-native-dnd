import React, { useMemo } from "react";
import { ViewProps } from "react-native";
import type { WithSpringConfig } from "react-native-reanimated";
import Animated, {
  runOnJS,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { useDndContext } from "../context/DndContext";
import useDraggable from "../hooks/useDraggable";
import { DndID, DraggableCallbacks, DraggableDropBehaviorType } from "../types";

interface DraggableProps extends Omit<ViewProps, "id"> {
  id: DndID;
  onEnter?: (draggedId: DndID, droppableId: DndID | null) => void;
  onLeave?: (draggedId: DndID, droppableId: DndID | null) => void;
  onDrop?: (draggedId: DndID, droppableId: DndID | null) => void;
  dropBehavior?: DraggableDropBehaviorType;
  userAnimatedStyle?: (isDragging: boolean) => Record<string, unknown>;
  onDragStateChange?: (isDragging: boolean) => void;
  springConfig?: WithSpringConfig;
}

export const Draggable: React.FC<DraggableProps> = ({
  id,
  style,
  children,
  onEnter,
  onLeave,
  onDrop,
  dropBehavior = "snapToHome",
  userAnimatedStyle,
  onDragStateChange,
  springConfig,
}) => {
  const elementRef = useAnimatedRef<Animated.View>();
  const memoizedCallbacks = useMemo<DraggableCallbacks>(
    () => ({
      onEnter,
      onLeave,
      onDrop,
    }),
    [onEnter, onLeave, onDrop]
  );
  const { offset: localOffset, onLayout } = useDraggable(
    id,
    memoizedCallbacks,
    elementRef,
    springConfig,
    dropBehavior
  );
  const { currentDraggableId } = useDndContext();
  const isCurrentlyDragging = useSharedValue(false);

  useAnimatedReaction(
    () => currentDraggableId.value === id,
    (isDraggingNow, wasDraggingPreviously) => {
      if (isDraggingNow !== wasDraggingPreviously) {
        isCurrentlyDragging.value = isDraggingNow;
        if (onDragStateChange) {
          runOnJS(onDragStateChange)(isDraggingNow);
        }
      }
    },
    [id, currentDraggableId, onDragStateChange, isCurrentlyDragging]
  );

  const combinedAnimatedStyle = useAnimatedStyle(() => {
    const currentTransformations = [];
    if (localOffset && localOffset.value) {
      currentTransformations.push({ translateX: localOffset.value.x });
      currentTransformations.push({ translateY: localOffset.value.y });
    }

    let finalStyles: Record<string, any> = {};

    if (userAnimatedStyle) {
      const userProvidedStyles = userAnimatedStyle(isCurrentlyDragging.value);
      for (const key in userProvidedStyles) {
        if (
          key === "transform" &&
          Array.isArray(userProvidedStyles.transform)
        ) {
          currentTransformations.push(...userProvidedStyles.transform);
        } else {
          finalStyles[key] = userProvidedStyles[key];
        }
      }
    }

    if (currentTransformations.length > 0) {
      finalStyles.transform = currentTransformations;
    }

    return finalStyles;
  }, [userAnimatedStyle, localOffset]);

  return (
    <Animated.View
      ref={elementRef}
      onLayout={onLayout}
      style={[style, combinedAnimatedStyle]}
      collapsable={false}
    >
      {children}
    </Animated.View>
  );
};
