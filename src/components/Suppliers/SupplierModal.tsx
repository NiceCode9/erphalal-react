import React, { useState, useEffect } from "react";
import {Modal} from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import TextArea from "../form/input/TextArea";
import { supabase } from "../../lib/supabaseClient";
import { toast } from "sonner";

interface SupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  supplierId: number | null;
}

export default function SupplierModal({
  isOpen,
  onClose,
  onSuccess,
  supplierId,
}: SupplierModalProps) {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");

  const isEdit = Boolean(supplierId);

  useEffect(() => {
    if (isOpen) {
      if (isEdit) {
        fetchSupplier();
      } else {
        resetForm();
      }
    }
  }, [isOpen, supplierId]);

  const resetForm = () => {
    setName("");
    setContact("");
    setPhone("");
    setEmail("");
    setAddress("");
  };

  const fetchSupplier = async () => {
    setFetching(true);
    try {
      const { data, error } = await supabase
        .from("suppliers")
        .select("*")
        .eq("id", supplierId)
        .single();

      if (error) throw error;
      if (data) {
        setName(data.name);
        setContact(data.contact || "");
        setPhone(data.phone || "");
        setEmail(data.email || "");
        setAddress(data.address || "");
      }
    } catch (error: any) {
      toast.error("Gagal mengambil detail supplier");
      onClose();
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const supplierData = {
      name,
      contact,
      phone,
      email,
      address,
      updated_at: new Date().toISOString(),
    };

    try {
      if (isEdit) {
        const { error } = await supabase
          .from("suppliers")
          .update(supplierData)
          .eq("id", supplierId);
        if (error) throw error;
        toast.success("Supplier berhasil diperbarui");
      } else {
        const { error } = await supabase
          .from("suppliers")
          .insert([supplierData]);
        if (error) throw error;
        toast.success("Supplier berhasil dibuat");
      }
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[600px]">
      <div className="no-scrollbar max-h-screen overflow-y-auto px-6 py-8">
        <h2 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
          {isEdit ? "Edit Supplier" : "Tambah Supplier"}
        </h2>
        <p className="mb-8 text-sm text-gray-500 dark:text-gray-400">
          {isEdit ? "Perbarui informasi supplier" : "Tambah supplier baru ke daftar Anda"}
        </p>

        {fetching ? (
          <div className="flex h-40 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="supplierName">Nama Supplier <span className="text-error-500">*</span></Label>
              <Input
                id="supplierName"
                placeholder="Misal: PT Artha Prima"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contact">Person Kontak</Label>
                <Input
                  id="contact"
                  placeholder="Misal: John Doe"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Nomor Telepon</Label>
                <Input
                  id="phone"
                  placeholder="Misal: 0812..."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Alamat Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Misal: supplier@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Alamat</Label>
              <TextArea
                id="address"
                placeholder="Alamat lengkap..."
                value={address}
                onChange={(val) => setAddress(val)}
                rows={3}
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-white/[0.05]">
              <Button variant="outline" type="button" onClick={onClose}>
                Batal
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Tambah Supplier"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
