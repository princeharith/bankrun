import { create } from 'zustand';
import axios from 'axios';

const useAuthStore = create((set) => ({
    user: null,
    loading: true,

    initialize: () => {
        // Check for stored user in localStorage
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            set({ user: JSON.parse(storedUser), loading: false });
        } else {
            set({ user: null, loading: false });
        }
    },

    loginWithStravaCode: async (code) => {
        set({ loading: true });
        console.log('Logging in with Strava code:', code);
        try {
            const response = await axios.post('http://localhost:5000/auth/strava', { code });
            const user = response.data.user;

            localStorage.setItem('user', JSON.stringify(user));
            set({ user, loading: false });
            return user;
        } catch (error) {
            set({ loading: false });
            throw error;
        }
    },

    signOut: () => {
        localStorage.removeItem('user');
        set({ user: null });
    },
}));

export default useAuthStore;
