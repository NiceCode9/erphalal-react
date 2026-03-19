import { useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import SupplierTable from "../../components/Suppliers/SupplierTable";
import Button from "../../components/ui/button/Button";
import { PlusIcon } from "../../icons";
import SupplierModal from "../../components/Suppliers/SupplierModal";

export default function Suppliers() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleAddSupplier = () => {
    setSelectedSupplierId(null);
    setIsModalOpen(true);
  };

  const handleEditSupplier = (id: number) => {
    setSelectedSupplierId(id);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedSupplierId(null);
  };

  const handleSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
    handleModalClose();
  };

  return (
    <>
      <PageMeta
        title="Supplier | Halal ERP"
        description="Halaman manajemen supplier"
      />
      <PageBreadcrumb pageTitle="Supplier" />

      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
              Daftar Supplier
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Kelola supplier dan informasi kontak mereka
            </p>
          </div>
          <Button 
            onClick={handleAddSupplier} 
            size="sm" 
            className="flex items-center gap-2"
          >
            <PlusIcon />
            Tambah Supplier
          </Button>
        </div>

        <SupplierTable 
          onEdit={handleEditSupplier} 
          refreshTrigger={refreshTrigger} 
        />
      </div>

      <SupplierModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleSuccess}
        supplierId={selectedSupplierId}
      />
    </>
  );
}
