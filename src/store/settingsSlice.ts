import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface SettingsState {
  /** Overrides the device setting when the visitor wants less motion than their device asks for. */
  reduceMotion: boolean;
}

const settingsSlice = createSlice({
  name: "settings",
  initialState: { reduceMotion: false } as SettingsState,
  reducers: {
    setReduceMotion(s, a: PayloadAction<boolean>) {
      s.reduceMotion = a.payload;
    },
  },
});

export const settingsActions = settingsSlice.actions;
export default settingsSlice.reducer;
