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
        if (user) {
            navigate('/dashboard');
            return;
        }

        const code = searchParams.get('code');

        if (!code) {
            setError('No authorization code found');
            return;
        }

        if (processedCode.current) return;
        processedCode.current = true;

        const authenticate = async () => {
            console.log('Authenticating with Strava...');
            try {
                await loginWithStravaCode(code);
                navigate('/dashboard');
            } catch (err) {
                console.error('Auth Error:', err);
                setError('Failed to authenticate with Strava');
                processedCode.current = false; // Allow retry on error if needed
            }
        };

        authenticate();
    }, [searchParams, loginWithStravaCode, navigate]);

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
