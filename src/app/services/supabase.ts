import { createClient, type User } from "@supabase/supabase-js";
import type {
  EstimateDraft,
  EstimateRecord,
  PricingRules,
  ProposalCompany,
  QuoteOption,
  VendorComparison,
} from "../types/estimate";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

export type UserProfile = {
  id: string;
  fullName: string | null;
  companyName: string | null;
  phone: string | null;
  role: "manager" | "rep";
  organizationId: string | null;
  organizationName: string | null;
  organizationJoinCode: string | null;
};

export type WorkspaceMember = {
  id: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  role: "manager" | "rep";
};

export type VendorQuoteRequestSummary = {
  id: string;
  createdAt: string;
  customerName: string | null;
  systemType: string;
  jobType: string;
  itemCount: number;
};

type EstimateSnapshot = {
  version: 2;
  draft: EstimateDraft;
  proposal: ProposalCompany;
};

type EstimateOptionRow = {
  level: "good" | "better" | "best";
  title: string;
  system_name: string;
  description: string;
  features: string[] | null;
  estimated_price: number;
  price_range_low: number;
  price_range_high: number;
  is_recommended: boolean;
  hard_cost: number | null;
  gross_margin_percent: number | null;
  policy_status: QuoteOption["policyStatus"] | null;
  policy_reason: string | null;
  estimated_monthly_payment: number | null;
  vendor_strategy: string | null;
  vendor_snapshot: VendorComparison[] | null;
};

type EstimateRow = {
  id: string;
  created_at: string;
  customer_name: string | null;
  property_address: string | null;
  job_type: string;
  system_type: string;
  project_scope: string;
  notes: string | null;
  selected_option_id: string | null;
  approval_status: EstimateRecord["approvalStatus"] | null;
  approval_note: string | null;
  delivery_method: EstimateRecord["deliveryMethod"] | null;
  proposal_company_name: string | null;
  proposal_company_email: string | null;
  proposal_company_phone: string | null;
  estimate_options: EstimateOptionRow[] | null;
};

type PricingRulesRow = {
  labor_rate_per_hour: number;
  margin_floor_percent: number;
  max_discount_percent: number;
  default_financing_apr: number;
  thermostat_upgrade_price: number;
  iaq_bundle_price: number;
  surge_protection_price: number;
  maintenance_plan_price: number;
  extended_labor_warranty_price: number;
};

type UserRow = {
  id: string;
  full_name: string | null;
  company_name: string | null;
  phone: string | null;
  role: string | null;
  organization_id: string | null;
};

type OrganizationRow = {
  id: string;
  name: string;
  join_code: string;
};

function buildSnapshot(record: EstimateRecord) {
  const snapshot: EstimateSnapshot = {
    version: 2,
    draft: record.draft,
    proposal: record.proposal,
  };

  return JSON.stringify(snapshot);
}

function parseSnapshot(raw: string | null) {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<EstimateSnapshot>;
    if ((parsed.version === 1 || parsed.version === 2) && parsed.draft && parsed.proposal) {
      return parsed as EstimateSnapshot;
    }
  } catch {
    return null;
  }

  return null;
}

function mapOptions(rows: EstimateOptionRow[] | null): QuoteOption[] {
  return (rows ?? [])
    .sort((left, right) => {
      const order = { good: 0, better: 1, best: 2 };
      return order[left.level] - order[right.level];
    })
    .map((row) => ({
      id: row.level,
      level: row.level,
      title: row.title,
      systemName: row.system_name,
      description: row.description,
      features: row.features ?? [],
      estimatedPrice: row.estimated_price,
      priceRangeLow: row.price_range_low,
      priceRangeHigh: row.price_range_high,
      isRecommended: row.is_recommended,
      hardCost: Math.round(row.hard_cost ?? 0),
      grossMarginPercent: Math.round(row.gross_margin_percent ?? 0),
      policyStatus: row.policy_status ?? "approved",
      policyReason: row.policy_reason,
      estimatedMonthlyPayment: row.estimated_monthly_payment ? Math.round(row.estimated_monthly_payment) : null,
      recommendedVendor: (row.vendor_snapshot ?? [])[0] ?? null,
      vendorComparisons: row.vendor_snapshot ?? [],
      vendorStrategy: row.vendor_strategy,
    }));
}

