import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Rect } from "@/os/geometry";

// Small pieces of shell state that several parts of the screen share.

export interface UiState {
  startOpen: boolean;
  /** The desktop icon last clicked or moved to with the arrow keys. */
  selectedIcon: string | null;
  /** The ghost outline shown while a dragged window is over a screen edge. */
  snapPreview: Rect | null;
}

const initialState: UiState = { startOpen: false, selectedIcon: null, snapPreview: null };

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    toggleStart(s) {
      s.startOpen = !s.startOpen;
    },
    openStart(s) {
      s.startOpen = true;
    },
    closeStart(s) {
      s.startOpen = false;
    },
    selectIcon(s, a: PayloadAction<string | null>) {
      s.selectedIcon = a.payload;
    },
    setSnapPreview(s, a: PayloadAction<Rect | null>) {
      s.snapPreview = a.payload;
    },
  },
});

export const uiActions = uiSlice.actions;
export default uiSlice.reducer;
