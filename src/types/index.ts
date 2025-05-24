import {
  BaseAnimationBuilder,
  LayoutAnimationFunction,
} from "react-native-reanimated";

export type DndID = string | number;

export type DraggableType = {
  id: DndID;
  hoveringId?: DndID | null;
  isHovered?: boolean;
  isPressed?: boolean;
  start: { x: number; y: number };
  offset: { x: number; y: number };
  layout: { x: number; y: number; width: number; height: number };
};

export type DroppableCallbacks = {
  onEnter?: (draggedId: DndID) => void;
  onLeave?: (draggedId: DndID) => void;
  onDrop?: (draggedId: DndID) => void;
};

export interface DroppableType {
  id: DndID;
  layout: { x: number; y: number; width: number; height: number };
  callbacks?: DroppableCallbacks;
  capacity?: number;
  swappable?: boolean;
}

export type LayoutType = {
  x: number; // Relative x within its direct parent from onLayout
  y: number; // Relative y within its direct parent from onLayout
  width: number;
  height: number;
  pageX: number; // Absolute x on screen from measure
  pageY: number; // Absolute y on screen from measure
};

export type DraggableAnimationLayout =
  | typeof BaseAnimationBuilder
  | BaseAnimationBuilder
  | LayoutAnimationFunction
  | undefined;
