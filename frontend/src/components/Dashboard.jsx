import React, { useState } from 'react';
import PlayerCard from './PlayerCard';
import useAuthStore from '../store/authStore';


const Dashboard = () => {
    const players = [
        'Harry', 'Sarah', 'Marcus', 'Luna', 'Diego', 'Zara'
    ];

    //TODO temporary to get random mileage
    const [mileage] = useState(() => {
        const numbers = {}
        players.forEach((player) => {
            numbers[player] = Math.floor(Math.random() * 13) + 2.5;
        })
        return numbers;
    })


    //getting the sign out function from the "state" object in authStore
    const signOut = useAuthStore((state) => state.signOut);

    const user = useAuthStore((state) => state.user);

    const [playerSelections, setPlayerSelection] = useState({});

    const handleSelection = (player, buttonType) => {
        console.log(player, buttonType);
        setPlayerSelection((prevSelections) => (
            console.log(prevSelections),
            {
                ...prevSelections,
                [player]: prevSelections[player] === buttonType ? null : buttonType,
            }
        ));
    };

    return (
        <div className="max-w-[1200px] mx-auto">
            <div className="flex justify-end p-4">
                <div className="flex flex-col items-center gap-2">
                    <div className="text-white text-sm">Welcome {user?.username}</div>
                    <button
                        onClick={() => signOut()}
                        className="font-press-start text-sm py-2 px-4 bg-transparent text-white border-2 border-white cursor-pointer hover:bg-white hover:text-black transition-colors"
                    >
                        LOGOUT
                    </button>
                </div>
            </div>

            <div className="text-center text-6xl mb-20 tracking-[8px] drop-shadow-[4px_4px_0_#333] md:text-4xl md:tracking-[4px]">
                BANKRUN
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 p-5">
                {players.map((player) => (
                    <PlayerCard
                        key={player}
                        name={player}
                        onBetUnder={() => handleSelection(player, 'under_selected')}
                        onBetOver={() => handleSelection(player, 'over_selected')}
                        underButtonActive={playerSelections[player] === 'under_selected'}
                        overButtonActive={playerSelections[player] === 'over_selected'}
                        number={mileage[player]}
                    />
                ))}
            </div>
        </div>
    );
};

export default Dashboard;
