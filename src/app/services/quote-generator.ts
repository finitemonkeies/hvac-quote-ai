import type { EstimateDraft, QuoteOption } from "../types/estimate";

const model = import.meta.env.VITE_OPENAI_MODEL ?? "gpt-5-mini";
const openAiApiKey = import.meta.env.VITE_OPENAI_API_KEY;

type OpenAiQuoteResponse = {
  options: Array<{
    level: "good" | "better" | "best";
    systemName: string;
    description: string;
    features: string[];
    estimatedPrice: number;
    priceRangeLow: number;
    priceRangeHigh: number;
  }>;
};

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
            systemName: {
              type: "string",
            },
            description: {
              type: "string",
            },
            features: {
              type: "array",
              minItems: 3,
              maxItems: 6,
              items: {
                type: "string",
              },
            },
            estimatedPrice: {
              type: "number",
            },
            priceRangeLow: {
              type: "number",
            },
            priceRangeHigh: {
              type: "number",
            },
          },
        },
      },
    },
  },
};

function sanitizeOptions(input: OpenAiQuoteResponse["options"]): QuoteOption[] {
  const order: Array<"good" | "better" | "best"> = ["good", "better", "best"];

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
      features: option?.features?.slice(0, 6) ?? [],
      estimatedPrice: safePrice,
      priceRangeLow: Math.max(0, Math.round(option?.priceRangeLow ?? safePrice * 0.95)),
      priceRangeHigh: Math.max(0, Math.round(option?.priceRangeHigh ?? safePrice * 1.06)),
      isRecommended: level === "best",
    };
  });
}

function buildPrompt(draft: EstimateDraft) {
  return [
    "You generate HVAC install estimate options for field technicians.",
    "Return Good, Better, Best options only.",
    "Use generic system names and do not mention manufacturers, SKUs, or inventory.",
    "Good system name: 14 SEER2 Comfort System.",
    "Better system name: 16 SEER2 Performance System.",
    "Best system name: 20 SEER2 High Efficiency System.",
    "Each option needs a concise description, 3-6 features, estimated price, and low/high range.",
    "Make the Better option the baseline and Best the recommended option.",
    "Estimate context:",
    JSON.stringify(draft),
  ].join("\n");
}

async function generateWithOpenAi(draft: EstimateDraft) {
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
          content: buildPrompt(draft),
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: responseSchema,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI request failed with ${response.status}`);
  }

  const payload = await response.json();
  const content = payload.choices?.[0]?.message?.content;
  const parsed = JSON.parse(content ?? "{}") as OpenAiQuoteResponse;
  return sanitizeOptions(parsed.options ?? []);
}

function generateFallbackOptions(draft: EstimateDraft): QuoteOption[] {
  const sizeFactor = Math.max(draft.homeSize, 1200) / 100;
  const baseEquipment = draft.equipmentCost || sizeFactor * 210;
  const laborCost = (draft.laborHours || 10) * 125;
  const materialsCost = draft.materials || 450;
  const scopePremium = draft.projectScope.includes("Relocate") ? 2200 : 0;
  const removalPremium = draft.removalNeeded ? 650 : 0;
  const permitPremium = draft.permitRequired ? 450 : 0;
  const ductworkPremium =
    draft.ductworkCondition === "Needs modifications"
      ? 1100
      : draft.ductworkCondition === "Replace major sections"
        ? 2200
        : 0;

  const betterPrice = Math.round(
    baseEquipment + laborCost + materialsCost + scopePremium + removalPremium + permitPremium + ductworkPremium,
  );
  const goodPrice = Math.round(betterPrice * 0.9);
  const bestPrice = Math.round(betterPrice * 1.24);

  const installNote =
    draft.installTimeline === "ASAP"
      ? "Priority scheduling for fast install turnaround"
      : "Standard install scheduling with startup and testing";

  return sanitizeOptions([
    {
      level: "good",
      systemName: "14 SEER2 Comfort System",
      description: "Reliable replacement option focused on speed, simplicity, and everyday comfort.",
      features: [
        "Single-stage equipment package",
        "Matched indoor and outdoor system sizing",
        "Basic programmable thermostat",
        installNote,
      ],
      estimatedPrice: goodPrice,
      priceRangeLow: Math.round(goodPrice * 0.96),
      priceRangeHigh: Math.round(goodPrice * 1.05),
    },
    {
      level: "better",
      systemName: "16 SEER2 Performance System",
      description: "Balanced comfort and efficiency for the homeowner who wants solid long-term value.",
      features: [
        "Higher efficiency compressor and blower pairing",
        "Smart thermostat setup and commissioning",
        "Improved airflow tuning for the existing home",
        "Permit coordination and haul-away included",
      ],
      estimatedPrice: betterPrice,
      priceRangeLow: Math.round(betterPrice * 0.95),
      priceRangeHigh: Math.round(betterPrice * 1.06),
    },
    {
      level: "best",
      systemName: "20 SEER2 High Efficiency System",
      description: "Premium comfort package with quieter operation, stronger humidity control, and top-end efficiency.",
      features: [
        "Variable-speed indoor comfort performance",
        "Enhanced humidity and airflow control",
        "Smart thermostat with homeowner orientation",
        "Higher-efficiency filtration and startup testing",
      ],
      estimatedPrice: bestPrice,
      priceRangeLow: Math.round(bestPrice * 0.95),
      priceRangeHigh: Math.round(bestPrice * 1.08),
    },
  ]);
}

export async function generateQuoteOptions(draft: EstimateDraft) {
  if (!openAiApiKey) {
    return generateFallbackOptions(draft);
  }

  try {
    return await generateWithOpenAi(draft);
  } catch (error) {
    console.warn("Falling back to local quote generation", error);
    return generateFallbackOptions(draft);
  }
}
