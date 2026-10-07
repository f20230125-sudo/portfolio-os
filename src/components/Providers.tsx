"use client";

import { useState } from "react";
import { Provider } from "react-redux";
import { makeStore } from "@/store/store";
import { ThemeProvider } from "./theme";

/** Everything the desktop shares: the Redux store and the theme. */
export function Providers({ children }: { children: React.ReactNode }) {
  // One store for the life of the page.
  const [store] = useState(makeStore);
  return (
    <Provider store={store}>
      <ThemeProvider>{children}</ThemeProvider>
    </Provider>
  );
}
