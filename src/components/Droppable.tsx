import React, { useMemo } from "react";
import { ViewProps } from "react-native";
import Animated, {
  runOnJS,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedStyle,
} from "react-native-reanimated";
import { useDndContext } from "../context/DndContext";
import useDroppable from "../hooks/useDroppable";
import { DndID, DroppableCallbacks } from "../types";

interface DroppableProps extends Omit<ViewProps, "id"> {
  id: DndID;
  onEnter?: (draggedId: DndID) => void;
  onLeave?: (draggedId: DndID) => void;
  onDrop?: (draggedId: DndID) => void;
  capacity?: number;
  swappable?: boolean;
  userAnimatedStyle?: (isHovered: boolean) => Record<string, unknown>;
  onHoverStateChange?: (isHovered: boolean) => void;
}

export const Droppable: React.FC<DroppableProps> = ({
  id,
  children,
  onEnter,
  onLeave,
  onDrop,
  style,
  capacity,
  swappable,
  userAnimatedStyle,
  onHoverStateChange,
}) => {
  const elementRef = useAnimatedRef<Animated.View>();
  const dndContext = useDndContext();

  const memoizedCallbacks = useMemo<DroppableCallbacks>(
    () => ({
      onEnter,
      onLeave,
      onDrop,
    }),
    [onEnter, onLeave, onDrop]
  );

  const { onLayout } = useDroppable(
    id,
    memoizedCallbacks,
    elementRef,
    capacity,
    swappable
  );

  useAnimatedReaction(
    () => dndContext.currentDroppableId.value === id,
    (isHoveredNow, wasHoveredPreviously) => {
      if (onHoverStateChange && isHoveredNow !== wasHoveredPreviously) {
        runOnJS(onHoverStateChange)(isHoveredNow);
      }
    },
    [id, dndContext.currentDroppableId, onHoverStateChange]
  );

  const combinedAnimatedStyle = useAnimatedStyle(() => {
    const isHovered = dndContext.currentDroppableId.value === id;
    return userAnimatedStyle ? userAnimatedStyle(isHovered) : {};
  }, [userAnimatedStyle]);

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
