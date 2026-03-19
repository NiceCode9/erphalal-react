import { useState, useEffect } from "react";
import { Link } from "react-router";
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
import { PencilIcon, TrashBinIcon, ArrowUpIcon } from "../../icons";
import PurchaseReturnModal from "./PurchaseReturnModal";

interface Purchase {
  id: number;
  purchase_date: string;
  total: number;
  notes: string | null;
  supplier_id: number | null;
  suppliers?: { name: string };
}

interface PurchaseTableProps {
  refreshTrigger: number;
}

export default function PurchaseTable({ refreshTrigger }: PurchaseTableProps) {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [itemsPerPage] = useState(10);
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [purchaseToDelete, setPurchaseToDelete] = useState<number | null>(null);
  
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [purchaseToReturn, setPurchaseToReturn] = useState<number | null>(null);

  useEffect(() => {
    fetchPurchases();
  }, [refreshTrigger, currentPage, searchTerm]);

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("purchases")
        .select("*, suppliers(name)", { count: "exact" });

      if (searchTerm) {
        // Search by notes or supplier name
        // Note: Filtering by joined table in Supabase can be tricky with .or()
        // For now, let's keep it simple with notes
        query = query.ilike("notes", `%${searchTerm}%`);
      }

      const { data, error, count } = await query
        .order("purchase_date", { ascending: false })
        .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1);

      if (error) throw error;
      setPurchases(data || []);
      setTotalCount(count || 0);
    } catch (error: any) {
      toast.error("Failed to load purchases");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id: number) => {
    setPurchaseToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!purchaseToDelete) return;

    try {
      // Logic: Deleting a purchase should ideally also delete purchase_items and stock_batches
      // The schema likely has ON DELETE CASCADE or RESTRICT.
      // Let's try deleting.
      const { error } = await supabase
        .from("purchases")
        .delete()
        .eq("id", purchaseToDelete);

      if (error) throw error;
      toast.success("Purchase deleted successfully");
      fetchPurchases();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete purchase. Make sure there are no linked items or returns.");
    } finally {
      setIsDeleteModalOpen(false);
      setPurchaseToDelete(null);
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      {/* Search Header */}
      <div className="p-5 border-b border-gray-100 dark:border-white/[0.05]">
        <div className="max-w-sm">
          <input
            type="text"
            placeholder="Search by notes..."
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
              <TableCell isHeader className="px-5 py-3 text-start">Date</TableCell>
              <TableCell isHeader className="px-5 py-3 text-start">Supplier</TableCell>
              <TableCell isHeader className="px-5 py-3 text-start">Total Amount</TableCell>
              <TableCell isHeader className="px-5 py-3 text-start">Notes</TableCell>
              <TableCell isHeader className="px-5 py-3 text-right">Actions</TableCell>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="px-5 py-10 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent"></div>
                    <span className="text-sm font-medium text-gray-400">Loading purchases...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : purchases.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="px-5 py-10 text-center text-gray-500">
                  No purchases found
                </TableCell>
              </TableRow>
            ) : (
              purchases.map((purchase) => (
                <TableRow key={purchase.id} className="border-b border-gray-100 last:border-0 dark:border-white/[0.05]">
                  <TableCell className="px-5 py-4 text-gray-800 dark:text-white/90">
                    {new Date(purchase.purchase_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-gray-500 dark:text-gray-400">
                    {purchase.suppliers?.name || "Unknown Supplier"}
                  </TableCell>
                  <TableCell className="px-5 py-4 font-medium text-gray-800 dark:text-white">
                    Rp {purchase.total.toLocaleString()}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-gray-500 dark:text-gray-400 max-w-xs truncate">
                    {purchase.notes || "-"}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setPurchaseToReturn(purchase.id);
                          setIsReturnModalOpen(true);
                        }}
                        className="text-yellow-600 hover:text-yellow-700"
                        title="Return Items"
                      >
                        <ArrowUpIcon className="size-5" />
                      </button>
                      <Link 
                        to={`/purchases/${purchase.id}/edit`}
                        className="text-brand-500 hover:text-brand-600"
                        title="Edit"
                      >
                        <PencilIcon className="size-5" />
                      </Link>
                      <button 
                        onClick={() => handleDeleteClick(purchase.id)}
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

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="px-5 py-4 border-t border-gray-100 dark:border-white/[0.05] flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalCount)}</span> of <span className="font-medium">{totalCount}</span> results
          </p>
          <div className="flex gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
              className="px-3 py-1 text-sm border rounded-md disabled:opacity-50"
            >
              Previous
            </button>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
              className="px-3 py-1 text-sm border rounded-md disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Purchase"
        message="Are you sure you want to delete this purchase transaction? This may affect your stock batches."
        variant="danger"
      />

      <PurchaseReturnModal
        isOpen={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        purchaseId={purchaseToReturn}
        onSuccess={() => {
          setIsReturnModalOpen(false);
          fetchPurchases();
        }}
      />
    </div>
  );
}
