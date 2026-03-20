export type QuoteLevel = "good" | "better" | "best";

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

export type QuotePolicyStatus = "approved" | "needs-approval";
export type EstimateApprovalStatus = "not-required" | "pending" | "approved";

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
  deliveryMethod?: "email" | "sms" | "download" | "share";
}
