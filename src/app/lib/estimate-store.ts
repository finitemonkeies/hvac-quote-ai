import {
  createElement,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import type {
  EstimateApprovalStatus,
  EstimateDraft,
  EstimateOutcomeStatus,
  EstimateRecord,
  ProposalDeliveryEvent,
  PricingRules,
  ProposalCompany,
  QuoteOption,
  QuoteOptionInput,
} from "../types/estimate";
import { useAuth } from "./auth";
import { applyQuotePolicy, generateQuoteOptions } from "../services/quote-generator";
import {
  fetchPricingRulesFromSupabase,
  fetchRecentEstimatesFromSupabase,
  saveEstimateToSupabase,
  savePricingRulesToSupabase,
} from "../services/supabase";

const CURRENT_ESTIMATE_KEY = "hvac-quote-ai.current-estimate";
const CURRENT_ESTIMATE_ID_KEY = "hvac-quote-ai.current-estimate-id";
const CURRENT_OPTIONS_KEY = "hvac-quote-ai.current-options";
const CURRENT_PROPOSAL_KEY = "hvac-quote-ai.current-proposal";
const CURRENT_CREATED_AT_KEY = "hvac-quote-ai.current-created-at";
const CURRENT_SELECTED_OPTION_KEY = "hvac-quote-ai.current-selected-option";
const CURRENT_APPROVAL_STATUS_KEY = "hvac-quote-ai.current-approval-status";
const CURRENT_APPROVAL_NOTE_KEY = "hvac-quote-ai.current-approval-note";
const CURRENT_OUTCOME_STATUS_KEY = "hvac-quote-ai.current-outcome-status";
const CURRENT_OUTCOME_NOTE_KEY = "hvac-quote-ai.current-outcome-note";
const CURRENT_DELIVERY_HISTORY_KEY = "hvac-quote-ai.current-delivery-history";
const COMPANY_PROFILE_KEY = "hvac-quote-ai.company-profile";
const PRICING_RULES_KEY = "hvac-quote-ai.pricing-rules";
const RECENT_ESTIMATES_KEY = "hvac-quote-ai.recent-estimates";

const defaultDraft: EstimateDraft = {
  customerName: "",
  customerEmail: "",
  customerPhone: "",
  propertyAddress: "",
  jobType: "Full system replacement",
  systemType: "Split system",
  existingSystemType: "Split system",
  existingSystemAge: "",
  existingFuelType: "Electric",
  existingSystemCondition: "Aging but operational",
  tier: "standard",
  equipmentCost: 7500,
  laborHours: 10,
  materials: 450,
  projectScope: "Replace existing equipment",
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
  homeSize: 2200,
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
};

const defaultProposal: ProposalCompany = {
  companyName: "Northwind Heating & Air",
  companyPhone: "(555) 420-4822",
  companyEmail: "quotes@northwindhvac.com",
  companyLicense: "LIC #HV-20491",
  salespersonName: "Field Technician",
};

const defaultPricingRules: PricingRules = {
  laborRatePerHour: 125,
  marginFloorPercent: 35,
  maxDiscountPercent: 10,
  defaultFinancingApr: 9.99,
  thermostatUpgradePrice: 325,
  iaqBundlePrice: 1350,
  surgeProtectionPrice: 425,
  maintenancePlanPrice: 290,
  extendedLaborWarrantyPrice: 1150,
};

interface EstimateContextValue {
  draft: EstimateDraft;
  options: QuoteOption[];
  recentEstimates: EstimateRecord[];
  companyProfile: ProposalCompany;
  pricingRules: PricingRules;
  proposal: ProposalCompany;
  selectedOptionId: string | null;
  approvalStatus: EstimateApprovalStatus;
  approvalNote: string;
  outcomeStatus: EstimateOutcomeStatus;
  outcomeNote: string;
  deliveryHistory: ProposalDeliveryEvent[];
  isGenerating: boolean;
  isLoadingRecent: boolean;
  startNewEstimate: () => void;
  updateDraft: (input: Partial<EstimateDraft>) => void;
  updateCompanyProfile: (input: Partial<ProposalCompany>) => void;
  updatePricingRules: (input: Partial<PricingRules>) => void;
  updateProposal: (input: Partial<ProposalCompany>) => void;
  generateOptions: () => Promise<QuoteOption[]>;
  refineOption: (optionId: string, updates: Partial<QuoteOptionInput>) => void;
  selectOption: (optionId: string) => void;
  updateApproval: (input: { status?: EstimateApprovalStatus; note?: string }) => void;
  updateOutcome: (input: { status?: EstimateOutcomeStatus; note?: string }) => void;
  loadEstimate: (record: EstimateRecord) => void;
  saveEstimate: (delivery?: {
    method: NonNullable<EstimateRecord["deliveryMethod"]>;
    destination?: string;
    note?: string;
  }) => Promise<EstimateRecord>;
}

const EstimateContext = createContext<EstimateContextValue | null>(null);

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }

  const raw = window.localStorage.getItem(key);
  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeStorage<T>(key: string, value: T) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

