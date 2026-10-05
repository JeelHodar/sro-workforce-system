import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

function toSqliteDate(date: Date) {
  const offset = date.getTimezoneOffset();
  const normalized = new Date(date.getTime() - offset * 60 * 1000);
  return normalized.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export async function ensureDemoData() {
  const ownerExists = await prisma.user.findUnique({
    where: { email: "owner@sro.com" },
  });

  if (!ownerExists) {
    await prisma.user.create({
      data: {
        name: "SRO Owner",
        email: "owner@sro.com",
        passwordHash: await hashPassword("Sro@12345"),
        role: "OWNER",
      },
    });
  }

  const workerCount = await prisma.worker.count();
  if (workerCount > 0) {
    return;
  }

  const workers = [
    { workerCode: "SRO-101", name: "John", phone: "555-1010", joiningDate: new Date("2024-01-10"), status: "ACTIVE", notes: "Lead worker" },
    { workerCode: "SRO-102", name: "Rahul", phone: "555-1011", joiningDate: new Date("2024-02-12"), status: "ACTIVE", notes: "Night shift" },
    { workerCode: "SRO-103", name: "Amit", phone: "555-1012", joiningDate: new Date("2024-03-15"), status: "ACTIVE", notes: "Site runner" },
    { workerCode: "SRO-104", name: "Priya", phone: "555-1013", joiningDate: new Date("2024-04-08"), status: "ACTIVE", notes: "Stock management" },
    { workerCode: "SRO-105", name: "Karan", phone: "555-1014", joiningDate: new Date("2024-05-21"), status: "ACTIVE", notes: "Driver" },
    { workerCode: "SRO-106", name: "Sara", phone: "555-1015", joiningDate: new Date("2024-06-03"), status: "INACTIVE", notes: "Left the company" },
  ];

  for (const worker of workers) {
    await prisma.worker.create({
      data: worker,
    });
  }

  const createdWorkers = await prisma.worker.findMany();
  const today = new Date();
  const startDate = addDays(today, -20);

  for (const worker of createdWorkers) {
    for (let i = 0; i < 20; i += 1) {
      const date = addDays(startDate, i);
      if (date.getDay() === 0 || date.getDay() === 6) {
        continue;
      }

      const attendanceStatus = ["PRESENT", "ABSENT", "LEAVE", "HALF_DAY"][i % 4];
      const boardsCarried = attendanceStatus === "PRESENT" || attendanceStatus === "HALF_DAY" ? 90 + (i % 3) * 25 : 0;
      const weightCarriedKg = attendanceStatus === "PRESENT" || attendanceStatus === "HALF_DAY" ? 1800 + (i % 4) * 350 : 0;

      await prisma.attendanceRecord.upsert({
        where: {
          workerId_date: {
            workerId: worker.id,
            date: new Date(`${toSqliteDate(date)}T00:00:00`),
          },
        },
        update: {
          attendanceStatus,
          boardsCarried,
          weightCarriedKg,
          notes: "Seeded demo record",
        },
        create: {
          workerId: worker.id,
          date: new Date(`${toSqliteDate(date)}T00:00:00`),
          attendanceStatus,
          boardsCarried,
          weightCarriedKg,
          notes: "Seeded demo record",
        },
      });
    }
  }
}
