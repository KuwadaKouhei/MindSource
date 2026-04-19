"use client";

import { createContext, useContext } from "react";

export const ColorSchemeContext = createContext<string>("default");

export function useColorScheme() {
  return useContext(ColorSchemeContext);
}
