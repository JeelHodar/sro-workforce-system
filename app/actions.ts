"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import {
  clearSession,
  createSession,
  hashPassword,
  requireAuth,
  verifyPassword,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const workerSchema = z.object({
  id: z.string().optional(),
  workerCode: z.string().trim().min(1, "Worker ID is required."),
  name: z.string().trim().min(1, "Worker name is required."),
  phone: z.string().trim().optional().default(""),
  joiningDate: z.string().trim().min(1, "Joining date is required."),
  status: z.enum(["ACTIVE", "INACTIVE"]),
  notes: z.string().trim().optional().default(""),
});

const attendanceSchema = z.object({
  workerId: z.string().min(1),
  date: z.string().min(1),
  attendanceStatus: z.enum(["PRESENT", "ABSENT", "LEAVE", "HALF_DAY"]),
  boardsCarried: z.coerce.number().nonnegative(),
  weightCarriedKg: z.coerce.number().nonnegative(),
  notes: z.string().optional().default(""),
  recordId: z.string().optional(),
});

function toDateOnly(dateString: string) {
  const parsed = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Invalid date.");
  }
  return parsed;
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect("/login?error=missing-fields");
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    redirect("/login?error=invalid-credentials");
  }

  await createSession(user.id);
  redirect("/dashboard");
}

export async function logoutAction() {
  await clearSession();
  redirect("/login");
}

export async function saveWorkerAction(formData: FormData) {
  await requireAuth();

  const parsed = workerSchema.safeParse({
    id: formData.get("id") ?? undefined,
    workerCode: formData.get("workerCode"),
    name: formData.get("name"),
    phone: formData.get("phone"),
    joiningDate: formData.get("joiningDate"),
    status: formData.get("status") ?? "ACTIVE",
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    redirect("/workers?error=invalid-worker");
  }

  const values = parsed.data;
  const existingWorker = await prisma.worker.findUnique({
    where: { workerCode: values.workerCode },
  });

  if (existingWorker && existingWorker.id !== values.id) {
    redirect("/workers?error=duplicate-worker-code");
  }

  if (values.id) {
    await prisma.worker.update({
      where: { id: values.id },
      data: {
        workerCode: values.workerCode,
        name: values.name,
        phone: values.phone || null,
        joiningDate: toDateOnly(values.joiningDate),
        status: values.status,
        notes: values.notes || null,
      },
    });
  } else {
    await prisma.worker.create({
      data: {
        workerCode: values.workerCode,
        name: values.name,
        phone: values.phone || null,
        joiningDate: toDateOnly(values.joiningDate),
        status: values.status,
        notes: values.notes || null,
      },
    });
  }

  revalidatePath("/workers");
  redirect("/workers");
}

export async function toggleWorkerStatusAction(formData: FormData) {
  await requireAuth();
  const workerId = String(formData.get("workerId") ?? "");
  const status = String(formData.get("status") ?? "ACTIVE");

  if (!workerId) {
    redirect("/workers?error=missing-worker");
  }

  await prisma.worker.update({
    where: { id: workerId },
    data: { status },
  });

  revalidatePath("/workers");
  redirect("/workers");
}

export async function saveAttendanceAction(formData: FormData) {
  await requireAuth();

  const parsed = attendanceSchema.safeParse({
    workerId: formData.get("workerId"),
    date: formData.get("date"),
    attendanceStatus: formData.get("attendanceStatus") ?? "PRESENT",
    boardsCarried: formData.get("boardsCarried") ?? 0,
    weightCarriedKg: formData.get("weightCarriedKg") ?? 0,
    notes: formData.get("notes") ?? "",
    recordId: formData.get("recordId") ?? undefined,
  });

  if (!parsed.success) {
    redirect("/attendance?error=invalid-record");
  }

  const values = parsed.data;
  const dateValue = toDateOnly(values.date);
  const attendanceStatus = values.attendanceStatus;
  const shouldZeroOut = attendanceStatus === "ABSENT" || attendanceStatus === "LEAVE";

  const boardValue = shouldZeroOut ? 0 : Math.max(0, Number(values.boardsCarried) || 0);
  const weightValue = shouldZeroOut ? 0 : Math.max(0, Number(values.weightCarriedKg) || 0);

  await prisma.attendanceRecord.upsert({
    where: {
      workerId_date: {
        workerId: values.workerId,
        date: dateValue,
      },
    },
    create: {
      workerId: values.workerId,
      date: dateValue,
      attendanceStatus,
      boardsCarried: boardValue,
      weightCarriedKg: weightValue,
      notes: values.notes || null,
    },
    update: {
      attendanceStatus,
      boardsCarried: boardValue,
      weightCarriedKg: weightValue,
      notes: values.notes || null,
    },
  });

  revalidatePath("/attendance");
  revalidatePath("/dashboard");
  revalidatePath("/reports");
  redirect(`/attendance?date=${values.date}&saved=1`);
}
