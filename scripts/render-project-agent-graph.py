#!/usr/bin/env python3
"""Render a Judgment project agent topology JSON file to standalone HTML."""

from __future__ import annotations

import argparse
import datetime as _dt
import html
import json
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any


STATUSES = [
    "planned",
    "ready",
    "running",
    "blocked",
    "review",
    "done",
    "failed",
    "skipped",
]

AGENT_LIFECYCLES = ["planned", "spawned", "visible", "active", "closed", "lost"]
CLAIM_LEVELS = ["observed", "inferred", "planned", "user-reported"]
LIVE_SURFACES = {"codex-side-chat", "thread-link"}
SUMMARY_SURFACES = {"worker-packet", "html-summary", "none", ""}
WEAK_EVIDENCE_WORDS = {
    "done",
    "complete",
    "completed",
    "looks good",
    "seems done",
    "probably",
    "confidence",
    "should work",
}


def as_list(value: Any) -> list[Any]:
    if value is None or value == "":
        return []
    if isinstance(value, list):
        return value
    return [value]


def text(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, (dict, list)):
        return json.dumps(value, ensure_ascii=False, indent=2)
    return str(value)


def esc(value: Any) -> str:
    return html.escape(text(value), quote=True)


def normalize_graph(data: Any) -> dict[str, Any]:
    if isinstance(data, list):
        data = {"nodes": data}
    if not isinstance(data, dict):
        raise ValueError("graph JSON must be an object or a list of nodes")

    nodes = data.get("nodes") or []
    if not isinstance(nodes, list):
        raise ValueError("graph.nodes must be a list")

    normalized = dict(data)
    normalized["nodes"] = [n if isinstance(n, dict) else {"title": str(n)} for n in nodes]
    agents = normalized.get("agents") or []
    if not isinstance(agents, list):
        raise ValueError("graph.agents must be a list when provided")
    normalized["agents"] = [a if isinstance(a, dict) else {"nickname": str(a)} for a in agents]
    return normalized


def validate_nodes(nodes: list[dict[str, Any]], agents: list[dict[str, Any]]) -> list[str]:
    warnings: list[str] = []
    ids: set[str] = set()
    agent_ids = {text(agent.get("agent_id")) for agent in agents if text(agent.get("agent_id"))}

    for index, node in enumerate(nodes, 1):
        node_id = text(node.get("id") or f"node-{index}")
        node_type = text(node.get("type") or "task")
        status = text(node.get("status") or "planned")
        claim_level = text(node.get("claim_level") or "")

        if node_id in ids:
            warnings.append(f"Duplicate node id: {node_id}")
        ids.add(node_id)

        if status not in STATUSES:
            warnings.append(f"{node_id}: unknown status '{status}'")
        if claim_level and claim_level not in CLAIM_LEVELS:
            warnings.append(f"{node_id}: unknown claim_level '{claim_level}'")

        if node_type in {"task", "agent"}:
            for field in ("inputs", "outputs", "depends_on", "test_or_evidence"):
                if not as_list(node.get(field)):
                    warnings.append(f"{node_id}: {node_type} node missing {field}")

        if node_type == "agent" and status in {"running", "review"}:
            if not node.get("agent_id"):
                warnings.append(f"{node_id}: running/review agent node missing agent_id")
            if not node.get("delegation_tool"):
                warnings.append(f"{node_id}: running/review agent node missing delegation_tool")
            if not node.get("delegation_result"):
                warnings.append(f"{node_id}: running/review agent node missing delegation_result")
            if not node.get("conversation_surface"):
                warnings.append(f"{node_id}: running/review agent node missing conversation_surface")
            if not node.get("conversation_open_target") and not node.get("conversation_ref") and node.get("conversation_visible") is not False:
                warnings.append(f"{node_id}: running/review agent node missing conversation open target or explicit conversation_visible=false")

        if node.get("agent_id") and agent_ids and text(node.get("agent_id")) not in agent_ids:
            warnings.append(f"{node_id}: agent_id not listed in graph.agents")

        if text(node.get("conversation_surface")) == "html-summary" and node.get("conversation_visible") is not False:
            warnings.append(f"{node_id}: html-summary conversation should set conversation_visible=false")

        if node_type == "test":
            for field in ("pass_fail_oracle", "owner", "unblocks"):
                if not as_list(node.get(field)):
                    warnings.append(f"{node_id}: test node missing {field}")

        if node_type == "handoff":
            if not node.get("owner"):
                warnings.append(f"{node_id}: handoff node missing sender/owner")
            if not as_list(node.get("unblocks")) and not node.get("handoff_to"):
                warnings.append(f"{node_id}: handoff node missing receiver")
            if not as_list(node.get("outputs")):
                warnings.append(f"{node_id}: handoff node missing expected output")

        if node_type == "blocker":
            if not node.get("next_action"):
                warnings.append(f"{node_id}: blocker node missing next_action")
            if not node.get("blocked_by") and not node.get("blocking_reason") and not node.get("required_human_input"):
                warnings.append(f"{node_id}: blocker node missing blocked_by/blocking_reason/required_human_input")

        if status == "done":
            if not as_list(node.get("artifacts")) and not as_list(node.get("test_or_evidence")):
                warnings.append(f"{node_id}: done node has no evidence artifacts or test result")
            evidence_text = " ".join(text(item).lower() for item in as_list(node.get("test_or_evidence")))
            if evidence_text.strip() in WEAK_EVIDENCE_WORDS:
                warnings.append(f"{node_id}: done node evidence is only confidence language")

        for dep in as_list(node.get("depends_on")):
            if text(dep) and text(dep) not in ids:
                # Later nodes may still define this id; resolve after loop below.
                pass

    all_ids = {text(node.get("id") or f"node-{i}") for i, node in enumerate(nodes, 1)}
    for index, node in enumerate(nodes, 1):
        node_id = text(node.get("id") or f"node-{index}")
        for dep in as_list(node.get("depends_on")):
            dep_id = text(dep)
            if dep_id and dep_id not in all_ids:
                warnings.append(f"{node_id}: depends_on missing node '{dep_id}'")
        for target in as_list(node.get("unblocks")):
            target_id = text(target)
            if target_id and target_id not in all_ids:
                warnings.append(f"{node_id}: unblocks missing node '{target_id}'")

    warnings.extend(validate_dependencies(nodes))
    warnings.extend(validate_agents(nodes, agents))
    warnings.extend(validate_write_scopes(nodes, agents))
    return warnings


def validate_dependencies(nodes: list[dict[str, Any]]) -> list[str]:
    warnings: list[str] = []
    graph: dict[str, list[str]] = {}
    all_ids = [text(node.get("id") or f"node-{i}") for i, node in enumerate(nodes, 1)]
    for index, node in enumerate(nodes, 1):
        node_id = text(node.get("id") or f"node-{index}")
        graph[node_id] = [text(dep) for dep in as_list(node.get("depends_on")) if text(dep) in all_ids]

    visiting: set[str] = set()
    visited: set[str] = set()

    def walk(node_id: str, path: list[str]) -> None:
        if node_id in visiting:
            cycle = path[path.index(node_id) :] + [node_id] if node_id in path else path + [node_id]
            warnings.append(f"dependency cycle detected: {' -> '.join(cycle)}")
            return
        if node_id in visited:
            return
        visiting.add(node_id)
        for dep in graph.get(node_id, []):
            walk(dep, path + [dep])
        visiting.remove(node_id)
        visited.add(node_id)

    for node_id in graph:
        walk(node_id, [node_id])
    return warnings


def validate_agents(nodes: list[dict[str, Any]], agents: list[dict[str, Any]]) -> list[str]:
    warnings: list[str] = []
    node_by_id = {text(node.get("id") or f"node-{i}"): node for i, node in enumerate(nodes, 1)}
    for index, agent in enumerate(agents, 1):
        label = text(agent.get("agent_id") or agent.get("nickname") or f"agent-{index}")
        lifecycle = text(agent.get("agent_lifecycle") or "")
        claim_level = text(agent.get("claim_level") or "")
        surface = text(agent.get("conversation_surface") or "")
        visible = agent.get("conversation_visible")
        status = text(agent.get("status") or "planned")

        if lifecycle and lifecycle not in AGENT_LIFECYCLES:
            warnings.append(f"{label}: unknown agent_lifecycle '{lifecycle}'")
        if claim_level and claim_level not in CLAIM_LEVELS:
            warnings.append(f"{label}: unknown claim_level '{claim_level}'")
        if status in {"running", "review"} and not agent.get("agent_id"):
            warnings.append(f"{label}: running/review agent missing agent_id")
        if lifecycle in {"spawned", "visible", "active"} and not agent.get("delegation_tool"):
            warnings.append(f"{label}: spawned/visible/active agent missing delegation_tool")
        if surface in LIVE_SURFACES and not (agent.get("conversation_open_target") or agent.get("conversation_ref") or agent.get("codex_ui_location")):
            warnings.append(f"{label}: live conversation surface missing open target or UI location")
        if surface in SUMMARY_SURFACES and visible is True:
            warnings.append(f"{label}: summary/non-live conversation surface cannot set conversation_visible=true")

        assigned_nodes = [text(item) for item in as_list(agent.get("assigned_nodes")) if text(item)]
        for assigned in assigned_nodes:
            if assigned not in node_by_id:
                warnings.append(f"{label}: assigned node missing from graph.nodes: {assigned}")
        if status == "done":
            unfinished = [
                assigned
                for assigned in assigned_nodes
                if text(node_by_id.get(assigned, {}).get("status")) in {"running", "blocked", "failed", "review"}
            ]
            if unfinished:
                warnings.append(f"{label}: agent done but assigned nodes are unfinished: {', '.join(unfinished)}")
    return warnings


def validate_write_scopes(nodes: list[dict[str, Any]], agents: list[dict[str, Any]]) -> list[str]:
    warnings: list[str] = []
    node_scopes: list[tuple[str, set[str]]] = []
    agent_scopes: list[tuple[str, set[str]]] = []
    for index, node in enumerate(nodes, 1):
        status = text(node.get("status") or "planned")
        if status not in {"ready", "running", "review"}:
            continue
        scope = {text(item) for item in as_list(node.get("write_scope")) if text(item)}
        if scope:
            node_scopes.append((text(node.get("id") or f"node-{index}"), scope))
    for index, agent in enumerate(agents, 1):
        status = text(agent.get("status") or "planned")
        if status not in {"starting", "running", "review"}:
            continue
        scope = {text(item) for item in as_list(agent.get("write_scope")) if text(item)}
        if scope:
            agent_scopes.append((text(agent.get("agent_id") or agent.get("nickname") or f"agent-{index}"), scope))

    has_integration = any(
        "integration" in text(node.get("lane")).lower()
        or "git" in text(node.get("lane")).lower()
        or "integration" in text(node.get("title")).lower()
        for node in nodes
    )
    for scope_group in (node_scopes, agent_scopes):
        for i, (left_name, left_scope) in enumerate(scope_group):
            for right_name, right_scope in scope_group[i + 1 :]:
                overlap = left_scope & right_scope
                if overlap and not has_integration:
                    warnings.append(
                        f"overlapping write_scope without Git/Integration node: {left_name} and {right_name} share {', '.join(sorted(overlap))}"
                    )
    return warnings


