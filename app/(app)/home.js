import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  ImageBackground,
  ToastAndroid,
} from "react-native";
import Checkbox from "expo-checkbox";
import { FIREBASE_AUTH } from "../../FirebaseConfig";
// import { useRouter } from "expo-router";
import MyModal from "../../myComponents/assignerModal";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { handleSignOut } from "../../myComponents/appBackend";
import {
  getFirestore,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  collection,
} from "firebase/firestore";
import { onSnapshot } from "firebase/firestore";
import { useRouter } from "expo-router";

import * as NavigationBar from "expo-navigation-bar";
import { ScrollView } from "react-native";
import { StatusBar } from "expo-status-bar";
import { BlurView } from "@react-native-community/blur";

const db = getFirestore();

const _AssignerButton = ({ handleModalOpen, handleModalClose }) => {
  return (
    <TouchableOpacity
      onPress={handleModalOpen}
      onClose={handleModalClose}
      style={styles._AssignerButton}
    >
      <Text style={styles.plus}>+</Text>
    </TouchableOpacity>
  );
};

const Item = ({
  id,
  from,
  to,
  collaborators,
  what,
  completed,
  items,
  setItems,
  onToggle,
  assignedBy,
}) => {
  return (
    <View
      style={[
        styles.Item,
        {
          // borderColor: "rgba(255,255,255,0.5)",
          // borderWidth: 3,
          borderRadius: 20,
        },
      ]}
      key={id}
    >
      <TouchableOpacity
        onPress={() => onToggle(id)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          // alignSelf: "center",
          // backgroundColor: "#D0F30188",
          backgroundColor: completed ? "transparent" : "#ffd7f1",
          borderColor: completed ? "#ffd7f1" : "transparent",
          borderWidth: 1,
          borderRadius: 12,
          justifyContent: "flex-start",
          alignItems: "center",
          paddingHorizontal: 8,
          paddingVertical: 4,
          width: "100%",
        }}
      >
        <Checkbox
          value={completed}
          onValueChange={() => onToggle(id)}
          style={styles.checkbox}
        />
        <Text style={[styles.ItemText, completed && styles.ItemTextPurchased]}>
          {what}
        </Text>
      </TouchableOpacity>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          // flex: 1,
          width: "100%",
        }}
      >
        <Text
          style={[
            styles.ItemFrom,
            { color: completed ? "rgb(50,50,50)" : "black" },
          ]}
        >
          {from}
        </Text>
        <Text style={styles.ItemTo}>{to}</Text>
      </View>
      <Text style={styles.ItemCollaborator}>
        {collaborators} and assigned by: {assignedBy}
      </Text>
    </View>
  );
};

