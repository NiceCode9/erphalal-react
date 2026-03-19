import { useState, useEffect } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import UserTable from "../../components/Users/UserTable";
import UserModal from "../../components/Users/UserModal";
import AddUserModal from "../../components/Users/AddUserModal";
import Button from "../../components/ui/button/Button";
import { PlusIcon } from "../../icons";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabaseClient";

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  phone: string | null;
  role: string | null;
}

export default function Users() {
  const { user } = useAuth();
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (user?.id) {
      supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          setCurrentUserRole(data?.role || null);
        });
    }
  }, [user]);

  const handleEdit = (profile: any) => {
    setSelectedProfile(profile);
    setIsEditModalOpen(true);
  };

  const handleEditModalSuccess = () => {
    setIsEditModalOpen(false);
    setSelectedProfile(null);
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleAddModalSuccess = () => {
    setIsAddModalOpen(false);
    setRefreshTrigger((prev) => prev + 1);
  };

  const isSuperadmin = currentUserRole === "superadmin";

  return (
    <>
      <PageMeta
        title="User Management | Halal ERP"
        description="Manage users and roles"
      />
      <PageBreadcrumb pageTitle="User Profiles" />

      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
              Users & Roles
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Manage system users, contact info, and role permissions.
            </p>
          </div>
          <div>
            {isSuperadmin ? (
              <Button size="sm" className="flex items-center gap-2" onClick={() => setIsAddModalOpen(true)}>
                <PlusIcon />
                Add User
              </Button>
            ) : (
              <p className="text-sm text-gray-500 italic mt-2">
                Only superadmin can add new users.
              </p>
            )}
          </div>
        </div>

        <UserTable onEdit={handleEdit} refreshTrigger={refreshTrigger} />
      </div>

      <UserModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedProfile(null);
        }}
        profile={selectedProfile}
        onSuccess={handleEditModalSuccess}
      />

      {isSuperadmin && (
        <AddUserModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={handleAddModalSuccess}
        />
      )}
    </>
  );
}
