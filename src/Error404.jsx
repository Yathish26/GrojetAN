import React from "react";
import { Link } from "react-router-dom";


export default function Error404() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-green-700 to-green-900 flex flex-col items-center p-4 font-sans text-gray-100">
            <main className="flex flex-col items-center justify-center flex-grow w-full max-w-4xl px-4">
                <div className="relative w-full max-w-sm md:max-w-md lg:max-w-lg mx-auto md:w-1/2 flex justify-center items-center">
                    <img
                        src="https://media-public.canva.com/-WRIo/MAFmO--WRIo/1/s.png"
                        draggable="false"
                        alt="Groceries in a phone"
                        className="w-25 max-md:w-40 h-auto rounded-3xl transform -rotate-3 hover:rotate-0 transition-transform duration-300 ease-in-out"
                        style={{ filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.3))' }}
                    />
                </div>
                <div className="flex flex-col items-center text-center w-full">
                    <h1 className="text-8xl font-bold text-white mb-4 drop-shadow-xl animate-fade-in-down">404</h1>
                    <h2 className="text-2xl md:text-3xl font-semibold text-yellow-400 mb-2 animate-fade-in-up">Oops! Page Not Found</h2>
                    <p className="text-lg md:text-xl text-gray-200 mb-8 max-w-md animate-fade-in-up">
                        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
                    </p>
                    <Link
                        to="/"
                        className="px-8 py-3 bg-green-600 text-white rounded-full font-bold shadow-md transition-colors duration-200 hover:bg-green-50 hover:text-green-800 animate-bounce-once"
                    >
                        Go Home
                    </Link>
                </div>
            </main>
        </div>
    );
}