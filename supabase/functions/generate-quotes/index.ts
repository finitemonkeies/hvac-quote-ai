import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type QuoteLevel = "good" | "better" | "best";
type PolicyStatus = "approved" | "needs-approval";
type VendorAvailability = "in-stock" | "limited" | "special-order";

type EstimateDraft = {
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
};

type PricingRules = {
  laborRatePerHour: number;
  marginFloorPercent: number;
  maxDiscountPercent: number;
  defaultFinancingApr: number;
  thermostatUpgradePrice: number;
  iaqBundlePrice: number;
  surgeProtectionPrice: number;
  maintenancePlanPrice: number;
  extendedLaborWarrantyPrice: number;
};

type VendorComparison = {
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
};

type QuoteOption = {
  id: string;
  level: QuoteLevel;
  title: string;
  systemName: string;
  description: string;
  features: string[];
  estimatedPrice: number;
  priceRangeLow: number;
  priceRangeHigh: number;
  isRecommended: boolean;
  hardCost: number;
  grossMarginPercent: number;
  policyStatus: PolicyStatus;
  policyReason: string | null;
  estimatedMonthlyPayment: number | null;
  recommendedVendor: VendorComparison | null;
  vendorComparisons: VendorComparison[];
  vendorStrategy: string | null;
};

type OpenAiQuoteResponse = {
  options: Array<{
    level: QuoteLevel;
    systemName: string;
    description: string;
    features: string[];
    estimatedPrice: number;
    priceRangeLow: number;
    priceRangeHigh: number;
  }>;
};

type VendorProductRow = {
  vendor_id: string;
  vendor_name: string;
  brand: string;
  model_family: string;
  quote_level: QuoteLevel;
  equipment_factor: number;
  lead_time_days: number;
  availability: VendorAvailability;
  rebate_amount: number;
  notes: string;
};

type VendorRow = {
  id: string;
  slug: string;
  name: string;
  integration_mode: "mock" | "catalog" | "manual-api";
  active: boolean;
  priority: number | null;
  config: {
    endpointUrl?: string;
    branchCode?: string;
    accountNumber?: string;
    supportedSystemTypes?: string[];
    notes?: string;
  } | null;
};

type ManualApiVendorResponse = {
  status?: "ok" | "error";
  message?: string;
  products?: Array<{
    brand?: string;
    modelFamily?: string;
    quoteLevel?: QuoteLevel;
    equipmentFactor?: number;
    leadTimeDays?: number;
    availability?: VendorAvailability;
    rebateAmount?: number;
    notes?: string;
  }>;
};

type VendorHealthCheckResult = {
  vendorId: string;
  vendorName: string;
  status: "connected" | "needs-setup" | "error";
  checkedAt: string;
  message: string;
  endpointUrl: string;
  secretConfigured: boolean;
  mode: VendorRow["integration_mode"];
  productCount: number;
};

const fallbackVendorProducts: VendorProductRow[] = [
  {
    vendor_id: "supply-pro",
    vendor_name: "Supply Pro Distribution",
    brand: "RunTru",
    model_family: "Builder Series Split",
    quote_level: "good",
    equipment_factor: 0.96,
    lead_time_days: 2,
    availability: "in-stock",
    rebate_amount: 0,
    notes: "Fast-turn regional stock with reliable standard replacements.",
  },
  {
    vendor_id: "supply-pro",
    vendor_name: "Supply Pro Distribution",
    brand: "RunTru",
    model_family: "Performance Variable Fan",
    quote_level: "better",
    equipment_factor: 0.96,
    lead_time_days: 2,
    availability: "in-stock",
    rebate_amount: 250,
    notes: "Fast-turn regional stock with reliable standard replacements.",
  },
  {
    vendor_id: "supply-pro",
    vendor_name: "Supply Pro Distribution",
    brand: "RunTru",
    model_family: "Comfort Inverter Plus",
    quote_level: "best",
    equipment_factor: 0.96,
    lead_time_days: 2,
    availability: "in-stock",
    rebate_amount: 450,
    notes: "Fast-turn regional stock with reliable standard replacements.",
  },
  {
    vendor_id: "comfort-warehouse",
    vendor_name: "Comfort Warehouse",
    brand: "Goodman",
    model_family: "GS Split Essentials",
    quote_level: "good",
    equipment_factor: 1.01,
    lead_time_days: 4,
    availability: "limited",
    rebate_amount: 100,
    notes: "Strong rebate posture with homeowner-friendly upgrade packages.",
  },
  {
    vendor_id: "comfort-warehouse",
    vendor_name: "Comfort Warehouse",
    brand: "Goodman",
    model_family: "Two-Stage Comfort Pairing",
    quote_level: "better",
    equipment_factor: 1.01,
    lead_time_days: 4,
    availability: "limited",
    rebate_amount: 300,
    notes: "Strong rebate posture with homeowner-friendly upgrade packages.",
  },
  {
    vendor_id: "comfort-warehouse",
    vendor_name: "Comfort Warehouse",
    brand: "Goodman",
    model_family: "Inverter QuietDrive",
    quote_level: "best",
    equipment_factor: 1.01,
    lead_time_days: 4,
    availability: "limited",
    rebate_amount: 500,
    notes: "Strong rebate posture with homeowner-friendly upgrade packages.",
  },
  {
    vendor_id: "premier-hvac",
    vendor_name: "Premier HVAC Supply",
    brand: "Carrier",
    model_family: "Comfort Standard Match",
    quote_level: "good",
    equipment_factor: 1.08,
    lead_time_days: 6,
    availability: "special-order",
    rebate_amount: 0,
    notes: "Premium brand path for homeowners prioritizing perceived value and quiet operation.",
  },
  {
    vendor_id: "premier-hvac",
    vendor_name: "Premier HVAC Supply",
    brand: "Carrier",
    model_family: "Performance Hybrid Match",
    quote_level: "better",
    equipment_factor: 1.08,
    lead_time_days: 6,
    availability: "special-order",
    rebate_amount: 200,
    notes: "Premium brand path for homeowners prioritizing perceived value and quiet operation.",
  },
  {
    vendor_id: "premier-hvac",
    vendor_name: "Premier HVAC Supply",
    brand: "Carrier",
    model_family: "Infinity Variable Platform",
    quote_level: "best",
    equipment_factor: 1.08,
    lead_time_days: 6,
    availability: "special-order",
    rebate_amount: 350,
    notes: "Premium brand path for homeowners prioritizing perceived value and quiet operation.",
  },
];

