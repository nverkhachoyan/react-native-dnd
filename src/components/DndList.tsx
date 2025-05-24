import React, { ReactNode } from "react";
import { View, ViewStyle } from "react-native";

interface DndListProps {
  style?: ViewStyle;
  children: ReactNode;
}

export const DndList = ({ style, children }: DndListProps) => {
  return <View style={style}>{children}</View>;
};

export default DndList;
