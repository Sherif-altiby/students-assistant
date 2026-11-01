import assert from 'node:assert/strict';
import test from 'node:test';
import { getSubjectScopeWhere } from './study-table.scope';

test('subject scope loads the full catalog for ALL and filters explicit subject IDs', () => {
  assert.deepEqual(getSubjectScopeWhere('ALL'), {});
  assert.deepEqual(getSubjectScopeWhere(['subject-a', 'subject-b']), {
    id: { in: ['subject-a', 'subject-b'] },
  });
});
