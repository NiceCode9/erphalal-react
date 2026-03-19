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
        title="Products | Halal ERP"
        description="Manage your POS products"
      />
      <PageBreadcrumb pageTitle="Products" />
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
              Product List
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Manage and organize your store's inventory.
            </p>
          </div>
          <Link to="/products/create">
            <Button size="sm" className="flex items-center gap-2">
              <PlusIcon />
              Add Product
            </Button>
          </Link>
        </div>

        <ProductTable refreshTrigger={refreshTrigger} />
      </div>
    </>
  );
}
