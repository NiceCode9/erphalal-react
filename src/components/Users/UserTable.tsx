import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import { supabase } from "../../lib/supabaseClient";
import ConfirmationModal from "../ui/modal/ConfirmationModal";
import { toast } from "sonner";
import { PencilIcon, TrashBinIcon } from "../../icons";
import Button from "../ui/button/Button";
import Badge from "../ui/badge/Badge";

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: string | null;
  updated_at: string | null;
}

interface UserTableProps {
  onEdit: (profile: Profile) => void;
  refreshTrigger: number;
}

export default function UserTable({ onEdit, refreshTrigger }: UserTableProps) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [itemsPerPage] = useState(10);
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchProfiles();
  }, [refreshTrigger, currentPage, searchTerm]);

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("profiles")
        .select("id, first_name, last_name, full_name, role, phone, avatar_url, updated_at");

      if (searchTerm) {
        query = query.or(`full_name.ilike.%${searchTerm}%,first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) {
        if (error.code === '42501') {
           throw new Error("Permission Denied (RLS). Please ensure you have added the SELECT policy in Supabase for the 'profiles' table.");
        }
        throw error;
      }
      setProfiles(data || []);
      setTotalCount(data?.length || 0);
    } catch (error: any) {
      console.error(error);
      toast.error(`Failed to load users: ${error.message || error.details || JSON.stringify(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setProfileToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!profileToDelete) return;

    try {
      // Note: deleting a profile does not delete auth.users automatically
      // But it removes their application access
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", profileToDelete);

      if (error) throw error;
      toast.success("User profile deleted successfully");
      fetchProfiles();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete user profile");
    } finally {
      setIsDeleteModalOpen(false);
      setProfileToDelete(null);
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="p-5 border-b border-gray-100 dark:border-white/[0.05]">
        <div className="max-w-sm">
          <input
            type="text"
            placeholder="Search users..."
            className="h-10 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2 text-sm dark:border-gray-700 dark:text-white/90 focus:border-brand-300 focus:ring-brand-500/10"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              <TableCell isHeader className="px-5 py-3 text-start">Name</TableCell>
              <TableCell isHeader className="px-5 py-3 text-start">Role</TableCell>
              <TableCell isHeader className="px-5 py-3 text-start">Phone</TableCell>
              <TableCell isHeader className="px-5 py-3 text-start">Last Updated</TableCell>
              <TableCell isHeader className="px-5 py-3 text-right">Actions</TableCell>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="px-5 py-10 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent"></div>
                    <span className="text-sm font-medium text-gray-400">Loading users...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : profiles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="px-5 py-10 text-center text-gray-500">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              profiles.map((profile) => (
                <TableRow key={profile.id} className="border-b border-gray-100 last:border-0 dark:border-white/[0.05]">
                  <TableCell className="px-5 py-4 font-medium text-gray-800 dark:text-white/90">
                    {profile.full_name || `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "Unknown"}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-gray-500 dark:text-gray-400">
                    <Badge size="sm" color={profile.role === "superadmin" ? "success" : "info"}>
                       {profile.role || "admin"}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-5 py-4 text-gray-500 dark:text-gray-400">
                    {profile.phone || "-"}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-gray-500 dark:text-gray-400 max-w-xs truncate">
                    {profile.updated_at ? new Date(profile.updated_at).toLocaleDateString() : "-"}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => onEdit(profile)}
                        className="text-brand-500 hover:text-brand-600"
                        title="Edit"
                      >
                        <PencilIcon className="size-5" />
                      </button>
                      <button 
                        onClick={() => handleDeleteClick(profile.id)}
                        className="text-error-500 hover:text-error-600"
                        title="Delete"
                      >
                        <TrashBinIcon className="size-5" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {!loading && totalPages > 1 && (
        <div className="px-5 py-4 border-t border-gray-100 dark:border-white/[0.05] flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalCount)}</span> of <span className="font-medium">{totalCount}</span> results
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Remove User Access"
        message="Are you sure you want to delete this user profile? This action will remove their profile data."
        variant="danger"
      />
    </div>
  );
}
