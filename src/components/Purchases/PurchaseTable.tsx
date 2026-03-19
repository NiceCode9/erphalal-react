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
import {
  PencilIcon,
  TrashBinIcon,
  ArrowUpIcon,
  DownloadIcon,
} from "../../icons";
import PurchaseReturnModal from "./PurchaseReturnModal";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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
      let supplierIds: number[] = [];
      if (searchTerm) {
        const { data: sData } = await supabase
          .from("suppliers")
          .select("id")
          .ilike("name", `%${searchTerm}%`);
        if (sData) supplierIds = sData.map((s) => s.id);
      }

      let query = supabase
        .from("purchases")
        .select("*, suppliers(name)", { count: "exact" });

      if (searchTerm) {
        if (supplierIds.length > 0) {
          query = query.or(
            `notes.ilike.%${searchTerm}%,supplier_id.in.(${supplierIds.join(",")})`,
          );
        } else {
          query = query.ilike("notes", `%${searchTerm}%`);
        }
      }

      const { data, error, count } = await query
        .order("purchase_date", { ascending: false })
        .range(
          (currentPage - 1) * itemsPerPage,
          currentPage * itemsPerPage - 1,
        );

      if (error) throw error;
      setPurchases(data || []);
      setTotalCount(count || 0);
    } catch (error: any) {
      console.error(error);
      toast.error("Failed to load purchases");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id: number) => {
    setPurchaseToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleDownloadInvoice = async (purchase: Purchase) => {
    try {
      setLoading(true);
      // Fetch full details including supplier address and items
      const { data: purchaseData, error: pError } = await supabase
        .from("purchases")
        .select(
          "*, suppliers(*), purchase_items(*, products(name, code, unit))",
        )
        .eq("id", purchase.id)
        .single();

      if (pError) throw pError;

      const doc = new jsPDF();

      // Header Branding (Same as reports for consistency)
      doc.setFontSize(22);
      doc.setTextColor(79, 70, 229);
      doc.setFont("helvetica", "bold");
      doc.text("ERP HALAL", 14, 20);

      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.setFont("helvetica", "normal");
      doc.text("Sistem Manajemen POS - FAKTUR PEMBELIAN", 14, 27);

      doc.setDrawColor(230, 230, 230);
      doc.line(14, 32, 196, 32);

      // Supplier & Purchase Info
      doc.setFontSize(12);
      doc.setTextColor(40);
      doc.setFont("helvetica", "bold");
      doc.text("DARI (SUPPLIER):", 14, 42);

      doc.setFontSize(10);
      doc.text(purchaseData.suppliers?.name || "N/A", 14, 48);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100);
      doc.text(purchaseData.suppliers?.address || "No Address", 14, 53);
      doc.text(`Telp: ${purchaseData.suppliers?.phone || "-"}`, 14, 58);
      doc.text(`Email: ${purchaseData.suppliers?.email || "-"}`, 14, 63);

      doc.setFont("helvetica", "bold");
      doc.setTextColor(40);
      doc.text("INFO FAKTUR:", 130, 42);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`No. Transaksi:  #PUR-${purchaseData.id}`, 130, 48);
      doc.text(
        `Tanggal:        ${new Date(purchaseData.purchase_date).toLocaleDateString("id-ID")}`,
        130,
        53,
      );
      doc.text(`Status:         Lunas`, 130, 58);

      // Items Table
      const tableColumn = ["Produk", "Unit", "Qty", "Harga Satuan", "Subtotal"];
      const tableRows = purchaseData.purchase_items.map((item: any) => [
        `[${item.products?.code}] ${item.products?.name}`,
        item.products?.unit || "-",
        item.quantity.toString(),
        `Rp ${item.price.toLocaleString("id-ID")}`,
        `Rp ${item.subtotal.toLocaleString("id-ID")}`,
      ]);

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 75,
        theme: "striped",
        headStyles: { fillColor: [79, 70, 229], fontSize: 10 },
        columnStyles: {
          2: { halign: "center" },
          3: { halign: "right" },
          4: { halign: "right", fontStyle: "bold" },
        },
        styles: { fontSize: 9 },
      });

      const finalY = (doc as any).lastAutoTable.finalY || 80;

      // Summary
      doc.setDrawColor(79, 70, 229);
      doc.setLineWidth(0.5);
      doc.line(130, finalY + 10, 196, finalY + 10);

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(79, 70, 229);
      doc.text("TOTAL:", 130, finalY + 20);
      doc.text(
        `Rp ${purchaseData.total.toLocaleString("id-ID")}`,
        196,
        finalY + 20,
        { align: "right" },
      );

      // Notes
      if (purchaseData.notes) {
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.setFont("helvetica", "italic");
        doc.text("Catatan:", 14, finalY + 20);
        doc.setFont("helvetica", "normal");
        doc.text(purchaseData.notes, 14, finalY + 26);
      }

      doc.save(`Faktur_Pembelian_PUR-${purchaseData.id}.pdf`);
      toast.success("Faktur berhasil diunduh");
    } catch (error: any) {
      console.error(error);
      toast.error("Gagal mengunduh faktur");
    } finally {
      setLoading(false);
    }
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
      toast.error(
        error.message ||
          "Failed to delete purchase. Make sure there are no linked items or returns.",
      );
    } finally {
      setIsDeleteModalOpen(false);
      setPurchaseToDelete(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Header Redesigned */}
      <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm dark:border-white/[0.05] dark:bg-white/[0.02]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/10">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-white/90">
                Daftar Pembelian
              </h3>
              <p className="text-xs text-gray-400 font-medium">
                Cari berdasarkan supplier atau catatan
              </p>
            </div>
          </div>

          <div className="w-full md:w-80">
            <input
              type="text"
              placeholder="Ketik supplier atau catatan..."
              className="h-11 w-full rounded-2xl border-none bg-gray-50 px-5 py-2 text-sm dark:bg-gray-900 dark:text-white/90 focus:ring-2 focus:ring-brand-500/20 transition-all"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>
      </div>

      <div className="relative rounded-[2rem] border border-gray-100 bg-white shadow-sm overflow-hidden dark:border-white/[0.05] dark:bg-white/[0.02]">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell isHeader className="px-5 py-3 text-start">
                  Date
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-start">
                  Supplier
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-start">
                  Total Amount
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-start">
                  Notes
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-right">
                  Actions
                </TableCell>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="px-5 py-10 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent"></div>
                      <span className="text-sm font-medium text-gray-400">
                        Loading purchases...
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : purchases.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="px-5 py-10 text-center text-gray-500"
                  >
                    No purchases found
                  </TableCell>
                </TableRow>
              ) : (
                purchases.map((purchase) => (
                  <TableRow
                    key={purchase.id}
                    className="border-b border-gray-100 last:border-0 dark:border-white/[0.05]"
                  >
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
                          onClick={() => handleDownloadInvoice(purchase)}
                          className="text-gray-500 hover:text-brand-500"
                          title="Download Invoice"
                        >
                          <DownloadIcon className="size-5" />
                        </button>
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
              Showing{" "}
              <span className="font-medium">
                {(currentPage - 1) * itemsPerPage + 1}
              </span>{" "}
              to{" "}
              <span className="font-medium">
                {Math.min(currentPage * itemsPerPage, totalCount)}
              </span>{" "}
              of <span className="font-medium">{totalCount}</span> results
            </p>
            <div className="flex gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => prev - 1)}
                className="px-3 py-1 text-sm border rounded-md disabled:opacity-50"
              >
                Previous
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => prev + 1)}
                className="px-3 py-1 text-sm border rounded-md disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

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
