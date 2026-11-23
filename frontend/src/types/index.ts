export type StageStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
export type OverallStatus = 'queued' | 'running' | 'successful' | 'failed' | 'stopped';
export type Scenario = 'success' | 'not_found' | 'calibration_failure' | 'gcode_validation_failure' | 'cnc_connection_failure' | 'cnc_execution_failure';
export type Severity = 'info' | 'warning' | 'error' | 'critical';
export interface Stage { id: string; label: string; status: StageStatus; startedAt?: string; endedAt?: string }
export interface TestError { id: string; testId: string; stage: string; category: string; description: string; timestamp: string; severity: Severity; details?: Record<string, string | number> }
export interface TestLog { timestamp: string; level: Severity; message: string }
export interface Grounding { model: string; target: string; bbox: [number, number, number, number]; centroid: [number, number] } // normalized 0..1
export interface Calibration { xMm: number; yMm: number; workspaceValid: boolean; info: string }
export interface CncInfo { connection: string; position?: string; state: string; stylus?: string }
export interface Evaluation { locErrPx: number; calErrMm: number; posErrMm: number; timeS: number; interactionSuccess: boolean }
export interface TestRecord {
  id: string; instruction: string; target: string; scenario?: Scenario; status: OverallStatus;
  createdAt: string; finishedAt?: string; durationMs?: number; stages: Stage[];
  screenshot: { width: number; height: number; ref?: string };
  grounding?: Grounding; calibration?: Calibration; gcode?: string[]; gcodeValid?: boolean; cnc?: CncInfo;
  outcome?: string; error?: TestError; logs: TestLog[]; evaluation?: Evaluation;
  simulated: boolean; source: 'local-demo' | 'backend';
}
export interface SystemStatus { mode: 'mock' | 'real'; components: { id: string; label: string; state: 'simulated' | 'connected' | 'disconnected' | 'unknown'; detail?: string }[]; device?: { id: string; model?: string; resolution?: string } }
export interface Trial { testId: string; instruction: string; date: string; locErrPx: number | null; calErrMm: number | null; posErrMm: number | null; timeS: number | null; success: boolean | null }
export interface EvaluationResults { simulated: boolean; summary: { locErrPx: number | null; calErrMm: number | null; posErrMm: number | null; successRate: number | null; timeS: number | null; trials: number }; trials: Trial[] }
export interface SystemConfiguration { simulated: boolean; sections: { title: string; items: { label: string; value: string | null }[] }[] }