function mapPricingRulesRow(row: PricingRulesRow): PricingRules {
  return {
    laborRatePerHour: row.labor_rate_per_hour,
    marginFloorPercent: row.margin_floor_percent,
    maxDiscountPercent: row.max_discount_percent,
    defaultFinancingApr: row.default_financing_apr,
    thermostatUpgradePrice: row.thermostat_upgrade_price,
    iaqBundlePrice: row.iaq_bundle_price,
    surgeProtectionPrice: row.surge_protection_price,
    maintenancePlanPrice: row.maintenance_plan_price,
    extendedLaborWarrantyPrice: row.extended_labor_warranty_price,
  };
}

function createJoinCode() {
  return crypto.randomUUID().split("-")[0].toUpperCase();
}

async function ensureCurrentUserWorkspace(user: User, profile: UserRow | null) {
  if (!supabase) {
    return null as OrganizationRow | null;
  }

  if (profile?.organization_id) {
    const { data } = await supabase
      .from("organizations")
      .select("id, name, join_code")
      .eq("id", profile.organization_id)
      .maybeSingle();

    return (data as OrganizationRow | null) ?? null;
  }

  const workspaceName = profile?.company_name || user.user_metadata?.company_name || `${user.email?.split("@")[0] ?? "HVAC"} Team`;
  const joinCode = createJoinCode();

  const { data: createdOrg, error: orgError } = await supabase
    .from("organizations")
    .insert({
      name: workspaceName,
      join_code: joinCode,
      owner_user_id: user.id,
    })
    .select("id, name, join_code")
    .single();

  if (orgError) {
    console.warn("Workspace creation failed", orgError);
    return null as OrganizationRow | null;
  }

  const { error: userError } = await supabase
    .from("users")
    .update({
      organization_id: createdOrg.id,
      company_name: workspaceName,
    })
    .eq("id", user.id);

  if (userError) {
    console.warn("Workspace assignment failed", userError);
  }

  return createdOrg as OrganizationRow;
}

function mapEstimateRow(row: EstimateRow): EstimateRecord {
  const snapshot = parseSnapshot(row.notes);
  const options = mapOptions(row.estimate_options);

  return {
    id: row.id,
    createdAt: row.created_at,
    draft:
      snapshot?.draft ?? {
        customerName: row.customer_name ?? "",
        customerEmail: "",
        customerPhone: "",
        propertyAddress: row.property_address ?? "",
        jobType: row.job_type,
        systemType: row.system_type,
        existingSystemType: row.system_type,
        existingSystemAge: "",
        existingFuelType: "Electric",
        existingSystemCondition: "Aging but operational",
        tier: "standard",
        equipmentCost: options.find((option) => option.level === "better")?.estimatedPrice ?? 0,
        laborHours: 10,
        materials: 450,
        projectScope: row.project_scope,
        installLocation: "Ground level",
        accessDifficulty: "Standard access",
        comfortIssues: "",
        equipmentPackage: "Matched system",
        preferredBrand: "Open",
        targetGrossMargin: 45,
        financingEnabled: true,
        financingTermMonths: 120,
        maintenancePlan: false,
        surgeProtection: false,
        iaqBundle: false,
        extendedLaborWarranty: false,
        thermostatUpgrade: true,
        homeSize: 2000,
        tonnage: "3.0 ton",
        installTimeline: "This week",
        ductworkCondition: "Existing ductwork in good shape",
        electricalReadiness: "Panel ready",
        thermostatPreference: "Smart thermostat",
        indoorAirQuality: "Standard filtration",
        accessNotes: "",
        notes: "",
        autoSuggest: true,
        removalNeeded: true,
        permitRequired: true,
      },
    options,
    proposal:
      snapshot?.proposal ?? {
        companyName: row.proposal_company_name ?? "HVAC Quote AI",
        companyPhone: row.proposal_company_phone ?? "",
        companyEmail: row.proposal_company_email ?? "",
        companyLicense: "",
        salespersonName: "Field Technician",
      },
    selectedOptionId: row.selected_option_id,
    approvalStatus: row.approval_status ?? "not-required",
    approvalNote: row.approval_note ?? "",
    deliveryMethod: row.delivery_method ?? undefined,
  };
}

