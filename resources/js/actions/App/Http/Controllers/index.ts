import DashboardController from './DashboardController'
import AnomalyController from './AnomalyController'
import CompanyController from './CompanyController'
import AuditPriorityController from './AuditPriorityController'
import RiskMapController from './RiskMapController'
import AccountController from './AccountController'
import FraudAlertStatusController from './FraudAlertStatusController'
import AnomalyFollowUpController from './AnomalyFollowUpController'
import PrioritizeAuditController from './PrioritizeAuditController'
import WarningLetterController from './WarningLetterController'
import InvestigationReportController from './InvestigationReportController'
import Settings from './Settings'
const Controllers = {
    DashboardController: Object.assign(DashboardController, DashboardController),
AnomalyController: Object.assign(AnomalyController, AnomalyController),
CompanyController: Object.assign(CompanyController, CompanyController),
AuditPriorityController: Object.assign(AuditPriorityController, AuditPriorityController),
RiskMapController: Object.assign(RiskMapController, RiskMapController),
AccountController: Object.assign(AccountController, AccountController),
FraudAlertStatusController: Object.assign(FraudAlertStatusController, FraudAlertStatusController),
AnomalyFollowUpController: Object.assign(AnomalyFollowUpController, AnomalyFollowUpController),
PrioritizeAuditController: Object.assign(PrioritizeAuditController, PrioritizeAuditController),
WarningLetterController: Object.assign(WarningLetterController, WarningLetterController),
InvestigationReportController: Object.assign(InvestigationReportController, InvestigationReportController),
Settings: Object.assign(Settings, Settings),
}

export default Controllers