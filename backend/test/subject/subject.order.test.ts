import assert from 'node:assert/strict';
import test from 'node:test';
import { assignSyllabusOrder, moveIdToOrder, reorderIds } from '../../src/modules/subject/subject.order';

test('reordering validates a complete set and returns sequential one-based positions', () => {
  const current = [{ id: 'a', order: 1 }, { id: 'b', order: 2 }, { id: 'c', order: 3 }];
  assert.deepEqual(reorderIds(current, ['c', 'a', 'b']), [
    { id: 'c', order: 1 },
    { id: 'a', order: 2 },
    { id: 'b', order: 3 },
  ]);
  assert.equal(reorderIds(current, ['a', 'a', 'c']), null);
});

test('moving an item clamps its requested position to the current list', () => {
  const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
  assert.deepEqual(moveIdToOrder(items, 'c', 1), [{ id: 'c' }, { id: 'a' }, { id: 'b' }]);
  assert.deepEqual(moveIdToOrder(items, 'a', 99), [{ id: 'b' }, { id: 'c' }, { id: 'a' }]);
});

test('nested subject creation assigns ordered units and lessons from array positions', () => {
  assert.deepEqual(assignSyllabusOrder([
    { title: 'الوحدة الأولى', lessons: [{ title: 'الدرس الأول' }, { title: 'الدرس الثاني' }] },
    { title: 'الوحدة الثانية' },
  ]), [
    {
      title: 'الوحدة الأولى',
      order: 1,
      lessons: [{ title: 'الدرس الأول', order: 1 }, { title: 'الدرس الثاني', order: 2 }],
    },
    { title: 'الوحدة الثانية', order: 2, lessons: [] },
  ]);
});
