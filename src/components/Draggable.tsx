import React from "react";
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
import { DndID } from "../types";

interface DraggableProps extends Omit<ViewProps, "id"> {
  id: DndID;
  userAnimatedStyle?: (isDragging: boolean) => Record<string, unknown>;
  onDragStateChange?: (isDragging: boolean) => void;
  springConfig?: WithSpringConfig;
}

export const Draggable: React.FC<DraggableProps> = ({
  id,
  style,
  children,
  userAnimatedStyle,
  onDragStateChange,
  springConfig,
}) => {
  const elementRef = useAnimatedRef<Animated.View>();
  const { offset: localOffset, onLayout } = useDraggable(
    id,
    elementRef,
    springConfig
  );
  const dndContext = useDndContext();

  const isCurrentlyDragging = useSharedValue(false);

  useAnimatedReaction(
    () => dndContext.currentDraggedId.value === id,
    (isDraggingNow, wasDraggingPreviously) => {
      if (isDraggingNow !== wasDraggingPreviously) {
        isCurrentlyDragging.value = isDraggingNow;
        if (onDragStateChange) {
          runOnJS(onDragStateChange)(isDraggingNow);
        }
      }
    },
    [id, dndContext.currentDraggedId, onDragStateChange, isCurrentlyDragging]
  );

  const combinedAnimatedStyle = useAnimatedStyle(() => {
    const currentTransformations = [];
    // Base translation from dragging
    if (localOffset && localOffset.value) {
      currentTransformations.push({ translateX: localOffset.value.x });
      currentTransformations.push({ translateY: localOffset.value.y });
    }

    let finalStyles: Record<string, any> = {}; // Start with an empty object for non-transform styles

    // Apply user-defined animated styles
    if (userAnimatedStyle) {
      const userProvidedStyles = userAnimatedStyle(isCurrentlyDragging.value);
      for (const key in userProvidedStyles) {
        if (
          key === "transform" &&
          Array.isArray(userProvidedStyles.transform)
        ) {
          // Add user's transform operations to our list
          currentTransformations.push(...userProvidedStyles.transform);
        } else {
          // For other styles (opacity, zIndex, etc.), apply them directly
          finalStyles[key] = userProvidedStyles[key];
        }
      }
    }

    // Assign the combined transformations if any exist
    if (currentTransformations.length > 0) {
      finalStyles.transform = currentTransformations;
    }

    return finalStyles;
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
