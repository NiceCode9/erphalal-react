import { useState, useEffect, useMemo } from "react";
import { supabase } from "../../lib/supabaseClient";
import { toast } from "sonner";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Badge from "../ui/badge/Badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHeader, 
  TableRow 
} from "../ui/table";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Product {
  id: number;
  name: string;
  code: string;
  min_stock: number;
  halal_expired: string | null;
  category_id: number | null;
  categories?: { name: string };
  stock_batches?: { quantity: number }[];
  totalStock?: number;
}

interface Category {
  id: number;
  name: string;
}

export default function StockReportsTable() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [selectedCategory, setSelectedCategory] = useState<number | "all">("all");
  const [stockStatus, setStockStatus] = useState<"all" | "low" | "out">("all");
  const [halalFilter, setHalalFilter] = useState<"all" | "valid" | "expired">("all");

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: catData } = await supabase.from("categories").select("id, name");
      if (catData) setCategories(catData);

      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name), stock_batches(quantity)")
        .eq("status", true);

      if (error) throw error;

      const processed = (data || []).map((p: any) => ({
        ...p,
        totalStock: p.stock_batches?.reduce((sum: number, b: any) => sum + b.quantity, 0) || 0
      }));

      setProducts(processed);
    } catch (err: any) {
      console.error(err);
      toast.error("Gagal memuat data stok");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchSearch = 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.code.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchCat = selectedCategory === "all" || p.category_id === selectedCategory;
      
      const status = (p.totalStock || 0) <= 0 ? "out" : (p.totalStock || 0) <= p.min_stock ? "low" : "ok";
      const matchStatus = stockStatus === "all" || status === stockStatus;

      const isExpired = p.halal_expired && new Date(p.halal_expired) < new Date();
      const matchHalal = 
        halalFilter === "all" || 
        (halalFilter === "valid" && !isExpired) || 
        (halalFilter === "expired" && isExpired);

      return matchSearch && matchCat && matchStatus && matchHalal;
    });
  }, [products, searchTerm, selectedCategory, stockStatus, halalFilter]);

  const exportExcel = () => {
    const data = filteredProducts.map(p => ({
      "Product Name": p.name,
      "Code": p.code,
      "Category": p.categories?.name || "N/A",
      "Min Stock": p.min_stock,
      "Current Stock": p.totalStock,
      "Halal Expired": p.halal_expired || "N/A",
      "Status": (p.totalStock || 0) <= 0 ? "OUT OF STOCK" : (p.totalStock || 0) <= p.min_stock ? "LOW STOCK" : "IN STOCK"
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Stock Report");
    XLSX.writeFile(wb, `Stock_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    
    // Add Header Branding
    doc.setFontSize(22);
    doc.setTextColor(79, 70, 229); // Brand primary color
    doc.setFont("helvetica", "bold");
    doc.text("ERP HALAL", 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.setFont("helvetica", "normal");
    doc.text("Sistem Manajemen POS - Laporan Stok & Inventaris", 14, 27);
    
    // Add Report Meta Info
    doc.setDrawColor(230, 230, 230);
    doc.line(14, 32, 196, 32); // Separator line
    
    doc.setFontSize(11);
    doc.setTextColor(40);
    doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 14, 40);
    doc.text(`Total Baris: ${filteredProducts.length} Produk`, 14, 46);
    
    const tableColumn = ["Produk", "Kode", "Kategori", "Stok", "Status Halal", "Kondisi"];
    const tableRows = filteredProducts.map(p => [
      p.name,
      p.code,
      p.categories?.name || "Tanpa Kategori",
      (p.totalStock || 0).toString(),
      p.halal_expired ? new Date(p.halal_expired).toLocaleDateString('id-ID') : "N/A",
      (p.totalStock || 0) <= 0 ? "HABIS" : (p.totalStock || 0) <= p.min_stock ? "RENDAH" : "AMAN"
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 55,
      theme: 'striped',
      headStyles: { 
        fillColor: [79, 70, 229], 
        fontSize: 10, 
        cellPadding: 4,
        halign: 'left'
      },
      columnStyles: {
        3: { halign: 'center', fontStyle: 'bold' }, // Stock
        4: { halign: 'center' }, // Halal
        5: { halign: 'right' }, // Status
      },
      styles: {
        fontSize: 9,
        cellPadding: 3
      },
      alternateRowStyles: {
        fillColor: [250, 250, 252]
      }
    });

    doc.save(`Laporan_Stok_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="rounded-[2rem] border border-gray-100 bg-white/80 p-8 shadow-xl shadow-gray-200/20 backdrop-blur-xl dark:border-white/[0.05] dark:bg-white/[0.03] dark:shadow-none">
        <div className="flex flex-col gap-8">
          {/* Header with Export Actions */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-100 dark:border-white/[0.05] pb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:text-warning-400 shadow-inner">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-white/90">
                  Parameter Inventaris
                </h3>
                <p className="text-xs text-gray-500 mt-0.5 font-medium uppercase tracking-wider">Monitor stok dan sertifikasi halal</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={exportExcel} 
                disabled={filteredProducts.length === 0}
                className="!rounded-2xl hover:!bg-success-50 hover:!text-success-600 transition-all !px-6 border-gray-200"
              >
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  Excel
                </span>
              </Button>
              <Button 
                variant="outline" 
                onClick={exportPDF} 
                disabled={filteredProducts.length === 0}
                className="!rounded-2xl hover:!bg-error-50 hover:!text-error-600 transition-all !px-6 border-gray-200"
              >
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  PDF
                </span>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-y-8 gap-x-6 items-end">
            <div className="lg:col-span-4">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">Produk</label>
              <div className="relative group">
                <Input 
                  type="text" 
                  placeholder="Nama atau kode produk..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 !h-12 !rounded-2xl !bg-gray-50/50 dark:!bg-gray-900 border-none shadow-sm focus:ring-2 focus:ring-brand-500/20"
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-500 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
              </div>
            </div>
            
            <div className="lg:col-span-3">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">Kategori</label>
              <select 
                className="w-full h-12 rounded-2xl border-none shadow-sm px-4 py-2.5 text-sm bg-gray-50/50 outline-none focus:ring-2 focus:ring-brand-500/20 transition-all dark:bg-gray-900 dark:text-gray-300"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value === "all" ? "all" : Number(e.target.value))}
              >
                <option value="all">Semua Kategori</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            
            <div className="lg:col-span-2">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">Level Stok</label>
              <select 
                className="w-full h-12 rounded-2xl border-none shadow-sm px-4 py-2.5 text-sm bg-gray-50/50 outline-none focus:ring-2 focus:ring-brand-500/20 transition-all dark:bg-gray-900 dark:text-gray-300"
                value={stockStatus}
                onChange={(e) => setStockStatus(e.target.value as any)}
              >
                <option value="all">Semua Level</option>
                <option value="low">Stok Rendah</option>
                <option value="out">Stok Habis</option>
              </select>
            </div>

            <div className="lg:col-span-2">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">Status Sertifikat</label>
              <select 
                className="w-full h-12 rounded-2xl border-none shadow-sm px-4 py-2.5 text-sm bg-gray-50/50 outline-none focus:ring-2 focus:ring-brand-500/20 transition-all dark:bg-gray-900 dark:text-gray-300"
                value={halalFilter}
                onChange={(e) => setHalalFilter(e.target.value as any)}
              >
                <option value="all">Semua Status</option>
                <option value="valid">Masih Berlaku</option>
                <option value="expired">Sudah Expired</option>
              </select>
            </div>
            
            <div className="lg:col-span-1">
              <Button 
                className="w-full h-12 !rounded-2xl active:scale-95 transition-all shadow-lg shadow-brand-500/20 font-bold"
              >
                Terapkan
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="relative rounded-[2.5rem] border border-gray-100 bg-white shadow-sm overflow-hidden dark:border-white/[0.05] dark:bg-white/[0.02]">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50/50 dark:bg-white/[0.01]">
              <TableRow>
                <TableCell isHeader className="!px-6 !py-5 uppercase text-[10px] font-black tracking-widest text-gray-400">Info Produk</TableCell>
                <TableCell isHeader className="!px-6 !py-5 uppercase text-[10px] font-black tracking-widest text-gray-400 border-l border-gray-50 dark:border-white/[0.05]">Kategori</TableCell>
                <TableCell isHeader className="!px-6 !py-5 uppercase text-[10px] font-black tracking-widest text-gray-400 text-right">Stok Fisik</TableCell>
                <TableCell isHeader className="!px-6 !py-5 uppercase text-[10px] font-black tracking-widest text-gray-400">Sertifikat Halal</TableCell>
                <TableCell isHeader className="!px-6 !py-5 uppercase text-[10px] font-black tracking-widest text-gray-400 text-right">Kondisi</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-50 dark:divide-white/[0.03]">
              {loading ? (
                 <TableRow>
                    <TableCell colSpan={5} className="text-center py-24">
                       <div className="flex flex-col items-center gap-2">
                         <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                         <p className="text-sm font-medium text-gray-400">Memuat data stok...</p>
                       </div>
                    </TableCell>
                 </TableRow>
              ) : filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-24">
                    <div className="flex flex-col items-center">
                      <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4 dark:bg-white/[0.02]">
                        <svg className="w-10 h-10 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                      </div>
                      <p className="text-gray-400 font-medium">Data stok tidak ditemukan</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((p) => {
                  const status = (p.totalStock || 0) <= 0 ? "out" : (p.totalStock || 0) <= p.min_stock ? "low" : "ok";
                  const isHalalExpired = p.halal_expired && new Date(p.halal_expired) < new Date();
                  
                  return (
                    <TableRow key={p.id} className="hover:bg-gray-50/50 transition-colors group dark:hover:bg-white/[0.01]">
                      <TableCell className="!px-6 !py-5">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-800 dark:text-white/90 group-hover:text-brand-600 transition-colors">{p.name}</span>
                          <span className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">{p.code}</span>
                        </div>
                      </TableCell>
                      <TableCell className="!px-6 !py-5 border-l border-gray-50 dark:border-white/[0.05]">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-400">
                          {p.categories?.name || "Tanpa Kategori"}
                        </span>
                      </TableCell>
                      <TableCell className="!px-6 !py-5 text-right">
                        <div className="flex flex-col items-end">
                          <span className={`text-lg font-black ${status === 'out' ? 'text-error-500' : status === 'low' ? 'text-warning-500' : 'text-gray-900 dark:text-white'}`}>
                            {p.totalStock}
                          </span>
                          <span className="text-[10px] text-gray-400">Min: {p.min_stock}</span>
                        </div>
                      </TableCell>
                      <TableCell className="!px-6 !py-5">
                         {p.halal_expired ? (
                           <div className="flex items-center gap-3">
                             <div className={`p-2 rounded-xl ${isHalalExpired ? 'bg-error-50 text-error-600' : 'bg-success-50 text-success-600'} dark:bg-white/5`}>
                               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                             </div>
                             <div className="flex flex-col">
                               <span className={`text-[10px] font-bold uppercase tracking-wider ${isHalalExpired ? "text-error-500" : "text-success-600"}`}>
                                 {isHalalExpired ? "Kedaluwarsa" : "Sertifikasi Valid"}
                               </span>
                               <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap">Hingga: {new Date(p.halal_expired).toLocaleDateString('id-ID', { dateStyle: 'medium' })}</span>
                             </div>
                           </div>
                         ) : (
                           <span className="text-[10px] font-bold text-gray-300 italic">Tanpa Data</span>
                         )}
                      </TableCell>
                      <TableCell className="!px-6 !py-5 text-right">
                        <Badge size="sm" color={status === "out" ? "error" : status === "low" ? "warning" : "success"} className="!rounded-lg shadow-sm">
                          {status === "out" ? "STOK HABIS" : status === "low" ? "STOK RENDAH" : "LEVEL AMAN"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
