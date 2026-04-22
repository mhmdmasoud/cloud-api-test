import { handleServerlessRequest } from "../online-server/dist/serverless.js";

export default async function handler(req, res) {
  await handleServerlessRequest(req, res);
}
