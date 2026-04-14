import fs from "node:fs";
import path from "node:path";
import XLSX from "xlsx";

const testCases = [
  {
    id: "TC-AUTH-001",
    module: "Authentication",
    feature: "Email login",
    priority: "Critical",
    type: "Functional",
    precondition: "Admin account exists",
    steps:
      "1. Go to /login\n2. Enter valid email/password\n3. Submit form",
    expectedResult:
      "User is redirected to /dashboard and access token is saved in localStorage.",
    automationScope: "UI + API",
    owner: "QA",
  },
  {
    id: "TC-AUTH-002",
    module: "Authentication",
    feature: "Invalid login",
    priority: "Critical",
    type: "Negative",
    precondition: "None",
    steps:
      "1. Go to /login\n2. Enter invalid credentials\n3. Submit form",
    expectedResult:
      "Login fails, error toast appears, user remains on /login.",
    automationScope: "UI + API",
    owner: "QA",
  },
  {
    id: "TC-AUTH-003",
    module: "Authentication",
    feature: "Public route guard",
    priority: "High",
    type: "Functional",
    precondition: "Valid access_token exists",
    steps: "1. Open /login directly",
    expectedResult:
      "PublicRoute redirects authenticated user to /dashboard.",
    automationScope: "UI",
    owner: "QA",
  },
  {
    id: "TC-AUTH-004",
    module: "Authentication",
    feature: "Private route guard",
    priority: "Critical",
    type: "Security",
    precondition: "No access_token",
    steps: "1. Open /dashboard directly",
    expectedResult: "PrivateRoute redirects unauthenticated user to /login.",
    automationScope: "UI",
    owner: "QA",
  },
  {
    id: "TC-AUTH-005",
    module: "Authentication",
    feature: "Google One Tap visibility",
    priority: "Medium",
    type: "Functional",
    precondition: "VITE_GOOGLE_CLIENT_ID configured",
    steps: "1. Open app root",
    expectedResult: "One Tap prompt is initialized without breaking route rendering.",
    automationScope: "Manual",
    owner: "QA",
  },
  {
    id: "TC-INV-001",
    module: "Inventory",
    feature: "List inventory",
    priority: "Critical",
    type: "Functional",
    precondition: "User is authenticated",
    steps: "1. Open /inventory",
    expectedResult:
      "Rows load in CustomDataGrid with server pagination and no console errors.",
    automationScope: "UI + API",
    owner: "QA",
  },
  {
    id: "TC-INV-002",
    module: "Inventory",
    feature: "Create listing",
    priority: "Critical",
    type: "Functional",
    precondition: "User is on /inventory",
    steps:
      "1. Open add modal\n2. Fill required fields\n3. Submit",
    expectedResult:
      "Listing is created, success toast appears, list query is refreshed.",
    automationScope: "UI + API",
    owner: "QA",
  },
  {
    id: "TC-INV-003",
    module: "Inventory",
    feature: "Edit listing",
    priority: "High",
    type: "Functional",
    precondition: "At least one listing exists",
    steps: "1. Open edit modal for listing\n2. Update fields\n3. Save",
    expectedResult: "Listing updates successfully and table reflects changes.",
    automationScope: "UI + API",
    owner: "QA",
  },
  {
    id: "TC-INV-004",
    module: "Inventory",
    feature: "Delete listing",
    priority: "High",
    type: "Functional",
    precondition: "At least one listing exists",
    steps: "1. Trigger delete action\n2. Confirm in dialog",
    expectedResult:
      "Listing is removed, success feedback shown, grid refreshes.",
    automationScope: "UI + API",
    owner: "QA",
  },
  {
    id: "TC-ADV-001",
    module: "Advertisements",
    feature: "Create advertisement",
    priority: "High",
    type: "Functional",
    precondition: "User is on /advertisements",
    steps:
      "1. Open add modal\n2. Enter valid values\n3. Submit",
    expectedResult:
      "Advertisement record is created and visible in the ads list.",
    automationScope: "UI + API",
    owner: "QA",
  },
  {
    id: "TC-ADV-002",
    module: "Advertisements",
    feature: "Advertisement details route",
    priority: "High",
    type: "Functional",
    precondition: "Advertisement exists",
    steps: "1. Open /advertisements/:id",
    expectedResult: "Detailed advertisement view loads with expected metadata.",
    automationScope: "UI + API",
    owner: "QA",
  },
  {
    id: "TC-SUB-001",
    module: "Subscriptions",
    feature: "Create subscription",
    priority: "High",
    type: "Functional",
    precondition: "User is on /subscriptions",
    steps:
      "1. Open add modal\n2. Fill plan fields\n3. Submit",
    expectedResult:
      "Subscription is created, toast shown, and query cache invalidated.",
    automationScope: "UI + API",
    owner: "QA",
  },
  {
    id: "TC-SUB-002",
    module: "Subscriptions",
    feature: "Edit subscription",
    priority: "High",
    type: "Functional",
    precondition: "Subscription exists",
    steps: "1. Open edit modal\n2. Change data\n3. Save",
    expectedResult:
      "Subscription updates without data loss and list shows updated values.",
    automationScope: "UI + API",
    owner: "QA",
  },
  {
    id: "TC-USER-001",
    module: "User Management",
    feature: "Load users",
    priority: "High",
    type: "Functional",
    precondition: "User is authenticated",
    steps: "1. Open /userManagement",
    expectedResult: "User dataset loads and actions are available per row.",
    automationScope: "UI + API",
    owner: "QA",
  },
  {
    id: "TC-USER-002",
    module: "User Management",
    feature: "Legacy sellers redirect",
    priority: "Medium",
    type: "Functional",
    precondition: "Authenticated session",
    steps: "1. Open /sellers",
    expectedResult: "Route redirects to /userManagement with no error.",
    automationScope: "UI",
    owner: "QA",
  },
  {
    id: "TC-MSG-001",
    module: "Messages",
    feature: "Message thread load",
    priority: "High",
    type: "Functional",
    precondition: "Websocket/server available",
    steps: "1. Open /messages",
    expectedResult: "Messages page loads active conversations and unread counters.",
    automationScope: "UI + Integration",
    owner: "QA",
  },
  {
    id: "TC-NOTIF-001",
    module: "Notifications",
    feature: "Notification list",
    priority: "Medium",
    type: "Functional",
    precondition: "Authenticated session",
    steps: "1. Open /notifications",
    expectedResult: "Notification list renders and shows accurate read/unread state.",
    automationScope: "UI + API",
    owner: "QA",
  },
  {
    id: "TC-PROF-001",
    module: "Profile",
    feature: "Profile fetch",
    priority: "High",
    type: "Functional",
    precondition: "Authenticated session",
    steps: "1. Open /profile",
    expectedResult: "Current profile details are populated from API data.",
    automationScope: "UI + API",
    owner: "QA",
  },
  {
    id: "TC-PROF-002",
    module: "Profile",
    feature: "Profile update",
    priority: "High",
    type: "Functional",
    precondition: "Profile page open",
    steps: "1. Edit editable fields\n2. Submit update",
    expectedResult: "Profile updates successfully and success toast appears.",
    automationScope: "UI + API",
    owner: "QA",
  },
  {
    id: "TC-TXN-001",
    module: "Transactions",
    feature: "Transaction list",
    priority: "High",
    type: "Functional",
    precondition: "Authenticated session",
    steps: "1. Open /transactions",
    expectedResult:
      "Transaction data loads with expected columns and formatting.",
    automationScope: "UI + API",
    owner: "QA",
  },
  {
    id: "TC-DASH-001",
    module: "Dashboard",
    feature: "Metrics rendering",
    priority: "High",
    type: "Functional",
    precondition: "Authenticated session",
    steps: "1. Open /dashboard",
    expectedResult: "Stat cards/charts render with no crash and valid values.",
    automationScope: "UI + API",
    owner: "QA",
  },
  {
    id: "TC-UX-001",
    module: "Theme",
    feature: "Theme toggle",
    priority: "Medium",
    type: "Usability",
    precondition: "Authenticated session",
    steps: "1. Toggle theme in navigation",
    expectedResult: "UI switches between light and dark themes consistently.",
    automationScope: "UI",
    owner: "QA",
  },
  {
    id: "TC-ERR-001",
    module: "Routing",
    feature: "404 page",
    priority: "Medium",
    type: "Functional",
    precondition: "None",
    steps: "1. Navigate to unknown route, e.g., /abc123",
    expectedResult: "NotFound page is rendered.",
    automationScope: "UI",
    owner: "QA",
  },
  {
    id: "TC-SEC-001",
    module: "API Security",
    feature: "JWT attached to requests",
    priority: "Critical",
    type: "Security",
    precondition: "User is logged in",
    steps: "1. Trigger authenticated API request\n2. Inspect headers",
    expectedResult: "Authorization bearer token is added by axios interceptor.",
    automationScope: "API",
    owner: "QA + Dev",
  },
  {
    id: "TC-SEC-002",
    module: "API Security",
    feature: "401 handling",
    priority: "Critical",
    type: "Security",
    precondition: "Expired or invalid token",
    steps: "1. Call protected endpoint",
    expectedResult:
      "Session is handled gracefully (redirect and/or clear invalid auth state).",
    automationScope: "Integration",
    owner: "QA + Dev",
  },
  {
    id: "TC-PERF-001",
    module: "Performance",
    feature: "Initial dashboard load",
    priority: "Medium",
    type: "Performance",
    precondition: "Warm backend",
    steps: "1. Login\n2. Measure dashboard fully loaded time",
    expectedResult: "Dashboard interactive under agreed SLA threshold.",
    automationScope: "Manual + Monitoring",
    owner: "QA + DevOps",
  },
  {
    id: "TC-RQ-001",
    module: "React Query",
    feature: "Mutation invalidates list query",
    priority: "High",
    type: "Integration",
    precondition: "List page open",
    steps: "1. Create/update entity through modal\n2. Observe grid refresh",
    expectedResult:
      "Relevant query keys are invalidated and latest records are shown.",
    automationScope: "Integration",
    owner: "QA + Dev",
  },
  {
    id: "TC-FORM-001",
    module: "Form Validation",
    feature: "Formik/Yup required fields",
    priority: "High",
    type: "Negative",
    precondition: "Open any create modal",
    steps: "1. Leave required fields empty\n2. Submit",
    expectedResult:
      "Validation errors are shown and API is not called until form is valid.",
    automationScope: "UI",
    owner: "QA",
  },
  {
    id: "TC-FORM-002",
    module: "Form Validation",
    feature: "SelectFieldWrapper options",
    priority: "Medium",
    type: "Functional",
    precondition: "Form includes category select",
    steps: "1. Open select\n2. Pick option from constants",
    expectedResult: "Selected value is bound to Formik and submitted correctly.",
    automationScope: "UI",
    owner: "QA",
  },
  {
    id: "TC-SKT-001",
    module: "Socket",
    feature: "Realtime updates",
    priority: "Medium",
    type: "Integration",
    precondition: "Socket server running",
    steps:
      "1. Open messages/notifications\n2. Trigger event from another user",
    expectedResult:
      "Unread counts and views update without full-page refresh.",
    automationScope: "Integration",
    owner: "QA + Dev",
  },
  {
    id: "TC-BUILD-001",
    module: "Build",
    feature: "Production build integrity",
    priority: "High",
    type: "Release",
    precondition: "Dependencies installed",
    steps: "1. Run npm run build",
    expectedResult: "Build completes without errors and outputs dist assets.",
    automationScope: "CI",
    owner: "DevOps",
  },
];

