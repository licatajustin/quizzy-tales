import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  RESULT_REVEAL_MS,
  isRestoredFinishedResult,
  shouldSkipResultReveal,
} from "./result-reveal.ts"

describe("result reveal", () => {
  it("holds the interstitial for under a second", () => {
    assert.ok(RESULT_REVEAL_MS >= 600)
    assert.ok(RESULT_REVEAL_MS <= 1000)
  })

  it("skips when motion is reduced or a finished attempt was restored", () => {
    assert.equal(
      shouldSkipResultReveal({
        reduceMotion: true,
        restoredFinishedResult: false,
      }),
      true
    )
    assert.equal(
      shouldSkipResultReveal({
        reduceMotion: false,
        restoredFinishedResult: true,
      }),
      true
    )
    assert.equal(
      shouldSkipResultReveal({
        reduceMotion: false,
        restoredFinishedResult: false,
      }),
      false
    )
  })

  it("treats only a restored finished subset attempt as already revealed", () => {
    assert.equal(
      isRestoredFinishedResult({
        subsetActive: true,
        restoredState: "result",
        hasSessionOverride: false,
      }),
      true
    )
    assert.equal(
      isRestoredFinishedResult({
        subsetActive: true,
        restoredState: "result",
        hasSessionOverride: true,
      }),
      false
    )
    assert.equal(
      isRestoredFinishedResult({
        subsetActive: true,
        restoredState: "playing",
        hasSessionOverride: false,
      }),
      false
    )
    assert.equal(
      isRestoredFinishedResult({
        subsetActive: false,
        restoredState: "result",
        hasSessionOverride: false,
      }),
      false
    )
  })
})
