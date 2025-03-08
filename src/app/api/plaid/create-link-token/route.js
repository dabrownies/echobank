import { NextResponse } from "next/server";
import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";

const config = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV],
  baseOptions: {
    headers: {
      "PLAID-CLIENT-ID": process.env.PLAID_CLIENT,
      "PLAID-SECRET": process.env.PLAID_SECRET,
    },
  },
});

const plaidClient = new PlaidApi(config);

export async function GET() {
  try {
    const response = await plaidClient.linkTokenCreate({
      user: {
        client_user_id: "test-user-"+Date.now(), // replacing with firebase uid when deploying currently testing
      },
      client_name: "Echo Bank",
      products: ["auth", "transactions"], //Services to enable
      country_codes: ["US"],
      language: "en", // for testing
    });

    return NextResponse.json({ link_token: response.data.link_token });
  } catch (error) {
    console.error("Plaid Error:", error.response?.data || error.message);
    return NextResponse.json({ error: error }, { status: 500 });
  }
}
