import { View, StyleSheet } from "react-native";
import { Slot, Stack } from "expo-router";

export default function Layout() {
  return (
    <View style={styles.container}>
      {/* The Slot renders the child pages */}
      <Slot />
      {/* <Stack
        screenOptions={{
          headerShown: true,
          // headerTitle: "AuthStack",
          // headerStyle: { backgroundColor: "tomato" },
          // headerTintColor: "white",
          // headerTitleStyle: { fontWeight: "bold" },
          // Animation: { type: "slide_from_right" },
          animation: "slide_from_right",
        }}
      /> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, // Full-screen layout
    // padding: 16, // Optional padding
    backgroundColor: "#f8f9fa", // Optional background color
  },
});
