import { PrescriptionStatus, AnchorStrategy } from "@prisma/client";
import { getAuthenticatedUserId } from "../utils/auth";

export const prescriptionResolvers = {
  Query: {
    /**
     * Get all prescriptions for the authenticated user
     * @returns Array of prescriptions ordered by nextDueAt
     */
    prescriptions: async (_: any, __: any, context: any) => {
      const userId = getAuthenticatedUserId(context);

      return context.prisma.prescription.findMany({
        where: { userId },
        orderBy: { nextDueAt: "asc" },
      });
    },

    /**
     * Get a single prescription by ID if it belongs to the authenticated user
     * @returns Prescription or null if not found
     */
    prescription: async (_: any, { id }: { id: string }, context: any) => {
      const userId = getAuthenticatedUserId(context);

      return context.prisma.prescription.findFirst({
        where: {
          id,
          userId,
        },
      });
    },

    /**
     * Get upcoming doses for the authenticated user
     * @returns Array of prescriptions with upcoming due dates
     */
    upcomingDoses: async (
      _: any,
      { limit = 10 }: { limit: number },
      context: any
    ) => {
      const userId = getAuthenticatedUserId(context);
      const now = new Date();

      return context.prisma.prescription.findMany({
        where: {
          userId,
          status: PrescriptionStatus.ACTIVE,
          nextDueAt: { gte: now },
          endDate: { gte: now },
        },
        orderBy: { nextDueAt: "asc" },
        take: limit,
      });
    },
  },

  Mutation: {
    /**
     * Create a new prescription for the authenticated user
     * @returns Newly created prescription
     */
    createPrescription: async (
      _: any,
      {
        drugName,
        dosage,
        intervalHours,
        startDate,
        endDate,
        anchorStrategy = AnchorStrategy.FROM_LAST_TAKEN,
        notes,
      }: {
        drugName: string;
        dosage: string;
        intervalHours: number;
        startDate: string;
        endDate: string;
        anchorStrategy?: AnchorStrategy;
        notes?: string;
      },
      context: any
    ) => {
      const userId = getAuthenticatedUserId(context);

      // Validate interval is positive
      if (intervalHours <= 0) {
        throw new Error("Interval hours must be greater than 0");
      }

      const start = new Date(startDate);
      const end = new Date(endDate);

      // Validate date range
      if (start >= end) {
        throw new Error("End date must be after start date");
      }

      // Set initial nextDueAt to startDate
      const nextDueAt = new Date(start);

      return context.prisma.prescription.create({
        data: {
          drugName,
          dosage,
          intervalHours,
          startDate: start,
          endDate: end,
          anchorStrategy,
          nextDueAt,
          notes,
          userId,
          status: PrescriptionStatus.ACTIVE,
        },
      });
    },

    /**
     * Mark a dose as taken and calculate the next due time
     * @returns Object containing the updated prescription ID, nextDueAt, and status
     */
    markDoseTaken: async (
      _: any,
      { prescriptionId }: { prescriptionId: string },
      context: any
    ) => {
      const userId = getAuthenticatedUserId(context);
      const now = new Date();

      // Find the prescription with a lock to prevent race conditions
      const rx = await context.prisma.prescription.findFirst({
        where: {
          id: prescriptionId,
          userId,
          status: PrescriptionStatus.ACTIVE,
        },
      });

      if (!rx) {
        throw new Error("Active prescription not found");
      }

      // Calculate next due time based on anchor strategy
      const anchorTime =
        rx.anchorStrategy === AnchorStrategy.FROM_SCHEDULED_TIME
          ? rx.nextDueAt
          : now;

      const nextDueCandidate = new Date(
        anchorTime.getTime() + rx.intervalHours * 60 * 60 * 1000
      );

      // Check if this is the last dose
      const isCompleted = nextDueCandidate > rx.endDate;
      const status = isCompleted ? PrescriptionStatus.COMPLETED : rx.status;

      // Create a dose event
      await context.prisma.doseEvent.create({
        data: {
          prescriptionId: rx.id,
          userId,
          action: "TAKEN",
          occurredAt: now,
          scheduledFor: rx.nextDueAt,
          latencyMinutes: Math.round(
            (now.getTime() - rx.nextDueAt.getTime()) / (60 * 1000)
          ),
        },
      });

      // Update the prescription
      const updated = await context.prisma.prescription.update({
        where: { id: rx.id },
        data: {
          lastTakenAt: now,
          nextDueAt: isCompleted ? rx.nextDueAt : nextDueCandidate,
          dosesTaken: { increment: 1 },
          status,
        },
      });

      return {
        id: updated.id,
        nextDueAt: updated.nextDueAt,
        status: updated.status,
      };
    },

    /**
     * Update a prescription's status
     * @returns The updated prescription
     */
    updatePrescriptionStatus: async (
      _: any,
      {
        input,
      }: { input: { prescriptionId: string; status: PrescriptionStatus } },
      context: any
    ) => {
      const userId = getAuthenticatedUserId(context);
      const { prescriptionId, status } = input;

      // Verify the prescription belongs to the user
      const prescription = await context.prisma.prescription.findFirst({
        where: {
          id: prescriptionId,
          userId,
        },
      });

      if (!prescription) {
        throw new Error("Prescription not found");
      }

      return context.prisma.prescription.update({
        where: { id: prescriptionId },
        data: { status },
      });
    },
  },

  // Field resolvers
  Prescription: {
    /**
     * Resolve the user field for Prescription type
     */
    user: (parent: any, _: any, context: any) => {
      return context.prisma.user.findUnique({
        where: { id: parent.userId },
      });
    },

    /**
     * Resolve the doseEvents field for Prescription type
     */
    doseEvents: (parent: any, _: any, context: any) => {
      return context.prisma.doseEvent.findMany({
        where: { prescriptionId: parent.id },
        orderBy: { occurredAt: "desc" },
      });
    },
  },

  DoseEvent: {
    /**
     * Resolve the prescription field for DoseEvent type
     */
    prescription: (parent: any, _: any, context: any) => {
      return context.prisma.prescription.findUnique({
        where: { id: parent.prescriptionId },
      });
    },

    /**
     * Resolve the user field for DoseEvent type
     */
    user: (parent: any, _: any, context: any) => {
      return context.prisma.user.findUnique({
        where: { id: parent.userId },
      });
    },
  },
};
