export class ApiError extends Error {
  status: number;

  constructor(status: number) {
    super(`Request failed with status ${status}`);
    this.status = status;
  }
}

const isSuccess = <T extends { status: number }>(
  res: T,
): res is Extract<T, { status: 200 | 201 }> =>
  res.status === 200 || res.status === 201;

// The generated fetchers resolve on 4xx, so failures are turned into errors here.
export function ok<T extends { status: number; data: unknown }>(
  res: T,
): Extract<T, { status: 200 | 201 }>["data"] {
  if (!isSuccess(res)) throw new ApiError(res.status);
  return res.data;
}

// Deleting and unlinking answer with a 2xx that the generated types don't
// declare, and a 404 means the target is already gone.
export function okOrMissing(res: { status: number }): void {
  if (res.status !== 404 && (res.status < 200 || res.status >= 300)) {
    throw new ApiError(res.status);
  }
}

// The auth endpoints answer a failure with problem details, and a success
// without a body. Returns why it failed, or nothing when it didn't. A failure
// can come without a body too, so the status decides first.
export function problemOf(
  res: { status: number; data: unknown },
  fallback: string,
): string | undefined {
  if (res.status >= 200 && res.status < 300) return undefined;
  const problem = res.data as
    { detail?: string | null; title?: string | null } | undefined;
  return problem?.detail ?? problem?.title ?? fallback;
}