const Contents = ({ items, setItems }) => {
  const toggleItem = async (index, itemWhat) => {
    setItems((prevItems) =>
      prevItems.map((item, i) =>
        index === i ? { ...item, completed: !item.completed } : item
      )
    );
    try {
      const tasksQuery = collection(db, "tasks");
      const tasksSnapshot = await getDocs(tasksQuery);
      let itemRef;
      tasksSnapshot.forEach((doc) => {
        if (doc.data().what === itemWhat) {
          itemRef = doc.ref;
        }
      });
      if (itemRef) {
        const itemDoc = await getDoc(itemRef);
        if (itemDoc.exists()) {
          const currentStatus = itemDoc.data().completed;
          await updateDoc(itemRef, {
            completed: !currentStatus,
          });
          console.log("Task status updated successfully");
          ToastAndroid.show(
            "Task status updated successfully",
            ToastAndroid.SHORT
          );
        }
      }
    } catch (error) {
      console.error("Error updating task status:", error);
      ToastAndroid.show("Error updating task status", ToastAndroid.SHORT);
      setItems((prevItems) =>
        prevItems.map((item, i) =>
          index === i ? { ...item, completed: !item.completed } : item
        )
      );
    }
  };
  return (
    <View style={styles.Board}>
      {/* <Text style={styles.TaskHeading}>Task</Text> */}
      <ScrollView style={styles.ShoppingList}>
        {items.map((item, index) => {
          if (!item) {
            return null;
          }
          console.log("Item: ", item.id + " " + item.what);

          return (
            <Item
              key={index}
              what={item.what || item.text || "no description"}
              from={item.from || "startPoint"}
              to={item.to || "deadline"}
              collaborators={item.collaborators || "default@gmail.com"}
              completed={item.completed}
              items={items}
              setItems={setItems}
              onToggle={() => toggleItem(index, item.what)}
              assignedBy={item.assignerEmail}
            />
          );
        })}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const Home = () => {
  const [modalVisible, setModalVisible] = useState(false);

  const router = useRouter();

  const [items, setItems] = React.useState([]);

  // Fetch tasks assigned to the current user
  const fetchUserTasks = async () => {
    try {
      const user = FIREBASE_AUTH.currentUser;
      if (!user) {
        throw new Error("No authenticated user found");
      }

      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) {
        throw new Error("User document does not exist");
      }

      const userData = userDoc.data();
      if (!userData) {
        throw new Error("User data is undefined");
      }

      const toMe = userData.toMe || [];
      const toSomeone = userData.toSomeone || [];

      // Fetch task details using task IDs
      const taskPromises = [...toMe, ...toSomeone].map(async (taskId) => {
        const taskDoc = await getDoc(doc(db, "tasks", taskId));
        return taskDoc.data();
      });
      const tasks = await Promise.all(taskPromises);
      setItems(tasks);
    } catch (error) {
      console.error("Error fetching user tasks:", error);
    }
  };

  const handleModalOpen = () => {
    setModalVisible(true);
    // NavigationBar.setBackgroundColorAsync("#F9F7F2");
  };

  const handleModalClose = () => {
    setModalVisible(false);
    // NavigationBar.setBackgroundColorAsync("#898A8D");
  };

  useEffect(() => {
    // const unsubscribe = onSnapshot(
    //   doc(db, "users", FIREBASE_AUTH.currentUser.uid),
    //   (doc) => {
    //     fetchUserTasks();
    //   }
    // );
    const unsubscribe = onSnapshot(collection(db, "tasks"), (snapshot) => {
      const tasks = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setItems(tasks);
    });
    // NavigationBar.setVisibilityAsync(true);
    // NavigationBar.setTranslucentAsync(true);
    NavigationBar.setButtonStyleAsync("light");
    NavigationBar.setBackgroundColorAsync("white");
    NavigationBar.setBorderColorAsync("black");
    NavigationBar.setBehaviorAsync("overlay-swipe");

    // NavigationBar.setVisibilityAsync(false);
    return () => unsubscribe();
  }, []);

  return (
    <GestureHandlerRootView>
      <StatusBar style="dark" />
      {/* <Image
        source={require("../../assets/images/bg-gradient.png")}
        style={{
          width: 400,
          height: 600,
          transform: [{ rotate: "90deg" }],
          // backgroundColor: "gray",
          // borderRadius: 10,
          position: "absolute",
          objectFit: "contain",
          // top: 0,
          left: 0,
        }}
        // objectFit="contain"
      /> */}
      {/* <ImageBackground
        source={require("../../assets/images/bg-2.png")}
        style={{
          width: "100%",
          height: "100%",
          // backgroundColor: "gray",
          // borderRadius: 10,
          position: "absolute",
          // objectFit: "contain",
          // transform: [{ rotate: "90deg" }],
          // top: 0,
          opacity: 0.8,
          // left: 0,
        }}
        // objectFit="contain"
      /> */}

      <View style={styles.Container}>
        <View
          style={{
            marginTop: 50,
            padding: 10,
            justifyContent: "space-between",
            alignItems: "center",
            // borderRadius: 10,
            flexDirection: "row",
            width: "100%",
            paddingHorizontal: 24,
          }}
        >
          <Text style={styles.TaskHeading}>Assigner</Text>
          <TouchableOpacity
            onPress={() => handleSignOut(FIREBASE_AUTH, router)}
          >
            <Image
              source={require("../../assets/images/signout.png")}
              style={{
                width: 50,
                height: 50,
                backgroundColor: "red",
                borderRadius: 10,
              }}
            />
          </TouchableOpacity>
        </View>
        <Contents items={items} setItems={setItems} />
        <_AssignerButton
          handleModalOpen={handleModalOpen}
          handleModalClose={handleModalClose}
        />
        {modalVisible && (
          <MyModal
            modalVisible={modalVisible}
            onModalClose={handleModalClose}
            items={items}
            setItems={setItems}
          />
        )}
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  Container: {
    flex: 1,
    justifyContent: "center",
    // paddingTop: 65,
    // paddingBottom: 10,
    // paddingHorizontal: 10,
    backgroundColor: "#102332",
    alignItems: "center",
  },

  Board: {
    flex: 1,
    width: "95%",
    height: 500,
    padding: 12,
    // borderRadius: 10,
    // backgroundColor: "rgba(255, 255, 255, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    // borderWidth: 1,
    // borderColor: "blue",
    marginVertical: 10,
  },

  TaskHeading: {
    fontSize: 25,
    paddingVertical: 5,
    fontWeight: "900",
    color: "#122023",
  },

  checkbox: {
    borderRadius: 20,
    borderColor: "rgba(0, 0, 0, 0.8)",
    // flexShrink: 0,
  },

  // d0f301

  _AssignerButton: {
    width: 50,
    height: 50,
    backgroundColor: "red",
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    bottom: 20,
    right: 30,
  },

  plus: {
    fontSize: 25,
    fontWeight: "bold",
    color: "white",
  },

  ShoppingList: {
    width: "100%",
    // backgroundColor: "red",
  },

  Item: {
    flexDirection: "column",
    alignItems: "center",
    padding: 10,
    marginBottom: 4,
  },

  ItemText: {
    fontSize: 18,
    color: "black",
    fontWeight: "bold",
    fontFamily: "monospace",
    paddingLeft: 12,
  },

  ItemTextPurchased: {
    textDecorationLine: "line-through",
  },

  ItemFrom: {
    fontSize: 16,
    // color: "black",

    fontFamily: "monospace",
    paddingLeft: 12,
  },

  ItemTo: {
    fontSize: 16,
    color: "white",
    color: "black",
    fontFamily: "monospace",
    paddingLeft: 12,
  },

  ItemCollaborator: {
    fontSize: 16,
    color: "white",
    color: "black",
    fontFamily: "monospace",
    paddingLeft: 12,
  },
});

export default Home;

// import { Image, StyleSheet, Platform } from 'react-native';

// import { HelloWave } from '@/components/HelloWave';
// import ParallaxScrollView from '@/components/ParallaxScrollView';
// import { ThemedText } from '@/components/ThemedText';
// import { ThemedView } from '@/components/ThemedView';

// export default function HomeScreen() {
//   return (
//     <ParallaxScrollView
//       headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
//       headerImage={
//         <Image
//           source={require('@/assets/images/partial-react-logo.png')}
//           style={styles.reactLogo}
//         />
//       }>
//       <ThemedView style={styles.titleContainer}>
//         <ThemedText type="title">Welcome!</ThemedText>
//         <HelloWave />
//       </ThemedView>
//       <ThemedView style={styles.stepContainer}>
//         <ThemedText type="subtitle">Step 1: Try it</ThemedText>
//         <ThemedText>
//           Edit <ThemedText type="defaultSemiBold">app/(tabs)/index.tsx</ThemedText> to see changes.
//           Press{' '}
//           <ThemedText type="defaultSemiBold">
//             {Platform.select({
//               ios: 'cmd + d',
//               android: 'cmd + m',
//               web: 'F12'
//             })}
//           </ThemedText>{' '}
//           to open developer tools.
//         </ThemedText>
//       </ThemedView>
//       <ThemedView style={styles.stepContainer}>
//         <ThemedText type="subtitle">Step 2: Explore</ThemedText>
//         <ThemedText>
//           Tap the Explore tab to learn more about what's included in this starter app.
//         </ThemedText>
//       </ThemedView>
//       <ThemedView style={styles.stepContainer}>
//         <ThemedText type="subtitle">Step 3: Get a fresh start</ThemedText>
//         <ThemedText>
//           When you're ready, run{' '}
//           <ThemedText type="defaultSemiBold">npm run reset-project</ThemedText> to get a fresh{' '}
//           <ThemedText type="defaultSemiBold">app</ThemedText> directory. This will move the current{' '}
//           <ThemedText type="defaultSemiBold">app</ThemedText> to{' '}
//           <ThemedText type="defaultSemiBold">app-example</ThemedText>.
//         </ThemedText>
//       </ThemedView>
//     </ParallaxScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   titleContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 8,
//   },
//   stepContainer: {
//     gap: 8,
//     marginBottom: 8,
//   },
//   reactLogo: {
//     height: 178,
//     width: 290,
//     bottom: 0,
//     left: 0,
//     position: 'absolute',
//   },
// });
