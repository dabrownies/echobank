// app/api/auth/register/route.js
import { NextResponse } from "next/server";
import admin from "../../../../../utils/firebaseAdmin";
import { db } from "../../../../../utils/firebaseConfig";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export async function POST(req) {
  try {
    const { email, password, displayName } = await req.json();
    console.log("Registration data:", { email, displayName });

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    let uid;
    try {
      const userByEmail = await admin.auth().getUserByEmail(email);
      uid = userByEmail.uid;
      console.log("User already exists with UID:", uid);
    } catch (userError) {
      if (userError.code === "auth/user-not-found") {
        // Create new user
        console.log("Creating new user in Firebase Auth");
        const userRecord = await admin.auth().createUser({
          email,
          password,
          displayName: displayName || email.split("@")[0],
        });
        uid = userRecord.uid;
        console.log("Created new user with UID:", uid);
      } else {
        throw userError;
      }
    }

    // Create or update user document in Firestore
    console.log("Writing user data to Firestore at path: users/" + uid);
    try {
      await setDoc(
        doc(db, "users", uid),
        {
          email,
          displayName: displayName || email.split("@")[0],
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
          isVerified: false,
        },
        { merge: true }
      );
      console.log("Successfully wrote user data to Firestore");
    } catch (firestoreError) {
      console.error("Firestore write error:", firestoreError);
      throw firestoreError;
    }

    return NextResponse.json({
      message: "User successfully registered or updated",
      user: {
        uid,
        email,
        displayName: displayName || email.split("@")[0],
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: error.message || "Registration failed" },
      { status: 500 }
    );
  }
}
