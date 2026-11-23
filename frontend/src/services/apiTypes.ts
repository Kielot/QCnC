import type { OverallStatus, Scenario, SystemConfiguration, SystemStatus, TestLog, TestRecord, EvaluationResults } from '../types';
export interface StartTestRequest { instruction: string; scenario?: Scenario } // scenario is a mock-only demo control
export interface StartTestResponse { id: string; status: OverallStatus }
export interface StopTestResponse { id: string; accepted: boolean; message: string }
export interface QCnCApi {
  getSystemStatus(): Promise<SystemStatus>;
  startTest(request: StartTestRequest): Promise<StartTestResponse>;
  getTestStatus(testId: string): Promise<TestRecord>;
  getTestLogs(testId: string): Promise<TestLog[]>;
  getTestHistory(): Promise<TestRecord[]>;
  getTestDetails(testId: string): Promise<TestRecord>;
  getEvaluationResults(): Promise<EvaluationResults>;
  getSystemConfiguration(): Promise<SystemConfiguration>;
  stopTest(testId: string): Promise<StopTestResponse>;
}
