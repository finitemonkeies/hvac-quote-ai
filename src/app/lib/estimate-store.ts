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
  EstimateDraft,
  EstimateRecord,
  ProposalCompany,
  QuoteOption,
  QuoteOptionInput,
} from "../types/estimate";
import { useAuth } from "./auth";
import { generateQuoteOptions } from "../services/quote-generator";
import { fetchRecentEstimatesFromSupabase, saveEstimateToSupabase } from "../services/supabase";

const CURRENT_ESTIMATE_KEY = "hvac-quote-ai.current-estimate";
const CURRENT_ESTIMATE_ID_KEY = "hvac-quote-ai.current-estimate-id";
const RECENT_ESTIMATES_KEY = "hvac-quote-ai.recent-estimates";

const defaultDraft: EstimateDraft = {
  customerName: "",
  propertyAddress: "",
  jobType: "Full system replacement",
  systemType: "Split system",
  tier: "standard",
  equipmentCost: 7500,
  laborHours: 10,
  materials: 450,
  projectScope: "Replace existing equipment",
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

interface EstimateContextValue {
  draft: EstimateDraft;
  options: QuoteOption[];
  recentEstimates: EstimateRecord[];
  proposal: ProposalCompany;
  selectedOptionId: string | null;
  isGenerating: boolean;
  isLoadingRecent: boolean;
  startNewEstimate: () => void;
  updateDraft: (input: Partial<EstimateDraft>) => void;
  updateProposal: (input: Partial<ProposalCompany>) => void;
  generateOptions: () => Promise<QuoteOption[]>;
  refineOption: (optionId: string, updates: Partial<QuoteOptionInput>) => void;
  selectOption: (optionId: string) => void;
  loadEstimate: (record: EstimateRecord) => void;
  saveEstimate: (deliveryMethod?: EstimateRecord["deliveryMethod"]) => Promise<EstimateRecord>;
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
  const { user } = useAuth();
  const [draft, setDraft] = useState<EstimateDraft>(() =>
    readStorage(CURRENT_ESTIMATE_KEY, defaultDraft),
  );
  const [options, setOptions] = useState<QuoteOption[]>([]);
  const [recentEstimates, setRecentEstimates] = useState<EstimateRecord[]>(() =>
    readStorage(RECENT_ESTIMATES_KEY, []),
  );
  const [proposal, setProposal] = useState<ProposalCompany>(defaultProposal);
  const [currentEstimateId, setCurrentEstimateId] = useState<string | null>(() =>
    readStorage<string | null>(CURRENT_ESTIMATE_ID_KEY, null),
  );
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingRecent, setIsLoadingRecent] = useState(false);

  useEffect(() => {
    writeStorage(CURRENT_ESTIMATE_KEY, draft);
  }, [draft]);

  useEffect(() => {
    writeStorage(CURRENT_ESTIMATE_ID_KEY, currentEstimateId);
  }, [currentEstimateId]);

  useEffect(() => {
    if (options.length === 0) {
      return;
    }

    const recommended = options.find((option) => option.isRecommended) ?? options[1] ?? options[0];
    setSelectedOptionId((current) => current ?? recommended.id);
  }, [options]);

  useEffect(() => {
    if (!user) {
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
  }, [user]);

  const startNewEstimate = () => {
    setDraft(defaultDraft);
    setOptions([]);
    setSelectedOptionId(null);
    setCurrentEstimateId(null);
  };

  const updateDraft = (input: Partial<EstimateDraft>) => {
    setDraft((current) => ({ ...current, ...input }));
  };

  const updateProposal = (input: Partial<ProposalCompany>) => {
    setProposal((current) => ({ ...current, ...input }));
  };

  const generateOptions = async () => {
    setIsGenerating(true);

    try {
      const generated = await generateQuoteOptions(draft);
      setOptions(generated);
      return generated;
    } finally {
      setIsGenerating(false);
    }
  };

  const refineOption = (optionId: string, updates: Partial<QuoteOptionInput>) => {
    setOptions((current) =>
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
    );
  };

  const selectOption = (optionId: string) => {
    setSelectedOptionId(optionId);
  };

  const loadEstimate = (record: EstimateRecord) => {
    setDraft(record.draft);
    setOptions(record.options);
    setProposal(record.proposal);
    setSelectedOptionId(record.selectedOptionId);
    setCurrentEstimateId(record.id);
  };

  const saveEstimate = async (deliveryMethod?: EstimateRecord["deliveryMethod"]) => {
    const record: EstimateRecord = {
      id: currentEstimateId ?? crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      draft,
      options,
      proposal,
      selectedOptionId,
      deliveryMethod,
    };

    const filtered = recentEstimates.filter((item) => item.id !== record.id);
    const nextRecent = [record, ...filtered].slice(0, 8);
    setRecentEstimates(nextRecent);
    writeStorage(RECENT_ESTIMATES_KEY, nextRecent);
    setCurrentEstimateId(record.id);

    await saveEstimateToSupabase(record);

    return record;
  };

  const value = useMemo(
    () => ({
      draft,
      options,
      recentEstimates,
      proposal,
      selectedOptionId,
      isGenerating,
      isLoadingRecent,
      startNewEstimate,
      updateDraft,
      updateProposal,
      generateOptions,
      refineOption,
      selectOption,
      loadEstimate,
      saveEstimate,
    }),
    [draft, isGenerating, isLoadingRecent, options, proposal, recentEstimates, selectedOptionId],
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