export async function upsertUserProfile(user: User) {
  if (!supabase) {
    return { persisted: false };
  }

  const payload = {
    id: user.id,
    full_name: user.user_metadata?.full_name ?? null,
    company_name: user.user_metadata?.company_name ?? null,
    phone: user.phone ?? null,
    role: user.user_metadata?.role === "rep" ? "rep" : "manager",
  };

  const { error } = await supabase.from("users").upsert(payload);

  if (error) {
    console.warn("Supabase profile upsert failed", error);
    return { persisted: false, error };
  }

  const { data: profile } = await supabase
    .from("users")
    .select("id, full_name, company_name, phone, role, organization_id")
    .eq("id", user.id)
    .maybeSingle();

  await ensureCurrentUserWorkspace(user, (profile as UserRow | null) ?? null);

  return { persisted: true };
}

export async function fetchCurrentUserProfile() {
  if (!supabase) {
    return null as UserProfile | null;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null as UserProfile | null;
  }

  const { data, error } = await supabase
    .from("users")
    .select("id, full_name, company_name, phone, role, organization_id")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.warn("Supabase profile fetch failed", error);
    return null as UserProfile | null;
  }

  if (!data) {
    return null as UserProfile | null;
  }

  const userRow = data as UserRow;
  const workspace = userRow.organization_id
    ? ((await supabase
        .from("organizations")
        .select("id, name, join_code")
        .eq("id", userRow.organization_id)
        .maybeSingle()).data as OrganizationRow | null)
    : null;

  return {
    id: data.id as string,
    fullName: (data.full_name as string | null) ?? null,
    companyName: (data.company_name as string | null) ?? null,
    phone: (data.phone as string | null) ?? null,
    role: data.role === "rep" ? "rep" : "manager",
    organizationId: userRow.organization_id,
    organizationName: workspace?.name ?? null,
    organizationJoinCode: workspace?.join_code ?? null,
  };
}

export async function updateCurrentUserRole(role: UserProfile["role"]) {
  if (!supabase) {
    return { persisted: false };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { persisted: false };
  }

  const { error } = await supabase.from("users").upsert({
    id: user.id,
    role,
  });

  if (error) {
    console.warn("Supabase role update failed", error);
    return { persisted: false, error };
  }

  return { persisted: true };
}

export async function fetchWorkspaceMembers() {
  if (!supabase) {
    return [] as WorkspaceMember[];
  }

  const profile = await fetchCurrentUserProfile();
  if (!profile?.organizationId) {
    return [] as WorkspaceMember[];
  }

  const { data, error } = await supabase
    .from("users")
    .select("id, full_name, phone, role")
    .eq("organization_id", profile.organizationId)
    .order("created_at", { ascending: true });

  if (error) {
    console.warn("Workspace members fetch failed", error);
    return [] as WorkspaceMember[];
  }

  return (data ?? []).map((row) => ({
    id: row.id as string,
    fullName: (row.full_name as string | null) ?? null,
    email: null,
    phone: (row.phone as string | null) ?? null,
    role: row.role === "rep" ? "rep" : "manager",
  }));
}

export async function updateWorkspaceMemberRole(memberId: string, role: WorkspaceMember["role"]) {
  if (!supabase) {
    return { persisted: false };
  }

  const { error } = await supabase.from("users").update({ role }).eq("id", memberId);

  if (error) {
    console.warn("Workspace member role update failed", error);
    return { persisted: false, error };
  }

  return { persisted: true };
}

export async function updateCurrentWorkspace(input: { name?: string }) {
  if (!supabase) {
    return { persisted: false };
  }

  const profile = await fetchCurrentUserProfile();
  if (!profile?.organizationId) {
    return { persisted: false };
  }

  const payload = {
    ...(input.name ? { name: input.name } : {}),
  };

  const { error } = await supabase.from("organizations").update(payload).eq("id", profile.organizationId);

  if (error) {
    console.warn("Workspace update failed", error);
    return { persisted: false, error };
  }

  return { persisted: true };
}

export async function joinWorkspaceByCode(joinCode: string) {
  if (!supabase) {
    return { persisted: false };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { persisted: false };
  }

  const { data: organization, error: orgError } = await supabase
    .from("organizations")
    .select("id, name, join_code")
    .eq("join_code", joinCode.trim().toUpperCase())
    .maybeSingle();

  if (orgError || !organization) {
    return { persisted: false, error: orgError ?? new Error("Workspace not found.") };
  }

  const { error: userError } = await supabase
    .from("users")
    .update({ organization_id: organization.id, company_name: organization.name })
    .eq("id", user.id);

  if (userError) {
    console.warn("Workspace join failed", userError);
    return { persisted: false, error: userError };
  }

  return { persisted: true, organization: organization as OrganizationRow };
}

