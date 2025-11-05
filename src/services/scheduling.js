// Simple daily scheduler that assigns dueDate across the next N days
// respecting a daily capacity (in minutes). Returns a map of taskId -> dueDate.

export function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function formatISODate(date) {
  const d = new Date(date);
  return d.toISOString();
}

export function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function scheduleTasksDaily(tasks, options = {}) {
  const {
    days = 7,
    minutesPerDay = 120, // Increased capacity
    now = new Date()
  } = options;

  const result = new Map();
  const dayCapacities = [];
  for (let i = 0; i < days; i++) {
    dayCapacities.push({
      date: startOfDay(addDays(now, i)),
      remaining: minutesPerDay
    });
  }

  // Prioritize tasks with due dates, then by estimate, then creation
  const sorted = [...tasks].sort((a, b) => {
    if (a.dueDate && !b.dueDate) return -1;
    if (!a.dueDate && b.dueDate) return 1;
    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate) - new Date(b.dueDate);
    }
    const ae = typeof a.estimatedMinutes === 'number' ? 0 : 1;
    const be = typeof b.estimatedMinutes === 'number' ? 0 : 1;
    if (ae !== be) return ae - be;
    const at = new Date(a.createdAt || 0).getTime();
    const bt = new Date(b.createdAt || 0).getTime();
    return at - bt;
  });

  sorted.forEach((task) => {
    if (task.completed) return; // Skip completed tasks

    const need = typeof task.estimatedMinutes === 'number' && task.estimatedMinutes > 0
      ? task.estimatedMinutes
      : 30; // default 30 minutes if missing

    // Try to fit into an available day
    for (let i = 0; i < dayCapacities.length; i++) {
      if (dayCapacities[i].remaining >= need) {
        dayCapacities[i].remaining -= need;
        result.set(task.id, formatISODate(dayCapacities[i].date));
        return;
      }
    }

    // If it's a large task, find the first day it can fit entirely
    if (need > minutesPerDay) {
        for (let i = 0; i < dayCapacities.length; i++) {
            if (dayCapacities[i].remaining === minutesPerDay) {
                dayCapacities[i].remaining -= need; // It will go negative
                result.set(task.id, formatISODate(dayCapacities[i].date));
                return;
            }
        }
    }

    // if no day had enough room, put on the day with most space
    let bestDay = dayCapacities.reduce((best, current) => {
        return current.remaining > best.remaining ? current : best;
    }, dayCapacities[0]);
    
    bestDay.remaining -= need;
    result.set(task.id, formatISODate(bestDay.date));
  });

  return result;
}


