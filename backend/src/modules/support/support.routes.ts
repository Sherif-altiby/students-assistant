import { Router } from "express";
 import { supportController } from "./support.controller";
import { authorize } from "../../middlewares/authorize";
import { authenticate } from "../../middlewares/authenticate";

const router = Router();

router.use(authenticate)

// --- Doctor: manage availability rules ---
router.post("/doctors/me/availability-rules" , authorize("DOCTOR"), supportController.createRule);
router.get("/doctors/me/availability-rules" , authorize("DOCTOR"), supportController.listMyRules);
router.patch("/doctors/me/availability-rules/:id" , authorize("DOCTOR"), supportController.updateRule);
router.delete("/doctors/me/availability-rules/:id" , authorize("DOCTOR"), supportController.deleteRule);

// --- User: browse open slots for a doctor ---
router.get("/doctors/:doctorId/slots" , supportController.listOpenSlots);

// --- User: apply / cancel bookings ---
router.post("/slots/:slotId/bookings" , authorize("USER"), supportController.apply);
router.post("/bookings/:bookingId/cancel" , authorize("USER"), supportController.cancel);
router.get("/users/me/bookings" , authorize("USER"), supportController.listMine);

// --- Doctor: manage bookings & slots ---
router.get("/doctors/me/bookings" , authorize("DOCTOR"), supportController.listForDoctor);
router.post("/bookings/:bookingId/respond" , authorize("DOCTOR"), supportController.respond);
router.patch("/slots/:slotId/meeting-link" , authorize("DOCTOR"), supportController.setMeetingLink);
router.post("/slots/:slotId/complete" , authorize("DOCTOR"), supportController.completeSession);

// --- User: rate completed session ---
router.post("/bookings/:bookingId/rating" , authorize("USER"), supportController.rate);

export { router as supportRouter };