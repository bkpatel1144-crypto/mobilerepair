import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ErrorBoundary } from '@/components/shared/error-boundary'
import { RouteFallback } from '@/components/shared/route-fallback'
import { AppShell } from '@/components/layout/app-shell'
import { DASHBOARD_NAV, DASHBOARD_MENU_KEY, NAV_SECTIONS, menuKey } from '@/config/nav'

// Route-level code splitting: the marketing site never pays for the (eventually
// Firebase/Recharts-heavy) authenticated app bundle, and vice versa. This matters more than
// usual here — `AuthProviderLayout` (and everything under it) pulls in the entire Firebase SDK,
// so it and the route guards that depend on it must stay dynamic imports, never a static one at
// the top of this file, or the marketing pages would pay for Firebase on every load too.
const AuthProviderLayout = lazy(() =>
  import('@/components/auth/auth-provider-layout').then((m) => ({ default: m.AuthProviderLayout }))
)
const ProtectedRoute = lazy(() =>
  import('@/components/auth/protected-route').then((m) => ({ default: m.ProtectedRoute }))
)
const GuestOnlyRoute = lazy(() =>
  import('@/components/auth/guest-only-route').then((m) => ({ default: m.GuestOnlyRoute }))
)
const RequireMenuAccess = lazy(() =>
  import('@/components/auth/require-menu-access').then((m) => ({ default: m.RequireMenuAccess }))
)
const LandingPage = lazy(() =>
  import('@/pages/marketing/landing-page').then((m) => ({ default: m.LandingPage }))
)
const PricingPage = lazy(() =>
  import('@/pages/marketing/pricing-page').then((m) => ({ default: m.PricingPage }))
)
const LoginPage = lazy(() =>
  import('@/pages/auth/login-page').then((m) => ({ default: m.LoginPage }))
)
const SignupPage = lazy(() =>
  import('@/pages/auth/signup-page').then((m) => ({ default: m.SignupPage }))
)
const ForgotPasswordPage = lazy(() =>
  import('@/pages/auth/forgot-password-page').then((m) => ({ default: m.ForgotPasswordPage }))
)
const CompleteSetupPage = lazy(() =>
  import('@/pages/auth/complete-setup-page').then((m) => ({ default: m.CompleteSetupPage }))
)
const DashboardPage = lazy(() =>
  import('@/pages/app/dashboard-page').then((m) => ({ default: m.DashboardPage }))
)
const PlaceholderPage = lazy(() =>
  import('@/pages/app/placeholder-page').then((m) => ({ default: m.PlaceholderPage }))
)
const RoleManagementPage = lazy(() =>
  import('@/pages/app/administration/role-management-page').then((m) => ({
    default: m.RoleManagementPage,
  }))
)
const RoleConfigurePage = lazy(() =>
  import('@/pages/app/administration/role-configure-page').then((m) => ({
    default: m.RoleConfigurePage,
  }))
)
const UserManagementPage = lazy(() =>
  import('@/pages/app/administration/user-management-page').then((m) => ({
    default: m.UserManagementPage,
  }))
)
const CreateUserPage = lazy(() =>
  import('@/pages/app/administration/create-user-page').then((m) => ({ default: m.CreateUserPage }))
)
const ActiveSessionsPage = lazy(() =>
  import('@/pages/app/administration/active-sessions-page').then((m) => ({ default: m.ActiveSessionsPage }))
)
const IpWhitelistPage = lazy(() =>
  import('@/pages/app/administration/ip-whitelist-page').then((m) => ({ default: m.IpWhitelistPage }))
)
const LoginReportPage = lazy(() =>
  import('@/pages/app/administration/login-report-page').then((m) => ({ default: m.LoginReportPage }))
)
const SystemAuditPage = lazy(() =>
  import('@/pages/app/administration/system-audit-page').then((m) => ({ default: m.SystemAuditPage }))
)
const WorkflowDesignerPage = lazy(() =>
  import('@/pages/app/settings/workflow-designer-page').then((m) => ({
    default: m.WorkflowDesignerPage,
  }))
)
const JobCardsPage = lazy(() =>
  import('@/pages/app/service/job-cards-page').then((m) => ({ default: m.JobCardsPage }))
)
const CreateJobCardPage = lazy(() =>
  import('@/pages/app/service/job-cards/create-job-card-page').then((m) => ({
    default: m.CreateJobCardPage,
  }))
)
const JobCardDetailPage = lazy(() =>
  import('@/pages/app/service/job-cards/job-card-detail-page').then((m) => ({
    default: m.JobCardDetailPage,
  }))
)
const ServiceOptionsPage = lazy(() =>
  import('@/pages/app/service/service-options-page').then((m) => ({ default: m.ServiceOptionsPage }))
)
const JobCostingPage = lazy(() =>
  import('@/pages/app/service/job-costing-page').then((m) => ({ default: m.JobCostingPage }))
)
const ServiceItemsPage = lazy(() =>
  import('@/pages/app/service/service-items-page').then((m) => ({ default: m.ServiceItemsPage }))
)
const ReceiptsPaymentsPage = lazy(() =>
  import('@/pages/app/finance/receipts-payments-page').then((m) => ({ default: m.ReceiptsPaymentsPage }))
)
const PartyLedgerPage = lazy(() =>
  import('@/pages/app/finance/party-ledger-page').then((m) => ({ default: m.PartyLedgerPage }))
)
const CashBookPage = lazy(() =>
  import('@/pages/app/finance/cash-book-page').then((m) => ({ default: m.CashBookPage }))
)
const ReceivablesPage = lazy(() =>
  import('@/pages/app/finance/receivables-page').then((m) => ({ default: m.ReceivablesPage }))
)
const PayablesPage = lazy(() =>
  import('@/pages/app/finance/payables-page').then((m) => ({ default: m.PayablesPage }))
)
const UomPage = lazy(() => import('@/pages/app/masters/uom-page').then((m) => ({ default: m.UomPage })))
const ItemCategoriesPage = lazy(() =>
  import('@/pages/app/masters/item-categories-page').then((m) => ({ default: m.ItemCategoriesPage }))
)
const ItemMasterPage = lazy(() =>
  import('@/pages/app/masters/item-master-page').then((m) => ({ default: m.ItemMasterPage }))
)
const PaymentModesPage = lazy(() =>
  import('@/pages/app/masters/payment-modes-page').then((m) => ({ default: m.PaymentModesPage }))
)
const PartyCategoriesPage = lazy(() =>
  import('@/pages/app/masters/party-categories-page').then((m) => ({ default: m.PartyCategoriesPage }))
)
const PartiesPage = lazy(() => import('@/pages/app/masters/parties-page').then((m) => ({ default: m.PartiesPage })))
const DevicePurchasePage = lazy(() =>
  import('@/pages/app/second-hand-device/device-purchase-page').then((m) => ({ default: m.DevicePurchasePage }))
)
const CreateSecondHandPurchasePage = lazy(() =>
  import('@/pages/app/second-hand-device/create-purchase-page').then((m) => ({
    default: m.CreateSecondHandPurchasePage,
  }))
)
const DeviceStockPage = lazy(() =>
  import('@/pages/app/second-hand-device/device-stock-page').then((m) => ({ default: m.DeviceStockPage }))
)
const DeviceSalePage = lazy(() =>
  import('@/pages/app/second-hand-device/device-sale-page').then((m) => ({ default: m.DeviceSalePage }))
)
const PurchaseRegisterPage = lazy(() =>
  import('@/pages/app/second-hand-device/purchase-register-page').then((m) => ({ default: m.PurchaseRegisterPage }))
)
const SaleRegisterPage = lazy(() =>
  import('@/pages/app/second-hand-device/sale-register-page').then((m) => ({ default: m.SaleRegisterPage }))
)
const ServiceReportsPage = lazy(() =>
  import('@/pages/app/reports/service-reports-page').then((m) => ({ default: m.ServiceReportsPage }))
)
const JobWiseProfitPage = lazy(() =>
  import('@/pages/app/reports/job-wise-profit-page').then((m) => ({ default: m.JobWiseProfitPage }))
)
const SupplierReportPage = lazy(() =>
  import('@/pages/app/reports/supplier-report-page').then((m) => ({ default: m.SupplierReportPage }))
)
const TechnicianReportPage = lazy(() =>
  import('@/pages/app/reports/technician-report-page').then((m) => ({ default: m.TechnicianReportPage }))
)
const PeriodSummaryPage = lazy(() =>
  import('@/pages/app/reports/period-summary-page').then((m) => ({ default: m.PeriodSummaryPage }))
)
const FieldVisitReportPage = lazy(() =>
  import('@/pages/app/reports/field-visit-report-page').then((m) => ({ default: m.FieldVisitReportPage }))
)
const BranchManagementPage = lazy(() =>
  import('@/pages/app/settings/branch-management-page').then((m) => ({ default: m.BranchManagementPage }))
)
const CompanySettingsPage = lazy(() =>
  import('@/pages/app/settings/company-settings-page').then((m) => ({ default: m.CompanySettingsPage }))
)
const FinancialYearsPage = lazy(() =>
  import('@/pages/app/settings/financial-years-page').then((m) => ({ default: m.FinancialYearsPage }))
)
const BillingPage = lazy(() => import('@/pages/app/settings/billing-page').then((m) => ({ default: m.BillingPage })))
const PrintFormatsPage = lazy(() =>
  import('@/pages/app/settings/print-formats-page').then((m) => ({ default: m.PrintFormatsPage }))
)
const WhatsAppPage = lazy(() => import('@/pages/app/settings/whatsapp-page').then((m) => ({ default: m.WhatsAppPage })))
const BackupRestorePage = lazy(() =>
  import('@/pages/app/settings/backup-restore-page').then((m) => ({ default: m.BackupRestorePage }))
)

