import React, { useState } from "react";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import { createClient } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabaseClient";
import { toast } from "sonner";
import { EyeIcon, EyeCloseIcon } from "../../icons";

// Create a secondary Supabase client that does not persist session
// This allows signing up a new user without logging out the current admin
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const signupClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddUserModal({
  isOpen,
  onClose,
  onSuccess,
}: AddUserModalProps) {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    full_name: "",
    first_name: "",
    last_name: "",
    phone: "",
    role: "admin",
  });

  const resetForm = () => {
    setFormData({
      email: "",
      password: "",
      full_name: "",
      first_name: "",
      last_name: "",
      phone: "",
      role: "admin",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    try {
      // 1. Create user in auth.users
      const { data: authData, error: authError } = await signupClient.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.full_name,
            first_name: formData.first_name,
            last_name: formData.last_name,
            phone: formData.phone,
            role: formData.role,
          },
        },
      });

      if (authError) throw authError;

      // The profile is likely created via a Supabase trigger.
      // We use the main client to update the profile with the extra metadata.
      if (authData.user) {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
             full_name: formData.full_name,
             first_name: formData.first_name,
             last_name: formData.last_name,
             phone: formData.phone,
             role: formData.role,
             updated_at: new Date().toISOString()
          })
          .eq("id", authData.user.id);
          
        if (profileError) {
          console.error("Profile update error: ", profileError);
          // Don't throw the error, the user is successfully added
          toast.warning("User berhasil dibuat, tetapi pembaruan profil gagal. Anda mungkin perlu mengeditnya secara manual.");
        }
      }

      toast.success("Pengguna berhasil dibuat");
      resetForm();
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Terjadi kesalahan saat pembuatan pengguna");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[500px]">
      <div className="px-6 py-8">
        <h2 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
          Tambah Pengguna Baru
        </h2>
        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
          Daftarkan akun pengguna baru dan atur peran sistem mereka.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Alamat Email <span className="text-error-500">*</span></Label>
            <Input
              id="email"
              type="email"
              placeholder="Misal: karyawan@halalerp.com"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2 relative">
            <Label htmlFor="password">Kata Sandi <span className="text-error-500">*</span></Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Minimal 6 karakter"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
              />
              <span
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                {showPassword ? (
                  <EyeCloseIcon className="size-5" />
                ) : (
                  <EyeIcon className="size-5" />
                )}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Peran</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="role"
                  value="admin"
                  checked={formData.role === "admin"}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="size-4 text-brand-500 focus:ring-brand-500"
                />
                <span className="text-sm">Admin</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="role"
                  value="superadmin"
                  checked={formData.role === "superadmin"}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="size-4 text-brand-500 focus:ring-brand-500"
                />
                <span className="text-sm">Super Admin</span>
              </label>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100 dark:border-white/[0.05] mt-4 mb-2">
             <p className="text-xs text-gray-400 mb-2">Info Profil (Opsional)</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="full_name">Nama Lengkap</Label>
            <Input
              id="full_name"
              placeholder="Misal: John Doe"
              value={formData.full_name}
              onChange={(e) =>
                setFormData({ ...formData, full_name: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">Nama Depan</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) =>
                  setFormData({ ...formData, first_name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Nama Belakang</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) =>
                  setFormData({ ...formData, last_name: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Nomor Telepon</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-6">
            <Button variant="outline" type="button" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Membuat..." : "Buat Pengguna"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
