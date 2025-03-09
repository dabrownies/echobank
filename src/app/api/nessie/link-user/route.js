import { NextResponse } from "next/server";
import admin from "../../../../../utils/firebaseAdmin";
import { db } from "../../../../../utils/firebaseConfig";
import { doc, setDoc, collection, serverTimestamp } from "firebase/firestore";

export async function POST(req) {
  try {
    // Authentication check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    const uid = decodedToken.uid;
    console.log("Authenticated user:", uid);

    // Parse request body
    const { firstName, lastName, address } = await req.json();
    console.log("Request data:", { firstName, lastName, address });

    // Prepare customer data
    const customerData = {
      first_name: firstName,
      last_name: lastName,
      address: address || {
        street_number: "123",
        street_name: "Main St",
        city: "Anytown",
        state: "NY",
        zip: "12345",
      },
    };

    // Call Nessie API to create customer
    console.log("Creating customer in Nessie API");
    const nessieResponse = await fetch(
      `${process.env.NESSIE_BASE_URL}customers?key=${process.env.NESSIE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customerData),
      }
    );

    // Check response status
    if (!nessieResponse.ok) {
      const errorText = await nessieResponse.text();
      console.error("Nessie API error:", errorText);
      return NextResponse.json(
        { error: `Nessie API error: ${errorText}` },
        { status: nessieResponse.status }
      );
    }

    // Parse response
    const nessieCustomer = await nessieResponse.json();
    console.log("Nessie customer created:", nessieCustomer);

    // Validate response
    if (!nessieCustomer || !nessieCustomer._id) {
      console.error("Invalid response from Nessie API:", nessieCustomer);
      return NextResponse.json(
        { error: "Invalid response from Nessie API" },
        { status: 500 }
      );
    }

    // Update user in Firestore
    console.log("Updating user in Firestore with Nessie data");
    await setDoc(
      doc(db, "users", uid),
      {
        nessieCustomerId: nessieCustomer._id,
        nessieData: nessieCustomer,
        hasNessieAccess: true,
        nessieLinkedAt: serverTimestamp(),
      },
      { merge: true }
    );

    // Prepare account data
    const checkingAccount = {
      type: "Checking",
      nickname: "Everyday Checking",
      rewards: 0,
      balance: 5000,
    };

    const savingsAccount = {
      type: "Savings",
      nickname: "Emergency Fund",
      rewards: 0,
      balance: 10000,
    };

    // Create accounts in Nessie
    console.log("Creating accounts in Nessie API");
    let checkingResponse, savingsResponse;
    try {
      [checkingResponse, savingsResponse] = await Promise.all([
        fetch(
          `${process.env.NESSIE_BASE_URL}customers/${nessieCustomer._id}/accounts?key=${process.env.NESSIE_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(checkingAccount),
          }
        ),
        fetch(
          `${process.env.NESSIE_BASE_URL}customers/${nessieCustomer._id}/accounts?key=${process.env.NESSIE_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(savingsAccount),
          }
        ),
      ]);

      // Check response status
      if (!checkingResponse.ok || !savingsResponse.ok) {
        let errorMessage = "";
        if (!checkingResponse.ok) {
          errorMessage += `Checking account error: ${await checkingResponse.text()}. `;
        }
        if (!savingsResponse.ok) {
          errorMessage += `Savings account error: ${await savingsResponse.text()}`;
        }
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error("Error creating accounts:", error);
      return NextResponse.json(
        { error: `Error creating accounts: ${error.message}` },
        { status: 500 }
      );
    }

    // Parse account responses
    let checkingData, savingsData;
    try {
      [checkingData, savingsData] = await Promise.all([
        checkingResponse.json(),
        savingsResponse.json(),
      ]);

      // Validate account data
      if (!checkingData._id || !savingsData._id) {
        throw new Error("Invalid account data from Nessie API");
      }

      console.log("Accounts created:", { checkingData, savingsData });
    } catch (error) {
      console.error("Error parsing account data:", error);
      return NextResponse.json(
        { error: `Error parsing account data: ${error.message}` },
        { status: 500 }
      );
    }

    // Store account data in Firestore
    console.log("Storing account data in Firestore");
    try {
      await Promise.all([
        setDoc(doc(db, "users", uid, "accounts", checkingData._id), {
          ...checkingAccount,
          _id: checkingData._id,
          nessieData: checkingData,
          linkedAt: serverTimestamp(),
        }),
        setDoc(doc(db, "users", uid, "accounts", savingsData._id), {
          ...savingsAccount,
          _id: savingsData._id,
          nessieData: savingsData,
          linkedAt: serverTimestamp(),
        }),
      ]);
      console.log("Account data stored successfully");
    } catch (error) {
      console.error("Error storing account data:", error);
      return NextResponse.json(
        { error: `Error storing account data: ${error.message}` },
        { status: 500 }
      );
    }

    // Return successful response
    return NextResponse.json({
      message: "User linked with Nessie and accounts created",
      customerId: nessieCustomer._id,
      accounts: [checkingData, savingsData],
    });
  } catch (error) {
    console.error("Error linking user with Nessie:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
