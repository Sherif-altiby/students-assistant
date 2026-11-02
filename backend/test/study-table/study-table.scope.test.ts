import assert from 'node:assert/strict';
import test from 'node:test';
import { getSubjectScopeWhere } from '../../src/modules/study-table/study-table.scope';

test('subject scope loads the full catalog for ALL and filters explicit subject IDs', () => {
  assert.deepEqual(getSubjectScopeWhere('ALL'), {});
  assert.deepEqual(getSubjectScopeWhere(['subject-a', 'subject-b']), {
    id: { in: ['subject-a', 'subject-b'] },
  });
});

test('subject scope combines the requested IDs with the user track catalog', () => {
  assert.deepEqual(getSubjectScopeWhere(['subject-a'], ['الفيزياء', 'الكيمياء']), {
    AND: [
      { id: { in: ['subject-a'] } },
      { title: { in: ['الفيزياء', 'الكيمياء'] } },
    ],
  });
});
