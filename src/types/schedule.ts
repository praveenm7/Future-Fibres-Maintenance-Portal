// =============================================
// Daily Schedule Types
// =============================================

export interface ScheduleConfig {
    breakDuration: number;      // 30 minutes per break
    bufferMinutes: number;      // 5 minutes between tasks
    prioritizeMandatory: boolean;
    groupByMachine: boolean;
}

export interface ScheduleBreak {
    label: string;              // "Breakfast" | "Lunch" | "Dinner" | "Midnight"
    start: string;              // "08:00"
    end: string;                // "08:30"
    startMinute: number;        // 480 (may be >1440 for overnight)
    endMinute: number;          // 510
}

export interface Shift {
    shiftId: string;
    shiftName: string;
    startTime: string;          // "06:00"
    endTime: string;            // "14:00"
}

export interface ScheduledTask {
    id: string;                 // "actionId-dateKey"
    actionId: string;
    machineId: string;
    machineFinalCode: string;
    machineArea: string;
    actionText: string;
    periodicity: string;
    status: 'IDEAL' | 'MANDATORY';
    maintenanceInCharge: boolean;
    timeNeeded: number;         // minutes

    // Scheduling result
    assignedOperatorId: string;
    assignedOperatorName: string;
    startTime: string;          // "08:00"
    endTime: string;            // "08:30"
    startMinute: number;        // 480
    endMinute: number;          // 510

    // Execution status
    executionStatus: 'PENDING' | 'COMPLETED' | 'SKIPPED' | null;
    executionId: string | null;
    completedByName: string | null;

    schedulingNotes: string[];
}

export interface UnscheduledTask {
    actionId: string;
    machineId: string;
    machineFinalCode: string;
    machineArea: string;
    actionText: string;
    periodicity: string;
    status: 'IDEAL' | 'MANDATORY';
    timeNeeded: number;
    reason: string;
}

export interface OperatorLane {
    operatorId: string;
    operatorName: string;
    department: string;
    tasks: ScheduledTask[];
    totalMinutes: number;
    utilizationPercent: number; // 0-100
}

export interface ShiftSchedule {
    shiftId: string;
    shiftName: string;
    workdayStart: string;       // "06:00"
    workdayEnd: string;         // "14:00"
    breaks: ScheduleBreak[];
    operators: OperatorLane[];
}

export interface UnassignedOperator {
    operatorId: string;
    operatorName: string;
    department: string;
}

export interface DailyScheduleSummary {
    totalTasks: number;
    scheduledTasks: number;
    unscheduledTasks: number;
    totalMinutes: number;
    mandatoryCount: number;
    idealCount: number;
    operatorCount: number;
    shiftCount: number;
}

export interface DailySchedule {
    date: string;               // "2026-02-20"
    config: ScheduleConfig;
    shifts: ShiftSchedule[];
    unassigned: UnassignedOperator[];
    unscheduled: UnscheduledTask[];
    summary: DailyScheduleSummary;
}

// --- Shift roster types (for config sheet) ---

export interface OperatorRosterEntry {
    operatorId: string;
    operatorName: string;
    department: string;
    defaultShiftId: string | null;
    defaultShiftName: string | null;
    effectiveShift: Shift | null;
    hasOverride: boolean;
    isDayOff: boolean;
    overrideId: string | null;
}