const deliverables = [
  {
    phase: "Phase 2",
    stream: "Authentication",
    deliverable: "Forgot password and reset flow",
    rationale:
      "Reduce login friction and support account recovery without manual admin intervention.",
    priority: "P0",
    estimateWeeks: 1,
    dependencies: "Backend reset-token endpoints + email delivery service",
    successMetric:
      "Password reset completion rate reaches target and login-related support tickets decrease.",
  },
  {
    phase: "Phase 2",
    stream: "Authentication",
    deliverable: "Google login and registration",
    rationale:
      "Speed up onboarding and improve authentication reliability with OAuth provider support.",
    priority: "P0",
    estimateWeeks: 1,
    dependencies: "Google OAuth credentials + backend token exchange endpoints",
    successMetric:
      "Users can sign in and register via Google with stable success rate in production.",
  },
  {
    phase: "Phase 2",
    stream: "Quality Engineering",
    deliverable: "Automated regression suite foundation",
    rationale:
      "Protect critical admin workflows (auth, inventory, subscriptions, ads) from regressions.",
    priority: "P0",
    estimateWeeks: 2,
    dependencies: "Stable test environment + API seed data",
    successMetric: "At least 25 critical flows automated in CI with >95% pass rate.",
  },
  {
    phase: "Phase 2",
    stream: "Messaging",
    deliverable: "Rich media messaging (documents, photos, videos, location)",
    rationale:
      "Enable more complete buyer-seller communication beyond plain text.",
    priority: "P0",
    estimateWeeks: 3,
    dependencies: "Media upload/storage service + message payload schema extension",
    successMetric:
      "Users can send and receive supported attachment types across active conversations.",
  },
  {
    phase: "Phase 2",
    stream: "Messaging",
    deliverable: "Live location sharing and recipient tracking",
    rationale:
      "Support real-time meetup coordination and visibility for in-person exchanges.",
    priority: "P0",
    estimateWeeks: 3,
    dependencies: "Realtime socket channels + map provider + location permission UX",
    successMetric:
      "Recipient can track sender live location while sharing is active with low update latency.",
  },
  {
    phase: "Phase 2",
    stream: "Observability",
    deliverable: "Client-side error tracking + release tagging",
    rationale:
      "Faster diagnosis of production issues from SPA runtime and API failures.",
    priority: "P0",
    estimateWeeks: 1,
    dependencies: "Monitoring tool selection and DSN/env setup",
    successMetric:
      "Unhandled frontend exceptions captured with user/session context.",
  },
  {
    phase: "Phase 2",
    stream: "Security",
    deliverable: "Auth/session hardening",
    rationale:
      "Reduce risk from token misuse, stale sessions, and unauthorized route access.",
    priority: "P0",
    estimateWeeks: 1,
    dependencies: "Backend auth policy alignment",
    successMetric: "Security checklist signed off for JWT and route guard scenarios.",
  },
  {
    phase: "Phase 3",
    stream: "Search",
    deliverable: "Popular search functionality",
    rationale:
      "Help users discover trending queries faster and improve conversion from search journeys.",
    priority: "P1",
    estimateWeeks: 2,
    dependencies: "Search telemetry aggregation + ranking logic",
    successMetric:
      "Popular searches are surfaced with measurable uplift in search engagement.",
  },
  {
    phase: "Phase 3",
    stream: "Support",
    deliverable: "In-app support help center",
    rationale:
      "Provide self-service guidance and reduce repetitive support interactions.",
    priority: "P1",
    estimateWeeks: 2,
    dependencies: "Knowledge base content + support workflow definitions",
    successMetric:
      "Help center usage grows and first-response time for support issues improves.",
  },
  {
    phase: "Phase 3",
    stream: "User Management",
    deliverable: "Role-based permission matrix (RBAC)",
    rationale:
      "Enable scoped access for support/admin/operator personas.",
    priority: "P1",
    estimateWeeks: 2,
    dependencies: "Backend claims/roles endpoints",
    successMetric:
      "All sensitive actions gated by role checks with audit-ready behavior.",
  },
  {
    phase: "Phase 3",
    stream: "Platform Logging",
    deliverable: "Application-wide structured logging and audit trail",
    rationale:
      "Improve debugging, compliance, and operational visibility across all modules.",
    priority: "P1",
    estimateWeeks: 2,
    dependencies: "Central log pipeline + correlation IDs + retention policy",
    successMetric:
      "Critical user and system actions are traceable end-to-end in centralized logs.",
  },
  {
    phase: "Phase 3",
    stream: "Messages & Notifications",
    deliverable: "Realtime reliability improvements",
    rationale:
      "Improve message delivery confidence and unread count consistency.",
    priority: "P1",
    estimateWeeks: 2,
    dependencies: "Socket health endpoint and retry policy",
    successMetric:
      "Missed realtime updates reduced to near-zero in soak testing.",
  },
  {
    phase: "Phase 3",
    stream: "Data Grid UX",
    deliverable: "Advanced filtering/export for major tables",
    rationale:
      "Improve admin productivity for large datasets.",
    priority: "P1",
    estimateWeeks: 2,
    dependencies: "API support for filter/sort fields",
    successMetric: "Common support queries resolved without manual backend checks.",
  },
  {
    phase: "Phase 4",
    stream: "Performance",
    deliverable: "Dashboard and listing performance optimization",
    rationale:
      "Keep SPA responsive at scale as entities and activity grow.",
    priority: "P1",
    estimateWeeks: 2,
    dependencies: "Baseline profiling results",
    successMetric:
      "Dashboard interactive time reduced by at least 30% from baseline.",
  },
  {
    phase: "Phase 4",
    stream: "Release Engineering",
    deliverable: "Preview environment + deployment quality gates",
    rationale:
      "Catch release blockers before production and standardize sign-off.",
    priority: "P1",
    estimateWeeks: 1,
    dependencies: "CI/CD pipeline adjustments",
    successMetric:
      "All releases pass lint/build/smoke checks before production deploy.",
  },
  {
    phase: "Phase 4",
    stream: "Analytics",
    deliverable: "Full-application analytics instrumentation",
    rationale:
      "Track usage outcomes, performance, and feature adoption across the entire application.",
    priority: "P2",
    estimateWeeks: 2,
    dependencies: "Unified analytics schema, event taxonomy, and dashboard layer",
    successMetric:
      "Product, support, and ops teams can monitor end-to-end KPIs from a centralized analytics view.",
  },
];

