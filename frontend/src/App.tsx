import { Link, Navigate, Route, Routes } from "react-router-dom";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ProductSearchPage } from "./pages/ProductSearchPage";
import { MyLinksPage } from "./pages/MyLinksPage";
import { WalletPage } from "./pages/WalletPage";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";

export function App() {
  const { user, signOut } = useAuth();

  return (
    <div>
      <nav>
        <Link to="/products">Products</Link>
        {user && <Link to="/links">My Links</Link>}
        {user && <Link to="/wallet">Wallet</Link>}
        {user ? (
          <button onClick={signOut}>Log Out</button>
        ) : (
          <>
            <Link to="/login">Log In</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </nav>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/products"
          element={
            <ProtectedRoute>
              <ProductSearchPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/links"
          element={
            <ProtectedRoute>
              <MyLinksPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/wallet"
          element={
            <ProtectedRoute>
              <WalletPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/products" replace />} />
      </Routes>
    </div>
  );
}
