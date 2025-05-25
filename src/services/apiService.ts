import axios from "axios";

const API_URL = "http://localhost:3001";

interface UserData {
    fullName?: string;
    email: string;
    password: string;
    role?: 'admin' | 'user';
}

const apiService = {
    register: async (userData: UserData) => {
        return axios.post(`${API_URL}/users`, userData); // Saving to db.json
    },

    login: async (userData: Omit<UserData, "fullName">) => {
        // Check for admin credentials first
        if (userData.email === 'admin@mme.com' && userData.password === 'admin123') {
            return { 
                message: "Admin login successful", 
                user: {
                    id: 'admin_1',
                    email: 'admin@mme.com',
                    fullName: 'Administrador MME',
                    role: 'admin',
                    token: 'admin_token_123'
                }
            };
        }

        // Regular user login
        const response = await axios.get(`${API_URL}/users`, {
            params: { email: userData.email, password: userData.password }
        });

        if (response.data.length > 0) {
            const user = {
                ...response.data[0],
                role: response.data[0].role || 'user' // Default to user role
            };
            return { message: "Login successful", user };
        } else {
            throw new Error("Invalid credentials");
        }
    },

    logout: async () => {
        return Promise.resolve({ message: "Logged out" });
    }
};

export default apiService;
