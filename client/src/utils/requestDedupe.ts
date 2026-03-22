const pendingRequests = new Map<string, Promise<unknown>>()

export function dedupeRequest<T>(key: string, request: () => Promise<T>): Promise<T> {
  const pending = pendingRequests.get(key)
  if (pending) {
    return pending as Promise<T>
  }

  const promise = request().finally(() => {
    pendingRequests.delete(key)
  })

  pendingRequests.set(key, promise)
  return promise
}

export function createDedupeKey(prefix: string, ...args: (string | number | undefined)[]): string {
  return [prefix, ...args.filter(Boolean)].join(':')
}
