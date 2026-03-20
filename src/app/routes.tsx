import { Suspense, lazy, type ComponentType } from "react";
import { createBrowserRouter } from "react-router-dom";
import { ProtectedApp, PublicOnly } from "./components/AuthGate";
import { RouteErrorBoundary } from "./components/RouteErrorBoundary";

function RouteFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f4f7fb] px-6">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <p className="text-sm font-medium text-slate-900">Loading screen...</p>
      </div>
    </div>
  );
}

function lazyRoute<T extends ComponentType<any>>(
  loader: () => Promise<{ [key: string]: T }>,
  exportName: string,
) {
  const Component = lazy(async () => {
    const module = await loader();
    return { default: module[exportName] };
  });

  return function LazyRoute() {
    return (
      <Suspense fallback={<RouteFallback />}>
        <Component />
      </Suspense>
    );
  };
}

const Home = lazyRoute(() => import("./screens/Home"), "Home");
const Auth = lazyRoute(() => import("./screens/Auth"), "Auth");
const NewEstimate = lazyRoute(() => import("./screens/NewEstimate"), "NewEstimate");
const Equipment = lazyRoute(() => import("./screens/Equipment"), "Equipment");
const Options = lazyRoute(() => import("./screens/Options"), "Options");
const Refine = lazyRoute(() => import("./screens/Refine"), "Refine");
const Preview = lazyRoute(() => import("./screens/Preview"), "Preview");
const Send = lazyRoute(() => import("./screens/Send"), "Send");
const Settings = lazyRoute(() => import("./screens/Settings"), "Settings");
const Approvals = lazyRoute(() => import("./screens/Approvals"), "Approvals");

export const router = createBrowserRouter([
  {
    Component: PublicOnly,
    errorElement: <RouteErrorBoundary />,
    children: [{ path: "/auth", Component: Auth }],
  },
  {
    Component: ProtectedApp,
    errorElement: <RouteErrorBoundary />,
    children: [
      { path: "/", Component: Home },
      { path: "/job-setup", Component: NewEstimate },
      { path: "/input", Component: Equipment },
      { path: "/options", Component: Options },
      { path: "/options/:optionId/refine", Component: Refine },
      { path: "/preview", Component: Preview },
      { path: "/send", Component: Send },
      { path: "/settings", Component: Settings },
      { path: "/approvals", Component: Approvals },
    ],
  },
]);
