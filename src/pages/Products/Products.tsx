import { Link } from "react-router";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ProductTable from "../../components/Products/ProductTable";
import Button from "../../components/ui/button/Button";
import { PlusIcon } from "../../icons";
import { useState } from "react";

export default function Products() {
  const [refreshTrigger] = useState(0);

  return (
    <>
      <PageMeta
        title="Produk | Halal ERP"
        description="Kelola produk POS Anda"
      />
      <PageBreadcrumb pageTitle="Produk" />
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
              Daftar Produk
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Kelola dan atur inventaris toko Anda.
            </p>
          </div>
          <Link to="/products/create">
            <Button size="sm" className="flex items-center gap-2">
              <PlusIcon />
              Tambah Produk
            </Button>
          </Link>
        </div>

        <ProductTable refreshTrigger={refreshTrigger} />
      </div>
    </>
  );
}
