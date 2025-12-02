import { create } from 'zustand';
import axios from 'axios';

const useAuthStore = create((set) => ({
    //these are the GLOBAL states
    user: null,
    loading: true,
    activities: [],
    usernames: [],

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

    syncActivities: async () => {
        const { user } = useAuthStore.getState();
        if (!user) return;

        try {
            const response = await axios.post('http://localhost:5000/api/activities/sync', { userId: user.id });
            console.log('Sync result:', response.data);
            // Refresh activities after sync
            await useAuthStore.getState().fetchActivities();
            return response.data;
        } catch (error) {
            console.error('Sync failed:', error);
            throw error;
        }
    },

    fetchActivities: async () => {
        const { user } = useAuthStore.getState();
        if (!user) return;

        try {
            const response = await axios.get(`http://localhost:5000/api/activities?userId=${user.id}`);
            set({ activities: response.data });
            // console.log('Activities:', response.data);
            return response.data;
        } catch (error) {
            console.error('Fetch activities failed:', error);
        }
    },
    //TODO need to rename this to fetch usernames and data
    fetchUsernames: async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/users');
            //TODO rename, usernames is now an object with both users and weekly_totals
            set({ usernames: response.data });
            console.log('Users:', response.data);
            return response.data;
        } catch (error) {
            console.error('Fetch users failed:', error);
        }
    },

    signOut: () => {
        localStorage.removeItem('user');
        set({ user: null });
    },
}));

export default useAuthStore;
