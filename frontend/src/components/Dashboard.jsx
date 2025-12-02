import React, { useState, useEffect } from 'react';
import PlayerCard from './PlayerCard';
import useAuthStore from '../store/authStore';



const Dashboard = () => {
    //TODO get username from the db

    const signOut = useAuthStore((state) => state.signOut);
    const user = useAuthStore((state) => state.user);
    const activities = useAuthStore((state) => state.activities);
    const fetchActivities = useAuthStore((state) => state.fetchActivities);
    const fetchUsernames = useAuthStore((state) => state.fetchUsernames);
    //rename this to userdata
    const usernames = useAuthStore((state) => state.usernames);


    useEffect(() => {
        if (user) {
            fetchActivities();
            fetchUsernames();
        }
    }, [user, fetchActivities]);

    console.log(usernames);

    // const users = usernames.map((user) => user.username);
    // const players = [...new Set(raw_players)];

    //TODO temporary to get random mileage
    // const [mileage] = useState(() => {
    //     const numbers = {}
    //     players.forEach((player) => {
    //         numbers[player] = Math.floor(Math.random() * 13) + 2.5;
    //     })
    //     return numbers;
    // })

    // console.log(mileage);


    //getting the sign out function from the "state" object in authStore



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
                    <button
                        onClick={() => useAuthStore.getState().syncActivities()}
                        className="font-press-start text-xs py-1 px-2 bg-transparent text-[#4CAF50] border-2 border-[#4CAF50] cursor-pointer hover:bg-[#4CAF50] hover:text-white transition-colors"
                    >
                        SYNC ACTIVITIES
                    </button>
                </div>
            </div>

            <div className="text-center text-6xl mb-20 tracking-[8px] drop-shadow-[4px_4px_0_#333] md:text-4xl md:tracking-[4px]">
                BANKRUN
            </div>
            {/* <div className="text-center text-6xl mb-20 tracking-[8px] drop-shadow-[4px_4px_0_#333] md:text-4xl md:tracking-[4px]">
                {activities.length > 0
                    ? activities.reduce((sum, act) => sum + parseFloat(act.distance), 0).toFixed(1) + ' mi'
                    : '0.0 mi'}
            </div> */}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 p-5">
                {usernames.map((username) => (
                    <PlayerCard
                        key={username.username}
                        name={username.username}
                        //we need the arrow function here to prevent the function from being called on render. Anytime we pass in the function with arguments, it gets called
                        //if the function has no arguments, we can just pass in the function name
                        onBetUnder={() => handleSelection(username.username, 'under_selected')}
                        onBetOver={() => handleSelection(username.username, 'over_selected')}
                        underButtonActive={playerSelections[username.username] === 'under_selected'}
                        overButtonActive={playerSelections[username.username] === 'over_selected'}
                        number={username.mileLine}
                    />
                ))}
            </div>
        </div>
    );
};

export default Dashboard;
