// import { PrismaClient } from "@prisma/client";
// import { addHours, addDays, addWeeks, parseISO } from "date-fns";

// type Frequency = "HOURLY" | "DAILY" | "WEEKLY" | "BIWEEKLY" | "MONTHLY";

// export async function generateReminders(
//   prisma: PrismaClient,
//   prescriptionId: string,
//   frequency: string,
//   startDate: Date,
//   endDate: Date,
//   timeOfDay: string = "09:00"
// ) {
//   const [hours, minutes] = timeOfDay.split(":").map(Number);

//   // Set the initial reminder time
//   let currentDate = new Date(startDate);
//   currentDate.setHours(hours, minutes, 0, 0);

//   const reminders = [];

//   // Generate reminders based on frequency
//   while (currentDate <= endDate) {
//     reminders.push({
//       prescriptionId,
//       time: currentDate,
//       status: "PENDING",
//     });

//     // Move to next reminder time based on frequency
//     switch (frequency.toUpperCase() as Frequency) {
//       case "HOURLY":
//         currentDate = addHours(currentDate, 1);
//         break;
//       case "DAILY":
//         currentDate = addDays(currentDate, 1);
//         break;
//       case "WEEKLY":
//         currentDate = addDays(currentDate, 7);
//         break;
//       case "BIWEEKLY":
//         currentDate = addWeeks(currentDate, 2);
//         break;
//       case "MONTHLY":
//         currentDate = addDays(currentDate, 30); // Approximate month
//         break;
//       default:
//         // Default to daily if frequency is not recognized
//         currentDate = addDays(currentDate, 1);
//     }
//   }

//   // Create all reminders in a single transaction
//   if (reminders.length > 0) {
//     await prisma.reminder.createMany({
//       data: reminders,
//     });
//   }

//   return reminders.length;
// }
