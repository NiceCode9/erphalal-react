import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import { supabase } from "../../lib/supabaseClient";
import { toast } from "sonner";
import DatePicker from "../../components/form/date-picker";

interface Category {
  id: number;
  name: string;
}

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);

  // Form states
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [barcode, setBarcode] = useState("");
  const [unit, setUnit] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [minStock, setMinStock] = useState("0");
  const [status, setStatus] = useState(true);
  
  // Halal states
  const [halalCert, setHalalCert] = useState("");
  const [halalAgency, setHalalAgency] = useState("");
  const [halalExpired, setHalalExpired] = useState("");

  useEffect(() => {
    fetchCategories();
    if (isEdit) {
      fetchProduct();
    }
  }, [id]);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("id, name")
      .order("name");
    if (error) {
      toast.error("Gagal memuat kategori");
    } else {
      setCategories(data || []);
    }
  };

  const fetchProduct = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      if (data) {
        setName(data.name);
        setCode(data.code || "");
        setBarcode(data.barcode || "");
        setUnit(data.unit || "");
        setCategoryId(data.category_id?.toString() || "");
        setSellingPrice(data.selling_price?.toString() || "");
        setMinStock(data.min_stock?.toString() || "0");
        setStatus(data.status);
        setHalalCert(data.halal_certificate_number || "");
        setHalalAgency(data.certification_agency || "");
        setHalalExpired(data.halal_expired || "");
      }
    } catch (err: any) {
      toast.error("Gagal mengambil detail produk");
      navigate("/products");
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const productData = {
      name,
      code,
      barcode: barcode || null,
      unit: unit || null,
      category_id: categoryId ? parseInt(categoryId) : null,
      selling_price: parseFloat(sellingPrice),
      min_stock: parseInt(minStock),
      status,
      halal_certificate_number: halalCert || null,
      certification_agency: halalAgency || null,
      halal_expired: halalExpired || null,
      updated_at: new Date().toISOString(),
    };

    try {
      if (isEdit) {
        const { error } = await supabase
          .from("products")
          .update(productData)
          .eq("id", id);
        if (error) throw error;
        toast.success("Produk berhasil diperbarui");
      } else {
        const { error } = await supabase
          .from("products")
          .insert([productData]);
        if (error) throw error;
        toast.success("Produk berhasil dibuat");
      }
      navigate("/products");
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
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
        title={`${isEdit ? "Edit" : "Tambah"} Produk | Halal ERP`}
        description="Form manajemen produk"
      />
      <PageBreadcrumb pageTitle={isEdit ? "Edit Produk" : "Tambah Produk"} />

      <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-white/[0.05] dark:bg-white/[0.03] lg:p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information Section */}
          <div>
            <h3 className="mb-4 text-lg font-medium text-gray-800 dark:text-white/90">Informasi Dasar</h3>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Produk <span className="text-error-500">*</span></Label>
                <Input
                  id="name"
                  placeholder="Misal: Susu Segar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="code">Kode Internal <span className="text-error-500">*</span></Label>
                <Input
                  id="code"
                  placeholder="Misal: PRD001"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="barcode">Barcode</Label>
                <Input
                  id="barcode"
                  placeholder="Misal: 899..."
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit">Satuan</Label>
                <Input
                  id="unit"
                  placeholder="Misal: Pcs, Box, Kg"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Kategori</Label>
                <select
                  id="category"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm dark:border-gray-700 dark:text-white/90 focus:border-brand-300 focus:ring-brand-500/10"
                >
                  <option value="">Pilih Kategori</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Harga Jual <span className="text-error-500">*</span></Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="0.00"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="minStock">Stok Minimum</Label>
                <Input
                  id="minStock"
                  type="number"
                  value={minStock}
                  onChange={(e) => setMinStock(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <div className="flex items-center gap-4 py-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={status}
                      onChange={() => setStatus(true)}
                      className="size-4 accent-brand-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Aktif</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={!status}
                      onChange={() => setStatus(false)}
                      className="size-4 accent-brand-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Tidak Aktif</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <hr className="border-gray-100 dark:border-white/[0.05]" />

          {/* Halal Certification Section */}
          <div>
            <h3 className="mb-4 text-lg font-medium text-gray-800 dark:text-white/90">Sertifikasi Halal</h3>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="halalCert">Nomor Sertifikat</Label>
                <Input
                  id="halalCert"
                  placeholder="Misal: ID00..."
                  value={halalCert}
                  onChange={(e) => setHalalCert(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="halalAgency">Lembaga Sertifikasi</Label>
                <Input
                  id="halalAgency"
                  placeholder="Misal: BPJPH / LPPOM MUI"
                  value={halalAgency}
                  onChange={(e) => setHalalAgency(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <DatePicker
                  id="halalExpired"
                  label="Tanggal Kedaluwarsa"
                  defaultDate={halalExpired}
                  onChange={(_selectedDates, dateStr) => setHalalExpired(dateStr)}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100 dark:border-white/[0.05]">
            <Button
              variant="outline"
              type="button"
              onClick={() => navigate("/products")}
            >
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Buat Produk"}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
