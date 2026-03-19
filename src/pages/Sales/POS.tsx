import { useState, useEffect, useMemo, useRef } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { supabase } from "../../lib/supabaseClient";
import { toast } from "sonner";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import { TrashBinIcon } from "../../icons";
import { useAuth } from "../../context/AuthContext";
import Receipt from "../../components/Sales/Receipt";

interface Product {
  id: number;
  name: string;
  code: string;
  barcode: string | null;
  selling_price: number;
  min_stock: number;
  category_id: number | null;
  categories?: { name: string };
  stock_batches?: { id: number; quantity: number }[];
  totalStock?: number;
  halal_expired: string | null;
}

interface Category {
  id: number;
  name: string;
}

interface CartItem extends Product {
  cartQuantity: number;
  subtotal: number;
}

export default function POS() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | "all">("all");

  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [tax, setTax] = useState<number>(0);
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // States for printing
  const [lastSale, setLastSale] = useState<any>(null);
  const [lastItems, setLastItems] = useState<any[]>([]);
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: catData } = await supabase.from("categories").select("*").order("name");
      if (catData) setCategories(catData);

      const { data: prodData, error: prodError } = await supabase
        .from("products")
        .select("*, categories(name), stock_batches(id, quantity)")
        .eq("status", true);

      if (prodError) throw prodError;

      const productsWithStock = (prodData || []).map((p: any) => {
        const totalStock = p.stock_batches?.reduce((sum: number, b: any) => sum + b.quantity, 0) || 0;
        return { ...p, totalStock };
      });

      setProducts(productsWithStock);
    } catch (err: any) {
      console.error(err);
      toast.error("Gagal memuat data POS");
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.barcode && p.barcode.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchCategory = selectedCategory === "all" || p.category_id === selectedCategory;

      return matchSearch && matchCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  const addToCart = (product: Product) => {
    // Check if halal certificate is expired
    if (product.halal_expired && new Date(product.halal_expired) < new Date()) {
      toast.error(`Tidak dapat menambahkan ${product.name}: Sertifikat Halal sudah kedaluwarsa (${new Date(product.halal_expired).toLocaleDateString()})`);
      return;
    }

    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.id === product.id);
      
      if (existing) {
        if (existing.cartQuantity + 1 > (product.totalStock || 0)) {
          toast.error(`Stok tidak mencukupi untuk ${product.name}`);
          return prevCart;
        }
        return prevCart.map((item) =>
          item.id === product.id
            ? {
                ...item,
                cartQuantity: item.cartQuantity + 1,
                subtotal: (item.cartQuantity + 1) * item.selling_price,
              }
            : item
        );
      }

      if ((product.totalStock || 0) < 1) {
        toast.error(`Stok habis: ${product.name}`);
        return prevCart;
      }

      return [
        ...prevCart,
        {
          ...product,
          cartQuantity: 1,
          subtotal: product.selling_price,
        },
      ];
    });
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item.id === id) {
          const newQty = item.cartQuantity + delta;
          if (newQty < 1) return item;
          if (newQty > (item.totalStock || 0)) {
            toast.error(`Not enough stock for ${item.name}`);
            return item;
          }
          return {
            ...item,
            cartQuantity: newQty,
            subtotal: newQty * item.selling_price,
          };
        }
        return item;
      })
    );
  };

  const removeFromCart = (id: number) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const grandTotal = subtotal - discount + tax;
  const change = cashReceived - grandTotal;

  const handlePrint = () => {
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error("Keranjang belanja kosong!");
      return;
    }
    if (cashReceived < grandTotal) {
      toast.error("Tunai diterima kurang dari total akhir!");
      return;
    }

    setIsProcessing(true);
    try {
      const invoiceNumber = `INV-${Date.now()}`;

      const { data: saleData, error: saleError } = await supabase
        .from("sales")
        .insert([
          {
            user_id: user?.id,
            invoice_number: invoiceNumber,
            subtotal,
            discount,
            tax,
            total: grandTotal,
            payment_method: "Cash",
            cash_received: cashReceived,
            change: Math.max(0, change),
          },
        ])
        .select()
        .single();

      if (saleError) throw saleError;
      const saleId = saleData.id;

      const saleItemsToInsert = [];
      const stockUpdates = [];

      for (const item of cart) {
        let remainingQty = item.cartQuantity;
        const { data: batches } = await supabase
          .from("stock_batches")
          .select("*")
          .eq("product_id", item.id)
          .gt("quantity", 0)
          .order("expired_at", { ascending: true, nullsFirst: false });

        if (!batches || batches.length === 0) {
          throw new Error(`Insufficient stock for ${item.name}`);
        }

        for (const batch of batches) {
          if (remainingQty <= 0) break;
          const takeQty = Math.min(batch.quantity, remainingQty);
          remainingQty -= takeQty;
          stockUpdates.push({ id: batch.id, quantity: batch.quantity - takeQty });
          saleItemsToInsert.push({
            sale_id: saleId,
            product_id: item.id,
            stock_batch_id: batch.id,
            quantity: takeQty,
            price: item.selling_price,
            subtotal: takeQty * item.selling_price,
          });
        }
        if (remainingQty > 0) throw new Error(`Not enough total stock for ${item.name}`);
      }

      const { error: itemsError } = await supabase.from("sale_items").insert(saleItemsToInsert);
      if (itemsError) throw itemsError;

      for (const update of stockUpdates) {
        const { error: updateError } = await supabase
          .from("stock_batches")
          .update({ quantity: update.quantity, updated_at: new Date().toISOString() })
          .eq("id", update.id);
        if (updateError) throw updateError;
      }

      // Prepare for print
      setLastSale({
        ...saleData,
        user_name: user?.user_metadata?.full_name || user?.email,
      });
      setLastItems(cart.map(i => ({
        name: i.name,
        quantity: i.cartQuantity,
        price: i.selling_price,
        subtotal: i.subtotal
      })));

      toast.success(`Transaksi berhasil! Mencetak nota...`);
      
      handlePrint();

      // Reset form
      setCart([]);
      setDiscount(0);
      setTax(0);
      setCashReceived(0);
      fetchData();

    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Gagal memproses pembayaran");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <PageMeta
        title="POS Kasir | Halal ERP"
        description="Sistem Kasir Penjualan"
      />

      {/* Modern Print Styles to hide everything EXCEPT the receipt during print */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden;
            margin: 0;
            padding: 0;
          }
          #print-receipt, #print-receipt * {
            visibility: visible;
          }
          #print-receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
            display: flex !important;
            justify-content: center !important;
          }
          /* Hide standard browser header/footer */
          @page {
            size: auto;
            margin: 0mm;
          }
        }
      `}} />

      {/* Receipt Component for Printing */}
      <div id="print-receipt" className="hidden print:block">
        {lastSale && (
          <Receipt ref={receiptRef} sale={lastSale} items={lastItems} />
        )}
      </div>

      <PageBreadcrumb pageTitle="POS Kasir" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Product Selection */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-grow">
              <Input
                type="text"
                placeholder="Cari produk berdasarkan kode, nama, barcode..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="h-11 rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value === "all" ? "all" : Number(e.target.value))}
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-grow overflow-y-auto min-h-[500px] border border-gray-200 dark:border-white/[0.05] rounded-xl p-4 bg-white dark:bg-white/[0.03]">
            {loading ? (
              <div className="flex justify-center items-center h-full text-sm font-medium">Memuat produk...</div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex justify-center items-center h-full text-gray-500 text-sm">Produk tidak ditemukan</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {filteredProducts.map((product) => {
                  const isHalalExpired = product.halal_expired && new Date(product.halal_expired) < new Date();
                  
                  return (
                    <div
                      key={product.id}
                      onClick={() => !isHalalExpired && addToCart(product)}
                      className={`relative flex flex-col p-4 rounded-xl border transition-all ${
                        isHalalExpired 
                          ? "bg-gray-100 dark:bg-white/[0.01] border-gray-200 dark:border-white/[0.05] opacity-60 cursor-not-allowed" 
                          : "cursor-pointer border-gray-100 hover:border-brand-300 hover:shadow-sm dark:border-white/[0.05] bg-gray-50/50 dark:bg-white/[0.02]"
                      }`}
                    >
                      {isHalalExpired && (
                        <div className="absolute top-2 right-2 z-10">
                          <span className="bg-error-500 text-white text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase shadow-sm">
                            Kedaluwarsa
                          </span>
                        </div>
                      )}
                      
                      <div className={`font-semibold truncate mb-1 ${isHalalExpired ? "text-gray-400" : "text-gray-800 dark:text-white/90"}`} title={product.name}>
                        {product.name}
                      </div>
                      <div className={`text-xs font-medium mb-3 ${isHalalExpired ? "text-gray-400" : "text-brand-500"}`}>
                        Rp {product.selling_price.toLocaleString()}
                      </div>

                      {isHalalExpired && (
                        <div className="text-[10px] text-error-500 font-bold mb-2 uppercase flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-error-500 animate-pulse"></span>
                          Halal Kedaluwarsa
                        </div>
                      )}

                      <div className="mt-auto flex justify-between items-center gap-2 flex-wrap text-xs text-gray-500">
                        <span className="truncate">{product.code}</span>
                        <span className={`whitespace-nowrap ${(product.totalStock || 0) <= product.min_stock ? "text-error-500 font-bold" : ""}`}>
                          Stok: {product.totalStock}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Cart */}
        <div className="flex flex-col border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] rounded-xl overflow-hidden shadow-sm h-[calc(100vh-120px)] lg:sticky top-20">
          <div className="p-3 border-b border-gray-200 dark:border-white/[0.05]">
            <h2 className="text-base font-semibold text-gray-800 dark:text-white/90">Pesanan Saat Ini</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
            {cart.length === 0 ? (
              <div className="flex justify-center items-center h-full text-gray-500 text-sm italic">Keranjang kosong</div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="flex justify-between items-start pb-3 border-b border-gray-100 dark:border-white/[0.05] last:border-0 p-2">
                  <div className="flex flex-col flex-1 pr-3">
                    <span className="font-medium text-sm text-gray-800 dark:text-white/90 leading-tight mb-1">{item.name}</span>
                    <span className="text-xs text-gray-500">Rp {item.selling_price.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center border border-gray-200 dark:border-white/[0.05] rounded-lg overflow-hidden">
                      <button 
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-8 h-8 flex justify-center items-center hover:bg-gray-100 dark:hover:bg-white/[0.05] text-gray-600 dark:text-white/80"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-sm font-medium">{item.cartQuantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-8 h-8 flex justify-center items-center hover:bg-gray-100 dark:hover:bg-white/[0.05] text-gray-600 dark:text-white/80"
                      >
                        +
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-sm">Rp {item.subtotal.toLocaleString()}</span>
                      <button onClick={() => removeFromCart(item.id)} className="text-error-500 hover:text-error-600">
                        <TrashBinIcon className="size-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="border-t border-gray-200 dark:border-white/[0.05] p-4 bg-gray-50/50 dark:bg-white/[0.02] shrink-0">
            <div className="space-y-2 mb-3">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>Subtotal</span>
                <span>Rp {subtotal.toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
                <span>Diskon</span>
                <input 
                  type="number" 
                  value={discount || ""} 
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  className="w-20 text-right px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-transparent focus:border-brand-500 outline-none"
                  placeholder="0"
                />
              </div>

              <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
                <span>Pajak</span>
                <input 
                  type="number" 
                  value={tax || ""} 
                  onChange={(e) => setTax(Number(e.target.value))}
                  className="w-20 text-right px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-transparent focus:border-brand-500 outline-none"
                  placeholder="0"
                />
              </div>

              <div className="pt-2 border-t border-gray-200 dark:border-white/[0.05] flex justify-between items-end">
                <span className="text-base font-medium text-gray-800 dark:text-white/90">Total Akhir</span>
                <span className="text-lg font-bold text-brand-500">
                  Rp {grandTotal.toLocaleString()}
                </span>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <div className="flex justify-between items-center gap-2 text-sm text-gray-800 dark:text-white/90">
                  <span className="font-medium whitespace-nowrap">Tunai Diterima</span>
                  <input 
                    type="number" 
                    value={cashReceived || ""} 
                    onChange={(e) => setCashReceived(Number(e.target.value))}
                    className="w-full max-w-[120px] text-right px-2 py-1.5 rounded border border-gray-300 focus:border-brand-500 bg-white dark:bg-gray-900 outline-none font-bold"
                    placeholder="0"
                  />
                </div>
                {cashReceived > 0 && (
                  <div className={`flex justify-between items-center text-sm font-medium ${change >= 0 ? "text-success-600" : "text-error-500"}`}>
                    <span>Kembalian</span>
                    <span className="text-base">Rp {change.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>

            <Button 
              className="w-full text-sm font-semibold py-2.5" 
              onClick={handleCheckout}
              disabled={isProcessing || cart.length === 0 || cashReceived < grandTotal}
            >
              {isProcessing ? "Memproses..." : "Bayar Pesanan"}
            </Button>
          </div>
        </div>

      </div>
    </>
  );
}
