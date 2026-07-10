export function encodeNdjsonLine(value: unknown) {
  return `${JSON.stringify(value)}\n`
}

export async function readNdjsonStream<T extends { type: string }>(
  response: Response,
  onEvent: (event: T) => void
) {
  if (!response.body) {
    throw new Error("Empty response body")
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""

  while (true) {
    const { done, value } = await reader.read()
    if (done) {
      break
    }

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split("\n")
    buffer = lines.pop() ?? ""

    for (const line of lines) {
      if (!line.trim()) {
        continue
      }

      onEvent(JSON.parse(line) as T)
    }
  }
}
