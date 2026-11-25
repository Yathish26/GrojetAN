import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Home, SearchX } from "lucide-react";

export default function Error404() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white border border-neutral-200 shadow-sm p-8 text-center">
                <div className="w-14 h-14 mx-auto mb-5 bg-green-50 border border-green-200 flex items-center justify-center">
                    <SearchX size={26} className="text-green-700" />
                </div>

                <p className="text-6xl font-bold text-neutral-900 mb-2">404</p>
                <h1 className="text-lg font-semibold text-neutral-900 mb-2">Page not found</h1>
                <p className="text-sm text-neutral-600 mb-8">
                    The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="flex items-center justify-center gap-2 px-4 py-2 border border-neutral-300 text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
                    >
                        <ArrowLeft size={16} />
                        Go Back
                    </button>
                    <Link
                        to="/"
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white hover:bg-green-700 transition-colors"
                    >
                        <Home size={16} />
                        Go Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
