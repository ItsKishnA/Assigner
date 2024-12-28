import React from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";

import { useState, useEffect } from "react";

import { useRouter } from "expo-router";

import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
import { onAuthStateChanged, User } from "firebase/auth";
import { FIREBASE_AUTH } from "../FirebaseConfig";

function index() {
  const router = useRouter();
  // const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  const handlePress = () => {
    console.log("Pressed");
    router.replace("/login");
  };

  useEffect(() => {
    onAuthStateChanged(
      FIREBASE_AUTH,
      (user) => {
        if (user) {
          console.log("User is signed in");
          setUser(user);
          router.replace("/(app)/home"); // Navigate to the main app index when the user logs in
        } else {
          console.log("User is signed out");
          // router.replace("index"); // Navigate to the login page when the user logs out
          // router.push("login");
          setUser(null);
        }
      },
      (error) => {
        console.error("Error in onAuthStateChanged: ", error);
      }
    );
  }, [user]);

  return (
    <View style={styles.Container}>
      {user ? (
        <View>
          <Text>Loading...</Text>
          <TouchableOpacity onPress={() => router.replace("/(app)/home")}>
            <Text>Goto home screen</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View>
          <Text>This is index page</Text>
          <TouchableOpacity onPress={handlePress}>
            <Text>Login</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  Container: {
    flex: 1,
    margin: 0,
    padding: 0,
  },
});

export default index;
