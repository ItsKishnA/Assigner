import { View, Text } from "react-native";
import React from "react";
// import slot from 'expo-router'
import { Slot, Stack } from "expo-router";

const _layout = () => {
  return (
    <View style={styles.container}>
      {/* <Text>_layout</Text> */}
      <Slot />
    </View>
  );
};

const styles = {
  container: {
    flex: 1, // Full-screen layout
    // padding: 16, // Optional padding
    backgroundColor: "#f8f9fa", // Optional background color
  },
};

export default _layout;
