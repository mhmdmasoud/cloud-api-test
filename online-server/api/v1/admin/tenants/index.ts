import type { IncomingMessage, ServerResponse } from 'node:http'
import { handleServerlessRequest } from '../../../../src/serverless.js'

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  await handleServerlessRequest(req, res)
}
