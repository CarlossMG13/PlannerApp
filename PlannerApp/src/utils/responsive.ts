import { useWindowDimensions } from "react-native";

export const TABLET_BREAKPOINT = 768;
export const CONTENT_MAX_WIDTH = 720;
export const AUTH_MAX_WIDTH = 480;

export function useLayout() {
  const { width, height } = useWindowDimensions();
  const isTablet = width >= TABLET_BREAKPOINT;
  return { width, height, isTablet };
}

/** Centered max-width container — use in contentContainerStyle or as a View style */
export const centered = {
  width: "100%" as const,
  maxWidth: CONTENT_MAX_WIDTH,
  alignSelf: "center" as const,
};

export const centeredAuth = {
  width: "100%" as const,
  maxWidth: AUTH_MAX_WIDTH,
  alignSelf: "center" as const,
};
