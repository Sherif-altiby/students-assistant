import assert from 'node:assert/strict';
import test from 'node:test';
import { flattenLegacyCatalog } from '../../src/modules/subject/subject.flatten';

test('legacy hierarchy flattening preserves depth-first unit and leaf-lesson order', () => {
  const flattened = flattenLegacyCatalog([
    {
      id: 'unit-2',
      subjectId: 'subject',
      title: 'ثان',
      order: 2,
      lessons: [{ id: 'last', title: 'أخير', order: 1 }],
    },
    {
      id: 'unit-1',
      subjectId: 'subject',
      title: 'أول',
      order: 1,
      lessons: [{
        id: 'parent',
        title: 'أساس',
        order: 1,
        children: [
          { id: 'child-2', title: 'ثان', order: 2 },
          { id: 'child-1', title: 'أول', order: 1 },
        ],
      }],
      children: [{
        id: 'nested-unit',
        subjectId: 'subject',
        title: 'فرع',
        order: 1,
        lessons: [{ id: 'nested-lesson', title: 'درس', order: 1 }],
      }],
    },
  ]);

  assert.deepEqual(flattened.units.map(({ id, title, order }) => ({ id, title, order })), [
    { id: 'unit-1', title: 'أول', order: 1 },
    { id: 'nested-unit', title: 'أول › فرع', order: 2 },
    { id: 'unit-2', title: 'ثان', order: 3 },
  ]);
  assert.deepEqual(flattened.units[0]!.lessons, [
    { id: 'child-1', title: 'أساس › أول', order: 1 },
    { id: 'child-2', title: 'أساس › ثان', order: 2 },
  ]);
  assert.deepEqual(flattened.removedLessonIds, ['parent']);
});
