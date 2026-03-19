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
  TableRow,
} from "../ui/table";
import * as XLSX from "xlsx";
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

interface Supplier {
  id: number;
  name: string;
}

export default function PurchaseReportsTable() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState<number | "all">(
    "all",
  );

  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const lastDay = today.toISOString().split("T")[0];

  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(lastDay);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: sData } = await supabase
        .from("suppliers")
        .select("id, name")
        .order("name");
      if (sData) setSuppliers(sData);

      const { data, error } = await supabase
        .from("purchases")
        .select("*, suppliers(name)")
        .gte("purchase_date", startDate)
        .lte("purchase_date", endDate)
        .order("purchase_date", { ascending: false });

      if (error) throw error;
      setPurchases(data || []);
    } catch (err: any) {
      console.error(err);
      toast.error("Gagal memuat data laporan pembelian");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredPurchases = useMemo(() => {
    return purchases.filter((p) => {
      const matchSearch =
        p.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.suppliers?.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchSupplier =
        selectedSupplier === "all" || p.supplier_id === selectedSupplier;

      return matchSearch && matchSupplier;
    });
  }, [purchases, searchTerm, selectedSupplier]);

  const totalSpending = filteredPurchases.reduce((sum, p) => sum + p.total, 0);
  const totalTransactions = filteredPurchases.length;

  const exportExcel = () => {
    const data = filteredPurchases.map((p) => ({
      ID: `PUR-${p.id}`,
      Tanggal: p.purchase_date,
      Supplier: p.suppliers?.name || "N/A",
      "Total Belanja": p.total,
      Catatan: p.notes || "-",
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Purchase Report");
    XLSX.writeFile(wb, `Laporan_Pembelian_${startDate}_to_${endDate}.xlsx`);
  };

  const exportPDF = () => {
    const doc = new jsPDF();

    // Header Branding
    doc.setFontSize(22);
    doc.setTextColor(79, 70, 229);
    doc.setFont("helvetica", "bold");
    doc.text("ERP HALAL", 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.setFont("helvetica", "normal");
    doc.text("Sistem Manajemen POS - Laporan Pembelian Stock", 14, 27);

    doc.setDrawColor(230, 230, 230);
    doc.line(14, 32, 196, 32);

    doc.setFontSize(11);
    doc.setTextColor(40);
    doc.text(`Periode: ${startDate} s/d ${endDate}`, 14, 40);
    doc.text(`Dicetak pada: ${new Date().toLocaleString("id-ID")}`, 14, 46);

    const tableColumn = ["ID", "Tanggal", "Supplier", "Catatan", "Total"];
    const tableRows = filteredPurchases.map((p) => [
      `PUR-${p.id}`,
      new Date(p.purchase_date).toLocaleDateString("id-ID"),
      p.suppliers?.name || "N/A",
      p.notes || "-",
      `Rp ${p.total.toLocaleString("id-ID")}`,
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 55,
      theme: "striped",
      headStyles: { fillColor: [79, 70, 229], fontSize: 10 },
      columnStyles: {
        4: { halign: "right", fontStyle: "bold" },
      },
      styles: { fontSize: 9 },
    });

    const finalY = (doc as any).lastAutoTable.finalY || 60;

    doc.setDrawColor(79, 70, 229);
    doc.setLineWidth(0.5);
    doc.line(14, finalY + 10, 196, finalY + 10);

    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(79, 70, 229);
    doc.text(`TOTAL PENGELUARAN:`, 14, finalY + 20);
    doc.text(`Rp ${totalSpending.toLocaleString("id-ID")}`, 196, finalY + 20, {
      align: "right",
    });

    doc.save(`Laporan_Pembelian_${startDate}_ke_${endDate}.pdf`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Filter Card */}
      <div className="rounded-[2rem] border border-gray-100 bg-white/80 p-8 shadow-xl shadow-gray-200/20 backdrop-blur-xl dark:border-white/[0.05] dark:bg-white/[0.03] dark:shadow-none">
        <div className="flex flex-col gap-8">
          {/* Header with Export Actions */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-100 dark:border-white/[0.05] pb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400 shadow-inner">
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
                    d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
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
                disabled={filteredPurchases.length === 0}
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
                disabled={filteredPurchases.length === 0}
                className="!rounded-2xl hover:!bg-error-50 hover:!text-error-600 transition-all !px-6 border-gray-200"
              >
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  PDF
                </span>
              </Button>
            </div>
          </div>

          {/* Filter Inputs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-y-8 gap-x-6 items-end">
            <div className="lg:col-span-4">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">
                Pencarian
              </label>
              <Input
                type="text"
                placeholder="Supplier atau catatan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="!rounded-2xl !bg-gray-50/50 dark:!bg-gray-900 border-none shadow-sm focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div className="lg:col-span-3">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">
                Supplier
              </label>
              <select
                className="w-full h-12 rounded-2xl border-none shadow-sm px-4 py-2.5 text-sm bg-gray-50/50 outline-none focus:ring-2 focus:ring-brand-500/20 transition-all dark:bg-gray-900 dark:text-gray-300"
                value={selectedSupplier}
                onChange={(e) =>
                  setSelectedSupplier(
                    e.target.value === "all" ? "all" : Number(e.target.value),
                  )
                }
              >
                <option value="all">Semua Supplier</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-2">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">
                Dari
              </label>
              <input
                type="date"
                className="w-full h-12 rounded-2xl border-none shadow-sm px-4 py-2.5 text-sm bg-gray-50/50 outline-none focus:ring-2 focus:ring-brand-500/20 transition-all dark:bg-gray-900 dark:text-gray-300"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="lg:col-span-2">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">
                Sampai
              </label>
              <input
                type="date"
                className="w-full h-12 rounded-2xl border-none shadow-sm px-4 py-2.5 text-sm bg-gray-50/50 outline-none focus:ring-2 focus:ring-brand-500/20 transition-all dark:bg-gray-900 dark:text-gray-300"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div className="lg:col-span-1">
              <Button
                onClick={fetchData}
                disabled={loading}
                className="w-full h-12 !rounded-2xl active:scale-95 transition-all shadow-lg shadow-brand-500/20 font-bold"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  "Apply"
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="group rounded-3xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-xl transition-all dark:border-white/[0.05] dark:bg-white/[0.02]">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 group-hover:scale-110 transition-transform">
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
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
            </div>
            <span className="text-[10px] font-bold py-1 px-2 rounded-full bg-success-100 text-success-700">
              Total Purchase
            </span>
          </div>
          <h3 className="text-3xl font-black text-gray-900 dark:text-white">
            Rp {totalSpending.toLocaleString()}
          </h3>
          <p className="text-sm text-gray-500 mt-1 uppercase font-semibold text-[10px] tracking-widest">
            Total Pengeluaran Stok
          </p>
        </div>

        <div className="group rounded-3xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-xl transition-all dark:border-white/[0.05] dark:bg-white/[0.02]">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-2xl bg-orange-50 text-orange-600 dark:bg-orange-500/10 group-hover:scale-110 transition-transform">
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
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
            </div>
            <span className="text-[10px] font-bold py-1 px-2 rounded-full bg-orange-100 text-orange-700">
              Transactions
            </span>
          </div>
          <h3 className="text-3xl font-black text-gray-900 dark:text-white">
            {totalTransactions}
          </h3>
          <p className="text-sm text-gray-500 mt-1 uppercase font-semibold text-[10px] tracking-widest">
            Jumlah Transaksi Pembelian
          </p>
        </div>
      </div>

      {/* Table Section */}
      <div className="relative rounded-[2.5rem] border border-gray-100 bg-white shadow-sm overflow-hidden dark:border-white/[0.05] dark:bg-white/[0.02]">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50/50 dark:bg-white/[0.01]">
              <TableRow>
                <TableCell
                  isHeader
                  className="!px-6 !py-5 uppercase text-[10px] font-black tracking-widest text-gray-400"
                >
                  ID Transaksi
                </TableCell>
                <TableCell
                  isHeader
                  className="!px-6 !py-5 uppercase text-[10px] font-black tracking-widest text-gray-400"
                >
                  Tanggal
                </TableCell>
                <TableCell
                  isHeader
                  className="!px-6 !py-5 uppercase text-[10px] font-black tracking-widest text-gray-400"
                >
                  Supplier
                </TableCell>
                <TableCell
                  isHeader
                  className="!px-6 !py-5 uppercase text-[10px] font-black tracking-widest text-gray-400 border-l border-gray-50"
                >
                  Catatan
                </TableCell>
                <TableCell
                  isHeader
                  className="!px-6 !py-5 uppercase text-[10px] font-black tracking-widest text-gray-400 text-right"
                >
                  Total Belanja
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-50 dark:divide-white/[0.03]">
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-24">
                    <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  </TableCell>
                </TableRow>
              ) : filteredPurchases.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-24 text-gray-400"
                  >
                    Tidak ada data pembelian untuk periode ini
                  </TableCell>
                </TableRow>
              ) : (
                filteredPurchases.map((p) => (
                  <TableRow
                    key={p.id}
                    className="hover:bg-gray-50/50 transition-colors dark:hover:bg-white/[0.01]"
                  >
                    <TableCell className="!px-6 !py-5 font-bold text-gray-800 dark:text-white/90">
                      PUR-{p.id}
                    </TableCell>
                    <TableCell className="!px-6 !py-5 text-sm text-gray-600 dark:text-gray-400 font-medium">
                      {new Date(p.purchase_date).toLocaleDateString("id-ID", {
                        dateStyle: "medium",
                      })}
                    </TableCell>
                    <TableCell className="!px-6 !py-5 font-semibold text-brand-600">
                      {p.suppliers?.name}
                    </TableCell>
                    <TableCell className="!px-6 !py-5 text-gray-500 border-l border-gray-50 dark:border-white/[0.05]">
                      {p.notes || "-"}
                    </TableCell>
                    <TableCell className="!px-6 !py-5 text-right font-black text-gray-900 bg-gray-50/50 dark:bg-white/[0.02] dark:text-white">
                      Rp {p.total.toLocaleString()}
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
