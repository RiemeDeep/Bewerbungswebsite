function safelyEquals(left: string, right: string) {
  const encoder = new TextEncoder();
  const leftBytes = encoder.encode(left);
  const rightBytes = encoder.encode(right);
  const length = Math.max(leftBytes.length, rightBytes.length);
  let difference = leftBytes.length ^ rightBytes.length;

  for (let index = 0; index < length; index += 1) {
    difference |= (leftBytes[index] ?? 0) ^ (rightBytes[index] ?? 0);
  }

  return difference === 0;
}

export function hasValidBasicCredentials(
  authorization: string | null,
  username: string,
  password: string,
) {
  if (!authorization?.startsWith("Basic ")) {
    return false;
  }

  try {
    const decoded = atob(authorization.slice("Basic ".length));
    const separatorIndex = decoded.indexOf(":");
    if (separatorIndex < 0) {
      return false;
    }

    return (
      safelyEquals(decoded.slice(0, separatorIndex), username) &&
      safelyEquals(decoded.slice(separatorIndex + 1), password)
    );
  } catch {
    return false;
  }
}
