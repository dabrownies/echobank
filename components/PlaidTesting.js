"use client";
import { useEffect, useState } from "react";
import Script from "next/script";

export default function PlaidLinkSimple() {
  const [linkToken, setLinkToken] = useState(null);

  useEffect(() => {
    async function fetchLinkToken() {
      try {
        const res = await fetch("/api/plaid/create-link-token");
        const data = await res.json();
        setLinkToken(data.link_token);
      } catch (error) {
        console.error("Error fetching link token:", error);
      }
    }
    fetchLinkToken();
  }, []);

  const openPlaidLink = () => {
    if (!window.Plaid) {
      console.error("Plaid Link SDK not loaded.");
      return;
    }
    const handler = window.Plaid.create({
      token: linkToken,
      onSuccess: (publicToken, metadata) => {
        console.log("Public token received:", publicToken);
        // You can now send the public token to your backend for exchange
        fetch("/api/plaid", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: "test-user-123",
            public_token: publicToken,
          }),
        })
          .then((res) => res.json())
          .then((data) => console.log("Exchange Result: ", data))
          .catch((error) =>
            console.error("Error Exchanging public token: ", error)
          );
      },
      onExit: (error, metadata) => {
        if (error) {
          console.error("Plaid Link exited with error:", error);
        } else {
          console.log("User exited Plaid Link", metadata);
        }
      },
    });
    handler.open();
  };

  return (
    <div>
      <h1>Link Your Bank</h1>
      <button onClick={openPlaidLink} disabled={!linkToken}>
        Open Plaid Link
      </button>
      {/* Load Plaid Link SDK using Next.js Script */}
      <Script
        src="https://cdn.plaid.com/link/v2/stable/link-initialize.js"
        strategy="beforeInteractive"
      />
    </div>
  );
}
