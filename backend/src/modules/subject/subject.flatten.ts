export interface LegacyLessonNode {
  id: string;
  title: string;
  order: number;
  children?: LegacyLessonNode[];
}

export interface LegacyUnitNode {
  id: string;
  subjectId: string;
  title: string;
  order: number;
  children?: LegacyUnitNode[];
  lessons?: LegacyLessonNode[];
}

export interface FlatUnit {
  id: string;
  subjectId: string;
  title: string;
  order: number;
  lessons: Array<{ id: string; title: string; order: number }>;
}

export interface FlattenedCatalog {
  units: FlatUnit[];
  removedLessonIds: string[];
}

function compareOrder<T extends { id: string; order: number }>(left: T, right: T): number {
  return left.order - right.order || left.id.localeCompare(right.id);
}

export function flattenLegacyCatalog(legacyUnits: LegacyUnitNode[]): FlattenedCatalog {
  const flattenedUnits: Array<{ unit: FlatUnit; orderPath: number[]; index: number }> = [];
  const removedLessonIds: string[] = [];

  const flattenLessons = (nodes: LegacyLessonNode[], parentTitles: string[] = []) => {
    const orderedNodes = [...nodes].sort(compareOrder);
    const leaves: Array<{ id: string; title: string; orderPath: number[] }> = [];
    const visit = (node: LegacyLessonNode, titlePath: string[], orderPath: number[]) => {
      const currentPath = [...titlePath, node.title];
      const currentOrder = [...orderPath, node.order];
      if (!node.children?.length) {
        leaves.push({ id: node.id, title: currentPath.join(' › '), orderPath: currentOrder });
        return;
      }
      removedLessonIds.push(node.id);
      [...node.children].sort(compareOrder).forEach((child) =>
        visit(child, currentPath, currentOrder),
      );
    };
    orderedNodes.forEach((node) => visit(node, parentTitles, []));
    leaves.sort((left, right) => {
      for (let index = 0; index < Math.min(left.orderPath.length, right.orderPath.length); index += 1) {
        const orderDifference = left.orderPath[index]! - right.orderPath[index]!;
        if (orderDifference) return orderDifference;
      }
      return left.orderPath.length - right.orderPath.length || left.id.localeCompare(right.id);
    });
    return leaves.map(({ id, title }, index) => ({ id, title, order: index + 1 }));
  };

  const visitUnit = (unit: LegacyUnitNode, titlePath: string[], orderPath: number[]) => {
    const currentTitles = [...titlePath, unit.title];
    const currentOrder = [...orderPath, unit.order];
    flattenedUnits.push({
      unit: {
        id: unit.id,
        subjectId: unit.subjectId,
        title: currentTitles.join(' › '),
        order: 0,
        lessons: flattenLessons(unit.lessons ?? []),
      },
      orderPath: currentOrder,
      index: flattenedUnits.length,
    });
    [...(unit.children ?? [])].sort(compareOrder).forEach((child) =>
      visitUnit(child, currentTitles, currentOrder),
    );
  };

  [...legacyUnits].sort(compareOrder).forEach((unit) => visitUnit(unit, [], []));
  const orderBySubject = new Map<string, number>();
  const orderedUnits = flattenedUnits
    .sort((left, right) => {
      const subjectOrder = left.unit.subjectId.localeCompare(right.unit.subjectId);
      if (subjectOrder) return subjectOrder;
      for (let index = 0; index < Math.min(left.orderPath.length, right.orderPath.length); index += 1) {
        const orderDifference = left.orderPath[index]! - right.orderPath[index]!;
        if (orderDifference) return orderDifference;
      }
      const orderDifference = left.orderPath.length - right.orderPath.length;
      return orderDifference || left.index - right.index;
    })
    .map(({ unit }) => {
      const order = (orderBySubject.get(unit.subjectId) ?? 0) + 1;
      orderBySubject.set(unit.subjectId, order);
      return { ...unit, order };
    });

  return { units: orderedUnits, removedLessonIds };
}