function normalizeSupportedSystemTypes(input: unknown) {
  if (!Array.isArray(input)) {
    return [] as string[];
  }

  return input.filter((value): value is string => typeof value === "string" && value.length > 0);
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

const responseSchema = {
  name: "hvac_quote_options",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["options"],
    properties: {
      options: {
        type: "array",
        minItems: 3,
        maxItems: 3,
        items: {
          type: "object",
          additionalProperties: false,
          required: [
            "level",
            "systemName",
            "description",
            "features",
            "estimatedPrice",
            "priceRangeLow",
            "priceRangeHigh",
          ],
          properties: {
            level: {
              type: "string",
              enum: ["good", "better", "best"],
            },
            systemName: { type: "string" },
            description: { type: "string" },
            features: {
              type: "array",
              minItems: 3,
              maxItems: 6,
              items: { type: "string" },
            },
            estimatedPrice: { type: "number" },
            priceRangeLow: { type: "number" },
            priceRangeHigh: { type: "number" },
          },
        },
      },
    },
  },
};

async function requireAuthenticatedUser(request: Request) {
  const authorization = request.headers.get("Authorization") ?? request.headers.get("authorization");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

  if (!authorization?.startsWith("Bearer ")) {
    throw jsonResponse({ error: "Missing authorization token." }, 401);
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    throw jsonResponse({ error: "Missing Supabase auth configuration." }, 500);
  }

  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    method: "GET",
    headers: {
      apikey: supabaseAnonKey,
      Authorization: authorization,
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw jsonResponse({ error: message || "Invalid auth token." }, 401);
  }
}

function sanitizeOptions(input: OpenAiQuoteResponse["options"]): QuoteOption[] {
  const order: QuoteLevel[] = ["good", "better", "best"];

  return order.map((level, index) => {
    const option = input.find((item) => item.level === level) ?? input[index];
    const safePrice = Math.max(0, Math.round(option?.estimatedPrice ?? 0));

    return {
      id: level,
      level,
      title: level === "good" ? "Good" : level === "better" ? "Better" : "Best",
      systemName:
        option?.systemName ??
        (level === "good"
          ? "14 SEER2 Comfort System"
          : level === "better"
            ? "16 SEER2 Performance System"
            : "20 SEER2 High Efficiency System"),
      description: option?.description ?? "",
      features: (option?.features ?? []).slice(0, 6),
      estimatedPrice: safePrice,
      priceRangeLow: Math.max(0, Math.round(option?.priceRangeLow ?? safePrice * 0.95)),
      priceRangeHigh: Math.max(0, Math.round(option?.priceRangeHigh ?? safePrice * 1.06)),
      isRecommended: level === "best",
      hardCost: 0,
      grossMarginPercent: 0,
      policyStatus: "approved",
      policyReason: null,
      estimatedMonthlyPayment: null,
      recommendedVendor: null,
      vendorComparisons: [],
      vendorStrategy: null,
    };
  });
}

function buildPrompt(draft: EstimateDraft, pricingRules: PricingRules) {
  return [
    "You generate HVAC install estimate options for field technicians.",
    "Return Good, Better, Best options only.",
    "Use generic system names and do not mention manufacturers, SKUs, or inventory.",
    "Good system name: 14 SEER2 Comfort System.",
    "Better system name: 16 SEER2 Performance System.",
    "Best system name: 20 SEER2 High Efficiency System.",
    "Each option needs a concise description, 3-6 features, estimated price, and low/high range.",
    "Make the Better option the baseline and Best the recommended option.",
    "Pricing assumptions:",
    JSON.stringify(pricingRules),
    "Estimate context:",
    JSON.stringify(draft),
  ].join("\n");
}

