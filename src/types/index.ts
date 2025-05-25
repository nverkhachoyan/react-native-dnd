export type DndID = string | number;

export type SnapBehaviorType =
  | "center"
  | "topLeft"
  | "topCenter"
  | "topRight"
  | "middleLeft"
  | "middleRight"
  | "bottomLeft"
  | "bottomCenter"
  | "bottomRight"
  | "none"
  | { x: number; y: number }; // Custom offset from droppable's top-left for draggable's top-left

export type DraggableDropBehaviorType = "snapToHome" | "freeRoam";

export type DraggableType = {
  id: DndID;
  layout: { x: number; y: number; width: number; height: number };
  callbacks?: DraggableCallbacks;
  hoveringId?: DndID | null;
  isHovered?: boolean;
  isPressed?: boolean;
  start: { x: number; y: number };
  offset: { x: number; y: number };
  dropBehavior?: DraggableDropBehaviorType;
};

export interface DroppableType {
  id: DndID;
  layout: { x: number; y: number; width: number; height: number };
  callbacks?: DroppableCallbacks;
  capacity?: number;
  swappable?: boolean;
  snapBehavior?: SnapBehaviorType;
}

export type DroppableCallbacks = {
  onEnter?: (droppableId: DndID, draggedId: DndID | null) => void;
  onLeave?: (droppableId: DndID, draggedId: DndID | null) => void;
  onDrop?: (droppableId: DndID, draggedId: DndID | null) => void;
};

export type DraggableCallbacks = {
  onEnter?: (draggedId: DndID, droppableId: DndID | null) => void;
  onLeave?: (draggedId: DndID, droppableId: DndID | null) => void;
  onDrop?: (draggedId: DndID, droppableId: DndID | null) => void;
};

export type LayoutType = {
  x: number; // Relative x within its direct parent from onLayout
  y: number; // Relative y within its direct parent from onLayout
  width: number;
  height: number;
  pageX: number; // Absolute x on screen from measure
  pageY: number; // Absolute y on screen from measure
};
