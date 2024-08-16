import { submitQuestion } from "@/store/askSlice";
import type { AppThunk } from "@/store/store";
import { uiActions } from "@/store/uiSlice";
import { windowsActions, type WinProps } from "@/store/windowsSlice";
import { appDef } from "./apps";
import { rememberOpener, restoreOpener } from "./windowFocus";

// What the shell does when the visitor asks for something. Components call
// these and never build window ids or titles themselves.

export const openApp =
  (id: string, props?: WinProps): AppThunk =>
  (dispatch) => {
    const def = appDef(id);
    if (!def) return;
    rememberOpener(id);
    dispatch(
      windowsActions.open({
        id,
        title: def.title,
        size: def.size,
        anchor: def.anchor,
        props: props ? { ...props, nonce: props.nonce ?? Date.now() } : undefined,
      }),
    );
    dispatch(uiActions.closeStart());
  };

export const activateApp = (id: string): AppThunk => (dispatch, getState) => {
  const { byId, focusedId } = getState().windows;
  if (byId[id]?.minimized || focusedId !== id) rememberOpener(id);
  dispatch(windowsActions.activate(id));
};

export const closeApp = (id: string): AppThunk => (dispatch, getState) => {
  if (!getState().windows.byId[id]) return;
  dispatch(windowsActions.close(id));
  // Wait for React to remove the frame and any unpinned taskbar button.
  requestAnimationFrame(() => restoreOpener(id, getState().windows.focusedId));
};

/** Opens the assistant and asks it something. */
export const askAbout =
  (question: string): AppThunk<Promise<void>> =>
  (dispatch) => {
    dispatch(openApp("ask"));
    return dispatch(submitQuestion(question));
  };
