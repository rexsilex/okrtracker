export type KeyResultType = 'standard' | 'leading' | 'lagging' | 'win_condition';

export interface Person {
    id: string;
    name: string;
    initials: string;
    color: string;
}

export interface WinLog {
    id: string;
    date: string;
    note: string;
    attributedTo: string[]; // Array of Person IDs
}

export interface KeyResult {
    id: string;
    title: string;
    type: KeyResultType;
    current: number;
    target: number;
    unit: string;
    winLog?: WinLog[];
}

export interface Objective {
    id: string;
    title: string;
    category?: string;
    description?: string;
    initiatives?: string[];
    keyResults: KeyResult[];
    wins?: WinLog[]; // Direct wins for the objective
}
