import { Navigate } from "react-router-dom";

export default function Accessories() {
  return <Navigate to="/products?category=accessories" replace />;
}
