import React from 'react';






const PlayerCard = ({ name, onBetUnder, onBetOver, underButtonActive, overButtonActive, number }) => {


    return (
        <div className="bg-black border-4 border-white p-8 text-center shadow-[8px_8px_0_#333] transition-all duration-200 hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[12px_12px_0_#333]">
            <div className="text-3xl mb-8 tracking-widest">{name}</div>
            <div className="flex gap-4 justify-center">
                <button
                    onClick={onBetUnder}
                    className={`font-press-start text-lg py-4 px-8 border-3 cursor-pointer transition-all duration-100 tracking-widest min-w-[80px] hover:scale-105 active:translate-x-0.5 active:translate-y-0.5 ${underButtonActive
                        ? 'bg-[#4CAF50] text-white border-[#4CAF50]'
                        : 'bg-white text-black border-white hover:bg-black hover:text-[#4CAF50] hover:border-[#4CAF50]'
                        }`}
                >
                    u{number}
                </button>
                <button
                    onClick={onBetOver}
                    className={`font-press-start text-lg py-4 px-8 border-3 cursor-pointer transition-all duration-100 tracking-widest min-w-[80px] hover:scale-105 active:translate-x-0.5 active:translate-y-0.5 ${overButtonActive
                        ? 'bg-[#f44336] text-white border-[#f44336]'
                        : 'bg-white text-black border-white hover:bg-black hover:text-[#f44336] hover:border-[#f44336]'
                        }`}
                >
                    o{number}
                </button>
            </div>
        </div>
    );
};

export default PlayerCard;
