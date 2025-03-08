import { db, auth } from "../../../../utils/firebaseConfig";
import { collection, addDoc } from "firebase/firestore";
import { NextResponse } from "next/server";

export async function GET(){

    try{
        const docRef = await addDoc(collection(db, "test"), {
            message: "Firestore is connected",
            timestamp: new Date(),
        });

        return NextResponse.json({ success: true, id: docRef.id});
    }
    catch(error){

        return NextResponse.json({ success: false, error: console.error(error)},{status: 500});
    }

}