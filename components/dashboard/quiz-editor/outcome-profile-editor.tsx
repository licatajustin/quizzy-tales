"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  coerceSectionKind,
  type OutcomeDetailKind,
  type OutcomeDetailSection,
} from "@/lib/quiz/outcome-details"

const KIND_LABELS: Record<OutcomeDetailKind, string> = {
  text: "Text",
  bullets: "Bullet list",
  chips: "Chips",
}

type OutcomeProfileEditorProps = {
  tagline: string
  details: OutcomeDetailSection[]
  onTaglineCommit: (tagline: string) => void
  onDetailsChange: (details: OutcomeDetailSection[]) => void
}

export function OutcomeProfileEditor({
  tagline,
  details,
  onTaglineCommit,
  onDetailsChange,
}: OutcomeProfileEditorProps) {
  const [sectionKeys, setSectionKeys] = useState(() =>
    details.map(() => crypto.randomUUID())
  )

  function replaceSection(index: number, next: OutcomeDetailSection) {
    onDetailsChange(
      details.map((section, sectionIndex) =>
        sectionIndex === index ? next : section
      )
    )
  }

  function moveSection(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= details.length) {
      return
    }

    const next = [...details]
    const nextKeys = [...sectionKeys]
    const [moved] = next.splice(index, 1)
    const [movedKey] = nextKeys.splice(index, 1)
    if (!moved || !movedKey) {
      return
    }
    next.splice(target, 0, moved)
    nextKeys.splice(target, 0, movedKey)
    setSectionKeys(nextKeys)
    onDetailsChange(next)
  }

  return (
    <div className="space-y-4">
      <Field>
        <FieldLabel>Tagline</FieldLabel>
        <FieldDescription>
          A short epithet under the name, such as &ldquo;The Quiet
          Strategist&rdquo;.
        </FieldDescription>
        <Input
          defaultValue={tagline}
          onBlur={(event) => {
            const next = event.target.value
            if (next === tagline) return
            onTaglineCommit(next)
          }}
        />
      </Field>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Profile sections</p>
            <p className="text-sm text-muted-foreground">
              Text, bullet lists, and chips readers see with this result. Blank
              sections stay off the result screen.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={() => {
              setSectionKeys((current) => [...current, crypto.randomUUID()])
              onDetailsChange([
                ...details,
                { label: "", kind: "text", value: "" },
              ])
            }}
          >
            <Plus data-icon="inline-start" />
            Add section
          </Button>
        </div>

        {details.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No profile sections yet.
          </p>
        ) : null}

        {details.map((section, index) => (
          <div
            key={sectionKeys[index] ?? index}
            className="space-y-3 rounded-lg border border-border/60 p-3"
          >
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={section.kind}
                onValueChange={(value) =>
                  replaceSection(
                    index,
                    coerceSectionKind(section, value as OutcomeDetailKind)
                  )
                }
              >
                <SelectTrigger aria-label="Section type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(KIND_LABELS) as OutcomeDetailKind[]).map(
                    (kind) => (
                      <SelectItem key={kind} value={kind}>
                        {KIND_LABELS[kind]}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
              <div className="ml-auto flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Move section up"
                  disabled={index === 0}
                  onClick={() => moveSection(index, -1)}
                >
                  <ChevronUp />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Move section down"
                  disabled={index === details.length - 1}
                  onClick={() => moveSection(index, 1)}
                >
                  <ChevronDown />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Remove section"
                  onClick={() => {
                    setSectionKeys((current) =>
                      current.filter((_, keyIndex) => keyIndex !== index)
                    )
                    onDetailsChange(
                      details.filter(
                        (_, sectionIndex) => sectionIndex !== index
                      )
                    )
                  }}
                >
                  <Trash2 />
                </Button>
              </div>
            </div>

            <Field>
              <FieldLabel>Label</FieldLabel>
              <Input
                defaultValue={section.label}
                onBlur={(event) => {
                  const label = event.target.value
                  if (label === section.label) return
                  replaceSection(index, { ...section, label })
                }}
              />
            </Field>

            {section.kind === "text" ? (
              <Field>
                <FieldLabel>Text</FieldLabel>
                <Textarea
                  defaultValue={section.value}
                  rows={3}
                  onBlur={(event) => {
                    const value = event.target.value
                    if (value === section.value) return
                    replaceSection(index, { ...section, kind: "text", value })
                  }}
                />
              </Field>
            ) : (
              <SectionItems
                items={section.value}
                onChange={(value) =>
                  replaceSection(index, {
                    label: section.label,
                    kind: section.kind,
                    value,
                  })
                }
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function SectionItems({
  items,
  onChange,
}: {
  items: string[]
  onChange: (items: string[]) => void
}) {
  const [itemKeys, setItemKeys] = useState(() =>
    items.map(() => crypto.randomUUID())
  )

  return (
    <div className="space-y-2">
      <FieldLabel>Items</FieldLabel>
      {items.map((item, index) => (
        <div key={itemKeys[index] ?? index} className="flex items-center gap-2">
          <Input
            defaultValue={item}
            onBlur={(event) => {
              const next = event.target.value
              if (next === item) return
              onChange(
                items.map((entry, entryIndex) =>
                  entryIndex === index ? next : entry
                )
              )
            }}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Remove item"
            onClick={() => {
              setItemKeys((current) =>
                current.filter((_, keyIndex) => keyIndex !== index)
              )
              onChange(items.filter((_, entryIndex) => entryIndex !== index))
            }}
          >
            <Trash2 />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="rounded-full"
        onClick={() => {
          setItemKeys((current) => [...current, crypto.randomUUID()])
          onChange([...items, ""])
        }}
      >
        <Plus data-icon="inline-start" />
        Add item
      </Button>
    </div>
  )
}
