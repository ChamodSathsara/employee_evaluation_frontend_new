// ===== Shared =====
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export type RoleId = 1 | 2 | 3 | 4 | 5 | 6;
export const ROLE = {
  ADMIN: 1,
  CEO: 2,
  MANAGER: 3,
  HOD: 4,
  SUPERVISOR: 5,
  EMPLOYEE: 6,
} as const;

export const ROLE_NAME: Record<number, string> = {
  1: "Admin",
  2: "CEO",
  3: "Manager",
  4: "HOD",
  5: "Supervisor",
  6: "Employee",
};

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

// ===== Auth =====
// Matches UserProfileDto (backend: AuthDtos.cs)
export interface User {
  userId: number;
  employeeNo: string;
  firstName: string;
  lastName: string;
  email: string;
  roleId: number;
  roleName: string;
  departmentId: number | null;
  departmentName: string | null;
  designationId: number | null;
  designationName: string | null;
  reportsTo: number | null;
  isActive: boolean;
}

// Matches LoginResponseDto
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAtUtc: string;
  user: User;
}

// Matches ChangePasswordRequestDto
export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

// ===== KPI Assignments (backend: KpiAssignmentDtos.cs / KpisController) =====
export interface KpiDetail {
  detailId: number;
  kpiName: string;
  description: string | null;
  weightPercentage: number;
}

export interface KpiAssignment {
  assignmentId: number;
  employeeId: number;
  employeeName: string;
  createdBy: number;
  createdByName: string;
  periodId: number;
  periodName: string;
  status: "Draft" | "Published" | string;
  totalWeight: number;
  createdDate: string;
  details: KpiDetail[];
}

export interface CreateKpiDetailInput {
  kpiName: string;
  description: string | null;
  weightPercentage: number;
}

// Matches CreateKpiAssignmentDto
export interface CreateKpiRequest {
  employeeId: number;
  periodId: number;
  details: CreateKpiDetailInput[];
}

// Matches the bulk KPI assignment request — POST /api/kpis/bulk
export interface CreateBulkKpiRequest {
  employeeIds: number[];
  periodId: number;
  details: CreateKpiDetailInput[];
}

// Matches UpdateKpiAssignmentDto
export interface UpdateKpiRequest {
  details: CreateKpiDetailInput[];
}

// ===== Employee Self Evaluation (backend: SelfEvaluationDtos.cs) =====
export interface SelfEvaluationDetailInput {
  kpiAssignmentDetailId: number;
  employeeMarks: number;
  comments: string;
}

// Matches SaveEmployeeEvaluationDto — POST /api/self-evaluations/save|submit
export interface SaveSelfEvaluationRequest {
  assignmentId: number;
  details: SelfEvaluationDetailInput[];
}

export interface EmployeeEvaluationDetail {
  detailId: number;
  kpiAssignmentDetailId: number;
  kpiName: string;
  weightPercentage: number;
  employeeMarks: number;
  comments: string | null;
}

// Matches EmployeeEvaluationDto
export interface SelfEvaluation {
  selfEvaluationId: number;
  assignmentId: number;
  employeeId: number;
  employeeName: string;
  periodId: number;
  periodName: string;
  submittedDate: string | null;
  status: "Draft" | "Submitted" | string;
  details: EmployeeEvaluationDetail[];
}

// ===== Supervisor Evaluation (backend: SupervisorEvaluationDtos.cs) =====
export interface SupervisorEvaluationDetailInput {
  kpiAssignmentDetailId: number;
  marks: number;
  comments?: string;
}

// Matches CreateSupervisorEvaluationDto — POST /api/supervisor-evaluations
export interface CreateSupervisorEvaluationRequest {
  selfEvaluationId: number;
  details: SupervisorEvaluationDetailInput[];
}

// Matches UpdateSupervisorEvaluationDto — PUT /api/supervisor-evaluations/{id}
export interface UpdateSupervisorEvaluationRequest {
  details: SupervisorEvaluationDetailInput[];
}

export interface SupervisorEvaluationDetail {
  detailId: number;
  kpiAssignmentDetailId: number;
  kpiName: string;
  weightPercentage: number;
  employeeMarks: number | null;
  marks: number;
  comments: string | null;
}

