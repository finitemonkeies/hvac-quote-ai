import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
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
    const { draft, pricingRules } = await request.json() as {
      draft: EstimateDraft;
      pricingRules: PricingRules;
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

    let vendorProducts: VendorProductRow[] = fallbackVendorProducts;

    if (adminClient) {
      const { data: vendorRows } = await adminClient
        .from("vendors")
        .select("id, name")
        .eq("active", true);
      const vendorNameById = new Map((vendorRows ?? []).map((vendor) => [vendor.id as string, vendor.name as string]));

      const { data: vendorProductsData } = await adminClient
        .from("vendor_products")
        .select("vendor_id, brand, model_family, quote_level, equipment_factor, lead_time_days, availability, rebate_amount, notes")
        .eq("active", true);

      if ((vendorProductsData ?? []).length > 0) {
        vendorProducts = (vendorProductsData ?? []).map((vendorProduct) => ({
          vendor_id: vendorProduct.vendor_id as string,
          vendor_name: vendorNameById.get(vendorProduct.vendor_id as string) ?? "Vendor",
          brand: vendorProduct.brand as string,
          model_family: vendorProduct.model_family as string,
          quote_level: vendorProduct.quote_level as QuoteLevel,
          equipment_factor: Number(vendorProduct.equipment_factor ?? 1),
          lead_time_days: Number(vendorProduct.lead_time_days ?? 3),
          availability: (vendorProduct.availability as VendorAvailability) ?? "in-stock",
          rebate_amount: Number(vendorProduct.rebate_amount ?? 0),
          notes: (vendorProduct.notes as string) ?? "",
        }));
      }
    }

    const baseOptions = applyQuotePolicy(draft, pricingRules, buildBaseOptions(draft, pricingRules));
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
          option.vendorComparisons.map((comparison) => ({
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
    console.error("generate-quotes failed", error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Failed to generate quotes." },
      500,
    );
  }
});