const executionPlan = [
  {
    sprint: "Sprint 1",
    objective: "Stabilize quality baseline",
    keyOutputs:
      "Regression framework setup, smoke suite in CI, forgot-password flow, Google auth readiness",
    definitionOfDone:
      "CI runs on PR with pass/fail reporting and no flaky critical tests",
  },
  {
    sprint: "Sprint 2",
    objective: "Expand business-critical automation",
    keyOutputs:
      "Inventory, advertisements, subscriptions and transactions critical path coverage plus rich messaging attachments",
    definitionOfDone:
      "Top-priority modules have passing regression checks and defect leakage reduced",
  },
  {
    sprint: "Sprint 3",
    objective: "Ship hardening and observability",
    keyOutputs:
      "Session-hardening updates, runtime error tracking, app-wide logging, support help center rollout",
    definitionOfDone:
      "Security checks pass and production incidents are diagnosable within minutes",
  },
  {
    sprint: "Sprint 4",
    objective: "Prepare scale-oriented enhancements",
    keyOutputs:
      "RBAC implementation plan, data grid enhancements, popular search, live location tracking and full analytics rollout",
    definitionOfDone:
      "Roadmap epic specs are implementation-ready with acceptance criteria",
  },
];

const traceabilityMatrix = [
  {
    testCaseId: "TC-AUTH-001",
    route: "/login",
    pageOrComponent: "src/pages/auth/LoginUser.jsx",
    primaryService: "src/services/authService.js",
    queryOrState: "JWT localStorage + PublicRoute",
    riskArea: "Authentication",
  },
  {
    testCaseId: "TC-AUTH-004",
    route: "/dashboard",
    pageOrComponent: "src/components/route/PrivateRoute.jsx",
    primaryService: "src/services/authService.js",
    queryOrState: "Route guard session validation",
    riskArea: "Unauthorized access",
  },
  {
    testCaseId: "TC-AUTH-005",
    route: "*",
    pageOrComponent: "src/components/auth/GoogleOneTap.jsx",
    primaryService: "n/a",
    queryOrState: "Google SDK prompt flow",
    riskArea: "SSO prompt reliability",
  },
  {
    testCaseId: "TC-INV-001",
    route: "/inventory",
    pageOrComponent: "src/pages/Inventory.jsx",
    primaryService: "src/services/listingService.js",
    queryOrState: "TanStack Query listing fetch",
    riskArea: "Server pagination",
  },
  {
    testCaseId: "TC-INV-002",
    route: "/inventory/add",
    pageOrComponent: "src/components/modals/InventoryModal.jsx",
    primaryService: "src/services/listingService.js",
    queryOrState: "Mutation + invalidateQueries",
    riskArea: "Create workflow",
  },
  {
    testCaseId: "TC-ADV-001",
    route: "/advertisements/add",
    pageOrComponent: "src/components/modals/ListingAdvModal.jsx",
    primaryService: "src/services/advertService.js",
    queryOrState: "Mutation + list refresh",
    riskArea: "Ad publishing",
  },
  {
    testCaseId: "TC-ADV-002",
    route: "/advertisements/:id",
    pageOrComponent: "src/pages/AdvertisementDetails.jsx",
    primaryService: "src/services/advertService.js",
    queryOrState: "Detail query (queryKey advert,id)",
    riskArea: "Detail rendering",
  },
  {
    testCaseId: "TC-SUB-001",
    route: "/subscriptions/add",
    pageOrComponent: "src/components/modals/SubscriptionModal.jsx",
    primaryService: "src/services/subscriptionService.js",
    queryOrState: "Mutation + invalidateQueries",
    riskArea: "Subscription setup",
  },
  {
    testCaseId: "TC-USER-001",
    route: "/userManagement",
    pageOrComponent: "src/pages/UserManagement.jsx",
    primaryService: "src/services/authService.js",
    queryOrState: "Grid state + filtering",
    riskArea: "User operations",
  },
  {
    testCaseId: "TC-USER-002",
    route: "/sellers",
    pageOrComponent: "src/App.jsx",
    primaryService: "n/a",
    queryOrState: "Navigate redirect",
    riskArea: "Legacy route compatibility",
  },
  {
    testCaseId: "TC-MSG-001",
    route: "/messages",
    pageOrComponent: "src/pages/Messages.jsx",
    primaryService: "src/services/messageService.js",
    queryOrState: "Query + socket events",
    riskArea: "Realtime unread consistency",
  },
  {
    testCaseId: "TC-NOTIF-001",
    route: "/notifications",
    pageOrComponent: "src/pages/Notifications.jsx",
    primaryService: "src/services/notificationService.js",
    queryOrState: "Notification query + socket events",
    riskArea: "Read/unread accuracy",
  },
  {
    testCaseId: "TC-PROF-001",
    route: "/profile",
    pageOrComponent: "src/pages/Profile.jsx",
    primaryService: "src/services/queries.js",
    queryOrState: "useUserProfileQuery",
    riskArea: "Profile data mapping",
  },
  {
    testCaseId: "TC-PROF-002",
    route: "/profile",
    pageOrComponent: "src/pages/Profile.jsx",
    primaryService: "src/services/sellerInfoService.js",
    queryOrState: "Mutations + toast feedback",
    riskArea: "Profile updates",
  },
  {
    testCaseId: "TC-TXN-001",
    route: "/transactions",
    pageOrComponent: "src/pages/Transactions.jsx",
    primaryService: "n/a (currently local data)",
    queryOrState: "Client state filter/search",
    riskArea: "Transaction presentation",
  },
  {
    testCaseId: "TC-DASH-001",
    route: "/dashboard",
    pageOrComponent: "src/pages/Dashboard.jsx",
    primaryService: "src/services/*",
    queryOrState: "Metrics queries",
    riskArea: "Widget stability",
  },
  {
    testCaseId: "TC-UX-001",
    route: "Global nav",
    pageOrComponent: "src/components/navigations/Navigation.jsx",
    primaryService: "n/a",
    queryOrState: "Theme mode toggle state",
    riskArea: "Visual consistency",
  },
  {
    testCaseId: "TC-SEC-001",
    route: "All protected routes",
    pageOrComponent: "src/api/axiosClient.js",
    primaryService: "src/api/axiosClient.js",
    queryOrState: "Request interceptor",
    riskArea: "Auth header propagation",
  },
  {
    testCaseId: "TC-RQ-001",
    route: "Inventory/Ads/Subscriptions",
    pageOrComponent: "src/pages/* + src/components/modals/*",
    primaryService: "src/services/*",
    queryOrState: "Query key invalidation behavior",
    riskArea: "Stale UI data",
  },
  {
    testCaseId: "TC-BUILD-001",
    route: "n/a",
    pageOrComponent: "package.json",
    primaryService: "Vite build pipeline",
    queryOrState: "npm run build",
    riskArea: "Release readiness",
  },
];

