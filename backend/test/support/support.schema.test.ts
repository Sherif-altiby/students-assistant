import assert from "node:assert/strict";
import test from "node:test";
import request from "supertest";
import { setMeetingLinkSchema } from "../../src/modules/support/support.schema";

test("meeting links must be absolute HTTPS URLs", () => {
  assert.equal(
    setMeetingLinkSchema.safeParse({
      meetingLink: "https://meet.example.com/session",
    }).success,
    true,
  );
  assert.equal(
    setMeetingLinkSchema.safeParse({
      meetingLink: "HTTPS://meet.example.com/session",
    }).success,
    true,
  );

  for (const meetingLink of [
    "javascript:alert(document.domain)",
    "data:text/html,<script>alert(1)</script>",
    "http://meet.example.com/session",
    "//meet.example.com/session",
  ]) {
    assert.equal(
      setMeetingLinkSchema.safeParse({ meetingLink }).success,
      false,
      `${meetingLink} should be rejected`,
    );
  }
});

test("meeting-link endpoint rejects javascript URLs before persistence", async () => {
  process.env.NODE_ENV = "test";
  process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
  process.env.JWT_ACCESS_SECRET = "test-access-secret-with-at-least-32-characters";
  process.env.JWT_REFRESH_SECRET = "test-refresh-secret-with-at-least-32-characters";
  process.env.MAILTRAP_HOST = "localhost";
  process.env.MAILTRAP_USER = "test";
  process.env.MAILTRAP_PASS = "test";
  process.env.FRONTEND_URL = "https://example.test";

  const [{ createApp }, { jwtService }] = await Promise.all([
    import("../../src/app"),
    import("../../src/utils/Jwt"),
  ]);
  const token = jwtService.signAccessToken({
    id: "c0a80123-4567-489a-8abc-123456789abc",
    email: "doctor@example.test",
    role: "DOCTOR",
  });

  const response = await request(createApp())
    .patch("/api/v1/support/slots/c0a80123-4567-489a-8abc-123456789abd/meeting-link")
    .set("Authorization", `Bearer ${token}`)
    .send({ meetingLink: "javascript:alert(document.domain)" });

  assert.equal(response.status, 400);
  assert.equal(response.body.message, "Validation failed");
});
