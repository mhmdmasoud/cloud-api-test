function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

export function ok(res, data, status = 200) {
  setCors(res);
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  return res.end(JSON.stringify(data));
}

export function badRequest(res, message, details = null) {
  return ok(
    res,
    {
      ok: false,
      error: message,
      details
    },
    400
  );
}

export function unauthorized(res, message = "Unauthorized") {
  return ok(
    res,
    {
      ok: false,
      error: message
    },
    401
  );
}

export function serverError(res, error) {
  return ok(
    res,
    {
      ok: false,
      error: error instanceof Error ? error.message : String(error)
    },
    500
  );
}

export function handleOptions(req, res) {
  if (req.method === "OPTIONS") {
    ok(res, { ok: true }, 200);
    return true;
  }

  return false;
}

export async function readJson(req) {
  const chunks = [];

  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }

  const raw = Buffer.concat(chunks).toString("utf8").trim();

  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error("Invalid JSON body");
  }
}
