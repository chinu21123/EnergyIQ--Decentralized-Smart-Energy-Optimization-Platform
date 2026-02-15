from __future__ import annotations

from datetime import datetime, timezone
from random import uniform
from typing import Literal

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(title="EnergyFlow Self-Healing API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


NodeStatus = Literal["stable", "warning", "faulty"]
HealingStatus = Literal["STABLE", "FAULT_DETECTED"]


class TrustNode(BaseModel):
    node_id: str
    trust_score: float
    status: NodeStatus
    last_update: str


class AggregateRequest(BaseModel):
    node_count: int = Field(default=8, ge=3, le=50)


class AggregateResponse(BaseModel):
    nodes: list[TrustNode]
    stable_count: int
    at_risk_count: int
    network_health: float


class SelfHealRequest(BaseModel):
    node_id: str = Field(min_length=3, max_length=40)
    voltage: float = Field(ge=150, le=300)
    load: float = Field(ge=0, le=100)
    battery_level: float = Field(ge=0, le=100)


class SelfHealResponse(BaseModel):
    status: HealingStatus
    action_taken: str
    grid_status: str
    updated_load: float
    updated_battery: float
    risk_score: float


def trust_status(score: float) -> NodeStatus:
    if score > 70:
        return "stable"
    if score > 40:
        return "warning"
    return "faulty"


def generate_trust_nodes(node_count: int) -> list[TrustNode]:
    now = datetime.now(timezone.utc).isoformat()
    nodes: list[TrustNode] = []
    for i in range(node_count):
        score = round(uniform(25, 98), 1)
        nodes.append(
            TrustNode(
                node_id=f"NODE-{i+1:03d}",
                trust_score=score,
                status=trust_status(score),
                last_update=now,
            )
        )
    return nodes


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/aggregate", response_model=AggregateResponse)
def aggregate(payload: AggregateRequest) -> AggregateResponse:
    nodes = generate_trust_nodes(payload.node_count)
    stable_count = sum(1 for n in nodes if n.status == "stable")
    at_risk_count = len(nodes) - stable_count
    network_health = round((stable_count / len(nodes)) * 100, 1) if nodes else 0.0
    return AggregateResponse(
        nodes=nodes,
        stable_count=stable_count,
        at_risk_count=at_risk_count,
        network_health=network_health,
    )


@app.post("/self-heal", response_model=SelfHealResponse)
def self_heal(payload: SelfHealRequest) -> SelfHealResponse:
    voltage_delta = abs(payload.voltage - 230.0)
    load_pressure = max(0.0, payload.load - 75.0)
    battery_pressure = max(0.0, 45.0 - payload.battery_level)

    risk_score = round(min(100.0, voltage_delta * 1.6 + load_pressure * 1.1 + battery_pressure * 1.2), 2)

    if risk_score < 30:
        return SelfHealResponse(
            status="STABLE",
            action_taken="No intervention required",
            grid_status="NORMAL",
            updated_load=round(payload.load, 2),
            updated_battery=round(payload.battery_level, 2),
            risk_score=risk_score,
        )

    target_load = max(35.0, payload.load - 18.0)
    target_battery = min(98.0, payload.battery_level + 12.0)
    return SelfHealResponse(
        status="FAULT_DETECTED",
        action_taken="Load redistributed to trusted nodes and battery reserve increased",
        grid_status="RECOVERY",
        updated_load=round(target_load, 2),
        updated_battery=round(target_battery, 2),
        risk_score=risk_score,
    )
