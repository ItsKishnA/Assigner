import {
  View,
  Text,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  ActivityIndicator,
  TouchableOpacity,
  ToastAndroid,
  Alert,
} from "react-native";
import React, { useCallback, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  setPersistence,
  inMemoryPersistence,
} from "firebase/auth";
import { FIREBASE_AUTH } from "../FirebaseConfig";
import {
  getFirestore,
  collection,
  addDoc,
  setDoc,
  doc,
} from "firebase/firestore";

const db = getFirestore();

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const addUser = async (userId, email) => {
    try {
      await setDoc(doc(db, "users", userId), {
        email: email,
        toMe: [],
        toSomeone: [],
      });
      console.log("User added successfully");
    } catch (error) {
      console.error("Error adding user: ", error);
    }
  };

  const authorizeNew = async (createUser) => {
    setLoading(true);
    try {
      if (createUser) {
        await createUserWithEmailAndPassword(FIREBASE_AUTH, email, password);
        console.log("User created successfully");
        const user = FIREBASE_AUTH.currentUser;
        if (user) {
          await addUser(user.uid, email);
        }
      } else {
        await setPersistence(FIREBASE_AUTH, inMemoryPersistence);
        await signInWithEmailAndPassword(FIREBASE_AUTH, email, password);
        console.log("User signed in successfully");
      }
    } catch (e) {
      console.error("Error in authorizeNew: ", e);
      if (e.code === "auth/invalid-email") {
        ToastAndroid.show("Invalid email", ToastAndroid.SHORT);
      } else if (e.code === "auth/missing-password") {
        ToastAndroid.show("Enter password", ToastAndroid.SHORT);
      } else if (createUser) {
        if (e.code === "auth/email-already-in-use") {
          _alertUser();
        } else if (e.code === "auth/weak-password") {
          ToastAndroid.show("Password is too weak", ToastAndroid.SHORT);
        } else {
          console.log(e);
          ToastAndroid.show(
            `${createUser ? "SignUp" : "SignIn"} failed`,
            ToastAndroid.SHORT
          );
        }
      } else {
        if (e.code === "auth/user-not-found") {
          ToastAndroid.show("User not found", ToastAndroid.SHORT);
        } else if (e.code === "auth/invalid-credential") {
          ToastAndroid.show("Wrong password", ToastAndroid.SHORT);
        } else {
          console.log(e);
          ToastAndroid.show("SignIn failed", ToastAndroid.SHORT);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const _alertUser = () =>
    Alert.alert("Email already in use", "Do you want to sign in instead?", [
      {
        text: "Yes",
        onPress: () => authorizeNew(false),
      },
      {
        text: "No",
        onPress: () => console.log("No"),
      },
    ]);

  const isValidEntry = useCallback(
    (myString, isMailNotName) => {
      isMailNotName = isMailNotName || false;
      return String(email)
        .toLowerCase()
        .match(
          /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        );
    },
    [email]
  );

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView behavior="padding" style={styles.avoidingView}>
        <TextInput
          style={[
            styles.input,
            { backgroundColor: isValidEntry(email, true) ? "#afa" : "#faa" },
          ]}
          placeholder="Email"
          autoCapitalize="none"
          onChangeText={(text) => setEmail(text)}
        />
        <TextInput
          style={styles.input}
          secureTextEntry={true}
          placeholder="Password"
          autoCapitalize="none"
          onChangeText={(text) => setPassword(text)}
        />

        {loading ? (
          <ActivityIndicator size="large" color="#0000ff" />
        ) : (
          <>
            <TouchableOpacity onPress={() => authorizeNew(false)}>
              <View style={styles.button}>
                <Text style={{ color: "white" }}>Sign In</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => authorizeNew(true)}>
              <View style={styles.button}>
                <Text style={{ color: "white" }}>Create new account...</Text>
              </View>
            </TouchableOpacity>
          </>
        )}
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    padding: 15,
    backgroundColor: "#aaa",
    marginBottom: 20,
    borderRadius: 5,
  },
  avoidingView: {
    width: "80%",
  },
  button: {
    backgroundColor: "#f00",
    padding: 10,
    borderRadius: 5,
    marginVertical: 5,
    alignItems: "center",
  },
});

export default Login;
