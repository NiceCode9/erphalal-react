import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import { supabase } from "../../lib/supabaseClient";
import ConfirmationModal from "../ui/modal/ConfirmationModal";
import { toast } from "sonner";
import { PencilIcon, TrashBinIcon } from "../../icons";
import Button from "../ui/button/Button";

interface Supplier {
  id: number;
  name: string;
  contact: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
}

interface SupplierTableProps {
  onEdit: (id: number) => void;
  refreshTrigger: number;
}

export default function SupplierTable({ onEdit, refreshTrigger }: SupplierTableProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [itemsPerPage] = useState(10);
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<number | null>(null);

  useEffect(() => {
    fetchSuppliers();
  }, [refreshTrigger, currentPage, searchTerm]);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("suppliers")
        .select("*", { count: "exact" });

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,contact.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      }

      const { data, error, count } = await query
        .order("name", { ascending: true })
        .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1);

      if (error) throw error;
      setSuppliers(data || []);
      setTotalCount(count || 0);
    } catch (error: any) {
      toast.error("Failed to load suppliers");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id: number) => {
    setSupplierToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!supplierToDelete) return;

    try {
      const { error } = await supabase
        .from("suppliers")
        .delete()
        .eq("id", supplierToDelete);

      if (error) throw error;
      toast.success("Supplier deleted successfully");
      fetchSuppliers();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete supplier");
    } finally {
      setIsDeleteModalOpen(false);
      setSupplierToDelete(null);
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      {/* Search Header */}
      <div className="p-5 border-b border-gray-100 dark:border-white/[0.05]">
        <div className="max-w-sm">
          <input
            type="text"
            placeholder="Search suppliers..."
            className="h-10 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2 text-sm dark:border-gray-700 dark:text-white/90 focus:border-brand-300 focus:ring-brand-500/10"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              <TableCell isHeader className="px-5 py-3 text-start">Supplier Name</TableCell>
              <TableCell isHeader className="px-5 py-3 text-start">Contact Person</TableCell>
              <TableCell isHeader className="px-5 py-3 text-start">Phone/Email</TableCell>
              <TableCell isHeader className="px-5 py-3 text-start">Address</TableCell>
              <TableCell isHeader className="px-5 py-3 text-right">Actions</TableCell>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="px-5 py-10 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent"></div>
                    <span className="text-sm font-medium text-gray-400">Loading suppliers...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : suppliers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="px-5 py-10 text-center text-gray-500">
                  No suppliers found
                </TableCell>
              </TableRow>
            ) : (
              suppliers.map((supplier) => (
                <TableRow key={supplier.id} className="border-b border-gray-100 last:border-0 dark:border-white/[0.05]">
                  <TableCell className="px-5 py-4 font-medium text-gray-800 dark:text-white/90 uppercase">
                    {supplier.name}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-gray-500 dark:text-gray-400">
                    {supplier.contact || "-"}
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <div className="flex flex-col text-sm">
                      <span className="text-gray-800 dark:text-white/90">{supplier.phone || "-"}</span>
                      <span className="text-xs text-gray-400">{supplier.email || "-"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-5 py-4 text-gray-500 dark:text-gray-400 max-w-xs truncate">
                    {supplier.address || "-"}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => onEdit(supplier.id)}
                        className="text-brand-500 hover:text-brand-600"
                        title="Edit"
                      >
                        <PencilIcon className="size-5" />
                      </button>
                      <button 
                        onClick={() => handleDeleteClick(supplier.id)}
                        className="text-error-500 hover:text-error-600"
                        title="Delete"
                      >
                        <TrashBinIcon className="size-5" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Footer */}
      {!loading && totalPages > 1 && (
        <div className="px-5 py-4 border-t border-gray-100 dark:border-white/[0.05] flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalCount)}</span> of <span className="font-medium">{totalCount}</span> results
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Supplier"
        message="Are you sure you want to delete this supplier? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