// Matches SupervisorEvaluationDto
export interface SupervisorEvaluation {
  supervisorEvaluationId: number;
  selfEvaluationId: number;
  employeeId: number;
  employeeName: string;
  supervisorId: number;
  supervisorName: string;
  submittedDate: string | null;
  status: "Draft" | "Submitted" | string;
  details: SupervisorEvaluationDetail[];
}

// ===== HOD Evaluation (backend: HodEvaluationDtos.cs) =====
export interface HodEvaluationDetailInput {
  kpiAssignmentDetailId: number;
  marks: number;
  comments?: string;
}

// Matches CreateHodEvaluationDto — POST /api/hod-evaluations
export interface CreateHodEvaluationRequest {
  selfEvaluationId: number;
  details: HodEvaluationDetailInput[];
}

// Matches UpdateHodEvaluationDto — PUT /api/hod-evaluations/{id}
export interface UpdateHodEvaluationRequest {
  details: HodEvaluationDetailInput[];
}

export interface HodEvaluationDetail {
  detailId: number;
  kpiAssignmentDetailId: number;
  kpiName: string;
  weightPercentage: number;
  employeeMarks: number | null;
  supervisorMarks: number | null;
  marks: number;
  comments: string | null;
}

// Matches HodEvaluationDto
export interface HodEvaluation {
  hodEvaluationId: number;
  selfEvaluationId: number;
  employeeId: number;
  employeeName: string;
  hodId: number;
  hodName: string;
  submittedDate: string | null;
  status: "Draft" | "Submitted" | string;
  details: HodEvaluationDetail[];
}

// Summary row used by GET /api/supervisor-evaluations/pending and /api/hod-evaluations/pending
export interface PendingReview {
  selfEvaluationId: number;
  assignmentId: number;
  employeeId: number;
  employeeName: string;
  periodName: string;
  submittedDate: string | null;
}

// ===== Evaluation Periods (backend: EvaluationPeriodDtos.cs) =====
export interface EvaluationPeriod {
  periodId: number;
  name: string;
  year: number;
  startDate: string; // "yyyy-MM-dd"
  endDate: string;
  status: "Active" | "Inactive" | string;
}

// Matches CreateEvaluationPeriodDto
export interface CreateEvaluationPeriodInput {
  name: string;
  year: number;
  startDate: string;
  endDate: string;
}

// Matches UpdateEvaluationPeriodDto
export interface UpdateEvaluationPeriodInput {
  name: string;
  year: number;
  startDate: string;
  endDate: string;
}

// ===== Team (backend: TeamController / TeamDtos.cs) =====
// Matches TeamMemberDto
export interface TeamMember {
  userId: number;
  employeeNo: string;
  firstName: string;
  lastName: string;
  email: string;
  roleName: string;
  departmentId: number | null;
  departmentName: string | null;
  designationId: number | null;
  designationName: string | null;
  isActive: boolean;
  hasKpis: boolean;
}

// ===== Competencies (backend: CompetencyDtos.cs) =====
// Matches CompetencyDto
export interface Competency {
  competencyId: number;
  name: string;
  description: string | null;
}

// Matches SubmitCompetencyEvaluationDto — POST /api/competency-evaluations?hodEvaluationId={id}
// One competency is submitted per call; the backend has no batch endpoint.
export interface SubmitCompetencyEvaluationInput {
  competencyId: number;
  score: number;
  remarks?: string;
}

// POST /api/competency-evaluations/custom?hodEvaluationId={id}
// Creates a custom competency and records its score in a single request.
export interface CreateCustomCompetencyEvaluationInput {
  name: string;
  description: string;
  score: number;
  remarks?: string;
}

// Matches UpdateCompetencyEvaluationDto — PUT /api/competency-evaluations/{id}
export interface UpdateCompetencyEvaluationInput {
  score: number;
  remarks?: string;
}

// Matches CompetencyEvaluationDto
export interface CompetencyEvaluation {
  competencyEvaluationId: number;
  hodEvaluationId: number;
  competencyId: number;
  competencyName: string;
  score: number;
  remarks: string | null;
}

export const COMPETENCY_SCALE = [
  { value: 1, label: "Need Improvement" },
  { value: 2, label: "Meets Minimum Requirements Of Position" },
  { value: 3, label: "Averagely Meets Requirements" },
  { value: 4, label: "Consistently Meets Requirements" },
  { value: 5, label: "Consistently Exceeds Requirements" },
];

