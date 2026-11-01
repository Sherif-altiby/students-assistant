import assert from 'node:assert/strict';
import test from 'node:test';
import { listNotificationsSchema, notificationIdSchema } from './notification.routes';

test('notification list validation accepts Express request fields and paginated query values', () => {
  const parsed = listNotificationsSchema.parse({
    body: {},
    params: {},
    query: { page: '1', limit: '20' },
  });

  assert.deepEqual(parsed.query, { page: 1, limit: 20 });
});

test('notification read validation accepts the request shape passed by validate middleware', () => {
  const parsed = notificationIdSchema.parse({
    body: {},
    params: { id: '214dbc54-539d-4c8d-b754-4834bec8281f' },
    query: {},
  });

  assert.equal(parsed.params.id, '214dbc54-539d-4c8d-b754-4834bec8281f');
});
