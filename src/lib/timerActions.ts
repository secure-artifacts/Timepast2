import { api } from "./api";
import { isoToDateInput, isoToTimeInput } from "./time";
import type { ActiveTimer } from "./types";

export async function finishActiveTimer(
  timer: ActiveTimer,
  setActiveTimer: (value: ActiveTimer | null) => void,
  refresh: () => Promise<void>,
  setStatus: (value: string) => void
) {
  const start = new Date(timer.startedAt);
  const end = new Date();
  if (end <= start) end.setTime(start.getTime() + 60000);

  const saveSegment = (entryDate: string, startTime: string, endTime: string) => api.saveTimeEntry({
    entryDate,
    startTime,
    endTime,
    eventTypeId: timer.eventTypeId,
    note: timer.note || "",
    sourceMode: "timer"
  });
  let segmentStart = new Date(start);
  let savedSegments = 0;
  while (isoToDateInput(segmentStart.toISOString()) !== isoToDateInput(end.toISOString())) {
    const startTime = isoToTimeInput(segmentStart.toISOString());
    if (startTime < "23:59") {
      await saveSegment(isoToDateInput(segmentStart.toISOString()), startTime, "23:59");
      savedSegments += 1;
    }
    segmentStart = new Date(segmentStart.getFullYear(), segmentStart.getMonth(), segmentStart.getDate() + 1);
  }
  const finalStart = isoToTimeInput(segmentStart.toISOString());
  const finalEnd = isoToTimeInput(end.toISOString());
  if (finalStart < finalEnd) {
    await saveSegment(isoToDateInput(segmentStart.toISOString()), finalStart, finalEnd);
    savedSegments += 1;
  }
  setActiveTimer(null);
  await refresh();
  setStatus(savedSegments > 1 ? `已保存 ${savedSegments} 段跨日打卡` : "半自动打卡已保存");
}