// ===== Achievements (backend: AchievementDtos.cs / AchievementTypeDtos.cs) =====
// Matches AchievementTypeDto
export interface AchievementType {
  achievementTypeId: number;
  name: string;
}

// Matches EmployeeAchievementDto
export interface Achievement {
  achievementId: number;
  hodEvaluationId: number;
  achievementTypeId: number;
  achievementTypeName: string;
  title: string;
  marks: number;
  attachment: string | null;
  remarks: string | null;
}

// Matches CreateEmployeeAchievementDto — POST /api/achievements
export interface CreateAchievementInput {
  hodEvaluationId: number;
  achievementTypeId: number;
  title: string;
  marks: number;
  remarks?: string;
}

// Matches UpdateEmployeeAchievementDto — PUT /api/achievements/{id}
export interface UpdateAchievementInput {
  achievementTypeId: number;
  title: string;
  marks: number;
  remarks?: string;
}

// ===== Evaluation Results / Grade (backend: EvaluationResultDtos.cs) =====
// Matches EvaluationResultDto
export interface EvaluationResult {
  resultId: number;
  hodEvaluationId: number;
  employeeId: number;
  employeeName: string;
  kpiScore: number;
  competencyScore: number;
  achievementScore: number;
  attendancePenalty: number;
  finalScore: number;
  grade: string;
  processedDate: string;
}

// ===== Recommendations (backend: RecommendationDtos.cs) =====
// The only RecommendationType values the backend accepts (RecommendationService.AllowedTypes).
export const RECOMMENDATION_TYPES = [
  "Promotion",
  "Salary Increment",
  "Training",
  "Extend Probation",
  "No Increment",
] as const;
export type RecommendationType = (typeof RECOMMENDATION_TYPES)[number];

// Matches CreateRecommendationDto — POST /api/recommendations?resultId={id}
export interface CreateRecommendationInput {
  recommendationType: RecommendationType | string;
  recommendationNote?: string;
}

// Matches UpdateRecommendationDto — PUT /api/recommendations/{id}
export interface UpdateRecommendationInput {
  recommendationType: RecommendationType | string;
  recommendationNote?: string;
}

// Matches RecommendationDto
export interface Recommendation {
  recommendationId: number;
  resultId: number;
  recommendationType: string;
  recommendationNote: string | null;
}

// ===== Manager Review (backend: ManagerReviewDtos.cs) =====
export interface ManagerReview {
  managerReviewId: number;
  resultId: number;
  employeeId: number;
  employeeName: string;
  managerId: number;
  managerName: string;
  comments: string | null;
  decision: "Pending" | "Approved" | "Rejected" | "Returned" | string;
  reviewDate: string;
}

// ===== Evaluation Detail — the combined view (backend: EvaluationDetailDtos.cs) =====
export interface EvaluationKpiLine {
  kpiAssignmentDetailId: number;
  kpiName: string;
  description: string | null;
  weightPercentage: number;
  employeeMarks: number | null;
  employeeComments: string | null;
  supervisorMarks: number | null;
  supervisorComments: string | null;
  hodMarks: number | null;
  hodComments: string | null;
}

export interface EvaluationCompetencyLine {
  competencyId: number;
  competencyName: string;
  score: number | null;
  remarks: string | null;
}

export interface EvaluationAchievementLine {
  achievementId: number;
  achievementTypeName: string;
  title: string;
  marks: number;
  attachment: string | null;
  remarks: string | null;
}

// Matches EvaluationDetailDto — GET /api/evaluation-detail/{assignmentId}
export interface EvaluationDetail {
  assignmentId: number;
  employeeId: number;
  employeeName: string;
  departmentName: string | null;
  designationName: string | null;
  periodId: number;
  periodName: string;

  selfEvaluationId: number | null;
  selfEvaluationStatus: string;

  supervisorEvaluationId: number | null;
  supervisorEvaluationStatus: string | null;

  hodEvaluationId: number | null;
  hodEvaluationStatus: string | null;

  kpiLines: EvaluationKpiLine[];
  competencies: EvaluationCompetencyLine[];
  achievements: EvaluationAchievementLine[];

  attendancePenalty: number | null;

  isProcessed: boolean;
  resultId: number | null;
  kpiScore: number | null;
  competencyScore: number | null;
  achievementScore: number | null;
  finalScore: number | null;
  grade: string | null;

  recommendationTypes: string[];
  recommendationNote: string | null;

  managerDecision: string | null;
  managerComments: string | null;
}

