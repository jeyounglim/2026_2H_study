export function getApiErrorMessage(
  e: unknown,
  fallback: string,
): string {
  const data = (e as { data?: { message?: string; errors?: { message?: string }[] } })?.data;
  const fieldMessages = data?.errors
    ?.map((err) => err.message)
    .filter((msg): msg is string => !!msg);
  if (fieldMessages?.length) {
    return fieldMessages.join(' ');
  }
  return data?.message || fallback;
}
