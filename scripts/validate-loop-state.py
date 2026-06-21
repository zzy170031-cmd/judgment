#!/usr/bin/env python3
"""Validate Judgment loop, request, and event JSON without third-party deps."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any


READINESS = {"no-loop", "manual-first", "skill-ready", "loop-ready", "blocked"}
LOOP_STATUS = {"planned", "queued", "running", "blocked", "failed", "completed", "stopped"}
EVENT_STATUS = {
    "planned",
    "queued",
    "running",
    "blocked",
    "failed",
    "completed",
    "executed",
    "passed",
    "resolved",
    "accepted",
}


def load_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def expect(errors: list[str], condition: bool, message: str) -> None:
    if not condition:
        errors.append(message)


def require_keys(errors: list[str], data: dict[str, Any], keys: list[str], prefix: str) -> None:
    for key in keys:
        expect(errors, key in data, f"{prefix}.{key} is required")


def validate_loop_state(data: Any) -> list[str]:
    errors: list[str] = []
    expect(errors, isinstance(data, dict), "root must be an object")
    if not isinstance(data, dict):
        return errors

    require_keys(
        errors,
        data,
        [
            "runId",
            "project",
            "codexOnly",
            "purpose",
            "gate",
            "readiness",
            "status",
            "controller",
            "currentLane",
            "currentAgent",
            "currentNode",
            "upstreamInputs",
            "downstreamReceivers",
            "allowedActions",
            "forbiddenActions",
            "oracles",
            "budget",
            "worktree",
            "evidence",
            "blockers",
            "nextAction",
            "review",
            "metrics",
            "updatedAt",
        ],
        "loop",
    )

    expect(errors, data.get("codexOnly") is True, "loop.codexOnly must be true")
    expect(errors, data.get("readiness") in READINESS, "loop.readiness is invalid")
    expect(errors, data.get("status") in LOOP_STATUS, "loop.status is invalid")

    controller = data.get("controller")
    expect(errors, isinstance(controller, dict), "loop.controller must be an object")
    if isinstance(controller, dict):
        require_keys(
            errors,
            controller,
            ["agentId", "role", "sees", "decision", "delegatesTo", "waitsFor", "stopCondition"],
            "loop.controller",
        )
        expect(errors, controller.get("role") == "Judgment Controller", "loop.controller.role must be Judgment Controller")
        expect(errors, isinstance(controller.get("sees"), list) and len(controller.get("sees", [])) > 0, "loop.controller.sees must be a non-empty array")

    for key in ["upstreamInputs", "downstreamReceivers", "allowedActions", "forbiddenActions", "oracles", "evidence", "blockers"]:
        expect(errors, isinstance(data.get(key), list), f"loop.{key} must be an array")
    expect(errors, isinstance(data.get("oracles"), list) and len(data.get("oracles", [])) > 0, "loop.oracles must not be empty")

    budget = data.get("budget")
    expect(errors, isinstance(budget, dict), "loop.budget must be an object")
    if isinstance(budget, dict):
        for key in ["maxRetries", "maxMinutes", "maxChangedFiles"]:
            expect(errors, isinstance(budget.get(key), int), f"loop.budget.{key} must be an integer")

    review = data.get("review")
    expect(errors, isinstance(review, dict), "loop.review must be an object")
    if isinstance(review, dict):
        require_keys(errors, review, ["required", "receiver", "status"], "loop.review")

    metrics = data.get("metrics")
    expect(errors, isinstance(metrics, dict), "loop.metrics must be an object")
    if isinstance(metrics, dict):
        require_keys(errors, metrics, ["attempts", "acceptedChanges", "acceptanceRate"], "loop.metrics")
        rate = metrics.get("acceptanceRate")
        expect(errors, isinstance(rate, (int, float)) and 0 <= rate <= 1, "loop.metrics.acceptanceRate must be 0..1")

    return errors


def validate_request_packet(data: Any) -> list[str]:
    errors: list[str] = []
    expect(errors, isinstance(data, dict), "request root must be an object")
    if not isinstance(data, dict):
        return errors

    require_keys(errors, data, ["id", "project", "branch", "gate", "module", "selectedAgent", "request", "safetyBoundary"], "request")
    expect(errors, bool(str(data.get("request", "")).strip()), "request.request must not be empty")

    safety = data.get("safetyBoundary")
    expect(errors, isinstance(safety, dict), "request.safetyBoundary must be an object")
    if isinstance(safety, dict):
        expect(errors, safety.get("htmlCanExecute") is False, "request.safetyBoundary.htmlCanExecute must be false")
        expect(errors, safety.get("codexMustReview") is True, "request.safetyBoundary.codexMustReview must be true")
        expect(errors, safety.get("gitWriteRequiresCodex") is True, "request.safetyBoundary.gitWriteRequiresCodex must be true")
        expect(
            errors,
            safety.get("destructiveActionsRequireHumanApproval") is True,
            "request.safetyBoundary.destructiveActionsRequireHumanApproval must be true",
        )

    loop = data.get("loop")
    if isinstance(loop, dict) and "readiness" in loop:
        expect(errors, loop.get("readiness") in READINESS, "request.loop.readiness is invalid")

    return errors


def validate_event(data: Any) -> list[str]:
    errors: list[str] = []
    expect(errors, isinstance(data, dict), "event root must be an object")
    if not isinstance(data, dict):
        return errors

    require_keys(errors, data, ["id", "source", "agentId", "agent", "lane", "module", "node", "status", "text"], "event")
    expect(errors, data.get("status") in EVENT_STATUS, "event.status is invalid")
    progress = data.get("progress")
    if progress is not None:
        expect(errors, isinstance(progress, (int, float)) and 0 <= progress <= 100, "event.progress must be 0..100 or null")

    loop = data.get("loop")
    if isinstance(loop, dict) and "readiness" in loop:
        expect(errors, loop.get("readiness") in READINESS, "event.loop.readiness is invalid")

    return errors


def infer_kind(path: Path, explicit: str) -> str:
    if explicit != "auto":
        return explicit
    name = path.name.lower()
    if "request" in name:
        return "request"
    if "event" in name:
        return "event"
    return "loop"


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("json_path", type=Path)
    parser.add_argument("--kind", choices=["auto", "loop", "request", "event"], default="auto")
    args = parser.parse_args()

    data = load_json(args.json_path)
    kind = infer_kind(args.json_path, args.kind)
    if kind == "loop":
        errors = validate_loop_state(data)
    elif kind == "request":
        errors = validate_request_packet(data)
    else:
        errors = validate_event(data)

    if errors:
        for error in errors:
            print(f"ERROR: {error}", file=sys.stderr)
        return 1

    print(f"OK: {args.json_path} ({kind})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