def infer_agents(nodes: list[dict[str, Any]], agents: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Return graph agents plus lightweight inferred agents from agent nodes."""
    if agents:
        return agents
    inferred: list[dict[str, Any]] = []
    for index, node in enumerate(nodes, 1):
        if text(node.get("type") or "task") != "agent":
            continue
        node_id = text(node.get("id") or f"node-{index}")
        inferred.append(
            {
                "agent_id": node.get("agent_id"),
                "nickname": node.get("agent_nickname") or node.get("owner") or node.get("title") or node_id,
                "role": node.get("lane") or node.get("type"),
                "status": node.get("status") or "planned",
                "assigned_nodes": [node_id],
                "conversation_surface": node.get("conversation_surface") or "html-summary",
                "conversation_visible": node.get("conversation_visible") if "conversation_visible" in node else False,
                "conversation_ref": node.get("conversation_ref"),
                "conversation_open_target": node.get("conversation_open_target"),
                "last_message": node.get("last_agent_message"),
                "last_synced_at": node.get("last_synced_at"),
                "next_input": node.get("next_action"),
                "evidence": node.get("test_or_evidence"),
            }
        )
    return inferred


def render_list(items: Any) -> str:
    values = [esc(item) for item in as_list(items) if text(item)]
    if not values:
        return '<span class="muted">无</span>'
    return "<ul>" + "".join(f"<li>{value}</li>" for value in values) + "</ul>"


def zh_status(status: Any) -> str:
    return {
        "planned": "计划中",
        "ready": "就绪",
        "running": "运行中",
        "blocked": "阻塞",
        "review": "待审查",
        "done": "完成",
        "failed": "失败",
        "skipped": "跳过",
        "starting": "启动中",
        "closed": "已关闭",
    }.get(text(status), text(status) or "未知")


def zh_type(node_type: Any) -> str:
    return {
        "agent": "代理",
        "task": "任务",
        "test": "测试",
        "evidence": "证据",
        "decision": "决策",
        "handoff": "交接",
        "blocker": "阻塞",
        "artifact": "产物",
        "release": "发布",
    }.get(text(node_type), text(node_type) or "节点")


def build_stream_events(nodes: list[dict[str, Any]], agents: list[dict[str, Any]]) -> list[dict[str, str]]:
    events: list[dict[str, str]] = []
    for agent in agents:
        nickname = text(agent.get("nickname") or agent.get("agent_id") or "未命名代理")
        surface = text(agent.get("conversation_surface") or "none")
        events.append(
            {
                "kind": "agent",
                "title": f"Agent 状态同步：{nickname}",
                "body": f"{nickname} 当前为 {zh_status(agent.get('status'))}，对话面：{surface}，生命周期：{agent.get('agent_lifecycle') or '未记录'}。",
            }
        )
        if agent.get("last_message"):
            events.append(
                {
                    "kind": "message",
                    "title": f"{nickname} 最新消息",
                    "body": text(agent.get("last_message")),
                }
            )
    for node in nodes:
        node_id = text(node.get("id") or node.get("title") or "node")
        title = text(node.get("title") or node_id)
        events.append(
            {
                "kind": text(node.get("type") or "task"),
                "title": f"节点推进：{title}",
                "body": f"{node_id} 处于 {zh_status(node.get('status'))}；验证口径：{', '.join(text(x) for x in as_list(node.get('test_or_evidence')) if text(x)) or '未设置'}。",
            }
        )
        if node.get("next_action"):
            events.append(
                {
                    "kind": "next",
                    "title": f"下一步：{title}",
                    "body": text(node.get("next_action")),
                }
            )
    return events


def render_node(node: dict[str, Any], index: int) -> str:
    node_id = node.get("id") or f"node-{index}"
    status = text(node.get("status") or "planned")
    node_type = text(node.get("type") or "task")
    title = node.get("title") or node_id
    fields = [
        ("负责人", node.get("owner")),
        ("代理", node.get("agent_nickname") or node.get("agent_id")),
        ("对话面", node.get("conversation_surface") or node.get("conversation_ref")),
        ("gate", node.get("gate")),
        ("依赖", render_list(node.get("depends_on"))),
        ("解锁", render_list(node.get("unblocks"))),
        ("测试/证据", render_list(node.get("test_or_evidence"))),
        ("验收口径", node.get("pass_fail_oracle")),
        ("下一步", node.get("next_action")),
        ("产物", render_list(node.get("artifacts"))),
    ]

    rows = []
    for label, value in fields:
        if isinstance(value, str) and value.startswith("<"):
            rendered = value
        else:
            rendered = esc(value) if text(value) else '<span class="muted">none</span>'
        rows.append(f"<dt>{esc(label)}</dt><dd>{rendered}</dd>")

    return f"""
    <article class="node status-{esc(status)} type-{esc(node_type)}">
      <header>
        <span class="badge">{esc(zh_status(status))}</span>
        <span class="type">{esc(zh_type(node_type))}</span>
      </header>
      <h3>{esc(title)}</h3>
      <p class="id">{esc(node_id)}</p>
      <dl>{''.join(rows)}</dl>
    </article>
    """


def render_agent(agent: dict[str, Any], index: int) -> str:
    status = text(agent.get("status") or "planned")
    nickname = agent.get("nickname") or agent.get("agent_id") or f"agent-{index}"
    surface = agent.get("conversation_surface") or "none"
    ref = agent.get("conversation_open_target") or agent.get("conversation_ref")
    lifecycle = agent.get("agent_lifecycle")
    claim_level = agent.get("claim_level")
    visible = agent.get("conversation_visible")
    synced = agent.get("last_synced_at") or agent.get("last_seen_at")
    last_message = agent.get("last_message")
    next_input = agent.get("next_input")
    evidence = agent.get("evidence")
    assigned = agent.get("assigned_nodes")
    role = agent.get("role")
    ref_html = (
        f'<a href="{esc(ref)}">{esc(ref)}</a>'
        if text(ref).startswith(("http://", "https://", "#"))
        else (esc(ref) if text(ref) else '<span class="muted">未绑定</span>')
    )
    return f"""
    <article class="agent-card status-{esc(status)}">
      <header>
        <span class="badge">{esc(zh_status(status))}</span>
        <span class="type">{esc(surface)}</span>
      </header>
      <h3>{esc(nickname)}</h3>
      <p class="muted">{esc(role or agent.get("agent_id") or "unassigned")}</p>
      <dl>
        <dt>节点</dt><dd>{render_list(assigned)}</dd>
        <dt>生命周期</dt><dd>{esc(lifecycle) if text(lifecycle) else '<span class="muted">未记录</span>'}</dd>
        <dt>声明级别</dt><dd>{esc(claim_level) if text(claim_level) else '<span class="muted">未记录</span>'}</dd>
        <dt>可见</dt><dd>{esc(visible) if visible is not None else '<span class="muted">未知</span>'}</dd>
        <dt>打开</dt><dd>{ref_html}</dd>
        <dt>同步</dt><dd>{esc(synced) if text(synced) else '<span class="muted">未同步</span>'}</dd>
        <dt>最新</dt><dd>{esc(last_message) if text(last_message) else '<span class="muted">无</span>'}</dd>
        <dt>下一步</dt><dd>{esc(next_input) if text(next_input) else '<span class="muted">无</span>'}</dd>
        <dt>证据</dt><dd>{render_list(evidence)}</dd>
      </dl>
    </article>
    """


def build_html(graph: dict[str, Any], source_path: Path, warnings: list[str]) -> str:
    nodes: list[dict[str, Any]] = graph["nodes"]
    agents = infer_agents(nodes, graph.get("agents") or [])
    title = graph.get("project") or graph.get("title") or "Project Agent Graph"
    gate = graph.get("current_gate") or graph.get("gate") or "none"
    verdict = graph.get("controller_verdict") or graph.get("verdict") or "not set"
    generated_at = _dt.datetime.now().astimezone().isoformat(timespec="seconds")

    by_status = Counter(text(node.get("status") or "planned") for node in nodes)
    by_type = Counter(text(node.get("type") or "task") for node in nodes)
    by_agent_status = Counter(text(agent.get("status") or "planned") for agent in agents)
    by_lane: dict[str, list[tuple[int, dict[str, Any]]]] = defaultdict(list)
    for index, node in enumerate(nodes, 1):
        by_lane[text(node.get("lane") or "unassigned")].append((index, node))

    summary_cards = "".join(
        f'<div class="metric"><span>{esc(zh_status(key))}</span><strong>{count}</strong></div>'
        for key, count in sorted(by_status.items())
    )
    type_cards = "".join(
        f'<div class="metric small"><span>{esc(zh_type(key))}</span><strong>{count}</strong></div>'
        for key, count in sorted(by_type.items())
    )
    agent_cards = "".join(render_agent(agent, index) for index, agent in enumerate(agents, 1))
    agent_summary = "".join(
        f'<div class="metric small"><span>{esc(zh_status(key))}</span><strong>{count}</strong></div>'
        for key, count in sorted(by_agent_status.items())
    )
    if not agent_cards:
        agent_cards = '<p class="muted">还没有记录子代理。计划包不能被报告为运行中。</p>'

    lane_html = []
    for lane, lane_nodes in sorted(by_lane.items()):
        lane_html.append(
            f"""
            <section class="lane">
              <h2>{esc(lane)}</h2>
              {''.join(render_node(node, index) for index, node in lane_nodes)}
            </section>
            """
        )

    warning_html = (
        "<ul>" + "".join(f"<li>{esc(warning)}</li>" for warning in warnings) + "</ul>"
        if warnings
        else '<p class="ok">没有拓扑警告。</p>'
    )
    stream_events = build_stream_events(nodes, agents)
    stream_html = "".join(
        f"""
        <article class="stream-event" style="animation-delay:{min(index * 0.18, 4.5):.2f}s">
          <span class="stream-dot"></span>
          <div>
            <h3>{esc(event["title"])}</h3>
            <p>{esc(event["body"])}</p>
          </div>
        </article>
        """
        for index, event in enumerate(stream_events)
    )
    raw_json = esc(json.dumps(graph, ensure_ascii=False, indent=2))

    return f"""<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{esc(title)}</title>
  <style>
    :root {{
      color-scheme: light;
      --bg: #f6f7f9;
      --panel: #ffffff;
      --text: #1f2933;
      --muted: #6b7280;
      --line: #d8dee6;
      --accent: #2563eb;
      --ok: #15803d;
      --warn: #b45309;
      --bad: #b91c1c;
      --review: #7c3aed;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }}
    * {{ box-sizing: border-box; }}
    body {{ margin: 0; background: var(--bg); color: var(--text); }}
    main {{ max-width: 1680px; margin: 0 auto; padding: 28px; }}
    header.top {{ display: flex; gap: 20px; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }}
    h1 {{ margin: 0 0 8px; font-size: 30px; letter-spacing: 0; }}
    h2 {{ font-size: 18px; margin: 0 0 14px; }}
    h3 {{ font-size: 16px; margin: 10px 0 2px; }}
    p {{ margin: 4px 0; }}
    .muted, .id {{ color: var(--muted); }}
    .grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin: 16px 0; }}
    .metric {{ background: var(--panel); border: 1px solid var(--line); border-radius: 8px; padding: 12px; }}
    .metric span {{ color: var(--muted); display: block; font-size: 12px; }}
    .metric strong {{ font-size: 22px; }}
    .metric.small strong {{ font-size: 18px; }}
    .section {{ background: var(--panel); border: 1px solid var(--line); border-radius: 8px; padding: 16px; margin: 16px 0; }}
    .cockpit {{ display: grid; grid-template-columns: minmax(0, 1fr) 360px; gap: 16px; align-items: start; }}
    .lanes {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px; align-items: start; }}
    .lane {{ background: #eef2f7; border: 1px solid var(--line); border-radius: 8px; padding: 12px; }}
    .agent-rail {{ position: sticky; top: 16px; max-height: calc(100vh - 32px); overflow: auto; background: var(--panel); border: 1px solid var(--line); border-radius: 8px; padding: 14px; }}
    .node, .agent-card {{ background: var(--panel); border: 1px solid var(--line); border-left: 5px solid var(--accent); border-radius: 8px; padding: 12px; margin: 10px 0; }}
    .agent-card {{ background: #fbfcfe; }}
    .node header, .agent-card header {{ display: flex; gap: 8px; align-items: center; }}
    .stream {{ display: grid; gap: 10px; }}
    .stream-event {{ display: grid; grid-template-columns: 16px 1fr; gap: 10px; opacity: 0; transform: translateY(8px); animation: stream-in .35s ease-out forwards; }}
    .stream-event h3 {{ margin: 0 0 4px; font-size: 14px; }}
    .stream-event p {{ color: var(--muted); font-size: 13px; }}
    .stream-dot {{ width: 10px; height: 10px; margin-top: 5px; border-radius: 999px; background: var(--accent); box-shadow: 0 0 0 4px #dbeafe; }}
    .badge, .type {{ border-radius: 999px; padding: 3px 8px; font-size: 12px; background: #e5e7eb; color: #111827; }}
    .type {{ background: #dbeafe; color: #1e40af; }}
    .status-done {{ border-left-color: var(--ok); }}
    .status-blocked, .status-failed {{ border-left-color: var(--bad); }}
    .status-review {{ border-left-color: var(--review); }}
    .status-running {{ border-left-color: var(--warn); }}
    dl {{ display: grid; grid-template-columns: 96px 1fr; gap: 8px; margin: 12px 0 0; }}
    dt {{ color: var(--muted); font-size: 12px; }}
    dd {{ margin: 0; min-width: 0; overflow-wrap: anywhere; }}
    ul {{ margin: 0; padding-left: 18px; }}
    pre {{ overflow: auto; background: #111827; color: #f9fafb; padding: 16px; border-radius: 8px; font-size: 12px; }}
    .ok {{ color: var(--ok); }}
    @keyframes stream-in {{ to {{ opacity: 1; transform: translateY(0); }} }}
    @media (max-width: 980px) {{ .cockpit {{ grid-template-columns: 1fr; }} .agent-rail {{ position: static; max-height: none; }} }}
    @media (max-width: 720px) {{ main {{ padding: 16px; }} header.top {{ display: block; }} dl {{ grid-template-columns: 1fr; }} }}
  </style>
</head>
<body>
  <main>
    <header class="top">
      <div>
        <h1>{esc(title)}</h1>
        <p class="muted">数据源：{esc(source_path)}</p>
      </div>
      <div>
        <p><strong>当前 Gate：</strong>{esc(gate)}</p>
        <p><strong>总控结论：</strong>{esc(verdict)}</p>
        <p><strong>渲染时间：</strong>{esc(generated_at)}</p>
      </div>
    </header>
    <section class="section">
      <h2>项目状态</h2>
      <div class="grid">{summary_cards}</div>
      <div class="grid">{type_cards}</div>
    </section>
    <div class="cockpit">
      <div>
        <section class="section">
          <h2>镜像事件流</h2>
          <p class="muted">这里按顺序镜像子代理、节点、测试和下一步。真实对话仍以 Codex 侧聊或线程为准。</p>
          <div class="stream">{stream_html}</div>
        </section>
        <section class="section">
          <h2>拓扑警告</h2>
          {warning_html}
        </section>
        <section class="lanes">
          {''.join(lane_html)}
        </section>
      </div>
      <aside class="agent-rail">
        <h2>子代理对话</h2>
        <p class="muted">真实 Codex 侧聊或线程是主对话面。这里展示当前已知状态、最后消息、下一步和证据。</p>
        <div class="grid">{agent_summary}</div>
        {agent_cards}
      </aside>
    </div>
    <section class="section">
      <h2>原始 Graph JSON</h2>
      <pre>{raw_json}</pre>
    </section>
  </main>
</body>
</html>
"""

STATUS_LABELS_V2 = {
    "planned": "计划中",
    "ready": "就绪",
    "running": "运行中",
    "blocked": "阻塞",
    "review": "待审查",
    "done": "完成",
    "failed": "失败",
    "skipped": "跳过",
    "starting": "启动中",
    "closed": "已关闭",
}

TYPE_LABELS_V2 = {
    "agent": "代理",
    "task": "任务",
    "test": "测试",
    "evidence": "证据",
    "decision": "决策",
    "handoff": "交接",
    "blocker": "阻塞",
    "artifact": "产物",
    "release": "发布",
}

SURFACE_LABELS_V2 = {
    "codex-side-chat": "Codex 侧聊",
    "thread-link": "线程链接",
    "worker-packet": "任务包",
    "html-summary": "HTML 镜像",
    "none": "未绑定",
    "": "未绑定",
}


def label_status_v2(status: Any) -> str:
    key = text(status)
    return STATUS_LABELS_V2.get(key, key or "未知")


def label_type_v2(node_type: Any) -> str:
    key = text(node_type)
    return TYPE_LABELS_V2.get(key, key or "节点")


def label_surface_v2(surface: Any) -> str:
    key = text(surface)
    return SURFACE_LABELS_V2.get(key, key or "未绑定")


def css_token_v2(value: Any) -> str:
    token = text(value).lower()
    chars = [char if char.isalnum() else "-" for char in token]
    return "".join(chars).strip("-") or "none"


def bool_label_v2(value: Any) -> str:
    if value is True:
        return "可见"
    if value is False:
        return "不可见"
    return "未知"


def maybe_text_v2(value: Any, empty: str = "未记录") -> str:
    rendered = text(value)
    return esc(rendered) if rendered else f'<span class="muted">{esc(empty)}</span>'


def render_chips_v2(items: Any, empty: str = "无") -> str:
    values = [text(item) for item in as_list(items) if text(item)]
    if not values:
        return f'<span class="muted">{esc(empty)}</span>'
    return "".join(f'<span class="chip">{esc(item)}</span>' for item in values)


def render_bullets_v2(items: Any, empty: str = "无") -> str:
    values = [text(item) for item in as_list(items) if text(item)]
    if not values:
        return f'<span class="muted">{esc(empty)}</span>'
    return "<ul>" + "".join(f"<li>{esc(item)}</li>" for item in values) + "</ul>"


def render_compact_meta_v2(pairs: list[tuple[str, Any]], empty: str = "未记录") -> str:
    rows: list[str] = []
    for label, value in pairs:
        if isinstance(value, str) and value.startswith("<"):
            rendered = value
        else:
            rendered = maybe_text_v2(value, empty)
        rows.append(
            f"""
            <div class="meta-item">
              <span>{esc(label)}</span>
              <strong>{rendered}</strong>
            </div>
            """
        )
    return "".join(rows)


def build_stream_events_v2(nodes: list[dict[str, Any]], agents: list[dict[str, Any]]) -> list[dict[str, str]]:
    events: list[dict[str, str]] = []
    for agent in agents:
        nickname = text(agent.get("nickname") or agent.get("agent_id") or "未命名代理")
        surface = label_surface_v2(agent.get("conversation_surface") or "none")
        events.append(
            {
                "kind": "agent",
                "title": f"子代理同步 - {nickname}",
                "body": (
                    f"状态 {label_status_v2(agent.get('status'))}，对话面 {surface}，"
                    f"生命周期 {text(agent.get('agent_lifecycle')) or '未记录'}。"
                ),
            }
        )
        if agent.get("last_message"):
            events.append(
                {
                    "kind": "message",
                    "title": f"{nickname} 最新消息",
                    "body": text(agent.get("last_message")),
                }
            )

    for node in nodes:
        node_id = text(node.get("id") or node.get("title") or "node")
        title = text(node.get("title") or node_id)
        evidence = ", ".join(text(item) for item in as_list(node.get("test_or_evidence")) if text(item))
        events.append(
            {
                "kind": text(node.get("type") or "task"),
                "title": f"节点推进 - {title}",
                "body": f"{node_id} 当前为 {label_status_v2(node.get('status'))}，验证口径：{evidence or '未设置'}。",
            }
        )
        if node.get("next_action"):
            events.append(
                {
                    "kind": "next",
                    "title": f"下一步 - {title}",
                    "body": text(node.get("next_action")),
                }
            )
    return events


def render_node_v2(node: dict[str, Any], index: int) -> str:
    node_id = text(node.get("id") or f"node-{index}")
    status = text(node.get("status") or "planned")
    node_type = text(node.get("type") or "task")
    title = text(node.get("title") or node_id)
    lane = text(node.get("lane") or "未分组")
    agent = node.get("agent_nickname") or node.get("agent_id") or node.get("owner")
    surface = node.get("conversation_surface") or node.get("conversation_ref")
    card_class = f"status-{css_token_v2(status)} type-{css_token_v2(node_type)}"

    meta = render_compact_meta_v2(
        [
            ("负责人", node.get("owner")),
            ("代理", agent),
            ("对话面", label_surface_v2(surface)),
            ("Gate", node.get("gate")),
        ],
        empty="未绑定",
    )
    handoff = render_compact_meta_v2(
        [
            ("依赖", render_chips_v2(node.get("depends_on"))),
            ("解锁", render_chips_v2(node.get("unblocks"))),
            ("测试/证据", render_bullets_v2(node.get("test_or_evidence"))),
            ("产物", render_bullets_v2(node.get("artifacts"))),
        ]
    )

    return f"""
    <article class="node-card {card_class}">
      <div class="node-topline">
        <span class="node-index">{index:02d}</span>
        <div class="node-title">
          <p class="eyebrow">{esc(lane)} - {esc(node_id)}</p>
          <h3>{esc(title)}</h3>
        </div>
        <span class="status-pill status-pill-{css_token_v2(status)}">{esc(label_status_v2(status))}</span>
      </div>
      <div class="node-tags">
        <span class="type-pill">{esc(label_type_v2(node_type))}</span>
        <span class="surface-pill">{esc(label_surface_v2(surface))}</span>
      </div>
      <div class="node-meta">{meta}</div>
      <div class="oracle">
        <span>验收口径</span>
        <p>{maybe_text_v2(node.get("pass_fail_oracle"))}</p>
      </div>
      <div class="handoff-grid">{handoff}</div>
      <div class="next-action">
        <span>下一步</span>
        <p>{maybe_text_v2(node.get("next_action"), "等待上游节点")}</p>
      </div>
    </article>
    """


def render_agent_v2(agent: dict[str, Any], index: int) -> str:
    status = text(agent.get("status") or "planned")
    nickname = text(agent.get("nickname") or agent.get("agent_id") or f"agent-{index}")
    role = text(agent.get("role") or agent.get("agent_id") or "未分配角色")
    surface = text(agent.get("conversation_surface") or "none")
    ref = text(agent.get("conversation_open_target") or agent.get("conversation_ref"))
    visible = bool_label_v2(agent.get("conversation_visible"))
    lifecycle = text(agent.get("agent_lifecycle") or "未记录")
    claim_level = text(agent.get("claim_level") or "未记录")
    synced = text(agent.get("last_synced_at") or agent.get("last_seen_at") or "")
    last_message = text(agent.get("last_message") or "暂无消息")
    next_input = text(agent.get("next_input") or "等待控制器分派")
    avatar = esc(nickname[:1].upper() if nickname else str(index))
    ref_html = (
        f'<a href="{esc(ref)}">{esc(ref)}</a>'
        if ref.startswith(("http://", "https://", "#"))
        else maybe_text_v2(ref, "未绑定")
    )

    return f"""
    <article class="agent-dialog status-{css_token_v2(status)}">
      <header class="agent-head">
        <span class="avatar">{avatar}</span>
        <div>
          <h3>{esc(nickname)}</h3>
          <p>{esc(role)}</p>
        </div>
        <span class="status-dot status-dot-{css_token_v2(status)}"></span>
      </header>
      <div class="chat-bubble">
        <span>最新消息</span>
        <p>{esc(last_message)}</p>
      </div>
      <dl class="agent-facts">
        <dt>状态</dt><dd>{esc(label_status_v2(status))}</dd>
        <dt>对话面</dt><dd>{esc(label_surface_v2(surface))}</dd>
        <dt>可见性</dt><dd>{esc(visible)}</dd>
        <dt>生命周期</dt><dd>{esc(lifecycle)}</dd>
        <dt>声明级别</dt><dd>{esc(claim_level)}</dd>
        <dt>同步时间</dt><dd>{maybe_text_v2(synced, "未同步")}</dd>
        <dt>打开位置</dt><dd>{ref_html}</dd>
      </dl>
      <div class="agent-block">
        <span>负责节点</span>
        <div>{render_chips_v2(agent.get("assigned_nodes"))}</div>
      </div>
      <div class="agent-block">
        <span>下一输入</span>
        <p>{esc(next_input)}</p>
      </div>
      <div class="agent-block">
        <span>证据</span>
        <div>{render_bullets_v2(agent.get("evidence"))}</div>
      </div>
    </article>
    """


def build_html_v2(graph: dict[str, Any], source_path: Path, warnings: list[str]) -> str:
    nodes: list[dict[str, Any]] = graph["nodes"]
    agents = infer_agents(nodes, graph.get("agents") or [])
    title = graph.get("project") or graph.get("title") or "Project Agent Graph"
    gate = graph.get("current_gate") or graph.get("gate") or "none"
    verdict = graph.get("controller_verdict") or graph.get("verdict") or "not set"
    generated_at = _dt.datetime.now().astimezone().isoformat(timespec="seconds")

    by_status = Counter(text(node.get("status") or "planned") for node in nodes)
    by_type = Counter(text(node.get("type") or "task") for node in nodes)
    by_agent_status = Counter(text(agent.get("status") or "planned") for agent in agents)
    by_lane: dict[str, list[tuple[int, dict[str, Any]]]] = defaultdict(list)
    for index, node in enumerate(nodes, 1):
        by_lane[text(node.get("lane") or "未分组")].append((index, node))

    total_evidence = sum(1 for node in nodes if text(node.get("type")) in {"test", "evidence"})
    running_agents = sum(1 for agent in agents if text(agent.get("status")) in {"running", "active", "review"})
    visible_agents = sum(1 for agent in agents if agent.get("conversation_visible") is True)

    metric_cards = "".join(
        f"""
        <article class="metric-card metric-{css_token_v2(key)}">
          <span>{esc(label_status_v2(key))}</span>
          <strong>{count}</strong>
        </article>
        """
        for key, count in sorted(by_status.items())
    )
    type_cards = "".join(
        f'<span class="summary-chip">{esc(label_type_v2(key))}<strong>{count}</strong></span>'
        for key, count in sorted(by_type.items())
    )
    lane_nav = "".join(
        f"""
        <a class="lane-link" href="#lane-{css_token_v2(lane)}">
          <span>{esc(lane)}</span>
          <strong>{len(lane_nodes)}</strong>
        </a>
        """
        for lane, lane_nodes in sorted(by_lane.items())
    )
    lane_html = "".join(
        f"""
        <section class="lane-column" id="lane-{css_token_v2(lane)}">
          <div class="lane-heading">
            <div>
              <p class="eyebrow">Lane</p>
              <h2>{esc(lane)}</h2>
            </div>
            <span>{len(lane_nodes)} 个节点</span>
          </div>
          <div class="lane-list">
            {''.join(render_node_v2(node, index) for index, node in lane_nodes)}
          </div>
        </section>
        """
        for lane, lane_nodes in sorted(by_lane.items())
    )
    agent_cards = "".join(render_agent_v2(agent, index) for index, agent in enumerate(agents, 1))
    if not agent_cards:
        agent_cards = '<p class="empty-state">还没有记录子代理。计划包不能被报告为运行中。</p>'

    agent_summary = "".join(
        f'<span class="summary-chip">{esc(label_status_v2(key))}<strong>{count}</strong></span>'
        for key, count in sorted(by_agent_status.items())
    )
    warning_html = (
        "<ul>" + "".join(f"<li>{esc(warning)}</li>" for warning in warnings) + "</ul>"
        if warnings
        else '<p class="success-text">拓扑校验通过，没有发现结构警告。</p>'
    )
    stream_events = build_stream_events_v2(nodes, agents)[:22]
    stream_html = "".join(
        f"""
        <article class="stream-line" style="animation-delay:{min(index * 0.14, 3.0):.2f}s">
          <span class="stream-time">T+{index:02d}</span>
          <div>
            <h3>{esc(event["title"])}</h3>
            <p>{esc(event["body"])}</p>
          </div>
        </article>
        """
        for index, event in enumerate(stream_events, 1)
    )
    raw_json = esc(json.dumps(graph, ensure_ascii=False, indent=2))

    return f"""<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{esc(title)}</title>
  <style>
    :root {{
      color-scheme: light;
      --page: #f4f7fb;
      --surface: #ffffff;
      --surface-2: #eef3f8;
      --text: #17212f;
      --muted: #64748b;
      --line: #d8e0ea;
      --blue: #2563eb;
      --teal: #0f766e;
      --green: #16833a;
      --amber: #c46a00;
      --red: #c0342b;
      --violet: #6d5bd0;
      --shadow: 0 18px 48px rgba(23, 33, 47, 0.08);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }}
    * {{ box-sizing: border-box; }}
    html {{ scroll-behavior: smooth; }}
    body {{ margin: 0; background: var(--page); color: var(--text); }}
    a {{ color: inherit; }}
    p, h1, h2, h3 {{ margin: 0; }}
    .app-shell {{ min-height: 100vh; }}
    .top-band {{
      background: linear-gradient(135deg, #132238 0%, #203a54 48%, #0f766e 100%);
      color: #fff;
      padding: 24px 28px 58px;
    }}
    .top-inner {{ max-width: 1760px; margin: 0 auto; display: grid; grid-template-columns: minmax(0, 1fr) 430px; gap: 24px; align-items: end; }}
    .eyebrow {{ color: var(--muted); font-size: 12px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }}
    .top-band .eyebrow {{ color: #b8d7e4; }}
    h1 {{ margin-top: 8px; font-size: clamp(28px, 3vw, 44px); line-height: 1.06; letter-spacing: 0; }}
    .hero-copy > p {{ max-width: 820px; margin-top: 12px; color: #d8e6ee; font-size: 15px; line-height: 1.7; }}
    .run-card {{
      border: 1px solid rgba(255,255,255,.18);
      background: rgba(255,255,255,.08);
      border-radius: 8px;
      padding: 18px;
      backdrop-filter: blur(10px);
    }}
    .run-card dl {{ display: grid; grid-template-columns: 98px 1fr; gap: 10px 14px; margin: 0; }}
    .run-card dt {{ color: #b8d7e4; font-size: 12px; }}
    .run-card dd {{ margin: 0; overflow-wrap: anywhere; }}
    .dashboard {{ max-width: 1760px; margin: -34px auto 0; padding: 0 28px 36px; }}
    .metric-strip {{ display: grid; grid-template-columns: repeat(4, minmax(120px, 1fr)); gap: 12px; margin-bottom: 18px; }}
    .metric-card {{
      min-height: 88px;
      background: var(--surface);
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 14px 16px;
      box-shadow: var(--shadow);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      border-top: 4px solid var(--blue);
    }}
    .metric-card span {{ color: var(--muted); font-size: 13px; }}
    .metric-card strong {{ font-size: 30px; line-height: 1; }}
    .metric-done {{ border-top-color: var(--green); }}
    .metric-running, .metric-ready {{ border-top-color: var(--amber); }}
    .metric-blocked, .metric-failed {{ border-top-color: var(--red); }}
    .workspace {{ display: grid; grid-template-columns: 220px minmax(0, 1fr) 390px; gap: 18px; align-items: start; }}
    .left-rail, .agent-rail {{
      position: sticky;
      top: 18px;
      max-height: calc(100vh - 36px);
      overflow: auto;
    }}
    .rail-panel, .agent-rail {{
      background: rgba(255,255,255,.92);
      border: 1px solid var(--line);
      border-radius: 8px;
      box-shadow: var(--shadow);
    }}
    .rail-panel {{ padding: 14px; }}
    .rail-panel + .rail-panel {{ margin-top: 12px; }}
    .rail-panel h2, .agent-rail h2 {{ font-size: 16px; margin-bottom: 10px; }}
    .summary-stack {{ display: grid; gap: 8px; }}
    .summary-chip {{
      display: inline-flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      border: 1px solid var(--line);
      background: #fff;
      border-radius: 999px;
      padding: 6px 10px;
      color: var(--muted);
      font-size: 12px;
    }}
    .summary-chip strong {{ color: var(--text); }}
    .lane-links {{ display: grid; gap: 8px; }}
    .lane-link {{
      display: flex;
      justify-content: space-between;
      gap: 10px;
      text-decoration: none;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: #fff;
      padding: 9px 10px;
      font-size: 13px;
    }}
    .main-flow {{ display: grid; gap: 18px; }}
    .stream-panel {{
      background: #101827;
      color: #eef6ff;
      border-radius: 8px;
      padding: 18px;
      box-shadow: var(--shadow);
      overflow: hidden;
    }}
    .section-head {{ display: flex; justify-content: space-between; gap: 14px; align-items: end; margin-bottom: 14px; }}
    .section-head h2 {{ font-size: 18px; }}
    .section-head p {{ color: var(--muted); font-size: 13px; line-height: 1.5; }}
    .stream-panel .section-head p {{ color: #9fb2c8; }}
    .stream-list {{ display: grid; gap: 10px; }}
    .stream-line {{
      display: grid;
      grid-template-columns: 52px 1fr;
      gap: 12px;
      padding: 10px 0;
      border-top: 1px solid rgba(255,255,255,.08);
      opacity: 0;
      transform: translateY(8px);
      animation: stream-in .35s ease-out forwards;
    }}
    .stream-time {{ color: #7dd3fc; font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-size: 12px; padding-top: 2px; }}
    .stream-line h3 {{ font-size: 14px; margin-bottom: 4px; }}
    .stream-line p {{ color: #bfd0e2; font-size: 13px; line-height: 1.5; }}
    .warning-panel {{
      border: 1px solid var(--line);
      border-left: 4px solid var(--teal);
      background: #fff;
      border-radius: 8px;
      padding: 14px 16px;
    }}
    .success-text {{ color: var(--green); font-weight: 650; }}
    .lanes-grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(310px, 1fr)); gap: 14px; align-items: start; }}
    .lane-column {{
      background: var(--surface-2);
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 12px;
      min-width: 0;
    }}
    .lane-heading {{ display: flex; justify-content: space-between; gap: 10px; align-items: center; margin-bottom: 10px; }}
    .lane-heading h2 {{ font-size: 18px; }}
    .lane-heading > span {{ color: var(--muted); font-size: 12px; }}
    .lane-list {{ display: grid; gap: 10px; }}
    .node-card {{
      background: #fff;
      border: 1px solid var(--line);
      border-left: 5px solid var(--blue);
      border-radius: 8px;
      padding: 14px;
      min-width: 0;
    }}
    .node-card.status-done {{ border-left-color: var(--green); }}
    .node-card.status-running, .node-card.status-ready {{ border-left-color: var(--amber); }}
    .node-card.status-blocked, .node-card.status-failed {{ border-left-color: var(--red); }}
    .node-card.status-review {{ border-left-color: var(--violet); }}
    .node-topline {{ display: grid; grid-template-columns: 34px minmax(0, 1fr) auto; gap: 10px; align-items: start; }}
    .node-index {{
      width: 30px;
      height: 30px;
      display: grid;
      place-items: center;
      border-radius: 8px;
      background: #e7eef8;
      color: #21405f;
      font-size: 12px;
      font-weight: 800;
    }}
    .node-title h3 {{ font-size: 16px; line-height: 1.25; margin-top: 2px; }}
    .status-pill, .type-pill, .surface-pill {{
      display: inline-flex;
      align-items: center;
      border-radius: 999px;
      padding: 4px 8px;
      font-size: 12px;
      font-weight: 700;
      white-space: nowrap;
    }}
    .status-pill {{ background: #e8eff8; color: #21405f; }}
    .status-pill-done {{ background: #dcfce7; color: #166534; }}
    .status-pill-running, .status-pill-ready {{ background: #fff3cf; color: #854d0e; }}
    .status-pill-blocked, .status-pill-failed {{ background: #fee2e2; color: #991b1b; }}
    .type-pill {{ background: #e0f2fe; color: #075985; }}
    .surface-pill {{ background: #f0fdfa; color: #115e59; }}
    .node-tags {{ display: flex; flex-wrap: wrap; gap: 6px; margin: 10px 0; }}
    .node-meta, .handoff-grid {{ display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }}
    .meta-item {{
      min-width: 0;
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 8px;
      background: #fbfdff;
    }}
    .meta-item span, .oracle > span, .next-action > span, .agent-block > span {{ display: block; color: var(--muted); font-size: 12px; margin-bottom: 4px; }}
    .meta-item strong {{ display: block; font-size: 13px; font-weight: 650; overflow-wrap: anywhere; }}
    .oracle, .next-action {{
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px solid var(--line);
    }}
    .oracle p, .next-action p, .agent-block p {{ color: #334155; font-size: 13px; line-height: 1.55; overflow-wrap: anywhere; }}
    .handoff-grid {{ margin-top: 10px; }}
    .chip {{
      display: inline-flex;
      max-width: 100%;
      margin: 2px 4px 2px 0;
      border-radius: 999px;
      background: #eef2ff;
      color: #3730a3;
      padding: 4px 8px;
      font-size: 12px;
      overflow-wrap: anywhere;
    }}
    ul {{ margin: 0; padding-left: 18px; }}
    li {{ margin: 2px 0; overflow-wrap: anywhere; }}
    .muted {{ color: var(--muted); font-weight: 500; }}
    .agent-rail {{ padding: 14px; }}
    .agent-rail > p {{ color: var(--muted); font-size: 13px; line-height: 1.6; margin-bottom: 12px; }}
    .agent-summary {{ display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }}
    .agent-dialog {{
      background: #fff;
      border: 1px solid var(--line);
      border-left: 4px solid var(--blue);
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 12px;
    }}
    .agent-dialog.status-done {{ border-left-color: var(--green); }}
    .agent-dialog.status-running {{ border-left-color: var(--amber); }}
    .agent-head {{ display: grid; grid-template-columns: 34px minmax(0, 1fr) 12px; gap: 10px; align-items: center; }}
    .avatar {{
      width: 34px;
      height: 34px;
      border-radius: 8px;
      background: #10253f;
      color: #fff;
      display: grid;
      place-items: center;
      font-weight: 800;
    }}
    .agent-head h3 {{ font-size: 15px; line-height: 1.2; }}
    .agent-head p {{ color: var(--muted); font-size: 12px; margin-top: 2px; }}
    .status-dot {{ width: 10px; height: 10px; border-radius: 99px; background: var(--blue); box-shadow: 0 0 0 4px #dbeafe; }}
    .status-dot-done {{ background: var(--green); box-shadow: 0 0 0 4px #dcfce7; }}
    .status-dot-running {{ background: var(--amber); box-shadow: 0 0 0 4px #fff3cf; }}
    .chat-bubble {{
      position: relative;
      margin: 12px 0;
      background: #f3f7fb;
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 10px;
    }}
    .chat-bubble span {{ color: var(--muted); font-size: 12px; }}
    .chat-bubble p {{ margin-top: 4px; font-size: 13px; line-height: 1.55; }}
    .agent-facts {{ display: grid; grid-template-columns: 82px 1fr; gap: 7px 10px; margin: 0; }}
    .agent-facts dt {{ color: var(--muted); font-size: 12px; }}
    .agent-facts dd {{ margin: 0; font-size: 13px; overflow-wrap: anywhere; }}
    .agent-block {{ border-top: 1px solid var(--line); margin-top: 10px; padding-top: 10px; }}
    .raw-json {{
      margin-top: 18px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: #fff;
      overflow: hidden;
    }}
    .raw-json summary {{ cursor: pointer; padding: 14px 16px; font-weight: 750; }}
    pre {{ margin: 0; overflow: auto; background: #0b1120; color: #e5edf7; padding: 16px; font-size: 12px; line-height: 1.5; }}
    .empty-state {{ color: var(--muted); border: 1px dashed var(--line); border-radius: 8px; padding: 14px; }}
    @keyframes stream-in {{ to {{ opacity: 1; transform: translateY(0); }} }}
    @media (max-width: 1260px) {{
      .workspace {{ grid-template-columns: minmax(0, 1fr) 360px; }}
      .left-rail {{ position: static; max-height: none; grid-column: 1 / -1; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }}
      .rail-panel + .rail-panel {{ margin-top: 0; }}
    }}
    @media (max-width: 940px) {{
      .top-inner, .workspace {{ grid-template-columns: 1fr; }}
      .agent-rail {{ position: static; max-height: none; }}
      .metric-strip {{ grid-template-columns: repeat(2, minmax(0, 1fr)); }}
    }}
    @media (max-width: 680px) {{
      .top-band {{ padding: 20px 16px 48px; }}
      .dashboard {{ padding: 0 16px 28px; }}
      .metric-strip, .left-rail, .node-meta, .handoff-grid {{ grid-template-columns: 1fr; }}
      .node-topline {{ grid-template-columns: 30px minmax(0, 1fr); }}
      .node-topline .status-pill {{ grid-column: 1 / -1; justify-self: start; }}
      .lanes-grid {{ grid-template-columns: 1fr; }}
    }}
  </style>
</head>
<body>
  <div class="app-shell">
    <header class="top-band">
      <div class="top-inner">
        <div class="hero-copy">
          <p class="eyebrow">Codex 项目运行图谱</p>
          <h1>{esc(title)}</h1>
          <p>根据真实项目节点、子代理、依赖、测试和证据生成的运行驾驶舱。右侧展示子代理对话镜像；真实 Codex 侧聊或线程仍是主证据面。</p>
        </div>
        <div class="run-card">
          <dl>
            <dt>当前 Gate</dt><dd>{esc(gate)}</dd>
            <dt>总控结论</dt><dd>{esc(verdict)}</dd>
            <dt>数据源</dt><dd>{esc(source_path)}</dd>
            <dt>渲染时间</dt><dd>{esc(generated_at)}</dd>
          </dl>
        </div>
      </div>
    </header>
    <main class="dashboard">
      <section class="metric-strip" aria-label="项目状态统计">
        {metric_cards}
      </section>
      <div class="workspace">
        <aside class="left-rail">
          <section class="rail-panel">
            <h2>运行索引</h2>
            <div class="summary-stack">
              <span class="summary-chip">节点总数<strong>{len(nodes)}</strong></span>
              <span class="summary-chip">子代理<strong>{len(agents)}</strong></span>
              <span class="summary-chip">运行代理<strong>{running_agents}</strong></span>
              <span class="summary-chip">可见对话<strong>{visible_agents}</strong></span>
              <span class="summary-chip">测试/证据<strong>{total_evidence}</strong></span>
              <span class="summary-chip">拓扑警告<strong>{len(warnings)}</strong></span>
            </div>
          </section>
          <section class="rail-panel">
            <h2>节点类型</h2>
            <div class="summary-stack">{type_cards}</div>
          </section>
          <section class="rail-panel">
            <h2>工作泳道</h2>
            <nav class="lane-links">{lane_nav}</nav>
          </section>
        </aside>
        <div class="main-flow">
          <section class="stream-panel">
            <div class="section-head">
              <div>
                <p class="eyebrow">Streaming Mirror</p>
                <h2>镜像事件流</h2>
              </div>
              <p>按顺序播放子代理、节点、测试和下一步，便于观察项目推进。</p>
            </div>
            <div class="stream-list">{stream_html}</div>
          </section>
          <section class="warning-panel">
            <div class="section-head">
              <div>
                <p class="eyebrow">Topology Gate</p>
                <h2>拓扑校验</h2>
              </div>
              <p>没有证据或依赖不闭合的节点不能进入完成态。</p>
            </div>
            {warning_html}
          </section>
          <section class="lanes-grid">
            {lane_html}
          </section>
          <details class="raw-json">
            <summary>查看原始 Graph JSON</summary>
            <pre>{raw_json}</pre>
          </details>
        </div>
        <aside class="agent-rail">
          <h2>子代理对话</h2>
          <p>这里展示 Codex 侧聊、线程链接、任务包和 HTML 镜像状态。只有真实创建过的子代理才能声明为真实对话。</p>
          <div class="agent-summary">{agent_summary}</div>
          {agent_cards}
        </aside>
      </div>
    </main>
  </div>
</body>
</html>
"""

def agent_for_node_v3(node: dict[str, Any], agents: list[dict[str, Any]]) -> dict[str, Any] | None:
    agent_id = text(node.get("agent_id"))
    agent_name = text(node.get("agent_nickname") or node.get("owner")).lower()
    for agent in agents:
        if agent_id and text(agent.get("agent_id")) == agent_id:
            return agent
    for agent in agents:
        candidates = {
            text(agent.get("nickname")).lower(),
            text(agent.get("role")).lower(),
            text(agent.get("agent_id")).lower(),
        }
        if agent_name and agent_name in candidates:
            return agent
    return None


def node_agent_log_v3(node: dict[str, Any], agent: dict[str, Any] | None) -> str:
    return (
        text(node.get("last_agent_message"))
        or text(node.get("agent_message"))
        or (text(agent.get("last_message")) if agent else "")
        or text(node.get("next_action"))
        or "等待上游节点或控制器分派。"
    )


def render_agent_tab_v3(agent: dict[str, Any], index: int) -> str:
    nickname = text(agent.get("nickname") or agent.get("agent_id") or f"agent-{index}")
    status = text(agent.get("status") or "planned")
    assigned = len(as_list(agent.get("assigned_nodes")))
    initial = esc(nickname[:1].upper() if nickname else str(index))
    return f"""
    <article class="agent-tab status-{css_token_v2(status)}">
      <span class="agent-dot">{initial}</span>
      <div>
        <strong>{esc(nickname)}</strong>
        <span>{esc(label_status_v2(status))} · {assigned} 节点</span>
      </div>
    </article>
    """


def render_flow_node_v3(node: dict[str, Any], index: int, agents: list[dict[str, Any]]) -> str:
    node_id = text(node.get("id") or f"node-{index}")
    title = text(node.get("title") or node_id)
    status = text(node.get("status") or "planned")
    node_type = text(node.get("type") or "task")
    agent = agent_for_node_v3(node, agents)
    agent_name = text(
        node.get("agent_nickname")
        or (agent.get("nickname") if agent else "")
        or node.get("owner")
        or "未绑定 Agent"
    )
    surface = node.get("conversation_surface") or (agent.get("conversation_surface") if agent else "") or "none"
    evidence = render_chips_v2(node.get("test_or_evidence"), "未设置测试")
    depends = render_chips_v2(node.get("depends_on"), "入口")
    unblocks = render_chips_v2(node.get("unblocks"), "终点")
    log = node_agent_log_v3(node, agent)
    gate = text(node.get("gate") or "none")
    status_token = css_token_v2(status)
    type_token = css_token_v2(node_type)
    delay = min(index * 0.09, 2.6)

    return f"""
    <article class="flow-node status-{status_token} type-{type_token}" style="--delay:{delay:.2f}s">
      <div class="node-chipline">
        <span class="seq">{index:02d}</span>
        <span class="status-badge">{esc(label_status_v2(status))}</span>
        <span class="type-badge">{esc(label_type_v2(node_type))}</span>
      </div>
      <h3>{esc(title)}</h3>
      <p class="node-id">{esc(node_id)} · Gate {esc(gate)}</p>
      <div class="agent-run">
        <div class="agent-avatar">{esc(agent_name[:1].upper() if agent_name else "A")}</div>
        <div>
          <span>{esc(agent_name)}</span>
          <p>{esc(log)}</p>
        </div>
      </div>
      <div class="node-evidence">
        <span>测试 / 证据</span>
        <div>{evidence}</div>
      </div>
      <div class="node-edges">
        <div><span>依赖</span>{depends}</div>
        <div><span>解锁</span>{unblocks}</div>
      </div>
      <div class="node-footer">
        <span>{esc(label_surface_v2(surface))}</span>
        <strong>{maybe_text_v2(node.get("pass_fail_oracle"), "验收口径未记录")}</strong>
      </div>
    </article>
    """


def render_lane_stream_v3(lane: str, lane_nodes: list[tuple[int, dict[str, Any]]], agents: list[dict[str, Any]]) -> str:
    done = sum(1 for _, node in lane_nodes if text(node.get("status")) == "done")
    running = sum(1 for _, node in lane_nodes if text(node.get("status")) in {"running", "ready", "review"})
    return f"""
    <section class="lane-stream" id="lane-{css_token_v2(lane)}">
      <div class="lane-meta">
        <span class="lane-marker"></span>
        <div>
          <p>WORK LANE</p>
          <h2>{esc(lane)}</h2>
        </div>
        <strong>{done}/{len(lane_nodes)} done</strong>
        <em>{running} active</em>
      </div>
      <div class="stream-track">
        {''.join(render_flow_node_v3(node, index, agents) for index, node in lane_nodes)}
      </div>
    </section>
    """


def render_agent_console_v3(agent: dict[str, Any], index: int) -> str:
    nickname = text(agent.get("nickname") or agent.get("agent_id") or f"agent-{index}")
    status = text(agent.get("status") or "planned")
    surface = text(agent.get("conversation_surface") or "none")
    visible = bool_label_v2(agent.get("conversation_visible"))
    lifecycle = text(agent.get("agent_lifecycle") or "未记录")
    last_message = text(agent.get("last_message") or "暂无运行消息。")
    next_input = text(agent.get("next_input") or "等待控制器派发。")
    return f"""
    <article class="agent-console status-{css_token_v2(status)}">
      <header>
        <span class="console-avatar">{esc(nickname[:1].upper() if nickname else str(index))}</span>
        <div>
          <h3>{esc(nickname)}</h3>
          <p>{esc(label_status_v2(status))} · {esc(label_surface_v2(surface))} · {esc(visible)}</p>
        </div>
      </header>
      <div class="console-log">
        <span>运行内容</span>
        <p>{esc(last_message)}</p>
      </div>
      <div class="console-next">
        <span>下一输入</span>
        <p>{esc(next_input)}</p>
      </div>
      <dl>
        <dt>生命周期</dt><dd>{esc(lifecycle)}</dd>
        <dt>节点</dt><dd>{render_chips_v2(agent.get("assigned_nodes"))}</dd>
        <dt>证据</dt><dd>{render_bullets_v2(agent.get("evidence"))}</dd>
      </dl>
    </article>
    """


def build_html_v3(graph: dict[str, Any], source_path: Path, warnings: list[str]) -> str:
    nodes: list[dict[str, Any]] = graph["nodes"]
    agents = infer_agents(nodes, graph.get("agents") or [])
    title = graph.get("project") or graph.get("title") or "Project Agent Graph"
    gate = graph.get("current_gate") or graph.get("gate") or "none"
    verdict = graph.get("controller_verdict") or graph.get("verdict") or "not set"
    generated_at = _dt.datetime.now().astimezone().isoformat(timespec="seconds")

    by_status = Counter(text(node.get("status") or "planned") for node in nodes)
    by_lane: dict[str, list[tuple[int, dict[str, Any]]]] = defaultdict(list)
    for index, node in enumerate(nodes, 1):
        by_lane[text(node.get("lane") or "unassigned")].append((index, node))

    active_agents = sum(1 for agent in agents if text(agent.get("status")) in {"running", "active", "review"})
    evidence_nodes = sum(1 for node in nodes if text(node.get("type")) in {"test", "evidence"})
    done_nodes = by_status.get("done", 0)
    ready_nodes = by_status.get("ready", 0) + by_status.get("running", 0) + by_status.get("review", 0)

    agent_tabs = "".join(render_agent_tab_v3(agent, index) for index, agent in enumerate(agents, 1))
    if not agent_tabs:
        agent_tabs = '<p class="empty-inline">暂无子代理记录</p>'

    lane_nav = "".join(
        f'<a href="#lane-{css_token_v2(lane)}"><span>{esc(lane)}</span><strong>{len(lane_nodes)}</strong></a>'
        for lane, lane_nodes in sorted(by_lane.items())
    )
    lane_streams = "".join(
        render_lane_stream_v3(lane, lane_nodes, agents)
        for lane, lane_nodes in sorted(by_lane.items())
    )
    agent_console = "".join(render_agent_console_v3(agent, index) for index, agent in enumerate(agents, 1))
    if not agent_console:
        agent_console = '<p class="empty-panel">还没有真实或计划中的子代理。</p>'

    warning_html = (
        "<ul>" + "".join(f"<li>{esc(warning)}</li>" for warning in warnings) + "</ul>"
        if warnings
        else '<p class="pass-line">拓扑校验通过：依赖、测试和证据节点可继续推进。</p>'
    )
    raw_json = esc(json.dumps(graph, ensure_ascii=False, indent=2))

    return f"""<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{esc(title)}</title>
  <style>
    :root {{
      color-scheme: dark;
      --bg: #090f1e;
      --panel: #101a2d;
      --panel-2: #142238;
      --panel-3: #1b2c45;
      --line: #253955;
      --line-strong: #3a5478;
      --text: #e7f0ff;
      --muted: #91a4bf;
      --green: #47d18c;
      --cyan: #4cc9f0;
      --amber: #ffbd5a;
      --red: #ff6b6b;
      --violet: #b794f4;
      --blue: #5aa7ff;
      --shadow: 0 24px 70px rgba(0, 0, 0, .34);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }}
    * {{ box-sizing: border-box; }}
    html {{ scroll-behavior: smooth; }}
    body {{
      margin: 0;
      min-height: 100vh;
      background:
        radial-gradient(circle at 70% 20%, rgba(76,201,240,.12), transparent 34%),
        linear-gradient(180deg, #07101e 0%, #111025 48%, #09101f 100%);
      color: var(--text);
      overflow-x: hidden;
    }}
    body::before {{
      content: "";
      position: fixed;
      inset: 0;
      pointer-events: none;
      background-image:
        linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px);
      background-size: 24px 24px;
      mask-image: linear-gradient(180deg, rgba(0,0,0,.95), rgba(0,0,0,.22));
    }}
    a {{ color: inherit; text-decoration: none; }}
    p, h1, h2, h3 {{ margin: 0; }}
    .bot-shell {{ display: grid; grid-template-columns: 232px minmax(0, 1fr); min-height: 100vh; }}
    .sidebar {{
      position: sticky;
      top: 0;
      height: 100vh;
      padding: 18px 14px;
      background: rgba(13, 25, 43, .95);
      border-right: 1px solid var(--line);
      box-shadow: 18px 0 40px rgba(0,0,0,.22);
    }}
    .brand {{ display: flex; gap: 12px; align-items: center; padding: 8px 8px 18px; }}
    .brand-mark {{
      width: 42px;
      height: 42px;
      border-radius: 8px;
      display: grid;
      place-items: center;
      background: linear-gradient(135deg, #ff7a36, #ffb34e);
      color: #221000;
      font-weight: 900;
      box-shadow: 0 0 26px rgba(255,122,54,.36);
    }}
    .brand h1 {{ font-size: 15px; letter-spacing: 0; }}
    .brand p {{ color: var(--muted); font-size: 11px; margin-top: 3px; }}
    .nav-section {{ margin-top: 18px; }}
    .nav-section > span {{ display: block; color: #71829a; font-size: 11px; font-weight: 800; margin: 0 8px 8px; }}
    .nav-item {{
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      margin: 5px 0;
      border-radius: 8px;
      color: #b8c7dc;
      background: rgba(255,255,255,.02);
      border: 1px solid transparent;
      font-size: 13px;
    }}
    .nav-item.active {{ color: #e8f7ff; background: rgba(76,201,240,.12); border-color: rgba(76,201,240,.32); box-shadow: inset 3px 0 0 var(--cyan); }}
    .nav-item strong {{ color: var(--green); font-size: 12px; }}
    .main {{ min-width: 0; }}
    .topbar {{
      position: sticky;
      top: 0;
      z-index: 3;
      padding: 16px 22px;
      background: rgba(8, 16, 30, .86);
      border-bottom: 1px solid var(--line);
      backdrop-filter: blur(14px);
    }}
    .top-row {{ display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 16px; align-items: center; }}
    .title-block h2 {{ font-size: 22px; letter-spacing: 0; }}
    .title-block p {{ color: var(--muted); font-size: 13px; margin-top: 5px; }}
    .gate-chip {{
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border: 1px solid rgba(71,209,140,.36);
      border-radius: 8px;
      color: #a8ffd0;
      background: rgba(71,209,140,.08);
      font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
      font-size: 13px;
    }}
    .agent-tabs {{ display: flex; flex-wrap: wrap; gap: 10px; margin-top: 14px; }}
    .agent-tab {{
      display: inline-grid;
      grid-template-columns: 30px minmax(0, 1fr);
      gap: 9px;
      align-items: center;
      min-width: 178px;
      border: 1px solid var(--line);
      background: rgba(20,34,56,.9);
      border-radius: 8px;
      padding: 8px 10px;
    }}
    .agent-dot, .console-avatar, .agent-avatar {{
      display: grid;
      place-items: center;
      border-radius: 7px;
      background: #1e3a5a;
      color: #d9fbff;
      font-weight: 900;
    }}
    .agent-dot {{ width: 30px; height: 30px; box-shadow: 0 0 0 1px rgba(76,201,240,.25), 0 0 20px rgba(76,201,240,.18); }}
    .agent-tab strong {{ display: block; font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }}
    .agent-tab span {{ color: var(--muted); font-size: 12px; }}
    .content {{ padding: 18px 22px 32px; }}
    .hud-grid {{ display: grid; grid-template-columns: repeat(4, minmax(130px, 1fr)); gap: 12px; margin-bottom: 16px; }}
    .hud-card {{
      min-height: 82px;
      border: 1px solid var(--line);
      background: linear-gradient(180deg, rgba(27,44,69,.92), rgba(16,26,45,.92));
      border-radius: 8px;
      padding: 12px;
      box-shadow: var(--shadow);
    }}
    .hud-card span {{ color: var(--muted); font-size: 12px; }}
    .hud-card strong {{ display: block; margin-top: 10px; font-size: 28px; line-height: 1; }}
    .ops-layout {{ display: grid; grid-template-columns: minmax(0, 1fr) 370px; gap: 16px; align-items: start; }}
    .office-stage {{
      border: 1px solid var(--line-strong);
      border-radius: 8px;
      background:
        linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px),
        linear-gradient(180deg, rgba(22,35,57,.96), rgba(17,21,43,.96));
      background-size: 18px 18px, 18px 18px, auto;
      box-shadow: var(--shadow);
      overflow: hidden;
    }}
    .stage-head {{
      display: flex;
      justify-content: space-between;
      gap: 14px;
      align-items: center;
      padding: 14px 16px;
      border-bottom: 1px solid var(--line);
      background: rgba(9,15,30,.72);
    }}
    .stage-head h2 {{ font-size: 18px; }}
    .stage-head p {{ color: var(--muted); font-size: 13px; margin-top: 4px; }}
    .lane-nav {{ display: flex; flex-wrap: wrap; gap: 8px; }}
    .lane-nav a {{
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 7px 10px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: rgba(20,34,56,.78);
      color: #d7e8ff;
      font-size: 12px;
    }}
    .lane-nav strong {{ color: var(--green); }}
    .lane-board {{ padding: 12px; display: grid; gap: 14px; }}
    .lane-stream {{
      display: grid;
      grid-template-columns: 160px minmax(0, 1fr);
      gap: 12px;
      align-items: stretch;
    }}
    .lane-meta {{
      min-height: 180px;
      border: 1px solid rgba(76,201,240,.22);
      background: rgba(8,16,30,.72);
      border-radius: 8px;
      padding: 12px;
      display: grid;
      align-content: start;
      gap: 8px;
    }}
    .lane-marker {{ width: 34px; height: 6px; border-radius: 99px; background: var(--cyan); box-shadow: 0 0 16px rgba(76,201,240,.7); }}
    .lane-meta p {{ color: var(--muted); font-size: 11px; font-weight: 800; letter-spacing: .08em; }}
    .lane-meta h2 {{ font-size: 16px; word-break: break-word; }}
    .lane-meta strong {{ color: #a8ffd0; font-size: 13px; }}
    .lane-meta em {{ color: var(--amber); font-style: normal; font-size: 12px; }}
    .stream-track {{
      position: relative;
      display: grid;
      grid-auto-flow: column;
      grid-auto-columns: minmax(280px, 330px);
      gap: 12px;
      overflow-x: auto;
      padding: 2px 4px 10px;
      scroll-snap-type: x proximity;
    }}
    .stream-track::before {{
      content: "";
      position: absolute;
      left: 18px;
      right: 18px;
      top: 32px;
      height: 2px;
      background: linear-gradient(90deg, transparent, rgba(76,201,240,.8), rgba(71,209,140,.6), transparent);
      opacity: .55;
    }}
    .flow-node {{
      position: relative;
      min-height: 250px;
      scroll-snap-align: start;
      border: 1px solid var(--line);
      border-top: 4px solid var(--blue);
      background: rgba(16, 26, 45, .94);
      border-radius: 8px;
      padding: 12px;
      box-shadow: 0 14px 34px rgba(0,0,0,.22);
      opacity: 0;
      transform: translateY(10px);
      animation: node-in .42s ease-out forwards;
      animation-delay: var(--delay);
    }}
    .flow-node::before {{
      content: "";
      position: absolute;
      top: 21px;
      left: -8px;
      width: 12px;
      height: 12px;
      border-radius: 99px;
      background: var(--cyan);
      box-shadow: 0 0 0 5px rgba(76,201,240,.13), 0 0 20px rgba(76,201,240,.7);
    }}
    .flow-node.status-done {{ border-top-color: var(--green); }}
    .flow-node.status-running, .flow-node.status-ready {{ border-top-color: var(--amber); }}
    .flow-node.status-blocked, .flow-node.status-failed {{ border-top-color: var(--red); }}
    .flow-node.status-review {{ border-top-color: var(--violet); }}
    .node-chipline {{ display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }}
    .seq {{
      display: inline-grid;
      place-items: center;
      min-width: 30px;
      height: 24px;
      border-radius: 6px;
      background: #06111f;
      color: #8bdcff;
      font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
      font-size: 12px;
    }}
    .status-badge, .type-badge {{
      border-radius: 999px;
      padding: 4px 8px;
      font-size: 12px;
      font-weight: 800;
      background: rgba(90,167,255,.14);
      color: #b9dcff;
    }}
    .type-badge {{ background: rgba(71,209,140,.12); color: #b9ffd9; }}
    .flow-node h3 {{ margin-top: 10px; font-size: 16px; line-height: 1.25; }}
    .node-id {{ color: var(--muted); margin-top: 4px; font-size: 12px; }}
    .agent-run {{
      display: grid;
      grid-template-columns: 36px minmax(0, 1fr);
      gap: 10px;
      margin-top: 12px;
      padding: 10px;
      border: 1px solid rgba(76,201,240,.2);
      border-radius: 8px;
      background: rgba(76,201,240,.07);
    }}
    .agent-avatar {{ width: 36px; height: 36px; background: #18365b; }}
    .agent-run span, .node-evidence > span, .node-edges span, .node-footer > span {{ display: block; color: #9fc1df; font-size: 12px; margin-bottom: 4px; }}
    .agent-run p {{ color: #e8f3ff; font-size: 13px; line-height: 1.5; overflow-wrap: anywhere; }}
    .node-evidence {{ margin-top: 10px; }}
    .chip {{
      display: inline-flex;
      max-width: 100%;
      margin: 2px 4px 2px 0;
      border-radius: 999px;
      background: rgba(71,209,140,.12);
      color: #b9ffd9;
      border: 1px solid rgba(71,209,140,.18);
      padding: 4px 8px;
      font-size: 12px;
      overflow-wrap: anywhere;
    }}
    .node-edges {{ display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 10px; }}
    .node-edges > div {{ min-width: 0; border: 1px solid var(--line); border-radius: 8px; padding: 8px; background: rgba(255,255,255,.025); }}
    .node-footer {{ border-top: 1px solid var(--line); margin-top: 10px; padding-top: 10px; }}
    .node-footer strong {{ display: block; color: #dcecff; font-size: 12px; line-height: 1.45; font-weight: 600; overflow-wrap: anywhere; }}
    .right-console {{
      position: sticky;
      top: 112px;
      max-height: calc(100vh - 132px);
      overflow: auto;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: rgba(12,21,37,.94);
      box-shadow: var(--shadow);
      padding: 14px;
    }}
    .right-console h2 {{ font-size: 18px; }}
    .right-console > p {{ color: var(--muted); font-size: 13px; line-height: 1.55; margin: 6px 0 12px; }}
    .agent-console {{
      border: 1px solid var(--line);
      border-left: 4px solid var(--blue);
      border-radius: 8px;
      background: rgba(20,34,56,.9);
      padding: 12px;
      margin-bottom: 12px;
    }}
    .agent-console.status-running {{ border-left-color: var(--amber); }}
    .agent-console.status-done {{ border-left-color: var(--green); }}
    .agent-console header {{ display: grid; grid-template-columns: 36px minmax(0, 1fr); gap: 10px; align-items: center; }}
    .console-avatar {{ width: 36px; height: 36px; background: #203e65; }}
    .agent-console h3 {{ font-size: 15px; }}
    .agent-console header p {{ color: var(--muted); font-size: 12px; margin-top: 3px; }}
    .console-log, .console-next {{ margin-top: 10px; padding: 10px; border-radius: 8px; background: rgba(6,17,31,.62); border: 1px solid rgba(76,201,240,.16); }}
    .console-log span, .console-next span {{ color: #9fc1df; font-size: 12px; }}
    .console-log p, .console-next p {{ margin-top: 4px; font-size: 13px; line-height: 1.5; }}
    .agent-console dl {{ display: grid; grid-template-columns: 78px 1fr; gap: 7px 10px; margin: 10px 0 0; }}
    .agent-console dt {{ color: var(--muted); font-size: 12px; }}
    .agent-console dd {{ margin: 0; font-size: 12px; overflow-wrap: anywhere; }}
    ul {{ margin: 0; padding-left: 18px; }}
    li {{ margin: 2px 0; }}
    .muted {{ color: var(--muted); }}
    .gate-panel, .raw-json {{
      margin-top: 16px;
      border: 1px solid var(--line);
      background: rgba(12,21,37,.9);
      border-radius: 8px;
      padding: 14px;
    }}
    .gate-panel h2 {{ font-size: 16px; margin-bottom: 8px; }}
    .pass-line {{ color: #a8ffd0; font-weight: 700; }}
    .raw-json summary {{ cursor: pointer; font-weight: 800; }}
    pre {{ overflow: auto; margin: 12px 0 0; padding: 14px; border-radius: 8px; background: #050a14; color: #dcecff; font-size: 12px; line-height: 1.5; }}
    .empty-inline, .empty-panel {{ color: var(--muted); }}
    @keyframes node-in {{ to {{ opacity: 1; transform: translateY(0); }} }}
    @media (max-width: 1260px) {{
      .bot-shell {{ grid-template-columns: 1fr; }}
      .sidebar {{ position: static; height: auto; display: none; }}
      .ops-layout {{ grid-template-columns: 1fr; }}
      .right-console {{ position: static; max-height: none; }}
    }}
    @media (max-width: 760px) {{
      .top-row, .hud-grid, .lane-stream {{ grid-template-columns: 1fr; }}
      .content, .topbar {{ padding-left: 14px; padding-right: 14px; }}
      .stream-track {{ grid-auto-flow: row; grid-auto-columns: auto; grid-template-columns: 1fr; overflow: visible; }}
      .stream-track::before {{ display: none; }}
      .node-edges {{ grid-template-columns: 1fr; }}
    }}
  </style>
</head>
<body>
  <div class="bot-shell">
    <aside class="sidebar">
      <div class="brand">
        <span class="brand-mark">J</span>
        <div>
          <h1>JUDGMENT</h1>
          <p>AGENT RUNTIME</p>
        </div>
      </div>
      <div class="nav-section">
        <span>总览</span>
        <a class="nav-item active" href="#"><span>泳道办公室</span><strong>{len(by_lane)}</strong></a>
        <a class="nav-item" href="#agents"><span>子代理对话</span><strong>{len(agents)}</strong></a>
        <a class="nav-item" href="#gate"><span>拓扑校验</span><strong>{len(warnings)}</strong></a>
      </div>
      <div class="nav-section">
        <span>泳道</span>
        {lane_nav}
      </div>
    </aside>
    <main class="main">
      <header class="topbar">
        <div class="top-row">
          <div class="title-block">
            <h2>{esc(title)}</h2>
            <p>泳道流式推进 · 关键节点直接显示 Agent 运行内容 · 数据源 {esc(source_path)}</p>
          </div>
          <span class="gate-chip">Gate {esc(gate)} · {esc(verdict)}</span>
        </div>
        <div class="agent-tabs">{agent_tabs}</div>
      </header>
      <section class="content">
        <section class="hud-grid">
          <article class="hud-card"><span>节点总数</span><strong>{len(nodes)}</strong></article>
          <article class="hud-card"><span>已完成</span><strong>{done_nodes}</strong></article>
          <article class="hud-card"><span>活跃节点</span><strong>{ready_nodes}</strong></article>
          <article class="hud-card"><span>测试 / 证据</span><strong>{evidence_nodes}</strong></article>
        </section>
        <div class="ops-layout">
          <section class="office-stage">
            <header class="stage-head">
              <div>
                <h2>Agent 泳道流式办公室</h2>
                <p>每条泳道横向推进；节点里的运行内容来自对应 agent 或节点消息。</p>
              </div>
              <nav class="lane-nav">{lane_nav}</nav>
            </header>
            <div class="lane-board">{lane_streams}</div>
          </section>
          <aside class="right-console" id="agents">
            <h2>子代理运行内容</h2>
            <p>这里是右侧对话镜像。真实子代理侧聊或线程仍是主证据面；HTML 只展示当前已同步状态。</p>
            {agent_console}
          </aside>
        </div>
        <section class="gate-panel" id="gate">
          <h2>拓扑校验</h2>
          {warning_html}
        </section>
        <details class="raw-json">
          <summary>查看原始 Graph JSON</summary>
          <pre>{raw_json}</pre>
        </details>
      </section>
    </main>
  </div>
</body>
</html>
"""

def render_recent_tasks_v4(nodes: list[dict[str, Any]]) -> str:
    items: list[str] = []
    for node in nodes[:6]:
        status = text(node.get("status") or "planned")
        items.append(
            f"""
            <article class="task-row">
              <span class="task-icon status-{css_token_v2(status)}">{esc(label_type_v2(node.get("type") or "task")[:1])}</span>
              <div>
                <strong>{esc(node.get("title") or node.get("id") or "未命名节点")}</strong>
                <p>{esc(node.get("updated_at") or node.get("gate") or "未记录时间")}</p>
              </div>
              <em class="state-tag state-{css_token_v2(status)}">{esc(label_status_v2(status))}</em>
            </article>
            """
        )
    return "".join(items) or '<p class="empty-panel">暂无任务节点。</p>'


def render_activity_v4(nodes: list[dict[str, Any]], agents: list[dict[str, Any]]) -> str:
    rows: list[str] = []
    for agent in agents[:3]:
        rows.append(
            f"""
            <article class="activity-row">
              <span class="activity-dot agent"></span>
              <p><strong>{esc(agent.get("nickname") or agent.get("agent_id") or "Agent")}</strong> {esc(agent.get("last_message") or "等待新的运行消息。")}</p>
            </article>
            """
        )
    for node in nodes[:5]:
        rows.append(
            f"""
            <article class="activity-row">
              <span class="activity-dot node"></span>
              <p><strong>{esc(node.get("owner") or "Controller")}</strong> 推进节点 {esc(node.get("title") or node.get("id") or "未命名节点")}，状态 {esc(label_status_v2(node.get("status")))}。</p>
            </article>
            """
        )
    return "".join(rows) or '<p class="empty-panel">暂无活动动态。</p>'


def build_html_v4(graph: dict[str, Any], source_path: Path, warnings: list[str]) -> str:
    nodes: list[dict[str, Any]] = graph["nodes"]
    agents = infer_agents(nodes, graph.get("agents") or [])
    title = graph.get("project") or graph.get("title") or "Project Agent Graph"
    gate = graph.get("current_gate") or graph.get("gate") or "none"
    verdict = graph.get("controller_verdict") or graph.get("verdict") or "not set"
    generated_at = _dt.datetime.now().astimezone().isoformat(timespec="seconds")

    by_status = Counter(text(node.get("status") or "planned") for node in nodes)
    by_lane: dict[str, list[tuple[int, dict[str, Any]]]] = defaultdict(list)
    for index, node in enumerate(nodes, 1):
        by_lane[text(node.get("lane") or "unassigned")].append((index, node))

    active_agents = sum(1 for agent in agents if text(agent.get("status")) in {"running", "active", "review"})
    done_nodes = by_status.get("done", 0)
    active_nodes = by_status.get("ready", 0) + by_status.get("running", 0) + by_status.get("review", 0)
    evidence_nodes = sum(1 for node in nodes if text(node.get("type")) in {"test", "evidence"})

    lane_nav = "".join(
        f'<a href="#lane-{css_token_v2(lane)}"><span>{esc(lane)}</span><strong>{len(lane_nodes)}</strong></a>'
        for lane, lane_nodes in sorted(by_lane.items())
    )
    lane_streams = "".join(
        render_lane_stream_v3(lane, lane_nodes, agents)
        for lane, lane_nodes in sorted(by_lane.items())
    )
    agent_tabs = "".join(render_agent_tab_v3(agent, index) for index, agent in enumerate(agents, 1))
    agent_console = "".join(render_agent_console_v3(agent, index) for index, agent in enumerate(agents, 1))
    if not agent_console:
        agent_console = '<p class="empty-panel">还没有真实或计划中的子代理。</p>'

    warning_html = (
        "<ul>" + "".join(f"<li>{esc(warning)}</li>" for warning in warnings) + "</ul>"
        if warnings
        else '<p class="pass-line">拓扑校验通过：依赖、测试和证据节点可继续推进。</p>'
    )
    raw_json = esc(json.dumps(graph, ensure_ascii=False, indent=2))

    return f"""<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{esc(title)}</title>
  <style>
    :root {{
      color-scheme: light;
      --page: #f4f8ff;
      --surface: #ffffff;
      --soft: #f7fbff;
      --text: #162033;
      --muted: #76849a;
      --line: #e5edf7;
      --blue: #4d8dff;
      --green: #28c982;
      --purple: #8c6cff;
      --orange: #ffae43;
      --red: #ff6370;
      --cyan: #26bfd2;
      --shadow: 0 20px 52px rgba(55, 82, 130, .12);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }}
    * {{ box-sizing: border-box; }}
    html {{ scroll-behavior: smooth; }}
    body {{
      margin: 0;
      min-height: 100vh;
      background:
        radial-gradient(circle at 18% 8%, rgba(141,108,255,.14), transparent 28%),
        radial-gradient(circle at 82% 12%, rgba(77,141,255,.14), transparent 30%),
        linear-gradient(135deg, #f9fcff 0%, #eef6ff 46%, #f8fbff 100%);
      color: var(--text);
    }}
    a {{ color: inherit; text-decoration: none; }}
    p, h1, h2, h3 {{ margin: 0; }}
    .app {{ display: grid; grid-template-columns: 248px minmax(0, 1fr); min-height: 100vh; }}
    .sidebar {{
      position: sticky;
      top: 0;
      height: 100vh;
      padding: 24px 18px;
      background: rgba(255,255,255,.84);
      border-right: 1px solid rgba(229,237,247,.9);
      backdrop-filter: blur(18px);
    }}
    .brand {{ display: flex; align-items: center; gap: 12px; margin-bottom: 28px; }}
    .brand-bot {{
      width: 48px;
      height: 48px;
      border-radius: 16px;
      display: grid;
      place-items: center;
      color: #fff;
      font-weight: 900;
      background: linear-gradient(145deg, #8c6cff, #4d8dff);
      box-shadow: 0 14px 28px rgba(77,141,255,.24);
    }}
    .brand h1 {{ font-size: 18px; letter-spacing: 0; }}
    .brand p {{ color: var(--muted); font-size: 12px; margin-top: 3px; }}
    .nav-title {{ display: block; color: #9aa7bb; font-size: 12px; font-weight: 800; margin: 20px 10px 8px; }}
    .nav-link {{
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      min-height: 44px;
      margin: 6px 0;
      padding: 0 12px;
      border-radius: 12px;
      color: #6d7890;
      font-size: 14px;
      font-weight: 650;
    }}
    .nav-link.active {{ color: #fff; background: linear-gradient(135deg, #5b9cff, #4d8dff); box-shadow: 0 12px 28px rgba(77,141,255,.26); }}
    .nav-link strong {{ color: var(--green); font-size: 12px; }}
    .profile {{
      position: absolute;
      left: 18px;
      right: 18px;
      bottom: 18px;
      display: grid;
      grid-template-columns: 38px minmax(0, 1fr);
      gap: 10px;
      align-items: center;
      padding: 10px;
      border: 1px solid var(--line);
      border-radius: 14px;
      background: #fff;
    }}
    .profile span {{ width: 38px; height: 38px; border-radius: 12px; display: grid; place-items: center; color: #fff; background: linear-gradient(135deg, #28c982, #26bfd2); font-weight: 900; }}
    .profile strong {{ display: block; font-size: 13px; }}
    .profile p {{ color: var(--muted); font-size: 12px; margin-top: 2px; }}
    .main {{ min-width: 0; padding: 24px; }}
    .topbar {{ display: grid; grid-template-columns: minmax(0,1fr) minmax(260px, 380px); gap: 18px; align-items: start; margin-bottom: 22px; }}
    .hello h2 {{ font-size: 27px; letter-spacing: 0; }}
    .hello p {{ color: var(--muted); margin-top: 8px; font-size: 14px; }}
    .searchbox {{
      display: flex;
      align-items: center;
      gap: 10px;
      height: 44px;
      padding: 0 14px;
      border: 1px solid var(--line);
      border-radius: 14px;
      background: rgba(255,255,255,.9);
      color: #9aa7bb;
      box-shadow: 0 10px 30px rgba(55,82,130,.08);
      font-size: 13px;
    }}
    .metric-grid {{ display: grid; grid-template-columns: repeat(4, minmax(150px, 1fr)); gap: 16px; margin-bottom: 16px; }}
    .metric {{
      display: grid;
      grid-template-columns: 52px minmax(0, 1fr);
      gap: 14px;
      align-items: center;
      min-height: 96px;
      padding: 16px;
      background: rgba(255,255,255,.92);
      border: 1px solid rgba(229,237,247,.94);
      border-radius: 16px;
      box-shadow: var(--shadow);
    }}
    .metric-icon {{ width: 52px; height: 52px; border-radius: 16px; display: grid; place-items: center; color: #fff; font-weight: 900; }}
    .metric:nth-child(1) .metric-icon {{ background: linear-gradient(135deg, #5b9cff, #4d8dff); }}
    .metric:nth-child(2) .metric-icon {{ background: linear-gradient(135deg, #2bd28f, #27b978); }}
    .metric:nth-child(3) .metric-icon {{ background: linear-gradient(135deg, #9a7cff, #7b61ff); }}
    .metric:nth-child(4) .metric-icon {{ background: linear-gradient(135deg, #ffb75a, #ff9d3e); }}
    .metric span {{ color: var(--muted); font-size: 13px; }}
    .metric strong {{ display: block; margin-top: 5px; font-size: 28px; line-height: 1; }}
    .metric p {{ color: var(--green); font-size: 12px; margin-top: 5px; }}
    .dashboard {{ display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 16px; align-items: start; }}
    .card {{
      background: rgba(255,255,255,.94);
      border: 1px solid rgba(229,237,247,.95);
      border-radius: 18px;
      box-shadow: var(--shadow);
    }}
    .card-head {{ display: flex; justify-content: space-between; gap: 12px; align-items: center; padding: 16px 18px 8px; }}
    .card-head h2 {{ font-size: 17px; }}
    .card-head p {{ color: var(--muted); font-size: 13px; margin-top: 4px; }}
    .lane-nav {{ display: flex; flex-wrap: wrap; gap: 8px; }}
    .lane-nav a {{
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 7px 10px;
      border: 1px solid #dce9fb;
      border-radius: 999px;
      color: #4d79bd;
      background: #f6faff;
      font-size: 12px;
      font-weight: 700;
    }}
    .lane-nav strong {{ color: var(--green); }}
    .lane-board {{ padding: 0 16px 16px; display: grid; gap: 14px; }}
    .lane-stream {{
      display: grid;
      grid-template-columns: 150px minmax(0, 1fr);
      gap: 12px;
      align-items: stretch;
      padding: 12px;
      border: 1px solid #e4edf8;
      border-radius: 16px;
      background:
        linear-gradient(rgba(77,141,255,.045) 1px, transparent 1px),
        linear-gradient(90deg, rgba(77,141,255,.045) 1px, transparent 1px),
        linear-gradient(135deg, #fbfdff, #f3f8ff);
      background-size: 18px 18px, 18px 18px, auto;
    }}
    .lane-meta {{
      border-radius: 14px;
      padding: 12px;
      background: #ffffff;
      border: 1px solid #e2edf8;
      display: grid;
      align-content: start;
      gap: 7px;
    }}
    .lane-marker {{ width: 34px; height: 6px; border-radius: 999px; background: linear-gradient(90deg, #4d8dff, #28c982); }}
    .lane-meta p {{ color: #9aa7bb; font-size: 11px; font-weight: 800; letter-spacing: .08em; }}
    .lane-meta h2 {{ font-size: 16px; word-break: break-word; }}
    .lane-meta strong {{ color: var(--green); font-size: 13px; }}
    .lane-meta em {{ color: var(--orange); font-style: normal; font-size: 12px; }}
    .stream-track {{
      position: relative;
      display: grid;
      grid-auto-flow: column;
      grid-auto-columns: minmax(274px, 320px);
      gap: 12px;
      overflow-x: auto;
      padding: 2px 2px 10px;
      scroll-snap-type: x proximity;
    }}
    .stream-track::before {{
      content: "";
      position: absolute;
      left: 18px;
      right: 18px;
      top: 32px;
      height: 2px;
      background: linear-gradient(90deg, transparent, rgba(77,141,255,.52), rgba(40,201,130,.55), transparent);
    }}
    .flow-node {{
      position: relative;
      min-height: 252px;
      scroll-snap-align: start;
      background: rgba(255,255,255,.98);
      border: 1px solid #e2edf8;
      border-top: 4px solid var(--blue);
      border-radius: 15px;
      padding: 13px;
      box-shadow: 0 14px 28px rgba(55,82,130,.1);
      opacity: 0;
      transform: translateY(10px);
      animation: node-in .38s ease-out forwards;
      animation-delay: var(--delay);
    }}
    .flow-node::before {{
      content: "";
      position: absolute;
      top: 21px;
      left: -7px;
      width: 12px;
      height: 12px;
      border-radius: 99px;
      background: var(--blue);
      box-shadow: 0 0 0 5px rgba(77,141,255,.14);
    }}
    .flow-node.status-done {{ border-top-color: var(--green); }}
    .flow-node.status-running, .flow-node.status-ready {{ border-top-color: var(--orange); }}
    .flow-node.status-blocked, .flow-node.status-failed {{ border-top-color: var(--red); }}
    .node-chipline {{ display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }}
    .seq, .status-badge, .type-badge {{
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 24px;
      border-radius: 999px;
      padding: 3px 8px;
      font-size: 12px;
      font-weight: 800;
    }}
    .seq {{ background: #eef5ff; color: #4d79bd; font-family: ui-monospace, SFMono-Regular, Consolas, monospace; }}
    .status-badge {{ background: #eaf8f1; color: #20a96d; }}
    .type-badge {{ background: #f0edff; color: #7659ef; }}
    .flow-node h3 {{ margin-top: 10px; font-size: 16px; line-height: 1.28; }}
    .node-id {{ color: var(--muted); font-size: 12px; margin-top: 4px; }}
    .agent-run {{
      display: grid;
      grid-template-columns: 38px minmax(0, 1fr);
      gap: 10px;
      margin-top: 12px;
      padding: 10px;
      border: 1px solid #e3effd;
      border-radius: 13px;
      background: #f7fbff;
    }}
    .agent-avatar {{ width: 38px; height: 38px; border-radius: 12px; display: grid; place-items: center; color: #fff; background: linear-gradient(135deg, #4d8dff, #8c6cff); font-weight: 900; }}
    .agent-run span, .node-evidence > span, .node-edges span, .node-footer > span {{ display: block; color: var(--muted); font-size: 12px; margin-bottom: 4px; }}
    .agent-run p {{ color: #33425a; font-size: 13px; line-height: 1.5; overflow-wrap: anywhere; }}
    .node-evidence {{ margin-top: 10px; }}
    .chip {{
      display: inline-flex;
      max-width: 100%;
      margin: 2px 4px 2px 0;
      border-radius: 999px;
      background: #eff8f4;
      color: #21a36a;
      border: 1px solid #d9f0e6;
      padding: 4px 8px;
      font-size: 12px;
      overflow-wrap: anywhere;
    }}
    .node-edges {{ display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 10px; }}
    .node-edges > div {{ min-width: 0; border: 1px solid #e7eef8; border-radius: 12px; padding: 8px; background: #fbfdff; }}
    .node-footer {{ border-top: 1px solid #e7eef8; margin-top: 10px; padding-top: 10px; }}
    .node-footer strong {{ display: block; color: #33425a; font-size: 12px; line-height: 1.45; font-weight: 650; overflow-wrap: anywhere; }}
    .side-stack {{ display: grid; gap: 16px; }}
    .agent-list, .activity-list, .task-list {{ padding: 0 14px 14px; display: grid; gap: 10px; }}
    .agent-console {{
      border: 1px solid #e2edf8;
      border-left: 4px solid var(--blue);
      border-radius: 14px;
      background: #fff;
      padding: 12px;
    }}
    .agent-console.status-running {{ border-left-color: var(--green); }}
    .agent-console header {{ display: grid; grid-template-columns: 40px minmax(0,1fr); gap: 10px; align-items: center; }}
    .console-avatar {{ width: 40px; height: 40px; border-radius: 14px; display: grid; place-items: center; color: #fff; background: linear-gradient(135deg, #6ea7ff, #8c6cff); font-weight: 900; }}
    .agent-console h3 {{ font-size: 14px; }}
    .agent-console header p {{ color: var(--muted); font-size: 12px; margin-top: 3px; }}
    .console-log, .console-next {{ margin-top: 10px; padding: 9px; border-radius: 12px; background: #f7fbff; border: 1px solid #e5eef8; }}
    .console-log span, .console-next span {{ color: var(--muted); font-size: 12px; }}
    .console-log p, .console-next p {{ margin-top: 4px; color: #33425a; font-size: 13px; line-height: 1.45; }}
    .agent-console dl {{ display: grid; grid-template-columns: 76px 1fr; gap: 6px 10px; margin: 10px 0 0; }}
    .agent-console dt {{ color: var(--muted); font-size: 12px; }}
    .agent-console dd {{ margin: 0; color: #33425a; font-size: 12px; overflow-wrap: anywhere; }}
    .task-row, .activity-row {{ display: grid; grid-template-columns: 36px minmax(0,1fr) auto; gap: 10px; align-items: center; padding: 9px; border-radius: 12px; background: #fbfdff; border: 1px solid #edf3fb; }}
    .task-icon {{ width: 36px; height: 36px; border-radius: 11px; display: grid; place-items: center; color: #fff; background: var(--blue); font-weight: 900; }}
    .task-icon.status-done {{ background: var(--green); }}
    .task-icon.status-ready, .task-icon.status-running {{ background: var(--orange); }}
    .task-row strong {{ display: block; font-size: 13px; }}
    .task-row p {{ color: var(--muted); font-size: 12px; margin-top: 2px; }}
    .state-tag {{ font-style: normal; font-size: 12px; color: #20a96d; background: #eaf8f1; border-radius: 999px; padding: 4px 8px; }}
    .state-ready, .state-running {{ color: #bd741d; background: #fff4df; }}
    .state-failed, .state-blocked {{ color: #d94352; background: #fff0f2; }}
    .activity-row {{ grid-template-columns: 12px minmax(0,1fr); align-items: start; }}
    .activity-dot {{ width: 10px; height: 10px; margin-top: 4px; border-radius: 999px; background: var(--blue); box-shadow: 0 0 0 4px rgba(77,141,255,.12); }}
    .activity-dot.agent {{ background: var(--purple); }}
    .activity-dot.node {{ background: var(--green); }}
    .activity-row p {{ color: #526176; font-size: 13px; line-height: 1.45; }}
    .activity-row strong {{ color: var(--text); }}
    .gate-panel, .raw-json {{ margin-top: 16px; padding: 16px 18px; }}
    .gate-panel h2 {{ font-size: 16px; margin-bottom: 8px; }}
    .pass-line {{ color: #20a96d; font-weight: 750; }}
    ul {{ margin: 0; padding-left: 18px; }}
    li {{ margin: 2px 0; color: #526176; }}
    .raw-json summary {{ cursor: pointer; font-weight: 800; }}
    pre {{ overflow: auto; margin: 12px 0 0; padding: 14px; border-radius: 14px; background: #101828; color: #e8f0ff; font-size: 12px; line-height: 1.5; }}
    .empty-panel {{ color: var(--muted); padding: 12px; }}
    @keyframes node-in {{ to {{ opacity: 1; transform: translateY(0); }} }}
    @media (max-width: 1280px) {{
      .app {{ grid-template-columns: 1fr; }}
      .sidebar {{ display: none; }}
      .dashboard {{ grid-template-columns: 1fr; }}
    }}
    @media (max-width: 860px) {{
      .main {{ padding: 16px; }}
      .topbar, .metric-grid, .lane-stream {{ grid-template-columns: 1fr; }}
      .stream-track {{ grid-auto-flow: row; grid-auto-columns: auto; grid-template-columns: 1fr; overflow: visible; }}
      .stream-track::before {{ display: none; }}
      .node-edges {{ grid-template-columns: 1fr; }}
    }}
  </style>
</head>
<body>
  <div class="app">
    <aside class="sidebar">
      <div class="brand">
        <span class="brand-bot">J</span>
        <div>
          <h1>Agent 办公室</h1>
          <p>智能协作，高效完成任务</p>
        </div>
      </div>
      <span class="nav-title">总览</span>
      <a class="nav-link active" href="#"><span>首页概览</span><strong>{len(nodes)}</strong></a>
      <a class="nav-link" href="#agents"><span>我的 Agents</span><strong>{len(agents)}</strong></a>
      <a class="nav-link" href="#gate"><span>拓扑校验</span><strong>{len(warnings)}</strong></a>
      <span class="nav-title">泳道</span>
      <nav>{lane_nav}</nav>
      <div class="profile">
        <span>C</span>
        <div>
          <strong>Controller</strong>
          <p>运行总控</p>
        </div>
      </div>
    </aside>
    <main class="main">
      <header class="topbar">
        <div class="hello">
          <h2>您好，项目总控</h2>
          <p>{esc(title)} · Gate {esc(gate)} · {esc(verdict)} · {esc(generated_at)}</p>
        </div>
        <div class="searchbox">搜索 Agents、任务、知识库或证据节点</div>
      </header>
      <section class="metric-grid">
        <article class="metric"><span class="metric-icon">A</span><div><span>活跃 Agents</span><strong>{active_agents}</strong><p>共 {len(agents)} 个代理</p></div></article>
        <article class="metric"><span class="metric-icon">R</span><div><span>运行中任务</span><strong>{active_nodes}</strong><p>需要持续观察</p></div></article>
        <article class="metric"><span class="metric-icon">D</span><div><span>已完成任务</span><strong>{done_nodes}</strong><p>证据闭合后保留</p></div></article>
        <article class="metric"><span class="metric-icon">E</span><div><span>测试 / 证据</span><strong>{evidence_nodes}</strong><p>每步都要咬合</p></div></article>
      </section>
      <div class="dashboard">
        <section class="card">
          <div class="card-head">
            <div>
              <h2>泳道流式执行</h2>
              <p>关键节点直接显示对应 Agent 的运行内容、测试证据、依赖和下一步。</p>
            </div>
            <nav class="lane-nav">{lane_nav}</nav>
          </div>
          <div class="lane-board">{lane_streams}</div>
        </section>
        <aside class="side-stack" id="agents">
          <section class="card">
            <div class="card-head">
              <div>
                <h2>我的 Agents</h2>
                <p>同步右侧对话镜像</p>
              </div>
            </div>
            <div class="agent-list">{agent_console}</div>
          </section>
          <section class="card">
            <div class="card-head"><h2>最近任务</h2></div>
            <div class="task-list">{render_recent_tasks_v4(nodes)}</div>
          </section>
          <section class="card">
            <div class="card-head"><h2>活动动态</h2></div>
            <div class="activity-list">{render_activity_v4(nodes, agents)}</div>
          </section>
        </aside>
      </div>
      <section class="card gate-panel" id="gate">
        <h2>拓扑校验</h2>
        {warning_html}
      </section>
      <details class="card raw-json">
        <summary>查看原始 Graph JSON</summary>
        <pre>{raw_json}</pre>
      </details>
    </main>
  </div>
</body>
</html>
"""


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path, help="project agent graph JSON")
    parser.add_argument("-o", "--output", type=Path, default=None, help="output HTML path")
    parser.add_argument("--strict", action="store_true", help="fail when topology warnings exist")
    args = parser.parse_args()

    data = json.loads(args.input.read_text(encoding="utf-8"))
    graph = normalize_graph(data)
    warnings = validate_nodes(graph["nodes"], graph.get("agents") or [])
    if args.strict and warnings:
        for warning in warnings:
            print(f"WARNING: {warning}")
        return 2

    output = args.output or args.input.with_suffix(".html")
    output.write_text(build_html_v4(graph, args.input, warnings), encoding="utf-8", newline="\n")
    print(f"Wrote {output}")
    if warnings:
        print(f"Topology warnings: {len(warnings)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