export async function saveEstimateToSupabase(record: EstimateRecord) {
  if (!supabase) {
    return { persisted: false };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { persisted: false };
  }

  const profile = await fetchCurrentUserProfile();
  if (!profile?.organizationId) {
    return { persisted: false };
  }

  const estimatePayload = {
    id: record.id,
    user_id: user.id,
    organization_id: profile.organizationId,
    customer_name: record.draft.customerName || null,
    property_address: record.draft.propertyAddress || null,
    job_type: record.draft.jobType,
    system_type: record.draft.systemType,
    project_scope: record.draft.projectScope,
    notes: buildSnapshot(record),
    selected_option_id: record.selectedOptionId,
    approval_status: record.approvalStatus ?? "not-required",
    approval_note: record.approvalNote || null,
    delivery_method: record.deliveryMethod ?? null,
    proposal_company_name: record.proposal.companyName,
    proposal_company_email: record.proposal.companyEmail,
    proposal_company_phone: record.proposal.companyPhone,
    created_at: record.createdAt,
  };

  const { error } = await supabase.from("estimates").upsert(estimatePayload);

  if (error) {
    console.warn("Supabase estimate save failed", error);
    return { persisted: false, error };
  }

  const optionRows = record.options.map((option) => ({
    estimate_id: record.id,
    level: option.level,
    title: option.title,
    system_name: option.systemName,
    description: option.description,
    features: option.features,
    estimated_price: option.estimatedPrice,
    price_range_low: option.priceRangeLow,
    price_range_high: option.priceRangeHigh,
    is_recommended: option.isRecommended,
    hard_cost: option.hardCost,
    gross_margin_percent: option.grossMarginPercent,
    policy_status: option.policyStatus,
    policy_reason: option.policyReason,
    estimated_monthly_payment: option.estimatedMonthlyPayment,
    vendor_strategy: option.vendorStrategy,
    vendor_snapshot: option.vendorComparisons,
  }));

  const { error: optionsError } = await supabase
    .from("estimate_options")
    .upsert(optionRows, { onConflict: "estimate_id,level" });

  if (optionsError) {
    console.warn("Supabase option save failed", optionsError);
    return { persisted: false, error: optionsError };
  }

  const { error: approvalError } = await supabase.from("estimate_approvals").upsert({
    estimate_id: record.id,
    user_id: user.id,
    organization_id: profile.organizationId,
    approval_status: record.approvalStatus ?? "not-required",
    approval_note: record.approvalNote || null,
  });

  if (approvalError) {
    console.warn("Supabase approval save failed", approvalError);
    return { persisted: false, error: approvalError };
  }

  return { persisted: true };
}

export async function fetchRecentEstimatesFromSupabase(limit = 8) {
  if (!supabase) {
    return [] as EstimateRecord[];
  }

  const profile = await fetchCurrentUserProfile();
  if (!profile?.organizationId) {
    return [] as EstimateRecord[];
  }

  const { data, error } = await supabase
    .from("estimates")
    .select(
      "id, created_at, customer_name, property_address, job_type, system_type, project_scope, notes, selected_option_id, approval_status, approval_note, delivery_method, proposal_company_name, proposal_company_email, proposal_company_phone, estimate_options(level, title, system_name, description, features, estimated_price, price_range_low, price_range_high, is_recommended, hard_cost, gross_margin_percent, policy_status, policy_reason, estimated_monthly_payment, vendor_strategy, vendor_snapshot)",
    )
    .eq("organization_id", profile.organizationId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.warn("Supabase estimate fetch failed", error);
    return [] as EstimateRecord[];
  }

  return (data as EstimateRow[]).map(mapEstimateRow);
}

export async function fetchPricingRulesFromSupabase() {
  if (!supabase) {
    return null as PricingRules | null;
  }
  const profile = await fetchCurrentUserProfile();
  if (!profile?.organizationId) {
    return null as PricingRules | null;
  }

  const { data, error } = await supabase
    .from("pricing_rules")
    .select(
      "labor_rate_per_hour, margin_floor_percent, max_discount_percent, default_financing_apr, thermostat_upgrade_price, iaq_bundle_price, surge_protection_price, maintenance_plan_price, extended_labor_warranty_price",
    )
    .eq("organization_id", profile.organizationId)
    .maybeSingle();

  if (error) {
    console.warn("Supabase pricing rules fetch failed", error);
    return null as PricingRules | null;
  }

  return data ? mapPricingRulesRow(data as PricingRulesRow) : null;
}

