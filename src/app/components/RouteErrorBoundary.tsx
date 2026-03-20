import { AlertTriangle, ArrowLeft, Home, RefreshCcw } from "lucide-react";
import { isRouteErrorResponse, useNavigate, useRouteError } from "react-router-dom";

function getErrorDetails(error: unknown) {
  if (isRouteErrorResponse(error)) {
    return {
      title: `${error.status} ${error.statusText}`,
      message:
        typeof error.data === "string"
          ? error.data
          : "This screen could not be loaded. You can head home or try again.",
    };
  }

  if (error instanceof Error) {
    return {
      title: "Something went wrong",
      message: error.message || "This screen hit an unexpected error.",
    };
  }

  return {
    title: "Something went wrong",
    message: "This screen hit an unexpected error.",
  };
}

export function RouteErrorBoundary() {
  const error = useRouteError();
  const navigate = useNavigate();
  const details = getErrorDetails(error);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7f4ec_0%,#eef6ff_55%,#ffffff_100%)] px-6 py-10 text-slate-900">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-3xl items-center">
        <div className="w-full overflow-hidden rounded-[32px] border border-slate-200/80 bg-white/95 shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur">
          <div className="border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,#fff3d6_0%,transparent_36%),linear-gradient(135deg,#123456_0%,#1d4f91_100%)] px-8 py-8 text-white">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold tracking-[0.18em] uppercase">
              <AlertTriangle className="h-4 w-4" />
              HVAC Quote AI
            </div>
            <h1 className="mt-6 max-w-2xl font-['Space_Grotesk',sans-serif] text-3xl font-semibold leading-tight sm:text-4xl">
              We hit a snag loading this screen.
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-white/80 sm:text-base">
              Your estimate data should still be safe. Try reloading this step or head back to home and continue from
              there.
            </p>
          </div>

          <div className="grid gap-6 px-8 py-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]">
            <div className="rounded-3xl border border-amber-200 bg-amber-50/70 p-6">
              <p className="text-xs font-semibold tracking-[0.2em] uppercase text-amber-700">Error details</p>
              <h2 className="mt-3 text-2xl font-semibold text-slate-950">{details.title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-700">{details.message}</p>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                <ArrowLeft className="h-4 w-4" />
                Go back
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-400 hover:bg-slate-50"
              >
                <RefreshCcw className="h-4 w-4" />
                Reload screen
              </button>
              <button
                type="button"
                onClick={() => navigate("/", { replace: true })}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-900 transition hover:border-sky-300 hover:bg-sky-100"
              >
                <Home className="h-4 w-4" />
                Return home
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
