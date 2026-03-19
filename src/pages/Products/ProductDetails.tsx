import { useState, useEffect } from "react";
import { useParams, Link } from "react-router";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { supabase } from "../../lib/supabaseClient";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import Button from "../../components/ui/button/Button";

interface Category {
  name: string;
}

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
  categories: Category | null;
  halal_certificate_number: string | null;
  certification_agency: string | null;
  halal_expired: string | null;
}

interface StockBatch {
  id: number;
  product_id: number;
  purchase_id: number | null;
  quantity: number;
  purchase_price: number;
  expired_at: string | null;
  created_at: string;
}

export default function ProductDetails() {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [stockBatches, setStockBatches] = useState<StockBatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProductDetails();
  }, [id]);

  const fetchProductDetails = async () => {
    setLoading(true);
    try {
      // Fetch Product
      const { data: productData, error: productError } = await supabase
        .from("products")
        .select("*, categories(name)")
        .eq("id", id)
        .single();

      if (productError) throw productError;
      setProduct(productData);

      // Fetch Stock Batches
      const { data: batchData, error: batchError } = await supabase
        .from("stock_batches")
        .select("*")
        .eq("product_id", id)
        .order("created_at", { ascending: false });

      if (batchError) throw batchError;
      setStockBatches(batchData || []);
    } catch (err: any) {
      console.error("Error fetching product details:", err);
      toast.error("Failed to fetch product details");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-gray-500">Product not found.</p>
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title={`Product Details: ${product.name} | Halal ERP`}
        description="View product details and stock batches"
      />
      <PageBreadcrumb pageTitle="Product Details" />

      <div className="space-y-6">
        {/* Product Information Card */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-white/[0.05] dark:bg-white/[0.03]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-medium text-gray-800 dark:text-white/90">
              Product Information
            </h3>
            <Link to={`/products/${product.id}/edit`}>
              <Button size="sm" variant="outline">
                Edit Product
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium text-gray-800 dark:text-white/90">{product.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Internal Code</p>
                <p className="font-medium text-gray-800 dark:text-white/90">{product.code}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Category</p>
                <p className="font-medium text-gray-800 dark:text-white/90">
                  {product.categories?.name || "Uncategorized"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Unit</p>
                <p className="font-medium text-gray-800 dark:text-white/90">{product.unit || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Barcode</p>
                <p className="font-medium text-gray-800 dark:text-white/90">{product.barcode || "-"}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Selling Price</p>
                <p className="font-medium text-gray-800 dark:text-white/90">
                  Rp {product.selling_price.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Minimum Stock</p>
                <p className="font-medium text-gray-800 dark:text-white/90">{product.min_stock}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <span
                  className={`mt-1 inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                    product.status
                      ? "bg-success-50 text-success-600"
                      : "bg-error-50 text-error-600"
                  }`}
                >
                  {product.status ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Halal Certification Card */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-white/[0.05] dark:bg-white/[0.03]">
          <h3 className="mb-6 text-xl font-medium text-gray-800 dark:text-white/90">
            Halal Certification
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-500">Certificate Number</p>
              <p className="font-medium text-gray-800 dark:text-white/90">
                {product.halal_certificate_number || "-"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Certification Agency</p>
              <p className="font-medium text-gray-800 dark:text-white/90">
                {product.certification_agency || "-"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Expiry Date</p>
              <p className="font-medium text-gray-800 dark:text-white/90">
                {product.halal_expired || "-"}
              </p>
            </div>
          </div>
        </div>

        {/* Stock Batches Card */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-white/[0.05] dark:bg-white/[0.03]">
          <h3 className="mb-6 text-xl font-medium text-gray-800 dark:text-white/90">
            Stock Batches
          </h3>
          <div className="overflow-hidden rounded-lg border border-gray-100 dark:border-white/[0.05]">
            <div className="max-w-full overflow-x-auto">
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                  <TableRow>
                    <TableCell isHeader className="px-5 py-3 text-start">Batch ID</TableCell>
                    <TableCell isHeader className="px-5 py-3 text-start">Quantity</TableCell>
                    <TableCell isHeader className="px-5 py-3 text-start">Purchase Price</TableCell>
                    <TableCell isHeader className="px-5 py-3 text-start">Expiry Date</TableCell>
                    <TableCell isHeader className="px-5 py-3 text-start">Date Added</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {stockBatches.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-6 text-center text-gray-500">
                        No stock batches found for this product.
                      </TableCell>
                    </TableRow>
                  ) : (
                    stockBatches.map((batch) => (
                      <TableRow key={batch.id}>
                        <TableCell className="px-5 py-4 font-medium text-gray-800 dark:text-white">
                          #{batch.id}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-gray-800 dark:text-white/90">
                          {batch.quantity}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-gray-800 dark:text-white/90">
                          Rp {batch.purchase_price.toLocaleString()}
                        </TableCell>
                        <TableCell className="px-5 py-4">
                          {batch.expired_at ? (
                            <span
                              className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                                new Date(batch.expired_at) < new Date()
                                  ? "bg-error-50 text-error-600"
                                  : "bg-success-50 text-success-600"
                              }`}
                            >
                              {batch.expired_at}
                            </span>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-gray-500">
                          {new Date(batch.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
