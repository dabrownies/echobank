// src/app/api/accounts/list/route.js
import { NextResponse } from "next/server";
import admin from "../../../../../utils/firebaseAdmin";
import { db } from "../../../../../utils/firebaseConfig";
import {
  doc,
  setDoc,
  collection,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";

// GET endpoint to retrieve user accounts
export async function GET(req) {
  try {
    // Get authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    const userId = decodedToken.uid;

    // Get user's accounts from Firestore
    const accountsSnapshot = await getDocs(
      collection(db, "users", userId, "accounts")
    );

    // Convert to array
    const accounts = [];
    accountsSnapshot.forEach((doc) => {
      accounts.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return NextResponse.json({ accounts });
  } catch (error) {
    console.error("Error fetching accounts:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST endpoint to create mock accounts for testing
export async function POST(req) {
  try {
    // Get authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    const userId = decodedToken.uid;

    // Create checking account
    const checkingAccountId = `checking-${Date.now()}`;
    await setDoc(doc(db, "users", userId, "accounts", checkingAccountId), {
      type: "Checking",
      nickname: "Everyday Checking",
      balance: 5000,
      createdAt: serverTimestamp(),
    });

    // Create savings account
    const savingsAccountId = `savings-${Date.now()}`;
    await setDoc(doc(db, "users", userId, "accounts", savingsAccountId), {
      type: "Savings",
      nickname: "Emergency Fund",
      balance: 10000,
      createdAt: serverTimestamp(),
    });

    // Add transactions to checking account
    await setDoc(
      doc(
        db,
        "users",
        userId,
        "accounts",
        checkingAccountId,
        "transactions",
        `tx-${Date.now()}-1`
      ),
      {
        amount: -120.5,
        description: "Grocery Shopping",
        category: "Food",
        date: serverTimestamp(),
        balance: 5000 - 120.5,
      }
    );

    await setDoc(
      doc(
        db,
        "users",
        userId,
        "accounts",
        checkingAccountId,
        "transactions",
        `tx-${Date.now()}-2`
      ),
      {
        amount: 1200.0,
        description: "Paycheck Deposit",
        category: "Income",
        date: serverTimestamp(),
        balance: 5000 + 1200.0,
      }
    );

    // Add transaction to savings account
    await setDoc(
      doc(
        db,
        "users",
        userId,
        "accounts",
        savingsAccountId,
        "transactions",
        `tx-${Date.now()}-3`
      ),
      {
        amount: 500.0,
        description: "Savings Transfer",
        category: "Transfer",
        date: serverTimestamp(),
        balance: 10000 + 500.0,
      }
    );

    return NextResponse.json({
      message: "Mock accounts created successfully",
      accounts: [
        { id: checkingAccountId, type: "Checking", balance: 5000 },
        { id: savingsAccountId, type: "Savings", balance: 10000 },
      ],
    });
  } catch (error) {
    console.error("Error creating accounts:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
