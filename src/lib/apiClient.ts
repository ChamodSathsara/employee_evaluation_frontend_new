import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from "axios";
import type {
  ApiResponse,
  LoginResponse,
  User,
  ChangePasswordInput,
  KpiAssignment,
  CreateKpiRequest,
  UpdateKpiRequest,
  EvaluationPeriod,
  CreateEvaluationPeriodInput,
  UpdateEvaluationPeriodInput,
  TeamMember,
  Competency,
  SubmitCompetencyEvaluationInput,
  UpdateCompetencyEvaluationInput,
  CompetencyEvaluation,
  AchievementType,
  Achievement,
  CreateAchievementInput,
  UpdateAchievementInput,
  EvaluationDetail,
  AttendanceInput,
  AttendanceSummary,
  Department,
  DepartmentProgress,
  CreateDepartmentInput,
  UpdateDepartmentInput,
  Designation,
  CreateDesignationInput,
  UpdateDesignationInput,
  Role,
  AdminUser,
  CreateUserInput,
  UpdateUserInput,
  AdminDashboard,
  SelfEvaluation,
  SaveSelfEvaluationRequest,
  CreateSupervisorEvaluationRequest,
  UpdateSupervisorEvaluationRequest,
  SupervisorEvaluation,
  CreateHodEvaluationRequest,
  UpdateHodEvaluationRequest,
  HodEvaluation,
  PendingReview,
  EvaluationResult,
  CreateRecommendationInput,
  UpdateRecommendationInput,
  Recommendation,
  UserSearchParams,
  PagedResult,
  EmployeeReport,
} from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://localhost:5001";

const ACCESS_TOKEN_KEY = "kpi_access_token";
const REFRESH_TOKEN_KEY = "kpi_refresh_token";
const USER_KEY = "kpi_user";

/**
 * ApiClient centralizes every HTTP call the app makes. All axios usage lives
 * here — feature code should never import axios directly.
 *
 * Every method below is annotated with the exact backend controller action it
 * calls, so payload shape drift can be caught by comparing against the C#
 * DTOs directly.
 */
class ApiClient {
  private http: AxiosInstance;

