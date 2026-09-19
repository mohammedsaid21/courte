export function cancellationDeadline(startsAt: Date, cancellationHours: number) {
  return new Date(startsAt.getTime() - cancellationHours * 60 * 60 * 1000);
}

export function evaluateCancellation(input: {
  status: string;
  startsAt: Date;
  now?: Date;
  cancellationHours: number;
}): { allowed: boolean; reason?: string; deadline: Date } {
  const now = input.now ?? new Date();
  const deadline = cancellationDeadline(input.startsAt, input.cancellationHours);
  if (input.status === "CANCELLED") {
    return { allowed: false, reason: "This booking is already cancelled.", deadline };
  }
  if (input.status === "COMPLETED") {
    return { allowed: false, reason: "Completed bookings cannot be cancelled.", deadline };
  }
  if (now >= input.startsAt) {
    return { allowed: false, reason: "This booking has already started.", deadline };
  }
  if (now > deadline) {
    const hours = input.cancellationHours;
    return {
      allowed: false,
      reason:
        hours > 0
          ? `You can cancel this booking up to ${hours} hours before the start time.`
          : "This booking can no longer be cancelled.",
      deadline,
    };
  }
  return { allowed: true, deadline };
}
