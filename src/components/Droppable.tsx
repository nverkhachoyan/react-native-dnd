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
import { DndID, DroppableCallbacks, SnapBehaviorType } from "../types";

interface DroppableProps extends Omit<ViewProps, "id"> {
  id: DndID;
  onEnter?: (droppableId: DndID, draggedId: DndID | null) => void;
  onLeave?: (droppableId: DndID, draggedId: DndID | null) => void;
  onDrop?: (droppableId: DndID, draggedId: DndID | null) => void;
  capacity?: number;
  swappable?: boolean;
  snapBehavior?: SnapBehaviorType;
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
  snapBehavior = "center",
  userAnimatedStyle,
  onHoverStateChange,
}) => {
  const elementRef = useAnimatedRef<Animated.View>();
  const { currentDroppableId } = useDndContext();

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
    swappable,
    snapBehavior
  );

  useAnimatedReaction(
    () => currentDroppableId.value === id,
    (isHoveredNow, wasHoveredPreviously) => {
      if (onHoverStateChange && isHoveredNow !== wasHoveredPreviously) {
        runOnJS(onHoverStateChange)(isHoveredNow);
      }
    },
    [id, currentDroppableId, onHoverStateChange]
  );

  const combinedAnimatedStyle = useAnimatedStyle(() => {
    const isHovered = currentDroppableId.value === id;
    return userAnimatedStyle ? userAnimatedStyle(isHovered) : {};
  }, [userAnimatedStyle, currentDroppableId, id]);

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