async function generateWithOpenAi(draft: EstimateDraft, pricingRules: PricingRules) {
  const openAiApiKey = Deno.env.get("OPENAI_API_KEY");
  if (!openAiApiKey) {
    return null as QuoteOption[] | null;
  }

  const model = Deno.env.get("OPENAI_MODEL") ?? "gpt-5-mini";
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openAiApiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      messages: [
        {
          role: "system",
          content: "You create structured HVAC quote options for technicians.",
        },
        {
          role: "user",
          content: buildPrompt(draft, pricingRules),
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: responseSchema,
      },
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `OpenAI request failed with ${response.status}`);
  }

  const payload = await response.json();
  const content = payload.choices?.[0]?.message?.content;
  const parsed = JSON.parse(content ?? "{}") as OpenAiQuoteResponse;
  return applyQuotePolicy(draft, pricingRules, sanitizeOptions(parsed.options ?? []));
}

function calculateMonthlyPayment(principal: number, aprPercent: number, termMonths: number) {
  if (principal <= 0 || termMonths <= 0) {
    return 0;
  }

  const monthlyRate = aprPercent / 100 / 12;
  if (monthlyRate === 0) {
    return principal / termMonths;
  }

  return (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -termMonths));
}

function supportsSystemType(vendor: VendorRow, systemType: string) {
  const supportedSystemTypes = normalizeSupportedSystemTypes(vendor.config?.supportedSystemTypes);
  if (supportedSystemTypes.length === 0) {
    return true;
  }

  return supportedSystemTypes.some((supported) => supported.toLowerCase() === systemType.toLowerCase());
}

function sortVendors(left: VendorRow, right: VendorRow) {
  return (left.priority ?? 100) - (right.priority ?? 100);
}

function getVendorSecretKeyName(vendor: VendorRow) {
  return `VENDOR_${vendor.slug.toUpperCase().replace(/[^A-Z0-9]/g, "_")}_API_KEY`;
}

function buildSupplyProAdapterPayload(
  operation: "health-check" | "quote-request",
  vendor: VendorRow,
  draft: EstimateDraft,
  pricingRules: PricingRules,
) {
  return {
    operation,
    vendor: {
      slug: vendor.slug,
      name: vendor.name,
      branchCode: vendor.config?.branchCode ?? "",
      accountNumber: vendor.config?.accountNumber ?? "",
    },
    opportunity: {
      customerName: draft.customerName,
      propertyAddress: draft.propertyAddress,
      systemType: draft.systemType,
      jobType: draft.jobType,
      tonnage: draft.tonnage,
      preferredBrand: draft.preferredBrand,
      installTimeline: draft.installTimeline,
    },
    pricingContext: {
      targetGrossMargin: draft.targetGrossMargin,
      financingEnabled: draft.financingEnabled,
      financingTermMonths: draft.financingTermMonths,
      laborRatePerHour: pricingRules.laborRatePerHour,
    },
    estimate: draft,
  };
}

function buildGenericVendorAdapterPayload(
  operation: "health-check" | "quote-request",
  vendor: VendorRow,
  draft: EstimateDraft,
  pricingRules: PricingRules,
) {
  if (vendor.slug === "supply-pro") {
    return buildSupplyProAdapterPayload(operation, vendor, draft, pricingRules);
  }

  return {
    operation,
    vendor: {
      slug: vendor.slug,
      branchCode: vendor.config?.branchCode ?? "",
      accountNumber: vendor.config?.accountNumber ?? "",
    },
    draft,
    pricingRules,
  };
}

async function updateVendorConnectionState(
  adminClient: ReturnType<typeof createClient>,
  vendorId: string,
  result: VendorHealthCheckResult,
) {
  await adminClient
    .from("vendors")
    .update({
      connection_status: result.status,
      last_sync_at: result.checkedAt,
      last_error: result.status === "error" ? result.message : null,
    })
    .eq("id", vendorId);
}