// ===== Attendance (backend: AttendanceDtos.cs) =====
// Matches AttendanceSummaryDto
export interface AttendanceSummary {
  attendanceId: number;
  employeeId: number;
  employeeName: string;
  periodId: number;
  annualLeave: number;
  casualLeave: number;
  medicalLeave: number;
  noPayLeave: number;
  lateAttendance: number;
  penaltyMarks: number;
}

// Matches UpsertAttendanceSummaryDto — POST/PUT /api/attendance
// NOTE: penaltyMarks is calculated by the backend from noPayLeave/lateAttendance — it is
// never sent by the client.
export interface AttendanceInput {
  employeeId: number;
  periodId: number;
  annualLeave: number;
  casualLeave: number;
  medicalLeave: number;
  noPayLeave: number;
  lateAttendance: number;
}

// ===== Departments (backend: DepartmentDtos.cs / DepartmentsController) =====
// Matches DepartmentDto — GET /api/departments
export interface Department {
  departmentId: number;
  departmentName: string;
  description: string | null;
  userCount: number;
}

// Matches CreateDepartmentDto
export interface CreateDepartmentInput {
  departmentName: string;
  description?: string;
}

// Matches UpdateDepartmentDto
export interface UpdateDepartmentInput {
  departmentName: string;
  description?: string;
}

// Matches DepartmentProgressDto — GET /api/departments/{id}/progress?periodId=
export interface DepartmentProgress {
  departmentId: number;
  departmentName: string;
  employeeCount: number;
  hodNames: string[];
  supervisorNames: string[];
  gradeCompletionPercentage: number;
  attendanceCompletionPercentage: number;
}

// ===== Designations (backend: DesignationDtos.cs) =====
// Matches DesignationDto
export interface Designation {
  designationId: number;
  designationName: string;
  userCount: number;
}

// Matches CreateDesignationDto
export interface CreateDesignationInput {
  designationName: string;
}

// Matches UpdateDesignationDto
export interface UpdateDesignationInput {
  designationName: string;
}

// ===== Roles (backend: RoleDtos.cs) =====
// Matches RoleDto
export interface Role {
  roleId: number;
  roleName: string;
  userCount: number;
}

// ===== Admin / Users (backend: UserDtos.cs) =====
// Matches UserDto
export interface AdminUser {
  userId: number;
  employeeNo: string;
  firstName: string;
  lastName: string;
  email: string;
  roleId: number;
  roleName: string;
  departmentId: number | null;
  departmentName: string | null;
  designationId: number | null;
  designationName: string | null;
  reportsTo: number | null;
  managerName: string | null;
  isActive: boolean;
  createdDate: string;
}

// Matches CreateUserDto
export interface CreateUserInput {
  employeeNo: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  roleId: number;
  departmentId: number | null;
  designationId: number | null;
  reportsTo: number | null;
}

// Matches UpdateUserDto
export interface UpdateUserInput {
  firstName: string;
  lastName: string;
  email: string;
  roleId: number;
  departmentId: number | null;
  designationId: number | null;
  reportsTo: number | null;
}

// Matches UserSearchDto (query params on GET /api/users)
export interface UserSearchParams {
  keyword?: string;
  roleId?: number;
  departmentId?: number;
  isActive?: boolean;
  pageNumber?: number;
  pageSize?: number;
}

// ===== Admin Dashboard (backend: DashboardDtos.cs → AdminDashboardDto) =====
export interface AuditLogEntry {
  auditId: number;
  userId: number;
  userName: string;
  action: string;
  tableName: string;
  recordId: number | null;
  createdDate: string;
}

// Matches AdminDashboardDto — GET /api/dashboard/admin
export interface AdminDashboard {
  totalUsers: number;
  activeUsers: number;
  totalDepartments: number;
  activeEvaluationPeriod: EvaluationPeriod | null;
  recentAuditLogs: AuditLogEntry[];
}

// ===== Reports =====
// GET /api/reports/employee/{employeeId}?periodId=
export interface EmployeeReport {
  employeeId: number;
  employeeName: string;
  departmentName: string;
  designationName: string;
  periodName: string;
  kpiScore: number;
  competencyScore: number;
  achievementScore: number;
  attendancePenalty: number;
  finalScore: number;
  grade: string;
  recommendations: string[];
  managerDecision: string | null;
  managerComments: string | null;
}
