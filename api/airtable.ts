import type { VercelRequest, VercelResponse } from "@vercel/node";
import Airtable from "airtable";

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  process.env.AIRTABLE_BASE_ID!
);
const TABLE_NAME = process.env.AIRTABLE_TABLE_NAME || "FormSubmissions";

/**
 * Validates if the input looks like test data or gibberish.
 */
function isSpamOrTest(text: string): boolean {
  if (!text) return true;

  const lowerText = text.toLowerCase().trim();

  // 1. Filter common test strings
  const testKeywords = ["test", "testing", "asdf", "qwerty", "1234"];
  if (testKeywords.some((word) => lowerText === word)) {
    return true;
  }

  // 2. High entropy / Gibberish detection
  // Checks for "words" longer than 25 characters (English max is usually ~21)
  const words = text.split(/\s+/);
  const hasLongNonsenseWord = words.some((word) => word.length > 25);
  if (hasLongNonsenseWord) {
    return true;
  }

  // 3. Low character diversity vs length (e.g., "aaaaaaaaaaaaaaaa")
  const uniqueChars = new Set(lowerText.replace(/\s/g, "")).size;
  if (lowerText.length > 10 && uniqueChars < 3) {
    return true;
  }

  return false;
}

async function sendDiscordWebhook(endpoint: string, message: string) {
  if (endpoint) {
    const content = { content: message };
    await fetch(endpoint, {
      body: JSON.stringify(content),
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const data = new URLSearchParams(req.body);
  try {
    const {
      name,
      email,
      building,
      floor,
      type,
      description,
      room,
      email_optin,
      campuspulse_id,
    } = Object.fromEntries(data);

    if (!building || (type === "door button" && !floor) || !description) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Always log to Airtable so you can review potential false positives
    await base(TABLE_NAME).create([
      {
        fields: {
          name,
          email,
          building,
          floor,
          type,
          description,
          room,
          email_optin: email_optin === "true",
        },
      },
    ]);

    // Check filters BEFORE sending webhooks
    const isFiltered = isSpamOrTest(description);

    if (!isFiltered) {
      let webhookMessage = `A new ${type} report has been filed:\n**Building**: ${building}\n**Location Description**: ${room}\n**Description**: ${description}\n`;

      const campuspulse_id_val = parseInt(campuspulse_id, 10);
      if (!isNaN(campuspulse_id_val)) {
        webhookMessage += `**Catalog URL:** https://access.campuspulse.app/access_points/${campuspulse_id}\n`;
      }

      webhookMessage += `\nThis automated message was generated because a report was filed through the catalog or the [reporting form](https://report.campuspulse.app). It will be verified and filed to FMS soon by our team.`;

      if (type === "elevator") {
        let pingRole = process.env.DISCORD_PING_ROLE ?? "";
        if (pingRole !== "") {
          pingRole += " ";
        }
        await sendDiscordWebhook(
          process.env.DISCORD_WEBHOOK_URL ?? "",
          pingRole + webhookMessage
        );
      }

      await sendDiscordWebhook(
        process.env.FIREHOSE_DISCORD_WEBHOOK_URL ?? "",
        webhookMessage
      );
    }

    return res.redirect(302, process.env.REDIRECT_SUCCESS_ROUTE!);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
