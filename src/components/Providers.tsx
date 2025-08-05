"use client";

import { useState } from "react";
import { Provider } from "react-redux";
import { makeStore } from "@/store/store";

/** The desktop's Redux store. Other routes only need the root theme provider. */
export function Providers({ children }: { children: React.ReactNode }) {
  // One store for the life of the page.
  const [store] = useState(makeStore);
  return (
    <Provider store={store}>{children}</Provider>
  );
}
