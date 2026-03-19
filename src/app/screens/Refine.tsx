import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppShell } from "../components/AppShell";
import { StepHeader } from "../components/StepHeader";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { useEstimate } from "../lib/estimate-store";

export function Refine() {
  const navigate = useNavigate();
  const { optionId = "" } = useParams();
  const { options, refineOption } = useEstimate();
  const option = useMemo(() => options.find((item) => item.id === optionId) ?? options[0], [optionId, options]);

  const [systemName, setSystemName] = useState(option?.systemName ?? "");
  const [description, setDescription] = useState(option?.description ?? "");
  const [estimatedPrice, setEstimatedPrice] = useState(option?.estimatedPrice.toString() ?? "");
  const [features, setFeatures] = useState(option?.features.join("\n") ?? "");

  useEffect(() => {
    if (options.length === 0) {
      navigate("/input");
    }
  }, [navigate, options.length]);

  if (!option) {
    return null;
  }

  return (
    <AppShell>
      <StepHeader title={`Refine ${option.title}`} subtitle="Step 4 of 5" backTo="/options" />

      <Card className="rounded-[28px] border-slate-200 bg-white/90 p-5">
        <div>
          <Label htmlFor="systemName">System name</Label>
          <Input
            id="systemName"
            value={systemName}
            onChange={(event) => setSystemName(event.target.value)}
            className="mt-2 h-12 rounded-2xl border-slate-200 bg-slate-50"
          />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="mt-2 min-h-24 rounded-2xl border-slate-200 bg-slate-50"
          />
        </div>

        <div>
          <Label htmlFor="estimatedPrice">Estimated price</Label>
          <Input
            id="estimatedPrice"
            type="number"
            value={estimatedPrice}
            onChange={(event) => setEstimatedPrice(event.target.value)}
            className="mt-2 h-12 rounded-2xl border-slate-200 bg-slate-50"
          />
        </div>

        <div>
          <Label htmlFor="features">Features</Label>
          <Textarea
            id="features"
            value={features}
            onChange={(event) => setFeatures(event.target.value)}
            className="mt-2 min-h-40 rounded-2xl border-slate-200 bg-slate-50"
          />
          <p className="mt-2 text-xs text-slate-500">Use one feature per line.</p>
        </div>
      </Card>

      <div className="mt-6 flex gap-3">
        <Button
          variant="outline"
          className="h-12 flex-1 rounded-full border-slate-300"
          onClick={() => navigate("/options")}
        >
          Cancel
        </Button>
        <Button
          className="h-12 flex-1 rounded-full bg-teal-500 font-semibold text-slate-950 hover:bg-teal-400"
          onClick={() => {
            const nextPrice = Number(estimatedPrice) || option.estimatedPrice;
            refineOption(option.id, {
              systemName,
              description,
              estimatedPrice: nextPrice,
              features: features
                .split("\n")
                .map((item) => item.trim())
                .filter(Boolean),
            });
            navigate("/options");
          }}
        >
          Save Changes
        </Button>
      </div>
    </AppShell>
  );
}
