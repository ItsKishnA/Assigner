import { useRouter } from "expo-router";
// import { FIREBASE_AUTH } from "./../FirebaseConfig";
import { signOut } from "firebase/auth";

export const handleSignOut = async (FIREBASE_AUTH, router) => {
  try {
    // const router = useRouter();
    await FIREBASE_AUTH.signOut();
    console.log("SignOut");
    router.replace("./../login"); // Navigate to the index page after sign out
  } catch (error) {
    console.error("Error signing out: ", error);
  }
};
