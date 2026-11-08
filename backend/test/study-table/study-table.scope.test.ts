import assert from 'node:assert/strict';
import test from 'node:test';
import { getSubjectScopeWhere } from '../../src/modules/study-table/study-table.scope';

test('subject scope loads the full catalog for ALL and filters explicit subject IDs', () => {
  assert.deepEqual(getSubjectScopeWhere('ALL'), {});
  assert.deepEqual(getSubjectScopeWhere(['subject-a', 'subject-b']), {
    id: { in: ['subject-a', 'subject-b'] },
  });
});

test('subject scope combines selected IDs with shared and student-owned subjects', () => {
  assert.deepEqual(getSubjectScopeWhere(['subject-a'], 'student-1'), {
    AND: [
      { id: { in: ['subject-a'] } },
      { OR: [{ ownerId: null }, { ownerId: 'student-1' }] },
    ],
  });
});

test('ALL subject scope excludes other students’ private subjects', () => {
  assert.deepEqual(getSubjectScopeWhere('ALL', 'student-1'), {
    AND: [
      {},
      { OR: [{ ownerId: null }, { ownerId: 'student-1' }] },
    ],
  });
});
