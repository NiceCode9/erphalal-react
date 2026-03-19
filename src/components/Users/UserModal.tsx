import React, { useState, useEffect } from "react";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import { supabase } from "../../lib/supabaseClient";
import { toast } from "sonner";

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  phone: string | null;
  role: string | null;
}

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile | null;
  onSuccess: () => void;
}

export default function UserModal({
  isOpen,
  onClose,
  profile,
  onSuccess,
}: UserModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    full_name: "",
    phone: "",
    role: "admin",
  });

  useEffect(() => {
    if (isOpen && profile) {
      setFormData({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        full_name: profile.full_name || "",
        phone: profile.phone || "",
        role: profile.role || "admin",
      });
    } else if (isOpen && !profile) {
      setFormData({
        first_name: "",
        last_name: "",
        full_name: "",
        phone: "",
        role: "admin",
      });
    }
  }, [isOpen, profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return; // Cannot create new users easily from this modal since auth.users is needed

    setLoading(true);
    try {
        const { error } = await supabase
          .from("profiles")
          .update({
            first_name: formData.first_name,
            last_name: formData.last_name,
            full_name: formData.full_name,
            phone: formData.phone,
            role: formData.role,
            updated_at: new Date().toISOString(),
          })
          .eq("id", profile.id);

        if (error) throw error;
        toast.success("User updated successfully");
      
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[500px]">
      <div className="px-6 py-8">
        <h2 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
          Edit User Profile
        </h2>
        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
          Update the profile metadata and role for this user.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              placeholder="e.g. John Doe"
              value={formData.full_name}
              onChange={(e) =>
                setFormData({ ...formData, full_name: e.target.value })
              }
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) =>
                  setFormData({ ...formData, first_name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name</Label>
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
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Role</Label>
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

          <div className="flex items-center justify-end gap-3 pt-4">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