  constructor() {
    this.http = axios.create({
      baseURL: BASE_URL,
      headers: { "Content-Type": "application/json" },
    });

    this.http.interceptors.request.use((config) => {
      const token = this.getAccessToken();
      if (token) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    this.http.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          this.clearSession();
          if (typeof window !== "undefined") {
            window.location.href = "/login";
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // ---------- token / session storage ----------
  getAccessToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  getStoredUser(): User | null {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  }

  setSession(data: LoginResponse) {
    if (typeof window === "undefined") return;
    localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  }

  clearSession() {
    if (typeof window === "undefined") return;
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  private async get<T>(url: string, config?: AxiosRequestConfig) {
    const res = await this.http.get<ApiResponse<T>>(url, config);
    return res.data;
  }
  private async post<T>(url: string, body?: unknown, config?: AxiosRequestConfig) {
    const res = await this.http.post<ApiResponse<T>>(url, body, config);
    return res.data;
  }
  private async put<T>(url: string, body?: unknown, config?: AxiosRequestConfig) {
    const res = await this.http.put<ApiResponse<T>>(url, body, config);
    return res.data;
  }
  private async patch<T>(url: string, body?: unknown, config?: AxiosRequestConfig) {
    const res = await this.http.patch<ApiResponse<T>>(url, body, config);
    return res.data;
  }
  private async del<T>(url: string, config?: AxiosRequestConfig) {
    const res = await this.http.delete<ApiResponse<T>>(url, config);
    return res.data;
  }

  // ===================== AUTH (AuthController) =====================
  login(email: string, password: string) {
    // POST /api/auth/login — LoginRequestDto { email, password }
    return this.post<LoginResponse>("/api/auth/login", { email, password });
  }
  logout() {
    // POST /api/auth/logout — no body
    return this.post<null>("/api/auth/logout");
  }
  changePassword(payload: ChangePasswordInput) {
    // POST /api/auth/change-password — ChangePasswordRequestDto
    return this.post<null>("/api/auth/change-password", payload);
  }
  getProfile() {
    // GET /api/auth/profile
    return this.get<User>("/api/auth/profile");
  }

  // ===================== KPI ASSIGNMENTS (KpisController) =====================
  createKpi(payload: CreateKpiRequest) {
    // POST /api/kpis — CreateKpiAssignmentDto { employeeId, periodId, details[] }
    return this.post<KpiAssignment>("/api/kpis", payload);
  }
  updateKpi(assignmentId: number, payload: UpdateKpiRequest) {
    // PUT /api/kpis/{assignmentId} — UpdateKpiAssignmentDto { details[] }
    return this.put<KpiAssignment>(`/api/kpis/${assignmentId}`, payload);
  }
  deleteKpi(assignmentId: number) {
    // DELETE /api/kpis/{assignmentId}
    return this.del<null>(`/api/kpis/${assignmentId}`);
  }
  publishKpi(assignmentId: number) {
    // POST /api/kpis/{assignmentId}/publish — no body
    return this.post<KpiAssignment>(`/api/kpis/${assignmentId}/publish`);
  }
  revertKpiToDraft(assignmentId: number) {
    // POST /api/kpis/{assignmentId}/draft — no body
    return this.post<KpiAssignment>(`/api/kpis/${assignmentId}/draft`);
  }
  getMyKpis() {
    // GET /api/kpis/my — the logged-in employee's own Published KPI assignments
    return this.get<KpiAssignment[]>("/api/kpis/my");
  }
  getMyTeamKpis() {
    // GET /api/kpis/my-team — every KPI assignment belonging to the caller's direct reports
    return this.get<KpiAssignment[]>("/api/kpis/my-team");
  }
  getKpiById(assignmentId: number) {
    // GET /api/kpis/{assignmentId}
    return this.get<KpiAssignment>(`/api/kpis/${assignmentId}`);
  }
  getKpisByEmployee(employeeId: number) {
    // GET /api/kpis/employee/{employeeId}
    return this.get<KpiAssignment[]>(`/api/kpis/employee/${employeeId}`);
  }
  getKpisByPeriod(periodId: number) {
    // GET /api/kpis/period/{periodId}
    return this.get<KpiAssignment[]>(`/api/kpis/period/${periodId}`);
  }

  // ===================== EMPLOYEE SELF EVALUATION (SelfEvaluationsController) =====================
  getMySelfEvaluation(assignmentId: number) {
    // GET /api/self-evaluations/my?assignmentId=
    return this.get<SelfEvaluation>(`/api/self-evaluations/my`, { params: { assignmentId } });
  }
  getSelfEvaluationByAssignment(assignmentId: number) {
    // GET /api/self-evaluations/{assignmentId} — Admin, the employee, or the assignment's creator
    return this.get<SelfEvaluation | null>(`/api/self-evaluations/${assignmentId}`);
  }
  saveSelfEvaluationDraft(payload: SaveSelfEvaluationRequest) {
    // POST /api/self-evaluations/save — SaveEmployeeEvaluationDto { assignmentId, details[] }
    return this.post<SelfEvaluation>("/api/self-evaluations/save", payload);
  }
  submitSelfEvaluation(payload: SaveSelfEvaluationRequest) {
    // POST /api/self-evaluations/submit — SaveEmployeeEvaluationDto { assignmentId, details[] }
    return this.post<SelfEvaluation>("/api/self-evaluations/submit", payload);
  }
  updateSelfEvaluationDraft(selfEvaluationId: number, payload: SaveSelfEvaluationRequest) {
    // PUT /api/self-evaluations/{id} — SaveEmployeeEvaluationDto
    return this.put<SelfEvaluation>(`/api/self-evaluations/${selfEvaluationId}`, payload);
  }
  getMySelfEvaluationHistory() {
    // GET /api/self-evaluations/history
    return this.get<SelfEvaluation[]>("/api/self-evaluations/history");
  }

  // ===================== SUPERVISOR EVALUATION (SupervisorEvaluationsController) =====================
  getSupervisorPending() {
    // GET /api/supervisor-evaluations/pending
    return this.get<PendingReview[]>("/api/supervisor-evaluations/pending");
  }
  getSupervisorEvaluation(id: number) {
    // GET /api/supervisor-evaluations/{id}
    return this.get<SupervisorEvaluation>(`/api/supervisor-evaluations/${id}`);
  }
  createSupervisorEvaluation(payload: CreateSupervisorEvaluationRequest) {
    // POST /api/supervisor-evaluations — CreateSupervisorEvaluationDto { selfEvaluationId, details[] }
    return this.post<SupervisorEvaluation>("/api/supervisor-evaluations", payload);
  }
  updateSupervisorEvaluation(id: number, payload: UpdateSupervisorEvaluationRequest) {
    // PUT /api/supervisor-evaluations/{id} — UpdateSupervisorEvaluationDto { details[] }
    return this.put<SupervisorEvaluation>(`/api/supervisor-evaluations/${id}`, payload);
  }
  submitSupervisorEvaluation(id: number) {
    // POST /api/supervisor-evaluations/{id}/submit — no body
    return this.post<SupervisorEvaluation>(`/api/supervisor-evaluations/${id}/submit`);
  }

  // ===================== HOD EVALUATION (HodEvaluationsController) =====================
  getHodPending() {
    // GET /api/hod-evaluations/pending
    return this.get<PendingReview[]>("/api/hod-evaluations/pending");
  }
  getHodEvaluation(id: number) {
    // GET /api/hod-evaluations/{id}
    return this.get<HodEvaluation>(`/api/hod-evaluations/${id}`);
  }
  createHodEvaluation(payload: CreateHodEvaluationRequest) {
    // POST /api/hod-evaluations — CreateHodEvaluationDto { selfEvaluationId, details[] }
    return this.post<HodEvaluation>("/api/hod-evaluations", payload);
  }
  updateHodEvaluation(id: number, payload: UpdateHodEvaluationRequest) {
    // PUT /api/hod-evaluations/{id} — UpdateHodEvaluationDto { details[] }
    return this.put<HodEvaluation>(`/api/hod-evaluations/${id}`, payload);
  }
  submitHodEvaluation(id: number) {
    // POST /api/hod-evaluations/{id}/submit — no body
    return this.post<HodEvaluation>(`/api/hod-evaluations/${id}/submit`);
  }

  // ===================== COMPETENCIES (CompetenciesController) =====================
  getCompetencies() {
    // GET /api/competencies — the master list of the 10 standard competencies
    return this.get<Competency[]>("/api/competencies");
  }

  // ===================== COMPETENCY EVALUATIONS (CompetencyEvaluationsController) =====================
  getCompetencyEvaluations(hodEvaluationId: number) {
    // GET /api/competency-evaluations/{hodEvaluationId}
    return this.get<CompetencyEvaluation[]>(`/api/competency-evaluations/${hodEvaluationId}`);
  }
  submitCompetencyEvaluation(hodEvaluationId: number, payload: SubmitCompetencyEvaluationInput) {
    // POST /api/competency-evaluations?hodEvaluationId= — SubmitCompetencyEvaluationDto
    // NOTE: the backend has no batch endpoint — one competency is submitted per call.
    // Submitting again for the same competencyId updates the existing score.
    return this.post<CompetencyEvaluation>("/api/competency-evaluations", payload, {
      params: { hodEvaluationId },
    });
  }
  updateCompetencyEvaluation(competencyEvaluationId: number, payload: UpdateCompetencyEvaluationInput) {
    // PUT /api/competency-evaluations/{id} — UpdateCompetencyEvaluationDto { score, remarks }
    return this.put<CompetencyEvaluation>(`/api/competency-evaluations/${competencyEvaluationId}`, payload);
  }

  // ===================== ACHIEVEMENT TYPES (AchievementTypesController) =====================
  getAchievementTypes() {
    // GET /api/achievement-types
    return this.get<AchievementType[]>("/api/achievement-types");
  }

  // ===================== ACHIEVEMENTS (AchievementsController) =====================
  getAchievements(hodEvaluationId: number) {
    // GET /api/achievements/{hodEvaluationId}
    return this.get<Achievement[]>(`/api/achievements/${hodEvaluationId}`);
  }
  addAchievement(payload: CreateAchievementInput) {
    // POST /api/achievements — CreateEmployeeAchievementDto { hodEvaluationId, achievementTypeId, title, marks, remarks }
    return this.post<Achievement>("/api/achievements", payload);
  }
  updateAchievement(achievementId: number, payload: UpdateAchievementInput) {
    // PUT /api/achievements/{id} — UpdateEmployeeAchievementDto { achievementTypeId, title, marks, remarks }
    return this.put<Achievement>(`/api/achievements/${achievementId}`, payload);
  }
  deleteAchievement(achievementId: number) {
    // DELETE /api/achievements/{id}
    return this.del<null>(`/api/achievements/${achievementId}`);
  }
  uploadAchievementFile(achievementId: number, file: File) {
    // POST /api/achievements/upload — multipart/form-data: UploadAchievementAttachmentDto { AchievementId, File }
    const form = new FormData();
    form.append("AchievementId", String(achievementId));
    form.append("File", file);
    return this.post<Achievement>("/api/achievements/upload", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  }

  // ===================== EVALUATION DETAIL (EvaluationDetailController) — combined view =====================
  getEvaluationDetail(assignmentId: number) {
    // GET /api/evaluation-detail/{assignmentId}
    // Returns Employee/Supervisor/HOD marks per KPI, competencies, achievements,
    // attendance penalty, final score/grade, recommendation, and Manager decision — all in one call.
    return this.get<EvaluationDetail>(`/api/evaluation-detail/${assignmentId}`);
  }
  getEvaluationDetailByEmployee(employeeId: number, periodId: number) {
    // GET /api/evaluation-detail/employee/{employeeId}?periodId=
    return this.get<EvaluationDetail>(`/api/evaluation-detail/employee/${employeeId}`, {
      params: { periodId },
    });
  }

  // ===================== ATTENDANCE (AttendanceController) =====================
  getAttendanceByEmployee(employeeId: number) {
    // GET /api/attendance/{employeeId} — all periods
    return this.get<AttendanceSummary[]>(`/api/attendance/${employeeId}`);
  }
  upsertAttendance(payload: AttendanceInput) {
    // POST /api/attendance — UpsertAttendanceSummaryDto { employeeId, periodId, annualLeave,
    // casualLeave, medicalLeave, noPayLeave, lateAttendance }. Creates or updates the record
    // for that employee/period; the penalty is calculated server-side, never sent by the client.
    return this.post<AttendanceSummary>("/api/attendance", payload);
  }
  updateAttendance(attendanceId: number, payload: AttendanceInput) {
    // PUT /api/attendance/{id} — same shape as upsert
    return this.put<AttendanceSummary>(`/api/attendance/${attendanceId}`, payload);
  }
  getAttendanceSummaryByPeriod(periodId: number) {
    // GET /api/attendance/summary/{periodId}
    return this.get<AttendanceSummary[]>(`/api/attendance/summary/${periodId}`);
  }

  // ===================== GRADE CALCULATION (EvaluationResultsController) =====================
  processGrade(hodEvaluationId: number) {
    // POST /api/evaluation-results/process/{hodEvaluationId} — no body. Requires the HOD
    // evaluation to be Submitted, all 10 competencies scored, and an attendance record to exist.
    return this.post<EvaluationResult>(`/api/evaluation-results/process/${hodEvaluationId}`);
  }
  getEvaluationResult(resultId: number) {
    // GET /api/evaluation-results/{id}
    return this.get<EvaluationResult>(`/api/evaluation-results/${resultId}`);
  }
  getResultsByEmployee(employeeId: number) {
    // GET /api/evaluation-results/employee/{employeeId}
    return this.get<EvaluationResult[]>(`/api/evaluation-results/employee/${employeeId}`);
  }
  getResultsByPeriod(periodId: number) {
    // GET /api/evaluation-results/period/{periodId}
    return this.get<EvaluationResult[]>(`/api/evaluation-results/period/${periodId}`);
  }

  // ===================== RECOMMENDATIONS (RecommendationsController) =====================
  getRecommendations(resultId: number) {
    // GET /api/recommendations/{resultId}
    return this.get<Recommendation[]>(`/api/recommendations/${resultId}`);
  }
  addRecommendation(resultId: number, payload: CreateRecommendationInput) {
    // POST /api/recommendations?resultId= — CreateRecommendationDto { recommendationType, recommendationNote }
    // recommendationType MUST be one of RECOMMENDATION_TYPES; any other value is rejected (400).
    return this.post<Recommendation>("/api/recommendations", payload, { params: { resultId } });
  }
  updateRecommendation(recommendationId: number, payload: UpdateRecommendationInput) {
    // PUT /api/recommendations/{id} — UpdateRecommendationDto
    return this.put<Recommendation>(`/api/recommendations/${recommendationId}`, payload);
  }

  // ===================== TEAM (TeamController) =====================
  getMyTeam() {
    // GET /api/team/my-team — the caller's direct reports
    return this.get<TeamMember[]>("/api/team/my-team");
  }
  getMySubtree() {
    // GET /api/team/my-subtree — every employee in the caller's downward org chart
    return this.get<TeamMember[]>("/api/team/my-subtree");
  }

  // ===================== EVALUATION PERIODS (EvaluationPeriodsController) =====================
  getEvaluationPeriods() {
    // GET /api/evaluation-periods
    return this.get<EvaluationPeriod[]>("/api/evaluation-periods");
  }
  getEvaluationPeriod(id: number) {
    // GET /api/evaluation-periods/{id}
    return this.get<EvaluationPeriod>(`/api/evaluation-periods/${id}`);
  }
  createEvaluationPeriod(payload: CreateEvaluationPeriodInput) {
    // POST /api/evaluation-periods — Admin only
    return this.post<EvaluationPeriod>("/api/evaluation-periods", payload);
  }
  updateEvaluationPeriod(id: number, payload: UpdateEvaluationPeriodInput) {
    // PUT /api/evaluation-periods/{id} — Admin only
    return this.put<EvaluationPeriod>(`/api/evaluation-periods/${id}`, payload);
  }
  activateEvaluationPeriod(id: number) {
    // PATCH /api/evaluation-periods/{id}/activate — Admin only, no body
    return this.patch<EvaluationPeriod>(`/api/evaluation-periods/${id}/activate`);
  }
  deleteEvaluationPeriod(id: number) {
    // DELETE /api/evaluation-periods/{id} — Admin only
    return this.del<null>(`/api/evaluation-periods/${id}`);
  }

  // ===================== DEPARTMENTS (DepartmentsController) =====================
  getDepartments() {
    // GET /api/departments
    return this.get<Department[]>("/api/departments");
  }
  getDepartment(id: number) {
    // GET /api/departments/{id}
    return this.get<Department>(`/api/departments/${id}`);
  }
  getDepartmentEmployees(id: number) {
    // GET /api/departments/{id}/employees
    return this.get<TeamMember[]>(`/api/departments/${id}/employees`);
  }
  getDepartmentProgress(id: number, periodId: number) {
    // GET /api/departments/{id}/progress?periodId=
    return this.get<DepartmentProgress>(`/api/departments/${id}/progress`, { params: { periodId } });
  }
  getAllDepartmentsProgress(periodId: number) {
    // GET /api/departments/progress?periodId= — all departments in one call
    return this.get<DepartmentProgress[]>("/api/departments/progress", { params: { periodId } });
  }
  createDepartment(payload: CreateDepartmentInput) {
    // POST /api/departments — Admin only. CreateDepartmentDto { departmentName, description }
    return this.post<Department>("/api/departments", payload);
  }
  updateDepartment(id: number, payload: UpdateDepartmentInput) {
    // PUT /api/departments/{id} — Admin only. UpdateDepartmentDto { departmentName, description }
    return this.put<Department>(`/api/departments/${id}`, payload);
  }
  deleteDepartment(id: number) {
    // DELETE /api/departments/{id} — Admin only
    return this.del<null>(`/api/departments/${id}`);
  }

  // ===================== DESIGNATIONS (DesignationsController) =====================
  getDesignations() {
    // GET /api/designations
    return this.get<Designation[]>("/api/designations");
  }
  createDesignation(payload: CreateDesignationInput) {
    // POST /api/designations — Admin only. CreateDesignationDto { designationName }
    return this.post<Designation>("/api/designations", payload);
  }
  updateDesignation(id: number, payload: UpdateDesignationInput) {
    // PUT /api/designations/{id} — Admin only. UpdateDesignationDto { designationName }
    return this.put<Designation>(`/api/designations/${id}`, payload);
  }
  deleteDesignation(id: number) {
    // DELETE /api/designations/{id} — Admin only
    return this.del<null>(`/api/designations/${id}`);
  }

  // ===================== ROLES (RolesController) =====================
  getRoles() {
    // GET /api/roles — Admin only
    return this.get<Role[]>("/api/roles");
  }

  // ===================== USERS (UsersController) — Admin only =====================
  getUsers(params: UserSearchParams) {
    // GET /api/users?keyword=&roleId=&departmentId=&isActive=&pageNumber=&pageSize=
    return this.get<PagedResult<AdminUser>>("/api/users", { params });
  }
  getUser(id: number) {
    // GET /api/users/{id}
    return this.get<AdminUser>(`/api/users/${id}`);
  }
  createUser(payload: CreateUserInput) {
    // POST /api/users — CreateUserDto. Response data is the created UserDto (no temporary password field).
    return this.post<AdminUser>("/api/users", payload);
  }
  updateUser(id: number, payload: UpdateUserInput) {
    // PUT /api/users/{id} — UpdateUserDto
    return this.put<AdminUser>(`/api/users/${id}`, payload);
  }
  deleteUser(id: number) {
    // DELETE /api/users/{id}
    return this.del<null>(`/api/users/${id}`);
  }
  updateUserStatus(id: number, isActive: boolean) {
    // PATCH /api/users/{id}/status — UpdateUserStatusDto { isActive }
    return this.patch<AdminUser>(`/api/users/${id}/status`, { isActive });
  }
  getUsersReportingTo(userId: number) {
    // GET /api/users/reporting-to/{userId}
    return this.get<AdminUser[]>(`/api/users/reporting-to/${userId}`);
  }
  getUsersByRole(roleId: number) {
    // GET /api/users/by-role/{roleId}
    return this.get<AdminUser[]>(`/api/users/by-role/${roleId}`);
  }
  getUsersByDepartment(departmentId: number) {
    // GET /api/users/by-department/{departmentId}
    return this.get<AdminUser[]>(`/api/users/by-department/${departmentId}`);
  }
  getManagementUsers() {
    // GET /api/users/management — all active CEO/Manager/HOD/Supervisor users
    return this.get<AdminUser[]>("/api/users/management");
  }

  // ===================== DASHBOARD (DashboardController) =====================
  getAdminDashboard() {
    // GET /api/dashboard/admin
    return this.get<AdminDashboard>("/api/dashboard/admin");
  }

  // ===================== REPORTS (ReportsController) =====================
  getEmployeeReport(employeeId: number, periodId?: number) {
    // GET /api/reports/employee/{employeeId}?periodId=
    return this.get<EmployeeReport>(`/api/reports/employee/${employeeId}`, {
      params: periodId ? { periodId } : undefined,
    });
  }

  /**
   * Downloads a report file (PDF or Excel) for a processed evaluation result as an
   * authenticated Blob and triggers a browser save. Must go through axios (not a raw
   * anchor tag) so the Authorization header is attached — the backend requires a bearer
   * token on every /api/reports/export/* route.
   */
  async downloadReport(resultId: number, format: "pdf" | "excel", fileName: string) {
    const path = format === "pdf" ? `/api/reports/export/pdf/${resultId}` : `/api/reports/export/excel/${resultId}`;
    const response = await this.http.get(path, { responseType: "blob" });

    const blobUrl = window.URL.createObjectURL(response.data as Blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(blobUrl);
  }

  // ===================== TOKEN REFRESH =====================
  async refreshAccessToken() {
    // POST /api/auth/refresh-token — RefreshTokenRequestDto { accessToken, refreshToken }
    const accessToken = this.getAccessToken();
    const refreshToken = this.getRefreshToken();
    if (!accessToken || !refreshToken) {
      throw new Error("No session to refresh.");
    }
    const result = await this.post<LoginResponse>("/api/auth/refresh-token", { accessToken, refreshToken });
    if (result.data) {
      this.setSession(result.data);
    }
    return result;
  }
}

export const apiClient = new ApiClient();
export default apiClient;
