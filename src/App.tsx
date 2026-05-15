import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import React, { useState } from "react";
import Navbar from "./components/Navbar";
import Index from "./pages/Index";
import Archive from "./pages/Archive";
import StateDetail from "./pages/StateDetail";
import Ledger from "./pages/Ledger";
import Reserve from "./pages/Reserve";
import AdminPortal from "./pages/AdminPortal";
import AdminLogin from "./pages/AdminLogin";
import Checkout from "./pages/Checkout";
import OrderHistory from "./pages/OrderHistory";
import Architecture from "./pages/Architecture";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import TransitionOverlay from "./components/TransitionOverlay";
import ErrorBoundary from "./components/ErrorBoundary";
import { CartProvider } from "./context/CartContext";

const queryClient = new QueryClient();

const App = () => {
  const [isTransitioning, setIsTransitioning] = useState(false);

  return (
    <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <div className="flex flex-col min-h-screen">
              <TransitionOverlay 
                show={isTransitioning} 
                onComplete={() => setIsTransitioning(false)} 
              />
              <Navbar />
              <main className="flex-grow">
                <Routes>
                  <Route path="/" element={<Index onStartTransition={() => setIsTransitioning(true)} />} />
                  <Route path="/ledger" element={<Ledger />} />
                  <Route path="/admin/login" element={<AdminLogin />} />
                  <Route path="/admin/portal" element={<AdminPortal />} />
                  
                  {/* Protected Routes */}
                  <Route path="/archive" element={
                    <ProtectedRoute>
                      <Archive />
                    </ProtectedRoute>
                  } />
                  <Route path="/state/:id" element={
                    <ProtectedRoute>
                      <StateDetail />
                    </ProtectedRoute>
                  } />
                  <Route path="/reserve" element={
                    <ProtectedRoute>
                      <Reserve />
                    </ProtectedRoute>
                  } />
                  <Route path="/checkout" element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <Checkout />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  } />
                  <Route path="/orders" element={
                    <ProtectedRoute>
                      <OrderHistory />
                    </ProtectedRoute>
                  } />
                  <Route path="/architecture" element={<Architecture />} />
                  
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
            </div>
          </BrowserRouter>
        </TooltipProvider>
      </CartProvider>
    </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;