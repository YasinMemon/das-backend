import {google} from "googleapis"

const GoogleClientID = process.env.GOOGLE_CLIENT_ID
const GoogleClientSecret = process.env.GOOGLE_CLIENT_SECRET

export const oauth2client = new google.auth.OAuth2(
  GoogleClientID,
  GoogleClientSecret,
  "postmessage" // Standard redirect URI for auth-code flow without traditional redirect
)