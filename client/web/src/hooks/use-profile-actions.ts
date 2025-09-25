import { meOperation } from "@/graphql/operations/me";
import { useMutation } from "@apollo/client";

export const useProfileActions = () => {
  const [deleteAccountMutation, { loading: deleteAccountLoading }] =
    useMutation(meOperation.Mutations.deleteAccount);

  const handleAccountDelete = async () => {
    try {
      await deleteAccountMutation();
      // The actual logout should be handled by the component using this hook
      return { success: true };
    } catch (error) {
      console.error("Failed to delete account:", error);
      return { success: false, error };
    }
  };

  return {
    handleAccountDelete,
    deleteAccountLoading,
    // Add other profile-related actions here
  };
};
