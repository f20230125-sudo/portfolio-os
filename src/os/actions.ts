import { submitQuestion } from "@/store/askSlice";
import type { AppThunk } from "@/store/store";
import { uiActions } from "@/store/uiSlice";
import { windowsActions, type WinProps } from "@/store/windowsSlice";
import { appDef } from "./apps";

// What the shell does when the visitor asks for something. Components call
// these and never build window ids or titles themselves.

export const openApp =
  (id: string, props?: WinProps): AppThunk =>
  (dispatch) => {
    const def = appDef(id);
    if (!def) return;
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

/** Opens the assistant and asks it something. */
export const askAbout =
  (question: string): AppThunk =>
  (dispatch) => {
    dispatch(openApp("ask"));
    dispatch(submitQuestion(question));
  };
