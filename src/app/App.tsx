import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import { AuthProvider } from "./lib/auth";
import { EstimateProvider } from "./lib/estimate-store";

function App() {
  return (
    <AuthProvider>
      <EstimateProvider>
        <RouterProvider router={router} />
      </EstimateProvider>
    </AuthProvider>
  );
}

export default App;
