import React, { useState, useEffect } from "react";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import { supabase } from "../../lib/supabaseClient";
import { toast } from "sonner";

interface PurchaseItem {
  id: number;
  product_id: number;
  quantity: number;
  price: number;
  products?: { name: string };
  stock_batches?: { id: number; quantity: number }[];
}

interface PurchaseReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseId: number | null;
  onSuccess: () => void;
}

export default function PurchaseReturnModal({
  isOpen,
  onClose,
  purchaseId,
  onSuccess,
}: PurchaseReturnModalProps) {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [returnQty, setReturnQty] = useState<string>("1");
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (isOpen && purchaseId) {
      fetchPurchaseItems();
      resetForm();
    }
  }, [isOpen, purchaseId]);

  const resetForm = () => {
    setSelectedItemId("");
    setReturnQty("1");
    setReason("");
  };

  const fetchPurchaseItems = async () => {
    try {
      // Fetch items and their corresponding stock batches for this purchase
      const { data, error } = await supabase
        .from("purchase_items")
        .select(`
          id, 
          product_id, 
          quantity, 
          price, 
          products(name),
          stock_batches: stock_batches(id, quantity)
        `)
        .eq("purchase_id", purchaseId);

      if (error) throw error;
      setItems((data as any) || []);
    } catch (error: any) {
      toast.error("Failed to load purchase items");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId) return toast.error("Please select an item");
    
    const item = items.find(i => i.id.toString() === selectedItemId);
    const qty = parseInt(returnQty);
    
    if (!item) return;
    if (qty > item.quantity) return toast.error(`Cannot return more than purchased (${item.quantity})`);
    
    const batch = item.stock_batches?.[0];
    if (!batch) return toast.error("Stock batch not found for this item");
    if (qty > batch.quantity) return toast.error(`Not enough stock available to return (Available: ${batch.quantity})`);

    setLoading(true);
    try {
      // 1. Insert into purchase_returns
      const { error: returnError } = await supabase.from("purchase_returns").insert([{
        purchase_id: purchaseId,
        purchase_item_id: item.id,
        stock_batch_id: batch.id,
        quantity: qty,
        reason,
        returned_at: new Date().toISOString(),
      }]);

      if (returnError) throw returnError;

      // 2. Update stock_batches quantity
      const { error: stockError } = await supabase.rpc('decrement_stock_batch_quantity', {
        batch_id: batch.id,
        qty: qty
      });
      
      // If RPC is not present, use manual update (less safe but works)
      if (stockError) {
        const { error: manualError } = await supabase
          .from("stock_batches")
          .update({ quantity: batch.quantity - qty })
          .eq("id", batch.id);
        if (manualError) throw manualError;
      }

      toast.success("Return processed successfully");
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "An error occurred while processing return");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[500px]">
      <div className="px-6 py-8">
        <h2 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
          Purchase Return
        </h2>
        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
          Return items for Purchase #{purchaseId}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="itemSelect">Select Item</Label>
            <select
              id="itemSelect"
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2 text-sm dark:border-gray-700 dark:text-white/90 focus:border-brand-300 focus:ring-brand-500/10"
              required
            >
              <option value="">Select an item to return</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.products?.name} (Bought: {item.quantity})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="qty">Return Quantity</Label>
            <Input
              id="qty"
              type="number"
              min="1"
              value={returnQty}
              onChange={(e) => setReturnQty(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason</Label>
            <Input
              id="reason"
              placeholder="e.g. Damaged, Wrong item"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Processing..." : "Process Return"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
