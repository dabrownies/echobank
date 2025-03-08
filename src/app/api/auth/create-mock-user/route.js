import { db } from "../../../../../utils/firebaseConfig";
import { collection, addDoc } from "firebase/firestore";
import { NextResponse } from "next/server";

// Example GET route to create a mock user
export async function GET() {
  try {
    // Hardcode some mock data
    const mockUser = {
      userId: "test-user-123",
      name: "John Doe",
      email: "john@example.com",
      createdAt: new Date(),
    };

    // Store this user in the 'users' collection
    const docRef = await addDoc(collection(db, "users"), mockUser);
    return NextResponse.json({
      message: "Mock user created successfully",
      docId: docRef.id,
      userData: mockUser,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
