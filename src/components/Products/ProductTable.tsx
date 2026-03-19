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
import { PencilIcon, TrashBinIcon, EyeIcon } from "../../icons";

interface Product {
  id: number;
  name: string;
  code: string;
  barcode: string | null;
  unit: string | null;
  selling_price: number;
  min_stock: number;
  status: boolean;
  category_id: number | null;
  categories?: { name: string };
  stock_batches?: { quantity: number }[];
}

interface ProductTableProps {
  refreshTrigger: number;
}

export default function ProductTable({ refreshTrigger }: ProductTableProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [itemsPerPage] = useState(10);
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      let query = supabase
        .from("products")
        .select("*, categories(name), stock_batches(quantity)", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to);

      if (searchTerm) {
        query = query.ilike("name", `%${searchTerm}%`);
      }

      const { data, error, count } = await query;

      if (error) throw error;
      setProducts(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Gagal memuat daftar produk");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [refreshTrigger, currentPage, searchTerm, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage]);

  const handleDeleteClick = (id: number) => {
    setProductToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", productToDelete);
      if (error) throw error;
      toast.success("Produk berhasil dihapus");
      fetchProducts();
      setIsDeleteModalOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Gagal menghapus produk");
    } finally {
      setIsDeleting(false);
      setProductToDelete(null);
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between lg:p-6">
        <div className="relative w-full max-w-sm">
          <input
            type="text"
            placeholder="Cari produk..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm placeholder:text-gray-400 focus:border-brand-300 dark:border-gray-700 dark:text-white/90"
          />
        </div>
      </div>

      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              <TableCell isHeader className="px-5 py-3 text-start">
                Produk
              </TableCell>
              <TableCell isHeader className="px-5 py-3 text-start">
                Kategori
              </TableCell>
              <TableCell isHeader className="px-5 py-3 text-start">
                Harga
              </TableCell>
              <TableCell isHeader className="px-5 py-3 text-start">
                Satuan
              </TableCell>
              <TableCell isHeader className="px-5 py-3 text-start">
                Total Stok
              </TableCell>
              <TableCell isHeader className="px-5 py-3 text-start">
                Info Stok
              </TableCell>
              <TableCell isHeader className="px-5 py-3 text-start">
                Status
              </TableCell>
              <TableCell isHeader className="px-5 py-3 text-right">
                Aksi
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center">
                  Memuat...
                </TableCell>
              </TableRow>
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center">
                  Produk tidak ditemukan.
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="px-5 py-4">
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-800 dark:text-white/90">
                        {product.name}
                      </span>
                      <span className="text-xs text-gray-400">
                        Kode: {product.code}{" "}
                        {product.barcode ? `| Barcode: ${product.barcode}` : ""}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="px-5 py-4 text-gray-500 dark:text-gray-400">
                    {product.categories?.name || "Tanpa Kategori"}
                  </TableCell>
                  <TableCell className="px-5 py-4 font-medium text-gray-800 dark:text-white">
                    Rp {product.selling_price.toLocaleString()}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-gray-500 dark:text-gray-400">
                    {product.unit || "-"}
                  </TableCell>
                  <TableCell className="px-5 py-4 font-medium text-gray-800 dark:text-white">
                    {product.stock_batches?.reduce((sum, batch) => sum + batch.quantity, 0) || 0}
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <span className="text-theme-xs text-gray-500">
                      Min: {product.min_stock}
                    </span>
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                        product.status
                          ? "bg-success-50 text-success-600"
                          : "bg-error-50 text-error-600"
                      }`}
                    >
                      {product.status ? "Aktif" : "Tidak Aktif"}
                    </span>
                  </TableCell>
                  <TableCell className="px-5 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        to={`/products/${product.id}`}
                        // className="text-brand-500 hover:text-brand-600"
                      >
                        {/* <EyeIcon className="size-5" /> */}
                        <EyeIcon className="fill-gray-500 hover:text-brand-600 dark:fill-gray-400 size-5" />
                      </Link>
                      <Link
                        to={`/products/${product.id}/edit`}
                        className="text-brand-500 hover:text-brand-600"
                      >
                        <PencilIcon className="size-5" />
                      </Link>
                      <button
                        onClick={() => handleDeleteClick(product.id)}
                        className="text-error-500 hover:text-error-600"
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

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Hapus Produk"
        message="Apakah Anda yakin ingin menghapus produk ini?"
        confirmLabel="Hapus"
        isLoading={isDeleting}
      />

      {/* Basic Pagination */}
      {!loading && totalCount > 10 && (
        <div className="flex items-center justify-between border-t border-gray-100 p-5 dark:border-white/[0.05]">
          <p className="text-sm text-gray-500">Total: {totalCount} produk</p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Prev
            </button>
            <span className="px-3 py-1">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
