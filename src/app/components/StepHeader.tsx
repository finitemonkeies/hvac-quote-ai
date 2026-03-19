import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";

interface StepHeaderProps {
  title: string;
  subtitle: string;
  backTo?: string;
}

export function StepHeader({ title, subtitle, backTo }: StepHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="-mx-4 mb-8 border-b border-slate-200 bg-white px-4 py-6 sm:-mx-6 sm:px-6">
      <div className="mx-auto flex max-w-4xl items-center gap-3">
        {backTo ? (
          <Button
            variant="ghost"
            size="icon"
            className="size-9 rounded-full text-slate-500 hover:bg-slate-100"
            onClick={() => navigate(backTo)}
          >
            <ArrowLeft className="size-4" />
          </Button>
        ) : null}
        <div>
          <h1 className="text-[1.2rem] font-semibold tracking-tight text-slate-950 sm:text-[1.35rem]">
            {title}
          </h1>
          <p className="mt-0.5 text-sm text-slate-600">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}