export async function savePricingRulesToSupabase(pricingRules: PricingRules) {
  if (!supabase) {
    return { persisted: false };
  }
  const profile = await fetchCurrentUserProfile();
  if (!profile?.organizationId) {
    return { persisted: false };
  }

  const payload = {
    organization_id: profile.organizationId,
    labor_rate_per_hour: pricingRules.laborRatePerHour,
    margin_floor_percent: pricingRules.marginFloorPercent,
    max_discount_percent: pricingRules.maxDiscountPercent,
    default_financing_apr: pricingRules.defaultFinancingApr,
    thermostat_upgrade_price: pricingRules.thermostatUpgradePrice,
    iaq_bundle_price: pricingRules.iaqBundlePrice,
    surge_protection_price: pricingRules.surgeProtectionPrice,
    maintenance_plan_price: pricingRules.maintenancePlanPrice,
    extended_labor_warranty_price: pricingRules.extendedLaborWarrantyPrice,
  };

  const { error } = await supabase.from("pricing_rules").upsert(payload);

  if (error) {
    console.warn("Supabase pricing rules save failed", error);
    return { persisted: false, error };
  }

  return { persisted: true };
}

export async function sendProposalEmailViaSupabase(input: {
  customerEmail: string;
  draft: EstimateDraft;
  pricingRules: PricingRules;
  proposal: ProposalCompany;
  options: QuoteOption[];
  selectedOptionId: string | null;
}) {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  let data: unknown;
  let error: unknown;

  try {
    const response = await supabase.functions.invoke("send-proposal", {
      body: input,
    });

    data = response.data;
    error = response.error;
  } catch (invokeError) {
    const maybeContext = (invokeError as { context?: Response } | null)?.context;

    if (maybeContext) {
      try {
        const payload = await maybeContext.json();
        throw new Error(payload?.error || payload?.message || "Failed to send proposal email.");
      } catch {
        const text = await maybeContext.text();
        throw new Error(text || "Failed to send proposal email.");
      }
    }

    throw invokeError;
  }

  if (error) {
    const message =
      (error as { message?: string } | null)?.message || "Failed to send proposal email.";
    throw new Error(message);
  }

  if ((data as { error?: string } | null)?.error) {
    throw new Error((data as { error: string }).error);
  }

  return data;
}

export async function generateQuoteOptionsViaSupabase(input: {
  draft: EstimateDraft;
  pricingRules: PricingRules;
}) {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase.functions.invoke("generate-quotes", {
    body: input,
  });

  if (error) {
    throw new Error(error.message || "Failed to generate quote options.");
  }

  const options = (data as { options?: QuoteOption[] } | null)?.options;
  if (!options || !Array.isArray(options)) {
    throw new Error("Quote generation returned an invalid payload.");
  }

  return options;
}

export async function fetchLatestVendorQuoteRequestSummary() {
  if (!supabase) {
    return null as VendorQuoteRequestSummary | null;
  }

  const profile = await fetchCurrentUserProfile();
  if (!profile?.organizationId) {
    return null as VendorQuoteRequestSummary | null;
  }

  const { data: requestRow, error } = await supabase
    .from("vendor_quote_requests")
    .select("id, created_at, customer_name, system_type, job_type")
    .eq("organization_id", profile.organizationId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "Failed to fetch vendor quote request.");
  }

  if (!requestRow) {
    return null as VendorQuoteRequestSummary | null;
  }

  const { count, error: countError } = await supabase
    .from("vendor_quote_items")
    .select("id", { count: "exact", head: true })
    .eq("request_id", requestRow.id as string);

  if (countError) {
    throw new Error(countError.message || "Failed to fetch vendor quote items.");
  }

  return {
    id: requestRow.id as string,
    createdAt: requestRow.created_at as string,
    customerName: (requestRow.customer_name as string | null) ?? null,
    systemType: requestRow.system_type as string,
    jobType: requestRow.job_type as string,
    itemCount: count ?? 0,
  };
}