async function fetchManualApiVendorProducts(
  vendor: VendorRow,
  draft: EstimateDraft,
  pricingRules: PricingRules,
) {
  const endpointUrl = vendor.config?.endpointUrl?.trim();
  if (!endpointUrl) {
    return [] as VendorProductRow[];
  }

  const secretKeyName = getVendorSecretKeyName(vendor);
  const apiKey = Deno.env.get(secretKeyName);
  if (!apiKey) {
    return [] as VendorProductRow[];
  }

  const response = await fetch(endpointUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(buildGenericVendorAdapterPayload("quote-request", vendor, draft, pricingRules)),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Vendor adapter request failed with ${response.status}`);
  }

  const payload = (await response.json()) as ManualApiVendorResponse;

  return (payload.products ?? []).map((product) => ({
    vendor_id: vendor.id,
    vendor_name: vendor.name,
    brand: product.brand ?? "Vendor equipment",
    model_family: product.modelFamily ?? "Matched package",
    quote_level: product.quoteLevel ?? "better",
    equipment_factor: Number(product.equipmentFactor ?? 1),
    lead_time_days: Number(product.leadTimeDays ?? 3),
    availability: product.availability ?? "limited",
    rebate_amount: Number(product.rebateAmount ?? 0),
    notes: product.notes ?? vendor.config?.notes ?? "Live vendor adapter response",
  }));
}

async function runVendorHealthCheck(
  adminClient: ReturnType<typeof createClient>,
  vendor: VendorRow,
  draft: EstimateDraft,
  pricingRules: PricingRules,
) {
  const checkedAt = new Date().toISOString();
  const endpointUrl = vendor.config?.endpointUrl?.trim() ?? "";
  const secretConfigured = Boolean(Deno.env.get(getVendorSecretKeyName(vendor)));

  if (vendor.integration_mode === "mock") {
    const result: VendorHealthCheckResult = {
      vendorId: vendor.id,
      vendorName: vendor.name,
      status: "connected",
      checkedAt,
      message: "Mock vendor is active and ready to provide fallback comparisons.",
      endpointUrl,
      secretConfigured,
      mode: vendor.integration_mode,
      productCount: 3,
    };
    await updateVendorConnectionState(adminClient, vendor.id, result);
    return result;
  }

  if (!endpointUrl) {
    const result: VendorHealthCheckResult = {
      vendorId: vendor.id,
      vendorName: vendor.name,
      status: "needs-setup",
      checkedAt,
      message: "Add an endpoint URL before testing this vendor adapter.",
      endpointUrl,
      secretConfigured,
      mode: vendor.integration_mode,
      productCount: 0,
    };
    await updateVendorConnectionState(adminClient, vendor.id, result);
    return result;
  }

  if (!secretConfigured) {
    const result: VendorHealthCheckResult = {
      vendorId: vendor.id,
      vendorName: vendor.name,
      status: "needs-setup",
      checkedAt,
      message: `Missing required secret ${getVendorSecretKeyName(vendor)} in Supabase Edge Function secrets.`,
      endpointUrl,
      secretConfigured,
      mode: vendor.integration_mode,
      productCount: 0,
    };
    await updateVendorConnectionState(adminClient, vendor.id, result);
    return result;
  }

  try {
    const response = await fetch(endpointUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get(getVendorSecretKeyName(vendor))}`,
      },
      body: JSON.stringify(buildGenericVendorAdapterPayload("health-check", vendor, draft, pricingRules)),
    });

    if (!response.ok) {
      const message = await response.text();
      const result: VendorHealthCheckResult = {
        vendorId: vendor.id,
        vendorName: vendor.name,
        status: "error",
        checkedAt,
        message: message || `Adapter responded with ${response.status}.`,
        endpointUrl,
        secretConfigured,
        mode: vendor.integration_mode,
        productCount: 0,
      };
      await updateVendorConnectionState(adminClient, vendor.id, result);
      return result;
    }

    const payload = (await response.json()) as ManualApiVendorResponse;
    const productCount = Array.isArray(payload.products) ? payload.products.length : 0;
    const result: VendorHealthCheckResult = {
      vendorId: vendor.id,
      vendorName: vendor.name,
      status: payload.status === "error" ? "error" : "connected",
      checkedAt,
      message:
        payload.message ||
        (productCount > 0
          ? `Adapter returned ${productCount} product candidates.`
          : "Adapter responded successfully."),
      endpointUrl,
      secretConfigured,
      mode: vendor.integration_mode,
      productCount,
    };
    await updateVendorConnectionState(adminClient, vendor.id, result);
    return result;
  } catch (error) {
    const result: VendorHealthCheckResult = {
      vendorId: vendor.id,
      vendorName: vendor.name,
      status: "error",
      checkedAt,
      message: error instanceof Error ? error.message : "Vendor health check failed.",
      endpointUrl,
      secretConfigured,
      mode: vendor.integration_mode,
      productCount: 0,
    };
    await updateVendorConnectionState(adminClient, vendor.id, result);
    return result;
  }
}

