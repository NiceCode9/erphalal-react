import React, { useState, useEffect } from "react";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import TextArea from "../form/input/TextArea";
import { supabase } from "../../lib/supabaseClient";
import { toast } from "sonner";


interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  category?: { id: number; name: string; description: string } | null;
}

export default function CategoryModal({
  isOpen,
  onClose,
  onSuccess,
  category,
}: CategoryModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (category) {
      setName(category.name);
      setDescription(category.description);
    } else {
      setName("");
      setDescription("");
    }
  }, [category, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (category) {
        // Update
        const { error: updateError } = await supabase
          .from("categories")
          .update({ name, description, updated_at: new Date().toISOString() })
          .eq("id", category.id);

        if (updateError) throw updateError;
        toast.success("Kategori berhasil diperbarui");
      } else {
        // Insert
        const { error: insertError } = await supabase
          .from("categories")
          .insert([{ name, description }]);

        if (insertError) throw insertError;
        toast.success("Kategori berhasil dibuat");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Error saving category:", err);
      toast.error(err.message || "Gagal menyimpan kategori");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[500px] m-4">
      <div className="no-scrollbar relative w-full max-w-[500px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
        <div className="px-2 pr-14">
          <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
            {category ? "Edit Kategori" : "Tambah Kategori Baru"}
          </h4>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
            {category
              ? "Perbarui detail kategori di bawah ini."
              : "Buat kategori baru untuk produk POS Anda."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="custom-scrollbar h-auto overflow-y-auto px-2 pb-3">
            <div className="space-y-5">
              <div>
                <Label>
                  Nama Kategori<span className="text-error-500">*</span>
                </Label>
                <Input
                  type="text"
                  placeholder="Misal: Minuman"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label>Deskripsi</Label>
                <TextArea
                  placeholder="Deskripsi singkat kategori..."
                  value={description}
                  onChange={(val) => setDescription(val)}
                  rows={4}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
            <Button size="sm" variant="outline" type="button" onClick={onClose}>
              Batal
            </Button>
            <Button size="sm" type="submit" disabled={loading}>
              {loading ? "Menyimpan..." : category ? "Simpan Perubahan" : "Tambah Kategori"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
