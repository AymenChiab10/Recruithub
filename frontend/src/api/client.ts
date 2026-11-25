const apiBaseUrl = (
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8085"
).replace(/\/+$/, "");

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly fieldErrors: Record<string, string> = {},
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readFieldErrors(payload: unknown): Record<string, string> {
  if (!isRecord(payload) || !isRecord(payload.fields)) return {};
  return Object.fromEntries(
    Object.entries(payload.fields).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string",
    ),
  );
}

async function readPayload(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new ApiError("Le serveur a renvoyé une réponse illisible.", response.status);
  }
}

export async function request<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      ...init,
      headers: {
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...init?.headers,
      },
    });
  } catch {
    throw new ApiError(
      "Connexion impossible. Vérifiez que l’API Gateway est démarrée, puis réessayez.",
      0,
    );
  }

  const payload = await readPayload(response);
  if (!response.ok) {
    const message =
      isRecord(payload) && typeof payload.error === "string"
        ? payload.error
        : "La requête n’a pas abouti.";
    throw new ApiError(message, response.status, readFieldErrors(payload));
  }
  return payload as T;
}

export function jsonBody(value: unknown): string {
  return JSON.stringify(value);
}
