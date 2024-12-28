// MyModal.js
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Button,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  ToastAndroid,
  TouchableWithoutFeedback,
  Switch,
} from "react-native";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
// import iconsr
import { Ionicons } from "@expo/vector-icons";

import { FIREBASE_AUTH } from "../FirebaseConfig";
import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  getDocs,
  query,
  where,
  doc,
  arrayUnion,
  serverTimestamp,
  getDoc,
  setDoc,
} from "firebase/firestore";

import _SVGSaveForAssigner from "../myConstants/SaveSVGForAssigner";
import { use } from "react";

const db = getFirestore();

export default AssignerModal = ({ modalVisible, onModalClose, setItems }) => {
  const sheetRef = useRef(null);
  // const [text, setText] = useState("");
  const [what, setWhat] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [collaborators, setCollaborators] = useState([]);

  const [isEnabled, setIsEnabled] = useState(true);
  const toggleSwitch = () => setIsEnabled((previousState) => !previousState);

  const handleAddElement = ({ what, from, to, collaborators, setItems }) => {
    if (!what) {
      ToastAndroid.show("Please enter a task", ToastAndroid.SHORT);
      return;
    }
    const id = Math.random().toString(36).substr(2, 9);
    console.log("Added element: ", what, from, to, collaborators);
    setItems((prevItems) =>
      prevItems.concat({
        id: id,
        what: what,
        from: from,
        to: to,
        completed: false,
        collaborators: collaborators,
      })
    );
    // ToastAndroid.show(`Added element: ${what}`, ToastAndroid.SHORT);
    console.log(collaborators);
    if (!collaborators || collaborators.length === 0) {
      assignTaskToSelf({ what, from, to, collaborators, completed: false, id });
    } else {
      assignTaskToSomeone(collaborators, {
        what,
        from,
        to,
        collaborators,
        id,
        completed: false,
      });
    }

    onModalClose();
  };

  // Assign a task to yourself
  const assignTaskToSelf = async (taskData) => {
    try {
      const user = FIREBASE_AUTH.currentUser;
      if (!user) {
        throw new Error("No authenticated user found");
      }

      const taskRef = await addDoc(collection(db, "tasks"), {
        assignerId: user.uid,
        assigneeId: user.uid,
        assigneeEmail: user.email,
        ...taskData,
        createdAt: serverTimestamp(),
      });

      await updateDoc(doc(db, "users", user.uid), {
        toMe: arrayUnion(taskRef.id),
      });

      console.log("Task assigned to self successfully");
    } catch (error) {
      console.error("Error assigning task to self:", error);
    }
  };

  // Assign a task to someone else
  const assignTaskToSomeone = async (assigneeEmail, taskData) => {
    try {
      const user = FIREBASE_AUTH.currentUser;
      if (!user) {
        throw new Error("No authenticated user found");
      }

      // Find the UID of the assignee based on the email
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", assigneeEmail));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error("No user found with the provided email");
      }

      const assigneeId = querySnapshot.docs[0].id;

      const taskRef = await addDoc(collection(db, "tasks"), {
        assignerId: user.uid,
        assigneeId: assigneeId,
        assignerEmail: user.email,
        ...taskData,
        createdAt: serverTimestamp(),
      });

      console.log("Task created successfully", taskRef.id);
      await updateDoc(doc(db, "users", user.uid), {
        toSomeone: arrayUnion(taskRef.id),
      });
      console.log("Task assigned in my section successfully");

      const assigneeDocRef = doc(db, "users", assigneeId);
      const assigneeDoc = await getDoc(assigneeDocRef);
      if (!assigneeDoc.exists()) {
        await setDoc(assigneeDocRef, { toMe: [] });
      }

      await updateDoc(assigneeDocRef, {
        toMe: arrayUnion(taskRef.id),
      });
      console.log("Task assigned in someone else's section successfully");

      console.log("Task assigned to someone else successfully");
    } catch (error) {
      console.error("Error assigning task to someone else:", error);
    }
  };

  return (
    <BottomSheet
      ref={sheetRef}
      onClose={onModalClose}
      enablePanDownToClose={true}
      style={styles.Container}
      overDragResistanceFactor={4}
      containerStyle={{
        backgroundColor: "rgba(0, 0, 0, 0.75)",
      }}
      handleIndicatorStyle={{
        backgroundColor: "black",
      }}
      handleStyle={{
        backgroundColor: "white",
      }}
    >
      <BottomSheetView style={styles.modalView}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardAvoidingView}
        >
          {/* TODO */}
          <View style={styles.topmostView}>
            <Text style={styles.headingText}>Add a new element!</Text>
            <TouchableOpacity
              onPress={onModalClose}
              style={styles.closeButtonTouchable}
            >
              {/* <Ionicons name="trash-bin" size={24} color="rgb(220, 0, 0)" /> */}
              <Ionicons
                name="close"
                size={24}
                color="black"
                style={styles.closeButtonIcon}
              />
            </TouchableOpacity>
          </View>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 10,
            }}
          >
            <TextInput
              placeholder={isEnabled ? "Enter Task" : "Enter item name to shop"}
              style={styles.textInput}
              value={what}
              onChangeText={setWhat}
            />
            <Switch
              trackColor={{ false: "#000", true: "green" }}
              thumbColor={isEnabled ? "#fff" : "#fff"}
              ios_backgroundColor="#3e3e3e"
              onValueChange={toggleSwitch}
              value={isEnabled}
              // style={{ backgroundColor: "red" }}
            />
          </View>

          <View>
            <Text>Assigned to :</Text>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: 10,
              }}
            >
              <TextInput
                placeholder="Collaborator"
                style={styles.textInput}
                value={collaborators}
                onChangeText={setCollaborators}
              />
            </View>
          </View>

          <View>
            <Text>From when to when</Text>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: 10,
              }}
            >
              <TextInput
                placeholder="From"
                style={styles.textInput}
                value={from}
                onChangeText={setFrom}
              />
              <TextInput
                placeholder="To"
                style={styles.textInput}
                value={to}
                onChangeText={setTo}
              />
            </View>
          </View>
          <TouchableOpacity
            style={styles.saveElementSvg}
            onPress={() =>
              handleAddElement({ what, from, to, collaborators, setItems })
            }
          >
            <_SVGSaveForAssigner />
          </TouchableOpacity>
          {/* TODO */}
        </KeyboardAvoidingView>
      </BottomSheetView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  Container: {
    flex: 1,
    zIndex: 10,
    justifyContent: "center",
  },

  bg: {
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    zIndex: -10,
  },

  modalView: {
    backgroundColor: "gray",
    width: "100%",
    borderTopStartRadius: 20,
    borderTopEndRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },

  topmostView: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    alignItems: "center",
    justifyContent: "center",
    alignContent: "center",
    alignSelf: "center",
    // height: ,
    // backgroundColor: "white",
  },

  headingText: {
    marginTop: 4,
    marginBottom: 16,
    fontSize: 16,
    // fontWeight: "500",
    textAlign: "center",
    // backgroundColor: "white",
    flex: 1,
    // height: ,
    alignItems: "center",
    alignSelf: "center",
    alignContent: "center",
    justifyContent: "center",
  },

  closeButtonTouchable: {
    position: "absolute",
    right: 8,
    top: 0,
    // backgroundColor: "red",
  },

  closeButtonIcon: {
    backgroundColor: "white",
    aspectRatio: 1,
    padding: 4,
    borderRadius: 50,
  },

  textInput: {
    backgroundColor: "white",
    padding: 10,
    borderRadius: 8,
    flex: 1,
    height: 50,
  },

  overlay: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.75)",
  },

  saveElementSvg: {
    backgroundColor: "rgb(100, 255, 100)",
    padding: 10,
    borderRadius: 25,
    alignItems: "center",
    height: 50,
    width: 50,
    // justifyContent: "center",
    alignContent: "center",
  },
});
