import { Switch, Route, Router } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";

import NotFound from "@/pages/not-found";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import PlantDetail from "@/pages/PlantDetail";
import MyPlants from "@/pages/MyPlants";
import Calendar from "@/pages/Calendar";
import Tips from "@/pages/Tips";
import Badges from "@/pages/Badges";
import AuthPage from "@/pages/auth-page";
import AddPlantManually from "@/pages/AddPlantManually";
import Forum from "@/pages/Forum";
import ResetPassword from "@/pages/reset-password";
import ResetPasswordToken from "@/pages/reset-password/[token]";
import Settings from "@/pages/Settings";
import AdminPanel from "@/components/AdminPanel";
import CommunitySpace from "@/components/CommunitySpace";

function AppRoutes() {
  return (
    <Layout>
      <Switch>
        <ProtectedRoute path="/" component={Home} />
        <ProtectedRoute path="/add-plant" component={AddPlantManually} />
        <ProtectedRoute path="/plants" component={MyPlants} />
        <ProtectedRoute path="/plants/:id" component={PlantDetail} />
        <ProtectedRoute path="/calendar" component={Calendar} />
        <ProtectedRoute path="/tips" component={Tips} />
        <ProtectedRoute path="/badges" component={Badges} />
        <ProtectedRoute path="/forum" component={Forum} />
        <ProtectedRoute path="/settings" component={Settings} />
        <ProtectedRoute path="/admin" component={AdminPanel} />
        <ProtectedRoute path="/communaute" component={CommunitySpace} />
        <Route path="/auth" component={AuthPage} />
        <Route path="/reset-password" component={ResetPassword} />
        <Route path="/reset-password/:token" component={ResetPasswordToken} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Router>
            <Toaster />
            <AppRoutes />
          </Router>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
