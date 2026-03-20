import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AppShell } from "../components/AppShell";
import { Card } from "../components/ui/card";
import { submitProposalResponse } from "../services/supabase";

export function ProposalResponse() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Recording your response...");

  const token = searchParams.get("token") ?? "";
  const decision = useMemo(() => {
    const value = searchParams.get("decision");
    return value === "accepted" || value === "lost" ? value : null;
  }, [searchParams]);

  useEffect(() => {
    if (!token || !decision) {
      setStatus("error");
      setMessage("This proposal link is invalid.");
      return;
    }

    let active = true;

    submitProposalResponse({ token, decision })
      .then((payload) => {
        if (!active) {
          return;
        }

        if (payload.status === "already-recorded") {
          setStatus("success");
          setMessage("This proposal response was already recorded. Thank you.");
          return;
        }

        setStatus("success");
        setMessage(
          decision === "accepted"
            ? "Your acceptance has been recorded. The team will follow up with next steps."
            : "Your response has been recorded. Thank you for letting us know.",
        );
      })
      .catch((error) => {
        if (!active) {
          return;
        }

        setStatus("error");
        setMessage(error instanceof Error ? error.message : "We could not record your response.");
      });

    return () => {
      active = false;
    };
  }, [decision, token]);

  return (
    <AppShell>
      <div className="mx-auto flex min-h-[70vh] max-w-[560px] items-center">
        <Card className="w-full rounded-[28px] border-slate-200 bg-white p-6 shadow-none">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Proposal Response</p>
          <h1 className="mt-3 text-2xl font-semibold text-slate-950">
            {status === "loading" ? "Updating your response" : status === "success" ? "Thank you" : "Something went wrong"}
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">{message}</p>
        </Card>
      </div>
    </AppShell>
  );
}
