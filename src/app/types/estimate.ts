export type QuoteLevel = "good" | "better" | "best";

export interface EstimateDraft {
  customerName: string;
  propertyAddress: string;
  jobType: string;
  systemType: string;
  tier: "budget" | "standard" | "premium";
  equipmentCost: number;
  laborHours: number;
  materials: number;
  projectScope: string;
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

export interface QuoteOption extends QuoteOptionInput {
  id: string;
  level: QuoteLevel;
  title: string;
  isRecommended: boolean;
}

export interface ProposalCompany {
  companyName: string;
  companyPhone: string;
  companyEmail: string;
  companyLicense: string;
  salespersonName: string;
}

export interface EstimateRecord {
  id: string;
  createdAt: string;
  draft: EstimateDraft;
  options: QuoteOption[];
  proposal: ProposalCompany;
  selectedOptionId: string | null;
  deliveryMethod?: "email" | "sms" | "download" | "share";
}