async function resolveVendorProducts(
  vendors: VendorRow[],
  vendorProductsData: Array<{
    vendor_id: string;
    brand: string;
    model_family: string;
    quote_level: string;
    equipment_factor: number;
    lead_time_days: number;
    availability: string;
    rebate_amount: number;
    notes: string;
  }>,
  draft: EstimateDraft,
  pricingRules: PricingRules,
) {
  const resolvedProducts: VendorProductRow[] = [];

  for (const vendor of vendors.filter((item) => item.active).sort(sortVendors)) {
    if (!supportsSystemType(vendor, draft.systemType)) {
      continue;
    }

    const catalogProducts = vendorProductsData
      .filter((product) => product.vendor_id === vendor.id)
      .map((product) => ({
        vendor_id: vendor.id,
        vendor_name: vendor.name,
        brand: product.brand,
        model_family: product.model_family,
        quote_level: product.quote_level as QuoteLevel,
        equipment_factor: Number(product.equipment_factor ?? 1),
        lead_time_days: Number(product.lead_time_days ?? 3),
        availability: (product.availability as VendorAvailability) ?? "in-stock",
        rebate_amount: Number(product.rebate_amount ?? 0),
        notes: product.notes || vendor.config?.notes || "",
      }));

    if (vendor.integration_mode === "manual-api") {
      try {
        const liveProducts = await fetchManualApiVendorProducts(vendor, draft, pricingRules);
        if (liveProducts.length > 0) {
          resolvedProducts.push(...liveProducts);
          continue;
        }
      } catch (error) {
        console.warn(`Vendor adapter failed for ${vendor.slug}, using catalog fallback`, error);
      }
    }

    if (catalogProducts.length > 0) {
      resolvedProducts.push(...catalogProducts);
    }
  }

  return resolvedProducts.length > 0 ? resolvedProducts : fallbackVendorProducts;
}

function calculateBaseHardCost(draft: EstimateDraft, pricingRules: PricingRules) {
  const sizeFactor = Math.max(draft.homeSize, 1200) / 100;
  const packageMultiplier =
    draft.equipmentPackage === "Value replacement"
      ? 0.94
      : draft.equipmentPackage === "High-efficiency match"
        ? 1.08
        : draft.equipmentPackage === "Premium comfort package"
          ? 1.16
          : 1;
  const brandMultiplier =
    draft.preferredBrand === "Open"
      ? 1
      : draft.preferredBrand === "Carrier" || draft.preferredBrand === "Trane" || draft.preferredBrand === "Lennox"
        ? 1.08
        : 1.04;
  const baseEquipment = (draft.equipmentCost || sizeFactor * 210) * packageMultiplier * brandMultiplier;
  const laborCost = (draft.laborHours || 10) * pricingRules.laborRatePerHour;
  const materialsCost = draft.materials || 450;
  const scopePremium = draft.projectScope.includes("Relocate") ? 2200 : 0;
  const removalPremium = draft.removalNeeded ? 650 : 0;
  const permitPremium = draft.permitRequired ? 450 : 0;
  const accessPremium =
    draft.accessDifficulty === "Tight attic / crawl"
      ? 900
      : draft.accessDifficulty === "Multi-story carry"
        ? 1200
        : draft.accessDifficulty === "Roof / crane concern"
          ? 2200
          : 0;
  const locationPremium =
    draft.installLocation === "Attic"
      ? 700
      : draft.installLocation === "Crawlspace"
        ? 900
        : draft.installLocation === "Roof"
          ? 1800
          : 0;
  const conditionPremium =
    draft.existingSystemCondition === "No cooling / no heating"
      ? 550
      : draft.existingSystemCondition === "Frequent breakdowns"
        ? 350
        : 0;
  const thermostatPremium = draft.thermostatUpgrade ? pricingRules.thermostatUpgradePrice : 0;
  const iaqPremium = draft.iaqBundle ? pricingRules.iaqBundlePrice : 0;
  const surgePremium = draft.surgeProtection ? pricingRules.surgeProtectionPrice : 0;
  const maintenancePremium = draft.maintenancePlan ? pricingRules.maintenancePlanPrice : 0;
  const warrantyPremium = draft.extendedLaborWarranty ? pricingRules.extendedLaborWarrantyPrice : 0;
  const ductworkPremium =
    draft.ductworkCondition === "Needs modifications"
      ? 1100
      : draft.ductworkCondition === "Replace major sections"
        ? 2200
        : 0;

  return (
    baseEquipment +
    laborCost +
    materialsCost +
    scopePremium +
    removalPremium +
    permitPremium +
    accessPremium +
    locationPremium +
    conditionPremium +
    thermostatPremium +
    iaqPremium +
    surgePremium +
    maintenancePremium +
    warrantyPremium +
    ductworkPremium
  );
}

