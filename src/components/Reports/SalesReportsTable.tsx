import { useState, useEffect, useMemo } from "react";
import { supabase } from "../../lib/supabaseClient";
import { toast } from "sonner";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHeader, 
  TableRow 
} from "../ui/table";
import Receipt from "../Sales/Receipt";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Sale {
  id: string;
  invoice_number: string;
  total: number;
  subtotal: number;
  discount: number;
  tax: number;
  payment_method: string;
  cash_received: number;
  change: number;
  created_at: string;
  profiles?: { full_name: string | null };
}

export default function SalesReportsTable() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Printing state
  const [printingSale, setPrintingSale] = useState<any>(null);
  const [printingItems, setPrintingItems] = useState<any[]>([]);
  
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = today.toISOString().split('T')[0];
  
  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(lastDay);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("sales")
        .select("*, profiles(full_name)")
        .gte("created_at", `${startDate}T00:00:00`)
        .lte("created_at", `${endDate}T23:59:59`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSales(data || []);
    } catch (err: any) {
      console.error(err);
      toast.error("Gagal memuat data penjualan");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = async (sale: Sale) => {
    try {
      setLoading(true);
      // Fetch sale items and join with product name
      const { data: itemsData, error } = await supabase
        .from("sale_items")
        .select("*, products(name)")
        .eq("sale_id", sale.id);

      if (error) throw error;

      const formattedItems = itemsData.map(item => ({
        name: item.products?.name || "Unknown Product",
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal
      }));

      setPrintingSale({
        ...sale,
        user_name: sale.profiles?.full_name
      });
      setPrintingItems(formattedItems);
      
      // Delay slightly for React to render the receipt
      setTimeout(() => {
        window.print();
        setPrintingSale(null);
        setPrintingItems([]);
      }, 500);
    } catch (err: any) {
      console.error(err);
      toast.error("Gagal mengambil detail nota");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  const filteredSales = useMemo(() => {
    return sales.filter(s => 
      s.invoice_number.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [sales, searchTerm]);

  const totalRevenue = filteredSales.reduce((sum, s) => sum + s.total, 0);
  const totalDiscount = filteredSales.reduce((sum, s) => sum + s.discount, 0);
  const totalTax = filteredSales.reduce((sum, s) => sum + s.tax, 0);

  const exportExcel = () => {
    const data = filteredSales.map(s => ({
      "Invoice": s.invoice_number,
      "Tanggal": new Date(s.created_at).toLocaleString(),
      "Kasir": s.profiles?.full_name || "N/A",
      "Subtotal": s.subtotal,
      "Discount": s.discount,
      "Tax": s.tax,
      "Total": s.total,
      "Method": s.payment_method
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sales Report");
    XLSX.writeFile(wb, `Sales_Report_${startDate}_to_${endDate}.xlsx`);
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
    doc.text("Sistem Manajemen POS - Laporan Penjualan", 14, 27);
    
    // Add Report Meta Info
    doc.setDrawColor(230, 230, 230);
    doc.line(14, 32, 196, 32); // Separator line
    
    doc.setFontSize(11);
    doc.setTextColor(40);
    doc.text(`Periode: ${startDate} s/d ${endDate}`, 14, 40);
    doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 14, 46);
    
    const tableColumn = ["Invoice", "Tanggal", "Kasir", "Diskon", "Pajak", "Total"];
    const tableRows = filteredSales.map(s => [
      s.invoice_number,
      new Date(s.created_at).toLocaleDateString('id-ID'),
      s.profiles?.full_name || "Staf Toko",
      `Rp ${s.discount.toLocaleString('id-ID')}`,
      `Rp ${s.tax.toLocaleString('id-ID')}`,
      `Rp ${s.total.toLocaleString('id-ID')}`
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
        3: { halign: 'right' }, // Discount
        4: { halign: 'right' }, // Tax
        5: { halign: 'right', fontStyle: 'bold' }, // Total
      },
      styles: {
        fontSize: 9,
        cellPadding: 3
      },
      alternateRowStyles: {
        fillColor: [250, 250, 252]
      }
    });

    const finalY = (doc as any).lastAutoTable.finalY || 60;
    
    // Summary Section at bottom
    doc.setDrawColor(79, 70, 229);
    doc.setLineWidth(0.5);
    doc.line(14, finalY + 10, 196, finalY + 10);
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(40);
    doc.text("RINGKASAN LAPORAN", 14, finalY + 18);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Total Diskon:`, 14, finalY + 26);
    doc.text(`Rp ${totalDiscount.toLocaleString('id-ID')}`, 196, finalY + 26, { align: 'right' });
    
    doc.text(`Total Pajak:`, 14, finalY + 32);
    doc.text(`Rp ${totalTax.toLocaleString('id-ID')}`, 196, finalY + 32, { align: 'right' });
    
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(79, 70, 229);
    doc.text(`TOTAL PENDAPATAN:`, 14, finalY + 42);
    doc.text(`Rp ${totalRevenue.toLocaleString('id-ID')}`, 196, finalY + 42, { align: 'right' });
    
    doc.save(`Laporan_Penjualan_${startDate}_ke_${endDate}.pdf`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
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
          @page {
            size: auto;
            margin: 0mm;
          }
        }
      `}} />

      {/* Hidden Receipt for Printing */}
      {printingSale && (
        <div id="print-receipt" className="hidden">
           <Receipt sale={printingSale} items={printingItems} />
        </div>
      )}

      <div className="rounded-[2rem] border border-gray-100 bg-white/80 p-8 shadow-xl shadow-gray-200/20 backdrop-blur-xl dark:border-white/[0.05] dark:bg-white/[0.03] dark:shadow-none">
        <div className="flex flex-col gap-8">
          {/* Header with Export Actions */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-100 dark:border-white/[0.05] pb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400 shadow-inner">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-white/90">
                  Parameter Laporan
                </h3>
                <p className="text-xs text-gray-500 mt-0.5 font-medium uppercase tracking-wider">Atur filter untuk menyesuaikan data</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={exportExcel} 
                disabled={filteredSales.length === 0}
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
                disabled={filteredSales.length === 0}
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
            <div className="lg:col-span-5">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">Cari Invoice</label>
              <div className="relative group">
                <Input 
                  type="text" 
                  placeholder="Masukkan nomor invoice (INV-...)"
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
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">Dari Tanggal</label>
              <input 
                type="date" 
                className="w-full h-12 rounded-2xl border-none shadow-sm px-4 py-2.5 text-sm bg-gray-50/50 outline-none focus:ring-2 focus:ring-brand-500/20 transition-all dark:bg-gray-900 dark:text-gray-300"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            
            <div className="lg:col-span-3">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">Sampai Tanggal</label>
              <input 
                type="date" 
                className="w-full h-12 rounded-2xl border-none shadow-sm px-4 py-2.5 text-sm bg-gray-50/50 outline-none focus:ring-2 focus:ring-brand-500/20 transition-all dark:bg-gray-900 dark:text-gray-300"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            
            <div className="lg:col-span-1">
              <Button 
                onClick={fetchSales} 
                disabled={loading} 
                className="w-full h-12 !rounded-2xl active:scale-95 transition-all shadow-lg shadow-brand-500/20 font-bold"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                ) : (
                  "Terapkan"
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="group relative rounded-3xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 dark:border-white/[0.05] dark:bg-white/[0.02]">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <span className="text-[10px] font-bold py-1 px-2 rounded-full bg-success-100 text-success-700 dark:bg-success-500/10 dark:text-success-400 ring-4 ring-success-500/5">Pendapatan</span>
          </div>
          <h3 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">Rp {totalRevenue.toLocaleString()}</h3>
          <p className="text-sm text-gray-500 mt-1 uppercase font-semibold text-[10px] tracking-widest">Total Penjualan Bersih</p>
        </div>

        <div className="group relative rounded-3xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 dark:border-white/[0.05] dark:bg-white/[0.02]">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-2xl bg-error-50 text-error-600 dark:bg-error-500/10 dark:text-error-400 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 012-2h10a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V5z" /></svg>
            </div>
            <span className="text-[10px] font-bold py-1 px-2 rounded-full bg-error-100 text-error-700 dark:bg-error-500/10 dark:text-error-400 ring-4 ring-error-500/5">Diskon</span>
          </div>
          <h3 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">Rp {totalDiscount.toLocaleString()}</h3>
          <p className="text-sm text-gray-500 mt-1 uppercase font-semibold text-[10px] tracking-widest">Potongan Harga Diberikan</p>
        </div>

        <div className="group relative rounded-3xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 dark:border-white/[0.05] dark:bg-white/[0.02]">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-2xl bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-white/60 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
            </div>
            <span className="text-[10px] font-bold py-1 px-2 rounded-full bg-gray-200 text-gray-700 dark:bg-white/10 dark:text-white/60">Pajak & Biaya</span>
          </div>
          <h3 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">Rp {totalTax.toLocaleString()}</h3>
          <p className="text-sm text-gray-500 mt-1 uppercase font-semibold text-[10px] tracking-widest">Total Pajak & Biaya Layanan</p>
        </div>
      </div>

      {/* Table Section */}
      <div className="relative rounded-[2.5rem] border border-gray-100 bg-white shadow-sm overflow-hidden dark:border-white/[0.05] dark:bg-white/[0.02]">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50/50 dark:bg-white/[0.01]">
              <TableRow>
                <TableCell isHeader className="!px-6 !py-5 uppercase text-[10px] font-black tracking-widest text-gray-400">Info Invoice</TableCell>
                <TableCell isHeader className="!px-6 !py-5 uppercase text-[10px] font-black tracking-widest text-gray-400">Waktu Transaksi</TableCell>
                <TableCell isHeader className="!px-6 !py-5 uppercase text-[10px] font-black tracking-widest text-gray-400">Petugas Kasir</TableCell>
                <TableCell isHeader className="!px-6 !py-5 uppercase text-[10px] font-black tracking-widest text-gray-400 text-right">Diskon</TableCell>
                <TableCell isHeader className="!px-6 !py-5 uppercase text-[10px] font-black tracking-widest text-gray-400 text-right">Pajak</TableCell>
                <TableCell isHeader className="!px-6 !py-5 uppercase text-[10px] font-black tracking-widest text-gray-400 text-right">Total Akhir</TableCell>
                <TableCell isHeader className="!px-6 !py-5 uppercase text-[10px] font-black tracking-widest text-gray-400 text-right">Aksi</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-50 dark:divide-white/[0.03]">
              {filteredSales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-24">
                    <div className="flex flex-col items-center">
                      <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4 dark:bg-white/[0.02]">
                        <svg className="w-10 h-10 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      </div>
                      <p className="text-gray-400 font-medium">Tidak ada data penjualan yang ditemukan</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredSales.map((sale) => (
                  <TableRow key={sale.id} className="hover:bg-gray-50/50 transition-colors dark:hover:bg-white/[0.01]">
                    <TableCell className="!px-6 !py-5">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-800 dark:text-white/90">{sale.invoice_number}</span>
                        <span className="text-[10px] text-brand-500 font-bold uppercase tracking-tighter">{sale.payment_method}</span>
                      </div>
                    </TableCell>
                    <TableCell className="!px-6 !py-5">
                      <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                        {new Date(sale.created_at).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
                        <span className="block text-[10px] opacity-60">{new Date(sale.created_at).toLocaleTimeString('id-ID', { timeStyle: 'short' })}</span>
                      </div>
                    </TableCell>
                    <TableCell className="!px-6 !py-5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-[10px] font-bold dark:from-white/10 dark:to-white/5">
                          {sale.profiles?.full_name?.charAt(0) || "S"}
                        </div>
                        <span className="text-sm font-semibold">{sale.profiles?.full_name || "Staf Toko"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="!px-6 !py-5 text-right font-medium text-error-500">
                      {sale.discount > 0 ? `-Rp ${sale.discount.toLocaleString()}` : "—"}
                    </TableCell>
                    <TableCell className="!px-6 !py-5 text-right font-medium text-gray-500">
                      Rp {sale.tax.toLocaleString()}
                    </TableCell>
                    <TableCell className="!px-6 !py-5 text-right">
                      <div className="text-sm font-black text-gray-900 bg-brand-50 inline-block px-3 py-1 rounded-lg ring-1 ring-brand-100 dark:bg-brand-500/10 dark:text-brand-400 dark:ring-brand-500/20">
                        Rp {sale.total.toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell className="!px-6 !py-5 text-right">
                       <button 
                        onClick={() => handlePrint(sale)}
                        disabled={loading}
                        className="p-2 rounded-xl bg-brand-50 text-brand-600 hover:bg-brand-100 dark:bg-brand-500/10 dark:text-brand-400 dark:hover:bg-brand-500/20 transition-all active:scale-90"
                        title="Cetak Ulang Nota"
                       >
                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                       </button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
