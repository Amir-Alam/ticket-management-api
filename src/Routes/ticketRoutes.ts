import { Router } from "express";
import TicketController from "../Controller/ticketController";
import TicketAanalyticsController from "../Controller/ticketAnalyticsController";
import authMiddleware from "../Middleware/authMiddleware";

const router = Router();

//////////////////////////   Route to CREATE TICKET   ----------------------->
router.post("/ticket", authMiddleware, TicketController.createTicketController);

//////////////////////////   Route to AASIGN TICKET to users   ----------------------->
router.post(
  "/tickets/:ticketId/assign",
  authMiddleware,
  TicketController.assignTicketController
);

//////////////////////////   Route to FETCH TICKET DETAILS   ----------------------->
router.post(
  "/tickets/:ticketId",
  authMiddleware,
  TicketController.ticketDetailsController
);

//////////////////////////   Route to DISPLAY DASHBOARD ANALYTICS TICKET DETAILS   ----------------------->
router.get(
  "/tickets/analytics",
  authMiddleware,
  TicketAanalyticsController.getTicketAnalytics
);

//////////////////////////   Route to DISPLAY DASHBOARD ANALYTICS TICKET DETAILS   ----------------------->
router.get(
  "/dashboard/analytics",
  authMiddleware,
  TicketAanalyticsController.getTicketDashboardAnalytics
);
export default router;