function applyQuotePolicy(draft: EstimateDraft, pricingRules: PricingRules, options: QuoteOption[]) {
  const baseHardCost = calculateBaseHardCost(draft, pricingRules);
  const baselineMultiplierByLevel: Record<QuoteLevel, number> = {
    good: 0.9,
    better: 1,
    best: 1.24,
  };

  return options.map((option) => {
    const hardCost = Math.round(baseHardCost * baselineMultiplierByLevel[option.level]);
    const grossMarginPercent =
      option.estimatedPrice > 0 ? Math.round(((option.estimatedPrice - hardCost) / option.estimatedPrice) * 100) : 0;
    const discountPercent =
      option.priceRangeHigh > 0
        ? Math.max(0, Math.round(((option.priceRangeHigh - option.estimatedPrice) / option.priceRangeHigh) * 100))
        : 0;
    const needsMarginApproval = grossMarginPercent < pricingRules.marginFloorPercent;
    const needsDiscountApproval = discountPercent > pricingRules.maxDiscountPercent;
    const policyStatus = needsMarginApproval || needsDiscountApproval ? "needs-approval" : "approved";
    const policyReason = needsMarginApproval
      ? `Margin ${grossMarginPercent}% is below floor ${pricingRules.marginFloorPercent}%`
      : needsDiscountApproval
        ? `Discount ${discountPercent}% exceeds max ${pricingRules.maxDiscountPercent}%`
        : null;

    return {
      ...option,
      hardCost,
      grossMarginPercent,
      policyStatus,
      policyReason,
      estimatedMonthlyPayment: draft.financingEnabled
        ? Math.round(
            calculateMonthlyPayment(
              option.estimatedPrice,
              pricingRules.defaultFinancingApr,
              Math.max(draft.financingTermMonths, 1),
            ),
          )
        : null,
    };
  });
}

function buildBaseOptions(draft: EstimateDraft, pricingRules: PricingRules): QuoteOption[] {
  const hardCost = calculateBaseHardCost(draft, pricingRules);
  const effectiveMargin = Math.max(draft.targetGrossMargin, pricingRules.marginFloorPercent);
  const marginMultiplier = 1 / Math.max(0.2, 1 - effectiveMargin / 100);
  const betterPrice = Math.round(hardCost * marginMultiplier);
  const goodPrice = Math.round(betterPrice * 0.9);
  const bestPrice = Math.round(betterPrice * 1.24);

  const installNote =
    draft.installTimeline === "ASAP"
      ? "Priority scheduling for fast install turnaround"
      : "Standard install scheduling with startup and testing";
  const accessNote =
    draft.accessDifficulty === "Standard access"
      ? "Standard access labor assumed"
      : `Install plan accounts for ${draft.accessDifficulty.toLowerCase()}`;
  const packageNote =
    draft.preferredBrand === "Open"
      ? `${draft.equipmentPackage} built around best-available matched equipment`
      : `${draft.equipmentPackage} built around ${draft.preferredBrand} preference`;
  const comfortNote = draft.comfortIssues
    ? `Addresses comfort concerns noted on-site: ${draft.comfortIssues}`
    : "Airflow and comfort settings tuned to current home conditions";

  return [
    {
      id: "good",
      level: "good",
      title: "Good",
      systemName: "14 SEER2 Comfort System",
      description: "Reliable replacement option focused on speed, simplicity, and everyday comfort.",
      features: [
        "Single-stage equipment package",
        "Matched indoor and outdoor system sizing",
        draft.thermostatUpgrade ? "Entry smart thermostat included" : "Basic programmable thermostat",
        installNote,
        accessNote,
      ],
      estimatedPrice: goodPrice,
      priceRangeLow: Math.round(goodPrice * 0.96),
      priceRangeHigh: Math.round(goodPrice * 1.05),
      isRecommended: false,
      hardCost: 0,
      grossMarginPercent: 0,
      policyStatus: "approved",
      policyReason: null,
      estimatedMonthlyPayment: null,
      recommendedVendor: null,
      vendorComparisons: [],
      vendorStrategy: null,
    },
    {
      id: "better",
      level: "better",
      title: "Better",
      systemName: "16 SEER2 Performance System",
      description: "Balanced comfort and efficiency for the homeowner who wants solid long-term value.",
      features: [
        "Higher efficiency compressor and blower pairing",
        draft.thermostatUpgrade ? "Smart thermostat setup and commissioning" : "System setup and commissioning",
        "Improved airflow tuning for the existing home",
        packageNote,
        "Permit coordination and haul-away included",
      ],
      estimatedPrice: betterPrice,
      priceRangeLow: Math.round(betterPrice * 0.95),
      priceRangeHigh: Math.round(betterPrice * 1.06),
      isRecommended: false,
      hardCost: 0,
      grossMarginPercent: 0,
      policyStatus: "approved",
      policyReason: null,
      estimatedMonthlyPayment: null,
      recommendedVendor: null,
      vendorComparisons: [],
      vendorStrategy: null,
    },
    {
      id: "best",
      level: "best",
      title: "Best",
      systemName: "20 SEER2 High Efficiency System",
      description: "Premium comfort package with quieter operation, stronger humidity control, and top-end efficiency.",
      features: [
        "Variable-speed indoor comfort performance",
        "Enhanced humidity and airflow control",
        draft.thermostatUpgrade ? "Smart thermostat with homeowner orientation" : "Premium control setup and homeowner orientation",
        "Higher-efficiency filtration and startup testing",
        comfortNote,
      ],
      estimatedPrice: bestPrice,
      priceRangeLow: Math.round(bestPrice * 0.95),
      priceRangeHigh: Math.round(bestPrice * 1.08),
      isRecommended: true,
      hardCost: 0,
      grossMarginPercent: 0,
      policyStatus: "approved",
      policyReason: null,
      estimatedMonthlyPayment: null,
      recommendedVendor: null,
      vendorComparisons: [],
      vendorStrategy: null,
    },
  ];
}

