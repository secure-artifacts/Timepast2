import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Copy, Edit3, Trash2 } from "lucide-react";
import { api } from "../../lib/api";
import { copyTextForEntry } from "../../lib/time";
import type { EventType, TimeEntry } from "../../lib/types";

type EntryListProps = {
  entries: TimeEntry[];
  events?: EventType[];
  refresh?: () => Promise<void>;
  compact?: boolean;
};

export function EntryList({ entries, events, refresh, compact = false }: EntryListProps) {
  const [editing, setEditing] = useState<TimeEntry | null>(null);
  const [pendingDelete, setPendingDelete] = useState<TimeEntry | null>(null);
  const [collapsedDates, setCollapsedDates] = useState<Set<string>>(() => new Set());
  const deleteTimerRef = useRef<number | null>(null);
  const visibleEntries = pendingDelete ? entries.filter((item) => item.id !== pendingDelete.id) : entries;
  const grouped = useMemo(() => visibleEntries.reduce<Record<string, TimeEntry[]>>((result, item) => {
    (result[item.entryDate] ||= []).push(item);
    return result;
  }, {}), [visibleEntries]);

  useEffect(() => () => {
    if (deleteTimerRef.current) window.clearTimeout(deleteTimerRef.current);
  }, []);

  const saveEdit = async () => {
    if (!editing || !refresh) return;
    await api.saveTimeEntry({ ...editing });
    setEditing(null);
    await refresh();
  };

  const stageDelete = (entry: TimeEntry) => {
    if (pendingDelete) return;
    setPendingDelete(entry);
    deleteTimerRef.current = window.setTimeout(async () => {
      await api.deleteTimeEntry(entry.id);
      setPendingDelete(null);
      deleteTimerRef.current = null;
      await refresh?.();
    }, 8000);
  };

  const undoDelete = () => {
    if (deleteTimerRef.current) window.clearTimeout(deleteTimerRef.current);
    deleteTimerRef.current = null;
    setPendingDelete(null);
  };

  return (
    <div className={compact ? "entry-list compact" : "entry-list"}>
      {pendingDelete && (
        <div className="delete-undo" role="status">
          <span>“{pendingDelete.eventName}” 已移入待删除</span>
          <button onClick={undoDelete}>撤回</button>
        </div>
      )}
      {Object.entries(grouped).map(([date, items]) => (
        <div className="entry-day" key={date}>
          <button className="entry-day-head" onClick={() => setCollapsedDates((current) => { const next = new Set(current); if (next.has(date)) next.delete(date); else next.add(date); return next; })} aria-expanded={!collapsedDates.has(date)}><ChevronDown size={16} className={collapsedDates.has(date) ? "collapsed" : ""} /><strong>{date}</strong><span>{items.length} 条记录</span></button>
          {!collapsedDates.has(date) && items.map((item) => editing?.id === item.id ? (
            <div className="entry-edit" key={item.id}>
              <input type="date" value={editing.entryDate} onChange={(event) => setEditing({ ...editing, entryDate: event.target.value })} />
              <input type="time" value={editing.startTime} onChange={(event) => setEditing({ ...editing, startTime: event.target.value })} />
              <input type="time" value={editing.endTime} onChange={(event) => setEditing({ ...editing, endTime: event.target.value })} />
              <select value={editing.eventTypeId} onChange={(event) => setEditing({ ...editing, eventTypeId: Number(event.target.value) })}>
                {events?.map((event) => <option key={event.id} value={event.id}>{event.name}</option>)}
              </select>
              <input value={editing.note} placeholder="备注" onChange={(event) => setEditing({ ...editing, note: event.target.value })} />
              <button className="primary" onClick={saveEdit}>保存</button>
              <button onClick={() => setEditing(null)}>取消</button>
            </div>
          ) : (
            <div className="entry-row" key={item.id}>
              <span className="dot" style={{ background: item.eventColor }} />
              <strong>{item.startTime}-{item.endTime}</strong>
              <span>{item.eventName}</span>
              <em>{item.note || "无备注"}</em>
              <button title="复制记录" aria-label="复制记录" onClick={() => navigator.clipboard.writeText(copyTextForEntry(item))}><Copy size={15} /></button>
              {!compact && <button title="编辑记录" aria-label="编辑记录" onClick={() => setEditing(item)}><Edit3 size={15} /></button>}
              {!compact && <button className="danger-icon" title="删除记录，可在 8 秒内撤回" aria-label="删除记录" disabled={!!pendingDelete} onClick={() => stageDelete(item)}><Trash2 size={15} /></button>}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
