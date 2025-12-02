import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const AuthCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const loginWithStravaCode = useAuthStore((state) => state.loginWithStravaCode);
    const user = useAuthStore((state) => state.user);
    const [error, setError] = useState('');

    const processedCode = useRef(false);

    useEffect(() => {
        // If we already have a user, redirect immediately
        if (user) {
            navigate('/dashboard');
            return;
        }

        const code = searchParams.get('code');
        if (!code) {
            setError('No authorization code found');
            return;
        }

        // Prevent double-firing in React Strict Mode
        if (processedCode.current) {
            console.log('Code already processed or processing');
            return;
        }
        processedCode.current = true;

        const authenticate = async () => {
            console.log('Authenticating with Strava code:', code);
            try {
                await loginWithStravaCode(code);
                navigate('/dashboard');
            } catch (err) {
                console.error('Auth Error:', err);
                setError('Failed to authenticate with Strava');
                // Do NOT reset processedCode.current = false here.
                // If the code is invalid, retrying won't help.
                // If it was a network error, the user should reload the page.
            }
        };

        authenticate();
    }, [searchParams, loginWithStravaCode, navigate, user]);

    if (error) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center font-press-start">
                <div className="text-red-500">{error}</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center font-press-start">
            AUTHENTICATING...
        </div>
    );
};

export default AuthCallback;
