type JsonLdProps = {
  data: Record<string, unknown> | Record<string, unknown>[]
}

function getSchemaKey(entry: Record<string, unknown>, index: number) {
  const schemaType =
    typeof entry["@type"] === "string" ? entry["@type"] : "schema"
  const schemaName = typeof entry.name === "string" ? entry.name : ""

  return `${schemaType}-${schemaName}-${index}`
}

export function JsonLd({ data }: JsonLdProps) {
  const payload = Array.isArray(data) ? data : [data]

  return (
    <>
      {payload.map((entry, index) => (
        <script
          key={getSchemaKey(entry, index)}
          type="application/ld+json"
          // JSON-LD requires inline script content; React has no alternative.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(entry) }}
        />
      ))}
    </>
  )
}