function makeSheet(data) {
  const worksheet = XLSX.utils.json_to_sheet(data);
  worksheet["!autofilter"] = {
    ref: worksheet["!ref"],
  };

  const headers = Object.keys(data[0] ?? {});
  worksheet["!cols"] = headers.map((header) => {
    const maxCellLength = Math.max(
      header.length,
      ...data.map((row) => String(row[header] ?? "").length)
    );

    return { wch: Math.min(Math.max(maxCellLength + 2, 16), 70) };
  });

  return worksheet;
}

function main() {
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, makeSheet(testCases), "Test Cases");
  XLSX.utils.book_append_sheet(
    workbook,
    makeSheet(deliverables),
    "Next Phase Deliverables"
  );
  XLSX.utils.book_append_sheet(
    workbook,
    makeSheet(executionPlan),
    "Execution Plan"
  );
  XLSX.utils.book_append_sheet(
    workbook,
    makeSheet(traceabilityMatrix),
    "Traceability"
  );

  const outputDir = path.resolve("docs", "qa");
  const outputFile = path.join(
    outputDir,
    "EasyPlug-QA-TestCases-NextPhase-Plan.xlsx"
  );

  fs.mkdirSync(outputDir, { recursive: true });
  try {
    XLSX.writeFile(workbook, outputFile);
    console.log(`Workbook generated: ${outputFile}`);
  } catch (error) {
    if (error?.code !== "EBUSY") {
      throw error;
    }

    const timestamp = new Date()
      .toISOString()
      .replace(/[:]/g, "-")
      .replace(/\.\d{3}Z$/, "Z");
    const fallbackFile = path.join(
      outputDir,
      `EasyPlug-QA-TestCases-NextPhase-Plan-${timestamp}.xlsx`
    );

    XLSX.writeFile(workbook, fallbackFile);
    console.log(
      `Primary workbook is locked; generated fallback workbook: ${fallbackFile}`
    );
  }
}

main();
