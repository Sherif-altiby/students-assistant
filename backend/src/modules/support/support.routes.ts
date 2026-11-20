import { Router } from "express";
import { supportController } from "./support.controller";
import { authorize } from "../../middlewares/authorize";
import { authenticate } from "../../middlewares/authenticate";

const router = Router();

// All support routes require a valid access token.
router.use(authenticate);

// --- Doctor: manage availability rules ---

// Create a weekly/daily/custom availability rule and materialize its slots.
router.post("/doctors/me/availability-rules", authorize("DOCTOR"), supportController.createRule);

// List the authenticated doctor's own availability rules.
router.get("/doctors/me/availability-rules", authorize("DOCTOR"), supportController.listMyRules);

// Update one of the doctor's own rules (re-generates slots if still active).
router.patch("/doctors/me/availability-rules/:id", authorize("DOCTOR"), supportController.updateRule);

// Delete one of the doctor's own rules.
router.delete("/doctors/me/availability-rules/:id", authorize("DOCTOR"), supportController.deleteRule);

// List distinct students the doctor has an ACCEPTED or COMPLETED booking with,
// each with the lazily-created doctor-chat id and a `canSend` flag
// (true = still writable, false = read-only history) — feeds the "My Students" sidebar.
router.get("/doctors/me/students", authorize("DOCTOR"), supportController.listMyAcceptedStudents);

// --- User: browse open slots for a doctor ---

// Public-to-authenticated users: list a doctor's OPEN slots for the current month.
router.get("/doctors/:doctorId/slots", supportController.listOpenSlots);

// --- User: apply / cancel bookings ---

// Book an OPEN slot; creates a PENDING booking and marks the slot BOOKED.
router.post("/slots/:slotId/bookings", authorize("USER"), supportController.apply);

// Cancel the user's own PENDING/ACCEPTED booking; frees the slot.
router.post("/bookings/:bookingId/cancel", authorize("USER"), supportController.cancel);

// List the authenticated user's own bookings.
router.get("/users/me/bookings", authorize("USER"), supportController.listMine);

// NEW: List distinct doctors the user has an ACCEPTED booking with,
// each with the lazily-created doctor-chat id — feeds the "My Doctors" sidebar.
router.get("/users/me/doctors", authorize("USER"), supportController.listMyAcceptedDoctors);

// --- Doctor: manage bookings & slots ---

// List all bookings across the doctor's slots.
router.get("/doctors/me/bookings", authorize("DOCTOR"), supportController.listForDoctor);

// Accept or reject a PENDING booking; rejecting frees the slot.
router.post("/bookings/:bookingId/respond", authorize("DOCTOR"), supportController.respond);

// Set/replace the HTTPS meeting link on one of the doctor's own slots.
router.patch("/slots/:slotId/meeting-link", authorize("DOCTOR"), supportController.setMeetingLink);

// Mark an ACCEPTED session as COMPLETED (slot + booking) in one transaction.
router.post("/slots/:slotId/complete", authorize("DOCTOR"), supportController.completeSession);

// --- User: rate completed session ---

// Rate a COMPLETED booking (1–5 + optional comment).
router.post("/bookings/:bookingId/rating", authorize("USER"), supportController.rate);

// --- Doctor: stats ---

// Aggregated stats: completed sessions, unique beneficiaries, avg rating.
router.get("/doctor/stats", authorize("DOCTOR"), supportController.getStats);

// Latest ratings that include a comment.
router.get("/doctor/ratings", authorize("DOCTOR"), supportController.getRatings);

// Next N ACCEPTED sessions for the doctor.
router.get("/doctor/upcoming", authorize("DOCTOR"), supportController.getUpcomingSessions);

export { router as supportRouter };