import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import { AuthProvider } from "./lib/auth";
import { EstimateProvider } from "./lib/estimate-store";
import { AppProviders } from "./components/AppProviders";

function App() {
  return (
    <AppProviders>
      <AuthProvider>
        <EstimateProvider>
          <RouterProvider router={router} />
        </EstimateProvider>
      </AuthProvider>
    </AppProviders>
  );
}

export default App;
