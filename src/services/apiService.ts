// import axios from "axios";

// const API_URL = "http://localhost:3001";

// interface UserData {
//     fullName?: string;
//     email: string;
//     password: string;
// }

// const apiService = {
//     register: async (userData: UserData) => {
//         return axios.post(`${API_URL}/users`, userData); // Saving to db.json
//     },

//     login: async (userData: Omit<UserData, "fullName">) => {
//         const response = await axios.get(`${API_URL}/users`, {
//             params: { email: userData.email, password: userData.password }
//         });

//         if (response.data.length > 0) {
//             return { message: "Login successful", user: response.data[0] };
//         } else {
//             throw new Error("Invalid credentials");
//         }
//     },

//     logout: async () => {
//         return Promise.resolve({ message: "Logged out" });
//     }
// };

// export default apiService;
