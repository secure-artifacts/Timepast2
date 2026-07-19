import React, { useEffect, useRef, useState } from "react";
import { currentMonitor, getCurrentWindow, PhysicalPosition } from "@tauri-apps/api/window";
import { Check, Maximize2, PanelTopClose, Pin, Play, Plus, Square, StickyNote, TimerReset } from "lucide-react";
import { api } from "../lib/api";
import { secondsToClock } from "../lib/time";
import type { ActiveTimer, EventType } from "../lib/types";

type MiniBarProps = {
  events: EventType[];
  activeTimer: ActiveTimer | null;
  pomodoro: number;
  alwaysOnTop: boolean;
  edgeHide: boolean;
  onAlwaysOnTopChange: (value: boolean) => void;
  onEdgeHideChange: (value: boolean) => void;
  onStart: (event: EventType) => void;
  onStop: () => void;
  onNote: () => void;
  onPomodoro: () => void;
  onAddEvent: (name: string) => Promise<number>;
  onExpand: () => void;
};

type Edge = "top" | "right" | "bottom" | "left";
type WorkArea = { x: number; y: number; width: number; height: number };

const edgeThreshold = 18;
const revealSize = 14;

export function MiniBar({
  events,
  activeTimer,
  pomodoro,
  alwaysOnTop,
  edgeHide,
  onAlwaysOnTopChange,
  onEdgeHideChange,
  onStart,
  onStop,
  onNote,
  onPomodoro,
  onAddEvent,
  onExpand
}: MiniBarProps) {
  const [selectedId, setSelectedId] = useState(0);
  const [adding, setAdding] = useState(false);
  const [newEventName, setNewEventName] = useState("");
  const [addError, setAddError] = useState("");
  const hiddenRef = useRef(false);
  const edgeHideRef = useRef(edgeHide);
  const restorePositionRef = useRef<PhysicalPosition | null>(null);
  const hideTimerRef = useRef<number | null>(null);
  const suppressHideUntilRef = useRef(0);

  useEffect(() => {
    edgeHideRef.current = edgeHide;
    if (!edgeHide && hiddenRef.current) revealFromEdge();
  }, [edgeHide]);

  useEffect(() => {
    if (!events.some((item) => item.id === selectedId)) setSelectedId(events[0]?.id || 0);
  }, [events, selectedId]);

  useEffect(() => {
    const windowRef = getCurrentWindow();
    const pending = windowRef.onMoved(async () => {
      if (hiddenRef.current) return;
      const position = await windowRef.outerPosition();
      const size = await windowRef.outerSize();
      const area = await workArea();
      if (area && !nearestEdge(position, size, area)) {
        restorePositionRef.current = null;
        suppressHideUntilRef.current = Date.now() + 800;
        clearHideTimer();
      }
      await api.saveWindowGeometry("mini-window", position.x, position.y, size.width, size.height);
    });
    return () => { pending.then((off) => off()).catch(() => undefined); };
  }, []);

  const selected = events.find((item) => item.id === selectedId);

  const drag = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!(event.target as HTMLElement).closest("button,select,input")) {
      getCurrentWindow().startDragging().catch(() => undefined);
    }
  };

  const saveNewEvent = async () => {
    if (!newEventName.trim()) {
      setAddError("请输入事件名称");
      return;
    }
    try {
      const id = await onAddEvent(newEventName);
      setSelectedId(id);
      setNewEventName("");
      setAddError("");
      setAdding(false);
    } catch (error) {
      setAddError(String(error).replace(/^Error:\s*/, "") || "保存失败");
    }
  };

  const workArea = async (): Promise<WorkArea | null> => {
    const monitor = await currentMonitor().catch(() => null);
    if (!monitor) return null;
    return {
      x: monitor.workArea.position.x,
      y: monitor.workArea.position.y,
      width: monitor.workArea.size.width,
      height: monitor.workArea.size.height
    };
  };

  const nearestEdge = (position: PhysicalPosition, size: { width: number; height: number }, area: WorkArea): Edge | null => {
    const distances: Array<[Edge, number]> = [
      ["top", Math.abs(position.y - area.y)],
      ["right", Math.abs(area.x + area.width - (position.x + size.width))],
      ["bottom", Math.abs(area.y + area.height - (position.y + size.height))],
      ["left", Math.abs(position.x - area.x)]
    ];
    const [edge, distance] = distances.sort((left, right) => left[1] - right[1])[0];
    return distance <= edgeThreshold ? edge : null;
  };

  const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

  const hiddenPosition = (edge: Edge, position: PhysicalPosition, size: { width: number; height: number }, area: WorkArea) => {
    const x = clamp(position.x, area.x, area.x + area.width - size.width);
    const y = clamp(position.y, area.y, area.y + area.height - size.height);
    switch (edge) {
      case "top":
        return new PhysicalPosition(x, area.y - size.height + revealSize);
      case "right":
        return new PhysicalPosition(area.x + area.width - revealSize, y);
      case "bottom":
        return new PhysicalPosition(x, area.y + area.height - revealSize);
      case "left":
        return new PhysicalPosition(area.x - size.width + revealSize, y);
    }
  };

  function clearHideTimer() {
    if (hideTimerRef.current === null) return;
    window.clearTimeout(hideTimerRef.current);
    hideTimerRef.current = null;
  }

  function scheduleHideToEdge() {
    clearHideTimer();
    hideTimerRef.current = window.setTimeout(() => {
      hideToEdge();
    }, 260);
  }

  async function hideToEdge() {
    if (!edgeHideRef.current || hiddenRef.current || adding || Date.now() < suppressHideUntilRef.current) return;
    const area = await workArea();
    if (!area) return;
    const windowRef = getCurrentWindow();
    const position = await windowRef.outerPosition();
    const size = await windowRef.outerSize();
    const edge = nearestEdge(position, size, area);
    if (!edge) return;
    restorePositionRef.current = position;
    hiddenRef.current = true;
    await api.saveWindowGeometry("mini-window", position.x, position.y, size.width, size.height).catch(() => undefined);
    await windowRef.setPosition(hiddenPosition(edge, position, size, area)).catch(() => undefined);
  }

  async function revealFromEdge() {
    clearHideTimer();
    const position = restorePositionRef.current;
    if (!position) return;
    suppressHideUntilRef.current = Date.now() + 800;
    hiddenRef.current = false;
    await getCurrentWindow().setPosition(position).catch(() => undefined);
  }

  return (
    <div className="mini-bar" data-tauri-drag-region onMouseDown={drag} onMouseEnter={revealFromEdge} onMouseLeave={scheduleHideToEdge}>
      <div className="mini-brand">T</div>
      {adding ? (
        <input
          className="mini-add-input"
          autoFocus
          value={newEventName}
          placeholder="事件名称"
          title={addError || "事件名称"}
          onChange={(event) => {
            setNewEventName(event.target.value);
            setAddError("");
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") saveNewEvent();
            if (event.key === "Escape") setAdding(false);
          }}
        />
      ) : (
        <select value={selectedId} disabled={!!activeTimer} onChange={(event) => setSelectedId(Number(event.target.value))}>
          {events.map((item) => (
            <option key={item.id} value={item.id}>{item.name}</option>
          ))}
        </select>
      )}
      {adding ? (
        <button className="primary" title="保存事件" onClick={saveNewEvent}><Check size={15} /></button>
      ) : (
        <button title="添加事件" onClick={() => setAdding(true)} disabled={!!activeTimer}><Plus size={15} /></button>
      )}
      {activeTimer ? (
        <button className="danger" title="结束打卡" aria-label="结束打卡" onClick={onStop}><Square size={15} /></button>
      ) : (
        <button className="primary" title="开始打卡" aria-label="开始打卡" disabled={!selected || adding} onClick={() => selected && onStart(selected)}><Play size={15} /></button>
      )}
      <button title="新建桌面便签" onClick={onNote}><StickyNote size={15} /></button>
      <button title="番茄钟" onClick={onPomodoro}><TimerReset size={15} />{pomodoro ? secondsToClock(pomodoro) : ""}</button>
      <button className={alwaysOnTop ? "active" : ""} title={alwaysOnTop ? "取消小条置顶" : "小条置顶"} onClick={() => onAlwaysOnTopChange(!alwaysOnTop)}><Pin size={15} className={alwaysOnTop ? "filled" : ""} /></button>
      <button className={edgeHide ? "active" : ""} title={edgeHide ? "关闭贴边隐藏" : "开启贴边隐藏"} onClick={() => onEdgeHideChange(!edgeHide)}><PanelTopClose size={15} /></button>
      <button title="展开主程序" onClick={onExpand}><Maximize2 size={15} /></button>
    </div>
  );
}