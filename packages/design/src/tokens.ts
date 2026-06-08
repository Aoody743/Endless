export const fontStacks = {
  serif:
    '"Noto Serif SC", "Source Han Serif SC", "Songti SC", "STSong", "Iowan Old Style", Georgia, serif',
  sans:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  mono:
    '"SFMono-Regular", "SF Mono", Consolas, "Liberation Mono", Menlo, monospace'
} as const;

export const radii = {
  xs: "4px",
  sm: "6px",
  md: "8px",
  lg: "12px"
} as const;

export const motion = {
  fast: "160ms",
  base: "220ms",
  slow: "360ms",
  ease: "cubic-bezier(0.2, 0.8, 0.2, 1)"
} as const;

export const spacing = {
  pageX: "clamp(1rem, 3vw, 2rem)",
  article: "min(100% - 2rem, 44rem)",
  shell: "min(100% - 2rem, 72rem)"
} as const;
