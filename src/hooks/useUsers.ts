import { useAuth } from "../context/AuthContext";
import api from "../infrastructure/api";
import { School, UserRole } from "../interfaces/index.interface";
import { IUser} from "../interfaces/user.interface";

export const useUsers = () => {
  const { getIdToken } = useAuth();

  const getHeaders = async () => {
    const token = await getIdToken();
    if (!token) {
      throw new Error('Token de autenticação não encontrado');
    }
    return {
      Authorization: `Bearer ${token}`
    };
  };

  // List users (with filters)
  const getUsers = async (params = {}): Promise<{ users: IUser[]; total: number; page: number; limit: number; totalPages: number }> => {
    const headers = await getHeaders();
    const { data } = await api.get<{ users: IUser[]; total: number; page: number; limit: number; totalPages: number }>(
      "/users",
      { params, headers }
    );
    return data;
  };

  // Get users by role
  const findByRole = async (role: UserRole): Promise<IUser[]> => {
    const headers = await getHeaders();
    const { data } = await api.get<IUser[]>(`/users/role/${role}`, { headers });
    return data;
  };

  // Get users by school
  const findBySchool = async (school: School): Promise<IUser[]> => {
    const headers = await getHeaders();
    const { data } = await api.get<IUser[]>(`/users/school/${school}`, { headers });
    return data;
  };

  // Get user by ID
  const getUserById = async (uid: string): Promise<IUser> => {
    const headers = await getHeaders();
    const { data } = await api.get<IUser>(`/users/${uid}`, { headers });
    return data;
  };

  // Update user
  const updateUser = async (uid: string, data: Partial<IUser>): Promise<IUser> => {
    try {
      console.log('🔄 useUsers: Updating user', uid, 'with data:', data);
      
      const headers = await getHeaders();
      
      // Clean the data
      const cleanData = Object.fromEntries(
        Object.entries(data).filter(([key, value]) => {
          // Remove undefined values and uid
          return value !== undefined && key !== 'uid';
        })
      );
      
      console.log('🔄 Clean update data:', cleanData);
      console.log('🔄 Request headers:', headers);
      
      const response = await api.put<IUser>(`/users/${uid}`, cleanData, { headers });
      
      console.log('✅ useUsers: User updated successfully:', response.data);
      
      return response.data;
    } catch (error: any) {
      console.error('❌ useUsers: Failed to update user:', error);
      
      // Detailed error logging
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
        console.error('Response headers:', error.response.headers);
      } else if (error.request) {
        console.error('Request made but no response:', error.request);
      } else {
        console.error('Error setting up request:', error.message);
      }
      
      throw error;
    }
  };

  // Update user image
  const updateUserImage = async (uid: string, image: any): Promise<IUser> => {
    const headers = await getHeaders();
    const formData = new FormData();
    formData.append("image", image);
    const response = await api.put<IUser>(`/users/${uid}/image`, formData, {
      headers: { ...headers, "Content-Type": "multipart/form-data" }
    });
    return response.data;
  };

  // Delete user
  const deleteUser = async (uid: string): Promise<{ message: string }> => {
    const headers = await getHeaders();
    const { data } = await api.delete<{ message: string }>(`/users/${uid}`, { headers });
    return data;
  };

  return {
    getUsers,
    findByRole,
    findBySchool,
    getUserById,
    updateUser,
    updateUserImage,
    deleteUser,
  };
};