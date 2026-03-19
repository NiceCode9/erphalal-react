import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import DatePicker from "../../components/form/date-picker";
import { supabase } from "../../lib/supabaseClient";
import { toast } from "sonner";
import { PlusIcon, TrashBinIcon } from "../../icons";

interface Supplier {
  id: number;
  name: string;
}

interface Product {
  id: number;
  name: string;
  code: string;
  unit: string | null;
}

interface PurchaseItemState {
  product_id: string;
  quantity: string;
  price: string;
  expired_at: string;
  unit?: string;
}

export default function PurchaseForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // Form states
  const [supplierId, setSupplierId] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<PurchaseItemState[]>([
    { product_id: "", quantity: "1", price: "0", expired_at: "" },
  ]);

  useEffect(() => {
    fetchInitialData();
    if (isEdit) {
      fetchPurchase();
    }
  }, [id]);

  const fetchInitialData = async () => {
    const [suppliersRes, productsRes] = await Promise.all([
      supabase.from("suppliers").select("id, name").order("name"),
      supabase.from("products").select("id, name, code, unit").order("name"),
    ]);

    if (suppliersRes.data) setSuppliers(suppliersRes.data);
    if (productsRes.data) setProducts(productsRes.data);
  };

  const fetchPurchase = async () => {
    try {
      const { data, error } = await supabase
        .from("purchases")
        .select("*, purchase_items(*)")
        .eq("id", id)
        .single();

      if (error) throw error;
      if (data) {
        setSupplierId(data.supplier_id?.toString() || "");
        setPurchaseDate(data.purchase_date);
        setNotes(data.notes || "");
        
        // Map purchase items
        const mappedItems = data.purchase_items.map((item: any) => ({
          product_id: item.product_id.toString(),
          quantity: item.quantity.toString(),
          price: item.price.toString(),
          expired_at: "", // We'd need to fetch from stock_batches to get this perfectly
        }));
        setItems(mappedItems.length > 0 ? mappedItems : [{ product_id: "", quantity: "1", price: "0", expired_at: "" }]);
      }
    } catch (error: any) {
      toast.error("Failed to fetch purchase details");
      navigate("/purchases");
    } finally {
      setFetching(false);
    }
  };

  const handleAddItem = () => {
    setItems([...items, { product_id: "", quantity: "1", price: "0", expired_at: "" }]);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const handleItemChange = (index: number, field: keyof PurchaseItemState, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // If product changed, update unit
    if (field === "product_id") {
      const product = products.find(p => p.id.toString() === value);
      if (product) {
        newItems[index].unit = product.unit || "";
      }
    }
    
    setItems(newItems);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => {
      const subtotal = parseFloat(item.quantity || "0") * parseFloat(item.price || "0");
      return sum + (isNaN(subtotal) ? 0 : subtotal);
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId) return toast.error("Please select a supplier");
    if (items.some(item => !item.product_id)) return toast.error("Please select a product for all items");

    setLoading(true);
    try {
      const total = calculateTotal();
      
      // 1. Insert/Update Purchase
      const purchaseData = {
        supplier_id: parseInt(supplierId),
        purchase_date: purchaseDate,
        total,
        notes,
        updated_at: new Date().toISOString(),
      };

      let purchaseIdResult: number;

      if (isEdit) {
        const { error } = await supabase
          .from("purchases")
          .update(purchaseData)
          .eq("id", id);
        if (error) throw error;
        purchaseIdResult = parseInt(id as string);
        
        // Delete old items and batches (simplified for now)
        await supabase.from("purchase_items").delete().eq("purchase_id", purchaseIdResult);
        await supabase.from("stock_batches").delete().eq("purchase_id", purchaseIdResult);
      } else {
        const { data, error } = await supabase
          .from("purchases")
          .insert([purchaseData])
          .select()
          .single();
        if (error) throw error;
        purchaseIdResult = data.id;
      }

      // 2. Insert Purchase Items
      const purchaseItemsData = items.map(item => ({
        purchase_id: purchaseIdResult,
        product_id: parseInt(item.product_id),
        quantity: parseInt(item.quantity),
        price: parseFloat(item.price),
        subtotal: parseInt(item.quantity) * parseFloat(item.price),
      }));

      const { error: itemsError } = await supabase.from("purchase_items").insert(purchaseItemsData);
      if (itemsError) throw itemsError;

      // 3. Insert Stock Batches
      const stockBatchesData = items.map(item => ({
        product_id: parseInt(item.product_id),
        purchase_id: purchaseIdResult,
        quantity: parseInt(item.quantity),
        purchase_price: parseFloat(item.price),
        expired_at: item.expired_at || null,
      }));

      const { error: batchesError } = await supabase.from("stock_batches").insert(stockBatchesData);
      if (batchesError) throw batchesError;

      toast.success(`Purchase ${isEdit ? "updated" : "created"} successfully`);
      navigate("/purchases");
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title={`${isEdit ? "Edit" : "New"} Purchase | Halal ERP`}
        description="Create or edit a purchase transaction"
      />
      <PageBreadcrumb pageTitle={isEdit ? "Edit Purchase" : "New Purchase"} />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header Information */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-white/[0.05] dark:bg-white/[0.03]">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="supplier">Supplier <span className="text-error-500">*</span></Label>
              <select
                id="supplier"
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                required
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2 text-sm dark:border-gray-700 dark:text-white/90 focus:border-brand-300 focus:ring-brand-500/10"
              >
                <option value="">Select Supplier</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <DatePicker
                id="purchaseDate"
                label="Purchase Date"
                defaultDate={purchaseDate}
                onChange={(_dates, dateStr) => setPurchaseDate(dateStr)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                placeholder="Optional notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Items Section */}
        <div className="rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
          <div className="border-b border-gray-100 p-5 dark:border-white/[0.05] flex items-center justify-between">
            <h3 className="font-medium text-gray-800 dark:text-white/90">Purchase Items</h3>
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={handleAddItem}
              className="flex items-center gap-2"
            >
              <PlusIcon />
              Add Item
            </Button>
          </div>

          <div className="overflow-x-auto p-5">
            <table className="w-full text-left">
              <thead>
                <tr className="text-sm font-medium text-gray-400">
                  <th className="pb-4 pr-4 min-w-[250px]">Product</th>
                  <th className="pb-4 px-4 w-32">Qty</th>
                  <th className="pb-4 px-4 w-40">Price (IDR)</th>
                  <th className="pb-4 px-4 w-48">Expired At</th>
                  <th className="pb-4 px-4 text-right">Subtotal</th>
                  <th className="pb-4 pl-4 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {items.map((item, index) => (
                  <tr key={index}>
                    <td className="py-4 pr-4">
                      <select
                        value={item.product_id}
                        onChange={(e) => handleItemChange(index, "product_id", e.target.value)}
                        className="h-10 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm dark:border-gray-700 dark:text-white/90"
                      >
                        <option value="">Select Product</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            [{p.code}] {p.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-4 px-4">
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                        className="h-10"
                      />
                    </td>
                    <td className="py-4 px-4">
                      <Input
                        type="number"
                        min="0"
                        value={item.price}
                        onChange={(e) => handleItemChange(index, "price", e.target.value)}
                        className="h-10"
                      />
                    </td>
                    <td className="py-4 px-4">
                      <DatePicker
                        id={`item-expiry-${index}`}
                        isStatic={false}
                        defaultDate={item.expired_at}
                        onChange={(_dates, dateStr) => handleItemChange(index, "expired_at", dateStr)}
                      />
                    </td>
                    <td className="py-4 px-4 text-right font-medium">
                      Rp {((parseInt(item.quantity) || 0) * (parseFloat(item.price) || 0)).toLocaleString()}
                    </td>
                    <td className="py-4 pl-4 text-right">
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="text-error-500 hover:text-error-600"
                        >
                          <TrashBinIcon className="size-5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={4} className="pt-6 text-right font-semibold text-gray-800 dark:text-white">Total Amount:</td>
                  <td className="pt-6 text-right text-lg font-bold text-brand-500">
                    Rp {calculateTotal().toLocaleString()}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-6">
          <Button
            variant="outline"
            type="button"
            onClick={() => navigate("/purchases")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Processing..." : isEdit ? "Update Purchase" : "Save Transaction"}
          </Button>
        </div>
      </form>
    </>
  );
}
