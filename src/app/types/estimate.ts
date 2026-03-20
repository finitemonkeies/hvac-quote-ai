export type QuoteLevel = "good" | "better" | "best";
export type VendorAvailability = "in-stock" | "limited" | "special-order";
export type DeliveryMethod = "email" | "sms" | "download" | "share";
export type VendorIntegrationMode = "mock" | "catalog" | "manual-api";
export type VendorConnectionStatus = "connected" | "needs-setup" | "error";

export interface ProposalDeliveryEvent {
  id: string;
  method: DeliveryMethod;
  timestamp: string;
  destination?: string;
  note?: string;
}

export interface EstimateDraft {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  propertyAddress: string;
  jobType: string;
  systemType: string;
  existingSystemType: string;
  existingSystemAge: string;
  existingFuelType: string;
  existingSystemCondition: string;
  tier: "budget" | "standard" | "premium";
  equipmentCost: number;
  laborHours: number;
  materials: number;
  projectScope: string;
  installLocation: string;
  accessDifficulty: string;
  comfortIssues: string;
  equipmentPackage: string;
  preferredBrand: string;
  targetGrossMargin: number;
  financingEnabled: boolean;
  financingTermMonths: number;
  maintenancePlan: boolean;
  surgeProtection: boolean;
  iaqBundle: boolean;
  extendedLaborWarranty: boolean;
  thermostatUpgrade: boolean;
  homeSize: number;
  tonnage: string;
  installTimeline: string;
  ductworkCondition: string;
  electricalReadiness: string;
  thermostatPreference: string;
  indoorAirQuality: string;
  accessNotes: string;
  notes: string;
  autoSuggest: boolean;
  removalNeeded: boolean;
  permitRequired: boolean;
}

export interface QuoteOptionInput {
  systemName: string;
  description: string;
  features: string[];
  estimatedPrice: number;
  priceRangeLow: number;
  priceRangeHigh: number;
}

export interface VendorComparison {
  vendorId: string;
  vendorName: string;
  packageLabel: string;
  brand: string;
  modelFamily: string;
  estimatedInstalledPrice: number;
  estimatedEquipmentCost: number;
  leadTimeDays: number;
  availability: VendorAvailability;
  rebateAmount: number;
  notes: string;
}

export interface VendorIntegration {
  id: string;
  slug: string;
  name: string;
  integrationMode: VendorIntegrationMode;
  active: boolean;
  priority: number;
  endpointUrl: string;
  branchCode: string;
  accountNumber: string;
  supportedSystemTypes: string[];
  notes: string;
  connectionStatus: VendorConnectionStatus;
  lastSyncAt: string | null;
  lastError: string | null;
}

export interface VendorIntegrationTestResult {
  vendorId: string;
  vendorName: string;
  status: VendorConnectionStatus;
  checkedAt: string;
  message: string;
  endpointUrl: string;
  secretConfigured: boolean;
  mode: VendorIntegrationMode;
  productCount: number;
}

export type QuotePolicyStatus = "approved" | "needs-approval";
export type EstimateApprovalStatus = "not-required" | "pending" | "approved";
export type EstimateOutcomeStatus = "draft" | "sent" | "accepted" | "lost";

export interface QuoteOption extends QuoteOptionInput {
  id: string;
  level: QuoteLevel;
  title: string;
  isRecommended: boolean;
  hardCost: number;
  grossMarginPercent: number;
  policyStatus: QuotePolicyStatus;
  policyReason: string | null;
  estimatedMonthlyPayment: number | null;
  recommendedVendor: VendorComparison | null;
  vendorComparisons: VendorComparison[];
  vendorStrategy: string | null;
}

export interface ProposalCompany {
  companyName: string;
  companyPhone: string;
  companyEmail: string;
  companyLicense: string;
  salespersonName: string;
}

export interface PricingRules {
  laborRatePerHour: number;
  marginFloorPercent: number;
  maxDiscountPercent: number;
  defaultFinancingApr: number;
  thermostatUpgradePrice: number;
  iaqBundlePrice: number;
  surgeProtectionPrice: number;
  maintenancePlanPrice: number;
  extendedLaborWarrantyPrice: number;
}

export interface EstimateRecord {
  id: string;
  createdAt: string;
  draft: EstimateDraft;
  options: QuoteOption[];
  proposal: ProposalCompany;
  selectedOptionId: string | null;
  approvalStatus?: EstimateApprovalStatus;
  approvalNote?: string;
  outcomeStatus?: EstimateOutcomeStatus;
  outcomeNote?: string;
  deliveryMethod?: DeliveryMethod;
  deliveryHistory: ProposalDeliveryEvent[];
}
