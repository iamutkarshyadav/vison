// Network utility functions for better error handling

export async function checkNetworkConnection(): Promise<boolean> {
  try {
    // Try to fetch a simple endpoint to check connectivity
    const response = await fetch("/api/ping", {
      method: "GET",
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });
    return response.ok;
  } catch (error) {
    console.warn("Network connectivity check failed:", error);
    return false;
  }
}

export function isNetworkError(error: any): boolean {
  if (error instanceof TypeError && error.message === "Failed to fetch") {
    return true;
  }
  if (error instanceof Error && error.name === "AbortError") {
    return true;
  }
  return false;
}

export function getNetworkErrorMessage(error: any): string {
  if (isNetworkError(error)) {
    return "Network error. Please check your internet connection and try again.";
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "An unexpected error occurred.";
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
): Promise<T> {
  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries) {
        break;
      }

      // Don't retry on authentication errors or client errors
      if (
        error instanceof Error &&
        (error.message.includes("Authentication") ||
          error.message.includes("401") ||
          error.message.includes("403") ||
          error.message.includes("400"))
      ) {
        break;
      }

      // Wait before retrying (exponential backoff)
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
