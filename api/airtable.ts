import type { VercelRequest, VercelResponse } from '@vercel/node'
import Airtable from 'airtable';

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  process.env.AIRTABLE_BASE_ID
);
const TABLE_NAME = process.env.AIRTABLE_TABLE_NAME || 'FormSubmissions';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const data = new URLSearchParams(req.body);
  try {
    const { name, email, building, floor, type, description, room, email_optin } = Object.fromEntries(data);
    if (!building || (type == "door button" && !floor) || !description) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const createdRecord = await base(TABLE_NAME).create([
      {
        fields: { name, email, building, floor, type, description, room, email_optin: email_optin === "true" },
      },
    ]);

    return res.redirect(302, process.env.REDIRECT_SUCCESS_ROUTE);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
 