function getPackageLevelMultiplier(level: QuoteLevel) {
  if (level === "good") return 0.88;
  if (level === "best") return 1.18;
  return 1;
}

function getBrandPreferenceFactor(draft: EstimateDraft, brand: string) {
  if (draft.preferredBrand === "Open") {
    return 1;
  }

  return draft.preferredBrand.toLowerCase() === brand.toLowerCase() ? 0.97 : 1.03;
}

function getInstallComplexityFactor(draft: EstimateDraft) {
  let factor = 1;
  if (draft.installLocation === "Attic" || draft.installLocation === "Crawlspace") factor += 0.03;
  if (draft.accessDifficulty === "Roof / crane concern") factor += 0.06;
  if (draft.projectScope.includes("Relocate")) factor += 0.05;
  return factor;
}

function calculateBaselineEquipmentCost(draft: EstimateDraft, level: QuoteLevel) {
  const packageMultiplier =
    draft.equipmentPackage === "Value replacement"
      ? 0.94
      : draft.equipmentPackage === "High-efficiency match"
        ? 1.08
        : draft.equipmentPackage === "Premium comfort package"
          ? 1.16
          : 1;

  return (draft.equipmentCost || Math.max(draft.homeSize, 1200) * 2.1) * packageMultiplier * getPackageLevelMultiplier(level);
}

function calculateComparisonPrice(
  option: QuoteOption,
  baselineEquipmentCost: number,
  vendorEquipmentCost: number,
  effectiveMarginPercent: number,
  rebateAmount: number,
) {
  const equipmentDelta = vendorEquipmentCost - baselineEquipmentCost - rebateAmount;
  const adjustedHardCost = Math.max(0, option.hardCost + equipmentDelta);
  const marginMultiplier = 1 / Math.max(0.2, 1 - effectiveMarginPercent / 100);
  return Math.round(adjustedHardCost * marginMultiplier);
}

function compareVendors(left: VendorComparison, right: VendorComparison) {
  const availabilityRank: Record<VendorAvailability, number> = {
    "in-stock": 0,
    limited: 1,
    "special-order": 2,
  };

  if (left.estimatedInstalledPrice !== right.estimatedInstalledPrice) {
    return left.estimatedInstalledPrice - right.estimatedInstalledPrice;
  }

  if (left.leadTimeDays !== right.leadTimeDays) {
    return left.leadTimeDays - right.leadTimeDays;
  }

  return availabilityRank[left.availability] - availabilityRank[right.availability];
}