// Leaves with a real page built already — Phase 3's Role/User Management. Everything else in
// NAV_SECTIONS still renders <PlaceholderPage>, generated generically below, until its own
// phase builds it. Keyed by `menuKey()` so this can never drift from the nav config.
const LEAF_PAGE_OVERRIDES: Record<string, React.ComponentType> = {
  'administration/roles': RoleManagementPage,
  'administration/users': UserManagementPage,
  'administration/sessions': ActiveSessionsPage,
  'administration/ip-whitelist': IpWhitelistPage,
  'administration/login-report': LoginReportPage,
  'administration/audit': SystemAuditPage,
  'settings/workflow': WorkflowDesignerPage,
  'service/job-cards': JobCardsPage,
  'service/options': ServiceOptionsPage,
  'service/costing': JobCostingPage,
  'service/items': ServiceItemsPage,
  'finance/receipts': ReceiptsPaymentsPage,
  'finance/ledger': PartyLedgerPage,
  'finance/cashbook': CashBookPage,
  'finance/receivables': ReceivablesPage,
  'finance/payables': PayablesPage,
  'masters/uom': UomPage,
  'masters/item-categories': ItemCategoriesPage,
  'masters/items': ItemMasterPage,
  'masters/payment-modes': PaymentModesPage,
  'masters/party-categories': PartyCategoriesPage,
  'masters/parties': PartiesPage,
  'second-hand-device/purchase': DevicePurchasePage,
  'second-hand-device/stock': DeviceStockPage,
  'second-hand-device/sale': DeviceSalePage,
  'second-hand-device/purchase-register': PurchaseRegisterPage,
  'second-hand-device/sale-register': SaleRegisterPage,
  'reports/service': ServiceReportsPage,
  'reports/job-profit': JobWiseProfitPage,
  'reports/supplier': SupplierReportPage,
  'reports/technician': TechnicianReportPage,
  'reports/period-summary': PeriodSummaryPage,
  'reports/field-visits': FieldVisitReportPage,
  'settings/branches': BranchManagementPage,
  'settings/company': CompanySettingsPage,
  'settings/financial-years': FinancialYearsPage,
  'settings/billing': BillingPage,
  'settings/print-formats': PrintFormatsPage,
  'settings/whatsapp': WhatsAppPage,
  'settings/backup': BackupRestorePage,
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Most of this app's data is per-tenant and changes only when the current user acts on
      // it — refetch-on-focus is more noise than signal here, unlike a social feed.
      refetchOnWindowFocus: false,
      staleTime: 30_000,
      retry: 1,
    },
  },
})

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <BrowserRouter>
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                {/* Marketing (public) — no Firebase, no AuthProvider, deliberately. */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/pricing" element={<PricingPage />} />

                {/* Everything below needs to know whether someone is signed in, so it all
                 * lives under the one lazy-loaded AuthProvider boundary. */}
                <Route element={<AuthProviderLayout />}>
                  {/* Auth — redirects away if already signed in */}
                  <Route element={<GuestOnlyRoute />}>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/signup" element={<SignupPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  </Route>

                  {/* Authenticated app shell — redirects to /login if signed out, or to
                   * /complete-setup for a signed-in user whose profile doc never landed. */}
                  <Route element={<ProtectedRoute />}>
                    <Route path="/complete-setup" element={<CompleteSetupPage />} />
                    <Route path="/app" element={<AppShell />}>
                      <Route index element={<Navigate to="dashboard" replace />} />
                      <Route
                        path={DASHBOARD_NAV.slug}
                        element={
                          <RequireMenuAccess menuKey={DASHBOARD_MENU_KEY}>
                            <DashboardPage />
                          </RequireMenuAccess>
                        }
                      />
                      {NAV_SECTIONS.flatMap((section) =>
                        section.children
                          .filter((leaf) => !leaf.locked)
                          .map((leaf) => {
                            const key = menuKey(section.key, leaf.slug)
                            const OverridePage = LEAF_PAGE_OVERRIDES[key]
                            return (
                              <Route
                                key={key}
                                path={`${section.key}/${leaf.slug}`}
                                element={
                                  <RequireMenuAccess menuKey={key}>
                                    {OverridePage ? (
                                      <OverridePage />
                                    ) : (
                                      <PlaceholderPage
                                        icon={section.icon}
                                        title={leaf.label}
                                        subtitle={`${section.label} — ${leaf.label}`}
                                        phase={leaf.phase ?? section.phase}
                                      />
                                    )}
                                  </RequireMenuAccess>
                                }
                              />
                            )
                          })
                      )}
                      {/* Sub-pages reached by drilling into a specific role/user, not by their
                       * own sidebar leaf — gated by the same menu key as their parent list. */}
                      <Route
                        path="administration/roles/:roleId/configure"
                        element={
                          <RequireMenuAccess menuKey="administration/roles">
                            <RoleConfigurePage />
                          </RequireMenuAccess>
                        }
                      />
                      <Route
                        path="administration/users/create"
                        element={
                          <RequireMenuAccess menuKey="administration/users">
                            <CreateUserPage />
                          </RequireMenuAccess>
                        }
                      />
                      <Route
                        path="service/job-cards/create"
                        element={
                          <RequireMenuAccess menuKey="service/job-cards">
                            <CreateJobCardPage />
                          </RequireMenuAccess>
                        }
                      />
                      <Route
                        path="service/job-cards/:jobId"
                        element={
                          <RequireMenuAccess menuKey="service/job-cards">
                            <JobCardDetailPage />
                          </RequireMenuAccess>
                        }
                      />
                      <Route
                        path="second-hand-device/purchase/create"
                        element={
                          <RequireMenuAccess menuKey="second-hand-device/purchase">
                            <CreateSecondHandPurchasePage />
                          </RequireMenuAccess>
                        }
                      />
                    </Route>
                  </Route>
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
