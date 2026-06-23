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
    "pass",
    "passed",
    "resolved",
    "accepted",
}
RUNTIME_STATUS = {"running", "blocked", "failed", "completed", "closed", "stopped"}
REVIEW_STATUS = {"pending", "not-required", "passed", "failed", "blocked"}
VERDICT = {"go", "conditional-go", "no-go", "blocked"}


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


def validate_runtime_state(data: Any) -> list[str]:
    errors: list[str] = []
    expect(errors, isinstance(data, dict), "runtime root must be an object")
    if not isinstance(data, dict):
        return errors

    require_keys(
        errors,
        data,
        ["status", "activeRun", "currentNode", "currentLane", "laneProgress", "blockers", "evidence", "updatedAt"],
        "runtime",
    )
    expect(errors, data.get("status") in RUNTIME_STATUS, "runtime.status is invalid")
    expect(errors, isinstance(data.get("currentNode"), str) and bool(data.get("currentNode")), "runtime.currentNode must be a string")
    expect(errors, isinstance(data.get("currentLane"), str) and bool(data.get("currentLane")), "runtime.currentLane must be a string")
    expect(errors, isinstance(data.get("laneProgress"), dict), "runtime.laneProgress must be an object")
    expect(errors, isinstance(data.get("blockers"), list), "runtime.blockers must be an array")
    expect(errors, isinstance(data.get("evidence"), list), "runtime.evidence must be an array")

    active = data.get("activeRun")
    if active is not None:
        expect(errors, isinstance(active, dict), "runtime.activeRun must be null or an object")
        if isinstance(active, dict):
            require_keys(errors, active, ["agent", "agentId", "module", "node", "lane", "status", "text", "time"], "runtime.activeRun")
            expect(errors, active.get("status") in EVENT_STATUS or active.get("status") in RUNTIME_STATUS, "runtime.activeRun.status is invalid")

    controller = data.get("controller")
    if controller is not None:
        expect(errors, isinstance(controller, dict), "runtime.controller must be an object")
        if isinstance(controller, dict):
            require_keys(errors, controller, ["role", "state", "sees", "decision", "waitsFor", "oracle", "stopCondition", "nextAction"], "runtime.controller")
            expect(errors, controller.get("role") == "Judgment Controller", "runtime.controller.role must be Judgment Controller")

    session = data.get("projectSession")
    if session is not None:
        expect(errors, isinstance(session, dict), "runtime.projectSession must be an object")
        if isinstance(session, dict):
            require_keys(errors, session, ["id", "project", "branch", "gate", "nextGate", "lifecycle", "status", "nextAction"], "runtime.projectSession")

    return errors


def validate_worker_packet(data: Any) -> list[str]:
    errors: list[str] = []
    expect(errors, isinstance(data, dict), "worker root must be an object")
    if not isinstance(data, dict):
        return errors

    require_keys(
        errors,
        data,
        [
            "id",
            "project",
            "lane",
            "agent",
            "goal",
            "inputs",
            "allowedActions",
            "forbiddenActions",
            "oracles",
            "downstreamReceiver",
            "stopCondition",
            "review",
        ],
        "worker",
    )
    for key in ["inputs", "allowedActions", "forbiddenActions", "oracles"]:
        expect(errors, isinstance(data.get(key), list), f"worker.{key} must be an array")
    expect(errors, isinstance(data.get("oracles"), list) and len(data.get("oracles", [])) > 0, "worker.oracles must not be empty")

    review = data.get("review")
    expect(errors, isinstance(review, dict), "worker.review must be an object")
    if isinstance(review, dict):
        require_keys(errors, review, ["required", "receiver", "status"], "worker.review")
        expect(errors, review.get("status") in REVIEW_STATUS, "worker.review.status is invalid")

    worktree = data.get("worktree")
    if worktree is not None:
        expect(errors, isinstance(worktree, dict), "worker.worktree must be an object")
        if isinstance(worktree, dict):
            require_keys(errors, worktree, ["required", "path", "branch", "baseRef"], "worker.worktree")

    return errors


def validate_verdict(data: Any) -> list[str]:
    errors: list[str] = []
    expect(errors, isinstance(data, dict), "verdict root must be an object")
    if not isinstance(data, dict):
        return errors

    require_keys(
        errors,
        data,
        ["id", "project", "gate", "verdict", "reviewer", "evidence", "risks", "requiredFollowups", "stopCondition", "issuedAt"],
        "verdict",
    )
    expect(errors, data.get("verdict") in VERDICT, "verdict.verdict is invalid")
    for key in ["evidence", "risks", "requiredFollowups"]:
        expect(errors, isinstance(data.get(key), list), f"verdict.{key} must be an array")
    expect(errors, isinstance(data.get("evidence"), list) and len(data.get("evidence", [])) > 0, "verdict.evidence must not be empty")

    return errors


def validate_trajectory(data: Any) -> list[str]:
    errors: list[str] = []
    expect(errors, isinstance(data, dict), "trajectory root must be an object")
    if not isinstance(data, dict):
        return errors

    require_keys(
        errors,
        data,
        ["time", "controllerDecision", "agent", "lane", "action", "tool", "files", "evidence", "result", "next"],
        "trajectory",
    )
    for key in ["files", "evidence"]:
        expect(errors, isinstance(data.get(key), list), f"trajectory.{key} must be an array")
    return errors


def infer_kind(path: Path, explicit: str) -> str:
    if explicit != "auto":
        return explicit
    name = path.name.lower()
    if "runtime" in name:
        return "runtime"
    if "worker" in name:
        return "worker"
    if "verdict" in name or "555" in name:
        return "verdict"
    if "trajectory" in name:
        return "trajectory"
    if "request" in name:
        return "request"
    if "event" in name:
        return "event"
    return "loop"


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("json_path", type=Path)
    parser.add_argument("--kind", choices=["auto", "loop", "request", "event", "runtime", "worker", "verdict", "trajectory"], default="auto")
    args = parser.parse_args()

    data = load_json(args.json_path)
    kind = infer_kind(args.json_path, args.kind)
    if kind == "loop":
        errors = validate_loop_state(data)
    elif kind == "request":
        errors = validate_request_packet(data)
    elif kind == "event":
        errors = validate_event(data)
    elif kind == "runtime":
        errors = validate_runtime_state(data)
    elif kind == "worker":
        errors = validate_worker_packet(data)
    elif kind == "verdict":
        errors = validate_verdict(data)
    else:
        errors = validate_trajectory(data)

    if errors:
        for error in errors:
            print(f"ERROR: {error}", file=sys.stderr)
        return 1

    print(f"OK: {args.json_path} ({kind})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
