import { createBrowserRouter } from "react-router-dom";
import { ProtectedApp, PublicOnly } from "./components/AuthGate";
import { Home } from "./screens/Home";
import { Auth } from "./screens/Auth";
import { NewEstimate } from "./screens/NewEstimate";
import { Equipment } from "./screens/Equipment";
import { Options } from "./screens/Options";
import { Preview } from "./screens/Preview";
import { Send } from "./screens/Send";
import { Refine } from "./screens/Refine";

export const router = createBrowserRouter([
  {
    Component: PublicOnly,
    children: [{ path: "/auth", Component: Auth }],
  },
  {
    Component: ProtectedApp,
    children: [
      { path: "/", Component: Home },
      { path: "/job-setup", Component: NewEstimate },
      { path: "/input", Component: Equipment },
      { path: "/options", Component: Options },
      { path: "/options/:optionId/refine", Component: Refine },
      { path: "/preview", Component: Preview },
      { path: "/send", Component: Send },
    ],
  },
]);
