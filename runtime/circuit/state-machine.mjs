// Work Unit state machine (M3.2, CIR-08, CIR-09, CIR-10, CIR-11, CIR-12,
// CIR-20; PAR-STATE-MACHINE, PAR-CLARIFY, PAR-SPEC-REVIEW-PRE-BUILD,
// PAR-QA-VERIFY, PAR-CODE-REVIEW-POST-BUILD). The states and transition
// table are data (contracts/state-machine.json, M2.1); this module is the
// runtime that derives the current state by replaying `transition`
// events (never stored as a separate mutable field, same reasoning as
// runtime/status's derived view, M3.1) and validates that a requested
// transition is actually in that table before it is allowed to happen.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { appendEvent } from "./events.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const stateMachine = JSON.parse(readFileSync(join(here, "..", "..", "contracts", "state-machine.json"), "utf8"));

export class InvalidTransitionError extends Error {}

/** The initial state of a Work Unit with no transition events yet. */
export const INITIAL_STATE = "NEW";

/** Current state: the toState of the last `transition` event, or NEW. */
export function deriveState(events) {
  const transitions = events.filter((e) => e.eventType === "transition");
  if (transitions.length === 0) return INITIAL_STATE;
  return transitions[transitions.length - 1].toState;
}

export function isValidTransition(fromState, toState) {
  return stateMachine.transitions.some((t) => t.from === fromState && t.to === toState);
}

export function assertValidTransition(fromState, toState) {
  if (!isValidTransition(fromState, toState)) {
    throw new InvalidTransitionError(`'${fromState}' -> '${toState}' is not in contracts/state-machine.json's transition table`);
  }
}

/**
 * CIR-08 / PAR-CLARIFY: entering SPECIFIED requires either no open
 * questions, or an explicit escalation to NEEDS_HUMAN_DECISION instead.
 * CLARIFY itself only exists "in the prompt" (there is no clarify event
 * type) -- its contract is this gate on the SPECIFIED transition.
 */
export function canEnterSpecified(openQuestions) {
  return !openQuestions || openQuestions.length === 0;
}

/**
 * Validates and appends a `transition` event. Throws InvalidTransitionError
 * without writing anything if the transition is not in the table, or if
 * toState is SPECIFIED with unresolved open questions (PAR-CLARIFY).
 */
export function transition(logPath, unitId, events, toState, { reason, openQuestions } = {}) {
  const fromState = deriveState(events);
  assertValidTransition(fromState, toState);
  if (toState === "SPECIFIED" && !canEnterSpecified(openQuestions)) {
    throw new InvalidTransitionError("cannot enter SPECIFIED with open questions unresolved; transition to NEEDS_HUMAN_DECISION instead (PAR-CLARIFY)");
  }
  return appendEvent(logPath, unitId, "transition", { fromState, toState, ...(reason ? { reason } : {}) });
}

/** All states this Work Unit could legally move to from `state`. */
export function availableTransitions(state) {
  return stateMachine.transitions.filter((t) => t.from === state).map((t) => t.to);
}

export function listStates() {
  return { states: stateMachine.states, derivedStates: stateMachine.derivedStates, exceptionStates: stateMachine.exceptionStates };
}
