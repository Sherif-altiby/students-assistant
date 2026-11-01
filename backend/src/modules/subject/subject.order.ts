export function reorderIds<T extends { id: string; order: number }>(
  current: T[],
  ids: string[],
): Array<{ id: string; order: number }> | null {
  if (current.length !== ids.length || new Set(ids).size !== ids.length
    || !ids.every((id) => current.some((item) => item.id === id))) {
    return null;
  }
  return ids.map((id, index) => ({ id, order: index + 1 }));
}

export function moveIdToOrder<T extends { id: string }>(
  items: T[],
  id: string,
  order: number,
): T[] {
  const remaining = items.filter((item) => item.id !== id);
  const item = items.find((value) => value.id === id);
  if (!item) return items;
  remaining.splice(Math.min(order - 1, remaining.length), 0, item);
  return remaining;
}

export function assignSyllabusOrder(
  units: Array<{ title: string; lessons?: Array<{ title: string }> }>,
) {
  return units.map((unit, unitIndex) => ({
    title: unit.title,
    order: unitIndex + 1,
    lessons: (unit.lessons ?? []).map((lesson, lessonIndex) => ({
      title: lesson.title,
      order: lessonIndex + 1,
    })),
  }));
}
