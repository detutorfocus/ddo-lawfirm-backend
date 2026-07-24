// src/server/routers/_app.ts
import { createTRPCRouter } from "../trpc";
import { authRouter } from "./auth.router";
import { caseRouter } from "./case.router";
import { documentRouter } from "./document.router";
import { appointmentRouter } from "./appointment.router";
import { taskRouter } from "./task.router";
import { messageRouter } from "./message.router";
import { publicationRouter } from "./publication.router";
import { invoiceRouter } from "./invoice.router";
import { publicRouter } from "./public.router";
import { notificationRouter } from "./notification.router";
import { adminRouter } from "./admin.router";
import { lawyerRouter, clientRouter } from "./lawyer.router";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  case: caseRouter,
  document: documentRouter,
  appointment: appointmentRouter,
  task: taskRouter,
  message: messageRouter,
  publication: publicationRouter,
  invoice: invoiceRouter,
  public: publicRouter,
  notification: notificationRouter,
  admin: adminRouter,
  lawyer: lawyerRouter,
  client: clientRouter,
});

export type AppRouter = typeof appRouter;