function enrichOptionsWithVendors(
  draft: EstimateDraft,
  pricingRules: PricingRules,
  options: QuoteOption[],
  vendorProducts: VendorProductRow[],
) {
  const effectiveMarginPercent = Math.max(draft.targetGrossMargin, pricingRules.marginFloorPercent);
  const complexityFactor = getInstallComplexityFactor(draft);

  return options.map((option) => {
    const baselineEquipmentCost = calculateBaselineEquipmentCost(draft, option.level);
    const vendorComparisons = vendorProducts
      .filter((vendorProduct) => vendorProduct.quote_level === option.level)
      .map((vendorProduct) => {
        const brandPreferenceFactor = getBrandPreferenceFactor(draft, vendorProduct.brand);
        const vendorEquipmentCost = Math.round(
          baselineEquipmentCost * vendorProduct.equipment_factor * brandPreferenceFactor * complexityFactor,
        );
        const rebateAmount = Number(vendorProduct.rebate_amount ?? 0);

        return {
          vendorId: vendorProduct.vendor_id,
          vendorName: vendorProduct.vendor_name,
          packageLabel: `${vendorProduct.brand} ${vendorProduct.model_family}`,
          brand: vendorProduct.brand,
          modelFamily: vendorProduct.model_family,
          estimatedInstalledPrice: calculateComparisonPrice(
            option,
            baselineEquipmentCost,
            vendorEquipmentCost,
            effectiveMarginPercent,
            rebateAmount,
          ),
          estimatedEquipmentCost: vendorEquipmentCost,
          leadTimeDays:
            draft.installTimeline === "ASAP"
              ? Math.max(1, vendorProduct.lead_time_days - 1)
              : vendorProduct.lead_time_days,
          availability: vendorProduct.availability,
          rebateAmount,
          notes: vendorProduct.notes,
        } satisfies VendorComparison;
      })
      .sort(compareVendors);

    const recommendedVendor = vendorComparisons[0] ?? null;

    return {
      ...option,
      recommendedVendor,
      vendorComparisons,
      vendorStrategy: recommendedVendor
        ? `${recommendedVendor.vendorName} is the best fit for ${option.title.toLowerCase()} based on installed price and lead time.`
        : null,
      systemName: recommendedVendor ? recommendedVendor.packageLabel : option.systemName,
    };
  });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    await requireAuthenticatedUser(request);

    const { mode, draft, pricingRules, vendorId } = await request.json() as {
      mode?: "generate-quotes" | "vendor-health-check";
      draft: EstimateDraft;
      pricingRules: PricingRules;
      vendorId?: string;
    };

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const authHeader = request.headers.get("Authorization");

    const adminClient =
      supabaseUrl && supabaseServiceRoleKey
        ? createClient(supabaseUrl, supabaseServiceRoleKey, { auth: { persistSession: false } })
        : null;

    let userId: string | null = null;
    let organizationId: string | null = null;

    if (adminClient && authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: authData } = await adminClient.auth.getUser(token);
      userId = authData.user?.id ?? null;

      if (userId) {
        const { data: userRow } = await adminClient
          .from("users")
          .select("organization_id")
          .eq("id", userId)
          .maybeSingle();

        organizationId = (userRow?.organization_id as string | null) ?? null;
      }
    }

    if (mode === "vendor-health-check") {
      if (!adminClient) {
        return jsonResponse({ error: "Supabase admin client is not configured." }, 500);
      }

      if (!vendorId) {
        return jsonResponse({ error: "Vendor id is required for a health check." }, 400);
      }

      const { data: vendorRow } = await adminClient
        .from("vendors")
        .select("id, slug, name, integration_mode, active, priority, config")
        .eq("id", vendorId)
        .maybeSingle();

      if (!vendorRow) {
        return jsonResponse({ error: "Vendor was not found." }, 404);
      }

      const result = await runVendorHealthCheck(adminClient, vendorRow as VendorRow, draft, pricingRules);
      return jsonResponse(result);
    }

    let vendorProducts: VendorProductRow[] = fallbackVendorProducts;

    if (adminClient) {
      const { data: vendorRows } = await adminClient
        .from("vendors")
        .select("id, slug, name, integration_mode, active, priority, config")
        .eq("active", true);

      const { data: vendorProductsData } = await adminClient
        .from("vendor_products")
        .select("vendor_id, brand, model_family, quote_level, equipment_factor, lead_time_days, availability, rebate_amount, notes")
        .eq("active", true);

      if ((vendorRows ?? []).length > 0) {
        vendorProducts = await resolveVendorProducts(
          (vendorRows ?? []) as VendorRow[],
          (vendorProductsData ?? []).map((vendorProduct) => ({
            vendor_id: vendorProduct.vendor_id as string,
            brand: vendorProduct.brand as string,
            model_family: vendorProduct.model_family as string,
            quote_level: vendorProduct.quote_level as string,
            equipment_factor: Number(vendorProduct.equipment_factor ?? 1),
            lead_time_days: Number(vendorProduct.lead_time_days ?? 3),
            availability: vendorProduct.availability as string,
            rebate_amount: Number(vendorProduct.rebate_amount ?? 0),
            notes: (vendorProduct.notes as string) ?? "",
          })),
          draft,
          pricingRules,
        );
      }
    }

    let baseOptions: QuoteOption[];

    try {
      const aiOptions = await generateWithOpenAi(draft, pricingRules);
      baseOptions = aiOptions ?? applyQuotePolicy(draft, pricingRules, buildBaseOptions(draft, pricingRules));
    } catch (error) {
      console.warn("OpenAI quote generation failed, using fallback", error);
      baseOptions = applyQuotePolicy(draft, pricingRules, buildBaseOptions(draft, pricingRules));
    }

    const options = enrichOptionsWithVendors(
      draft,
      pricingRules,
      baseOptions,
      vendorProducts,
    );

    if (adminClient && organizationId) {
      const { data: requestRow } = await adminClient
        .from("vendor_quote_requests")
        .insert({
          organization_id: organizationId,
          user_id: userId,
          customer_name: draft.customerName || null,
          system_type: draft.systemType,
          job_type: draft.jobType,
          request_payload: { draft, pricingRules },
        })
        .select("id")
        .single();

      if (requestRow?.id) {
        const quoteItems = options.flatMap((option) =>
          option.vendorComparisons
            .filter((comparison) => isUuid(comparison.vendorId))
            .map((comparison) => ({
              request_id: requestRow.id,
              vendor_id: comparison.vendorId,
              quote_level: option.level,
              package_label: comparison.packageLabel,
              brand: comparison.brand,
              model_family: comparison.modelFamily,
              estimated_equipment_cost: comparison.estimatedEquipmentCost,
              estimated_installed_price: comparison.estimatedInstalledPrice,
              lead_time_days: comparison.leadTimeDays,
              availability: comparison.availability,
              rebate_amount: comparison.rebateAmount,
              notes: comparison.notes,
            })),
        );

        if (quoteItems.length > 0) {
          await adminClient.from("vendor_quote_items").insert(quoteItems);
        }
      }
    }

    return jsonResponse({ options });
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }

    console.error("generate-quotes failed", error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Failed to generate quotes." },
      500,
    );
  }
});
