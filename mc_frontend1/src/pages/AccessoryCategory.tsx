import { Navigate, useParams } from "react-router-dom";

const toCategoryParam = (value?: string) =>
  (value || "accessories").trim().toLowerCase().replace(/[\s-]+/g, "_");

export default function AccessoryCategory() {
  const { category } = useParams();

  return (
    <Navigate
      to={`/products?category=${encodeURIComponent(toCategoryParam(category))}`}
      replace
    />
  );
}
