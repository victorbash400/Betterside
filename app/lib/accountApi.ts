export class AccountApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
  }
}
export async function accountRequest(
  path: string,
  body?: unknown,
  transport: typeof fetch = fetch,
  method = "POST",
) {
  const response = await transport(path, {
    method,
    cache: "no-store",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const data = await response.json();
  if (!response.ok)
    throw new AccountApiError(
      typeof data.error === "string" ? data.error : "Account request failed.",
      response.status,
      data.code,
    );
  return data;
}
