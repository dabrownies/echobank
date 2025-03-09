// app/auth/sign-in/page.js
"use client";

import { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [idToken, setIdToken] = useState("");
  const [userId, setUserId] = useState("");

  useEffect(() => {
    // Initialize Firebase
    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      // Add other config as needed
    };
    initializeApp(firebaseConfig);
  }, []);

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const auth = getAuth();
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      setUserId(user.uid);

      // Get the ID token
      const token = await user.getIdToken();
      setIdToken(token);
    } catch (err) {
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md mt-10">
      <h1 className="text-2xl font-bold mb-6">Sign In</h1>

      <form onSubmit={handleSignIn}>
        <div className="mb-4">
          <label className="block mb-2 text-sm font-medium">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
            placeholder="you@example.com"
            required
          />
        </div>

        <div className="mb-6">
          <label className="block mb-2 text-sm font-medium">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
            placeholder="Your password"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-500 text-white p-3 rounded hover:bg-blue-600 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Signing In..." : "Sign In"}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-800 rounded">{error}</div>
      )}

      {idToken && (
        <div className="mt-6 p-4 border border-gray-200 rounded">
          <h2 className="text-lg font-semibold mb-2">Your ID Token</h2>
          <p className="text-sm mb-4">Use this token in your API requests:</p>
          <textarea
            readOnly
            value={idToken}
            className="w-full p-2 border border-gray-300 rounded h-32 text-sm"
          />
          <div className="mt-4">
            <h3 className="font-medium mb-2">Example curl command:</h3>
            <div className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
              <code>
                curl -X POST http://localhost:3000/api/nessie/link-user \<br />
                {"  "}-H "Content-Type: application/json" \<br />
                {"  "}-H "Authorization: Bearer {idToken.substring(0, 20)}..." \
                <br />
                {"  "}-d '
                {JSON.stringify(
                  {
                    firstName: "Test",
                    lastName: "User",
                    address: {
                      street_number: "123",
                      street_name: "Main St",
                      city: "Anytown",
                      state: "NY",
                      zip: "12345",
                    },
                  },
                  null,
                  2
                )}
                '
              </code>
            </div>
          </div>

          <div className="mt-4">
            <p className="font-medium">
              User ID: <span className="font-normal">{userId}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
