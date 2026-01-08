import { configureStore, type ThunkAction, type UnknownAction } from "@reduxjs/toolkit";
import ask from "./askSlice";
import settings from "./settingsSlice";
import ui from "./uiSlice";
import windows from "./windowsSlice";

export function makeStore() {
  return configureStore({ reducer: { windows, ui, ask, settings } });
}

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
export type AppThunk = ThunkAction<void, RootState, unknown, UnknownAction>;
