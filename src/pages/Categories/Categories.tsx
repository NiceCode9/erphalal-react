import { useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import CategoryTable from "../../components/Categories/CategoryTable";
import CategoryModal from "../../components/Categories/CategoryModal";
import Button from "../../components/ui/button/Button";

interface Category {
  id: number;
  name: string;
  description: string;
  created_at: string;
}

export default function Categories() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleCreate = () => {
    setSelectedCategory(null);
    setIsModalOpen(true);
  };

  const handleEdit = (category: Category) => {
    setSelectedCategory(category);
    setIsModalOpen(true);
  };

  const handleSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <>
      <PageMeta
        title="Kategori Produk | Halal ERP"
        description="Kelola kategori produk POS Anda."
      />
      <PageBreadcrumb pageTitle="Kategori Produk" />
      
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90">
              Kategori
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Kelola kategori produk untuk pengaturan yang lebih baik.
            </p>
          </div>
          <Button size="sm" onClick={handleCreate}>
            Tambah Kategori
          </Button>
        </div>

        <CategoryTable 
          onEdit={handleEdit} 
          refreshTrigger={refreshTrigger} 
        />
      </div>

      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSuccess}
        category={selectedCategory}
      />
    </>
  );
}
