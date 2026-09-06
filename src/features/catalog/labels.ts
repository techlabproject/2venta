export const CONDITION_LABEL = {
  nuevo: "Nuevo",
  usado_bueno: "Usado, buen estado",
  usado_regular: "Usado, estado regular",
} as const;

export type Condition = keyof typeof CONDITION_LABEL;
