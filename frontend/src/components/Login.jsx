import React, { useState } from 'react';

const Login = () => {
    const [loading, setLoading] = useState(false);

    const handleLogin = () => {
        const clientId = import.meta.env.VITE_STRAVA_CLIENT_ID;
        const redirectUri = `${window.location.origin}/auth/callback`;
        const scope = 'read,activity:read_all';
        console.log(clientId, redirectUri, scope);

        window.location.href = `https://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=${scope}`;
    };

    return (
        <div className="max-w-[1200px] mx-auto min-h-[80vh] flex flex-col items-center justify-center">
            <div className="text-center text-6xl mb-12 tracking-[8px] drop-shadow-[4px_4px_0_#333] md:text-4xl md:tracking-[4px]">
                BANKRUN
            </div>

            <div className="bg-black border-4 border-white p-12 w-full max-w-md shadow-[8px_8px_0_#333] flex flex-col items-center">
                <h2 className="text-3xl mb-10 text-center tracking-widest">LOGIN</h2>


                <div className="text-center mb-8 text-gray-400 text-sm leading-relaxed">
                    CONNECT YOUR STRAVA ACCOUNT TO START PLAYING
                </div>

                <button
                    onClick={handleLogin}
                    disabled={loading}
                    className="font-press-start text-lg py-4 px-8 bg-[#FC4C02] text-white border-3 border-white cursor-pointer transition-all duration-100 tracking-widest hover:bg-white hover:text-[#FC4C02] hover:scale-105 active:translate-x-0.5 active:translate-y-0.5 hover:border-[#FC4C02] disabled:opacity-50 disabled:cursor-not-allowed w-full"
                >
                    {loading ? 'CONNECTING...' : 'CONNECT WITH STRAVA'}
                </button>
            </div>
        </div>
    );
};

export default Login;
