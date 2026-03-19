import { createClient, type User } from "@supabase/supabase-js";
import type {
  EstimateDraft,
  EstimateRecord,
  ProposalCompany,
  QuoteOption,
} from "../types/estimate";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

type EstimateSnapshot = {
  version: 1;
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
  delivery_method: EstimateRecord["deliveryMethod"] | null;
  proposal_company_name: string | null;
  proposal_company_email: string | null;
  proposal_company_phone: string | null;
  estimate_options: EstimateOptionRow[] | null;
};

function buildSnapshot(record: EstimateRecord) {
  const snapshot: EstimateSnapshot = {
    version: 1,
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
    if (parsed.version === 1 && parsed.draft && parsed.proposal) {
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
    }));
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
        propertyAddress: row.property_address ?? "",
        jobType: row.job_type,
        systemType: row.system_type,
        tier: "standard",
        equipmentCost: options.find((option) => option.level === "better")?.estimatedPrice ?? 0,
        laborHours: 10,
        materials: 450,
        projectScope: row.project_scope,
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
  };

  const { error } = await supabase.from("users").upsert(payload);

  if (error) {
    console.warn("Supabase profile upsert failed", error);
    return { persisted: false, error };
  }

  return { persisted: true };
}

export async function saveEstimateToSupabase(record: EstimateRecord) {
  if (!supabase) {
    return { persisted: false };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const estimatePayload = {
    id: record.id,
    user_id: user?.id ?? null,
    customer_name: record.draft.customerName || null,
    property_address: record.draft.propertyAddress || null,
    job_type: record.draft.jobType,
    system_type: record.draft.systemType,
    project_scope: record.draft.projectScope,
    notes: buildSnapshot(record),
    selected_option_id: record.selectedOptionId,
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
  }));

  const { error: optionsError } = await supabase
    .from("estimate_options")
    .upsert(optionRows, { onConflict: "estimate_id,level" });

  if (optionsError) {
    console.warn("Supabase option save failed", optionsError);
    return { persisted: false, error: optionsError };
  }

  return { persisted: true };
}

export async function fetchRecentEstimatesFromSupabase(limit = 8) {
  if (!supabase) {
    return [] as EstimateRecord[];
  }

  const { data, error } = await supabase
    .from("estimates")
    .select(
      "id, created_at, customer_name, property_address, job_type, system_type, project_scope, notes, selected_option_id, delivery_method, proposal_company_name, proposal_company_email, proposal_company_phone, estimate_options(level, title, system_name, description, features, estimated_price, price_range_low, price_range_high, is_recommended)",
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.warn("Supabase estimate fetch failed", error);
    return [] as EstimateRecord[];
  }

  return (data as EstimateRow[]).map(mapEstimateRow);
}

export async function sendProposalEmailViaSupabase(input: {
  customerEmail: string;
  draft: EstimateDraft;
  proposal: ProposalCompany;
  options: QuoteOption[];
  selectedOptionId: string | null;
}) {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase.functions.invoke("send-proposal", {
    body: input,
  });

  if (error) {
    throw new Error(error.message || "Failed to send proposal email.");
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data;
}