export function EstimateProvider({ children }: PropsWithChildren) {
  const { profile, user } = useAuth();
  const [draft, setDraft] = useState<EstimateDraft>(() =>
    readStorage(CURRENT_ESTIMATE_KEY, defaultDraft),
  );
  const [options, setOptions] = useState<QuoteOption[]>(() => readStorage(CURRENT_OPTIONS_KEY, []));
  const [recentEstimates, setRecentEstimates] = useState<EstimateRecord[]>(() =>
    readStorage(RECENT_ESTIMATES_KEY, []),
  );
  const [companyProfile, setCompanyProfile] = useState<ProposalCompany>(() =>
    readStorage(COMPANY_PROFILE_KEY, defaultProposal),
  );
  const [pricingRules, setPricingRules] = useState<PricingRules>(() =>
    readStorage(PRICING_RULES_KEY, defaultPricingRules),
  );
  const [proposal, setProposal] = useState<ProposalCompany>(() =>
    readStorage(CURRENT_PROPOSAL_KEY, readStorage(COMPANY_PROFILE_KEY, defaultProposal)),
  );
  const [currentEstimateId, setCurrentEstimateId] = useState<string | null>(() =>
    readStorage<string | null>(CURRENT_ESTIMATE_ID_KEY, null),
  );
  const [currentEstimateCreatedAt, setCurrentEstimateCreatedAt] = useState<string | null>(() =>
    readStorage<string | null>(CURRENT_CREATED_AT_KEY, null),
  );
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(() =>
    readStorage<string | null>(CURRENT_SELECTED_OPTION_KEY, null),
  );
  const [approvalStatus, setApprovalStatus] = useState<EstimateApprovalStatus>(() =>
    readStorage<EstimateApprovalStatus>(CURRENT_APPROVAL_STATUS_KEY, "not-required"),
  );
  const [approvalNote, setApprovalNote] = useState(() => readStorage(CURRENT_APPROVAL_NOTE_KEY, ""));
  const [outcomeStatus, setOutcomeStatus] = useState<EstimateOutcomeStatus>(() =>
    readStorage<EstimateOutcomeStatus>(CURRENT_OUTCOME_STATUS_KEY, "draft"),
  );
  const [outcomeNote, setOutcomeNote] = useState(() => readStorage(CURRENT_OUTCOME_NOTE_KEY, ""));
  const [deliveryHistory, setDeliveryHistory] = useState<ProposalDeliveryEvent[]>(() =>
    readStorage(CURRENT_DELIVERY_HISTORY_KEY, []),
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingRecent, setIsLoadingRecent] = useState(false);

  useEffect(() => {
    writeStorage(CURRENT_ESTIMATE_KEY, draft);
  }, [draft]);

  useEffect(() => {
    writeStorage(CURRENT_ESTIMATE_ID_KEY, currentEstimateId);
  }, [currentEstimateId]);

  useEffect(() => {
    writeStorage(CURRENT_CREATED_AT_KEY, currentEstimateCreatedAt);
  }, [currentEstimateCreatedAt]);

  useEffect(() => {
    writeStorage(CURRENT_OPTIONS_KEY, options);
  }, [options]);

  useEffect(() => {
    writeStorage(CURRENT_PROPOSAL_KEY, proposal);
  }, [proposal]);

  useEffect(() => {
    writeStorage(COMPANY_PROFILE_KEY, companyProfile);
  }, [companyProfile]);

  useEffect(() => {
    writeStorage(PRICING_RULES_KEY, pricingRules);
  }, [pricingRules]);

  useEffect(() => {
    writeStorage(CURRENT_SELECTED_OPTION_KEY, selectedOptionId);
  }, [selectedOptionId]);

  useEffect(() => {
    writeStorage(CURRENT_APPROVAL_STATUS_KEY, approvalStatus);
  }, [approvalStatus]);

  useEffect(() => {
    writeStorage(CURRENT_APPROVAL_NOTE_KEY, approvalNote);
  }, [approvalNote]);

  useEffect(() => {
    writeStorage(CURRENT_OUTCOME_STATUS_KEY, outcomeStatus);
  }, [outcomeStatus]);

  useEffect(() => {
    writeStorage(CURRENT_OUTCOME_NOTE_KEY, outcomeNote);
  }, [outcomeNote]);

  useEffect(() => {
    writeStorage(CURRENT_DELIVERY_HISTORY_KEY, deliveryHistory);
  }, [deliveryHistory]);

  useEffect(() => {
    if (!user?.email) {
      return;
    }

    setCompanyProfile((current) =>
      current.companyEmail ? current : { ...current, companyEmail: user.email ?? current.companyEmail },
    );
    setProposal((current) =>
      current.companyEmail ? current : { ...current, companyEmail: user.email ?? current.companyEmail },
    );
  }, [user?.email]);

  useEffect(() => {
    if (options.length === 0) {
      return;
    }

    const recommended = options.find((option) => option.isRecommended) ?? options[1] ?? options[0];
    setSelectedOptionId((current) => current ?? recommended.id);
  }, [options]);

  useEffect(() => {
    const selected = options.find((option) => option.id === selectedOptionId) ?? null;
    if (!selected) {
      return;
    }

    if (selected.policyStatus === "needs-approval") {
      setApprovalStatus((current) => (current === "approved" ? current : "pending"));
      return;
    }

    setApprovalStatus("not-required");
    setApprovalNote("");
  }, [options, selectedOptionId]);

  useEffect(() => {
    if (!user || !profile?.organizationId) {
      setRecentEstimates([]);
      return;
    }

    let active = true;
    setIsLoadingRecent(true);

    fetchRecentEstimatesFromSupabase()
      .then((records) => {
        if (!active) {
          return;
        }

        setRecentEstimates(records);
        writeStorage(RECENT_ESTIMATES_KEY, records);
      })
      .catch((error) => {
        console.warn("Failed to hydrate recent estimates", error);
      })
      .finally(() => {
        if (active) {
          setIsLoadingRecent(false);
        }
      });

    return () => {
      active = false;
    };
  }, [profile?.organizationId, user]);

  useEffect(() => {
    if (!user || !profile?.organizationId) {
      return;
    }

    let active = true;

    fetchPricingRulesFromSupabase()
      .then((rules) => {
        if (!active || !rules) {
          return;
        }

        setPricingRules(rules);
      })
      .catch((error) => {
        console.warn("Failed to hydrate pricing rules", error);
      });

    return () => {
      active = false;
    };
  }, [profile?.organizationId, user]);

  const startNewEstimate = () => {
    setDraft(defaultDraft);
    setOptions([]);
    setProposal(companyProfile);
    setSelectedOptionId(null);
    setApprovalStatus("not-required");
    setApprovalNote("");
    setOutcomeStatus("draft");
    setOutcomeNote("");
    setCurrentEstimateId(null);
    setCurrentEstimateCreatedAt(null);
    setDeliveryHistory([]);
  };

  const updateDraft = (input: Partial<EstimateDraft>) => {
    setDraft((current) => ({ ...current, ...input }));
  };

  const updateCompanyProfile = (input: Partial<ProposalCompany>) => {
    setCompanyProfile((current) => {
      const next = { ...current, ...input };
      setProposal(next);
      return next;
    });
  };

  const updatePricingRules = (input: Partial<PricingRules>) => {
    setPricingRules((current) => {
      const next = { ...current, ...input };
      void savePricingRulesToSupabase(next);
      return next;
    });
  };

  const updateProposal = (input: Partial<ProposalCompany>) => {
    setProposal((current) => ({ ...current, ...input }));
  };

  const generateOptions = async () => {
    setIsGenerating(true);

    try {
      const generated = await generateQuoteOptions(draft, pricingRules);
      setOptions(generated);
      return generated;
    } finally {
      setIsGenerating(false);
    }
  };

  const refineOption = (optionId: string, updates: Partial<QuoteOptionInput>) => {
    setOptions((current) =>
      applyQuotePolicy(
        draft,
        pricingRules,
        current.map((option) => {
          if (option.id !== optionId) {
            return option;
          }

          const mergedFeatures = updates.features?.filter(Boolean) ?? option.features;
          const nextPrice = updates.estimatedPrice ?? option.estimatedPrice;

          return {
            ...option,
            ...updates,
            features: mergedFeatures,
            estimatedPrice: nextPrice,
            priceRangeLow:
              updates.priceRangeLow ?? Math.round(nextPrice * (option.level === "good" ? 0.95 : 0.94)),
            priceRangeHigh:
              updates.priceRangeHigh ?? Math.round(nextPrice * (option.level === "best" ? 1.08 : 1.06)),
          };
        }),
      ),
    );
  };

  const selectOption = (optionId: string) => {
    setSelectedOptionId(optionId);
  };

  const updateApproval = (input: { status?: EstimateApprovalStatus; note?: string }) => {
    if (input.status) {
      setApprovalStatus(input.status);
    }

    if (input.note !== undefined) {
      setApprovalNote(input.note);
    }
  };

  const updateOutcome = (input: { status?: EstimateOutcomeStatus; note?: string }) => {
    if (input.status) {
      setOutcomeStatus(input.status);
    }

    if (input.note !== undefined) {
      setOutcomeNote(input.note);
    }
  };

  const loadEstimate = (record: EstimateRecord) => {
    setDraft(record.draft);
    setOptions(record.options);
    setProposal(record.proposal);
    setSelectedOptionId(record.selectedOptionId);
    setApprovalStatus(record.approvalStatus ?? "not-required");
    setApprovalNote(record.approvalNote ?? "");
    setOutcomeStatus(record.outcomeStatus ?? "draft");
    setOutcomeNote(record.outcomeNote ?? "");
    setCurrentEstimateId(record.id);
    setCurrentEstimateCreatedAt(record.createdAt);
    setDeliveryHistory(record.deliveryHistory);
  };

  const saveEstimate = async (delivery?: {
    method: NonNullable<EstimateRecord["deliveryMethod"]>;
    destination?: string;
    note?: string;
  }) => {
    const nextCreatedAt = currentEstimateCreatedAt ?? new Date().toISOString();
    const nextDeliveryHistory = delivery
      ? [
          {
            id: crypto.randomUUID(),
            method: delivery.method,
            timestamp: new Date().toISOString(),
            destination: delivery.destination,
            note: delivery.note,
          },
          ...deliveryHistory,
        ].slice(0, 12)
      : deliveryHistory;

    const record: EstimateRecord = {
      id: currentEstimateId ?? crypto.randomUUID(),
      createdAt: nextCreatedAt,
      draft,
      options,
      proposal,
      selectedOptionId,
      approvalStatus,
      approvalNote,
      outcomeStatus: delivery && outcomeStatus === "draft" ? "sent" : outcomeStatus,
      outcomeNote,
      deliveryMethod: delivery?.method,
      deliveryHistory: nextDeliveryHistory,
    };

    const filtered = recentEstimates.filter((item) => item.id !== record.id);
    const nextRecent = [record, ...filtered].slice(0, 8);
    setRecentEstimates(nextRecent);
    writeStorage(RECENT_ESTIMATES_KEY, nextRecent);
    setCurrentEstimateId(record.id);
    setCurrentEstimateCreatedAt(nextCreatedAt);
    setDeliveryHistory(nextDeliveryHistory);

    await saveEstimateToSupabase(record);

    return record;
  };

  const value = useMemo(
    () => ({
      draft,
      options,
      recentEstimates,
      companyProfile,
      pricingRules,
      proposal,
      selectedOptionId,
      approvalStatus,
      approvalNote,
      outcomeStatus,
      outcomeNote,
      deliveryHistory,
      isGenerating,
      isLoadingRecent,
      startNewEstimate,
      updateDraft,
      updateCompanyProfile,
      updatePricingRules,
      updateProposal,
      generateOptions,
      refineOption,
      selectOption,
      updateApproval,
      updateOutcome,
      loadEstimate,
      saveEstimate,
    }),
    [
      companyProfile,
      draft,
      isGenerating,
      isLoadingRecent,
      options,
      approvalNote,
      approvalStatus,
      outcomeNote,
      outcomeStatus,
      pricingRules,
      proposal,
      recentEstimates,
      selectedOptionId,
      deliveryHistory,
    ],
  );

  return createElement(EstimateContext.Provider, { value }, children);
}

export function useEstimate() {
  const context = useContext(EstimateContext);
  if (!context) {
    throw new Error("useEstimate must be used inside EstimateProvider");
  }

  return context;
}
