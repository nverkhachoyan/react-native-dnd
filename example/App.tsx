import { SafeAreaView, StyleSheet, Text, View } from "react-native";

import {
  DndList,
  DndProvider,
  Draggable,
  Droppable,
} from "@nverk/react-native-dnd";
import { withSpring, WithSpringConfig } from "react-native-reanimated";

const SENTENCE_PARTS = ["The", "", "brown", "fox", "", "over"];
const WORD_OPTIONS = ["the", "quick", "brown", "fox", "jumps", "over"];

const SPRING_CONFIG: WithSpringConfig = {
  damping: 10,
  stiffness: 100,
  mass: 1,
  overshootClamping: false,
  restDisplacementThreshold: 0.001,
  restSpeedThreshold: 2,
};

export default function App() {
  const droppableStyles = (isHovered: boolean) => {
    "worklet";
    return {
      backgroundColor: withSpring(
        isHovered ? "rgba(231, 231, 231, 0.3)" : "transparent"
      ),
    };
  };

  const draggableStyles = (isDragging: boolean) => {
    "worklet";
    return {
      backgroundColor: isDragging ? "#b6dded" : "#e9ecef",
      transform: [{ scale: withSpring(isDragging ? 1.1 : 1) }],
    };
  };

  return (
    <SafeAreaView style={styles.container}>
      <DndProvider>
        <DndList style={styles.sentenceContainer}>
          {SENTENCE_PARTS.map((part, index) => {
            const isBlank = !part;

            if (isBlank) {
              return (
                <Droppable
                  key={`blank_${index}`}
                  id={`blank_${index}`}
                  style={styles.blankSlot}
                  userAnimatedStyle={droppableStyles}
                >
                  <Text>{"______"}</Text>
                </Droppable>
              );
            }

            return (
              <View key={`word_${index}`} style={styles.wordSlot}>
                <Text>{part}</Text>
              </View>
            );
          })}
        </DndList>

        <DndList style={styles.optionsContainer}>
          {WORD_OPTIONS.map((option, idx) => (
            <Draggable
              key={option}
              id={`option_${idx}`}
              style={styles.wordCard}
              userAnimatedStyle={draggableStyles}
              springConfig={SPRING_CONFIG}
            >
              <Text>{option}</Text>
            </Draggable>
          ))}
        </DndList>
      </DndProvider>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f8f9fa",
    alignItems: "center",
    justifyContent: "center",
  },
  sentenceContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 30,
    paddingVertical: 15,
    paddingHorizontal: 10,
    backgroundColor: "#ffffff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#dee2e6",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2.0,
    elevation: 3,
  },
  optionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 15,
  },
  wordSlot: {
    backgroundColor: "transparent",
    margin: 8,
    paddingVertical: 12,
    minHeight: 45,
    justifyContent: "center",
    alignItems: "center",
  },
  blankSlot: {
    backgroundColor: "#f1f3f5",
    borderRadius: 10,
    margin: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 70,
    minHeight: 45,
    justifyContent: "center",
    alignItems: "center",
  },
  wordCard: {
    borderRadius: 8,
    margin: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 1.5,
    elevation: 3,
  },
});
