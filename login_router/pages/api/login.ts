import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs/promises";

export type LoginResult = {
  success: boolean;
  url?: string;
};

type Account = {
  url: string;
};

class Accounts {
  accounts: Record<string, Account> | null = null;

  async getAccount(token: string): Promise<Account | null> {
    if (!this.accounts) {
      console.log("Reading accounts.json");
      const data = await fs.readFile("./accounts.json");
      this.accounts = JSON.parse(data.toString()) as Record<string, Account>;
      console.log(`Found ${Object.keys(this.accounts).length} accounts`);
    }

    return this.accounts[token] || null;
  }
}

const accounts = new Accounts();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<LoginResult>
) {
  const token = req.body.token;
  if (!token) return res.status(400).json({ success: false });

  const account = await accounts.getAccount(token);
  if (account) {
    return res.status(200).json({ success: true, url: account.url });
  }
  res.status(404).json({ success: false });
}
