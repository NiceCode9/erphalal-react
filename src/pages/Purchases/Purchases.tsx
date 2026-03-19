import React, { useState } from "react";
import { Link } from "react-router";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import PurchaseTable from "../../components/Purchases/PurchaseTable";
import Button from "../../components/ui/button/Button";
import { PlusIcon } from "../../icons";

export default function Purchases() {
  const [refreshTrigger] = useState(0);

  return (
    <>
      <PageMeta
        title="Purchases | Halal ERP"
        description="Purchase management page"
      />
      <PageBreadcrumb pageTitle="Purchases" />

      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
              Purchase History
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Track and manage your stock purchase transactions
            </p>
          </div>
          <Link to="/purchases/create">
            <Button size="sm" className="flex items-center gap-2">
              <PlusIcon />
              New Purchase
            </Button>
          </Link>
        </div>

        <PurchaseTable refreshTrigger={refreshTrigger} />
      </div>
    </>
  );
}
