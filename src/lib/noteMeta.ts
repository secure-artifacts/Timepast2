import type { StickyNote } from "./types";

export type NoteMeta = {
  title?: string;
  appCollapsed?: boolean;
  desktopCollapsed?: boolean;
};

export function readNoteMeta(note: Pick<StickyNote, "styleJson">): NoteMeta {
  try {
    return JSON.parse(note.styleJson || "{}");
  } catch {
    return {};
  }
}

export function writeNoteMeta(note: Pick<StickyNote, "styleJson">, patch: NoteMeta) {
  return JSON.stringify({ ...readNoteMeta(note), ...patch });
}

export function noteTitle(note: Pick<StickyNote, "styleJson">) {
  return readNoteMeta(note).title ?? "\u4fbf\u7b7e";
}

export function withNoteTitle(note: Pick<StickyNote, "styleJson">, title: string) {
  return writeNoteMeta(note, { title: title.trim() });
}

export function isAppNoteCollapsed(note: Pick<StickyNote, "styleJson">) {
  return Boolean(readNoteMeta(note).appCollapsed);
}

export function withAppNoteCollapsed(note: Pick<StickyNote, "styleJson">, collapsed: boolean) {
  return writeNoteMeta(note, { appCollapsed: collapsed });
}

export function isDesktopNoteCollapsed(note: Pick<StickyNote, "styleJson">) {
  return Boolean(readNoteMeta(note).desktopCollapsed);
}
