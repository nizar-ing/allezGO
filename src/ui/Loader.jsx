import { Loader2 } from "lucide-react";

function Loader() {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm">
            <div className="relative flex items-center justify-center">
                {/* Pulse ring */}
                <div className="absolute h-24 w-24 animate-ping rounded-full bg-indigo-500/30"></div>

                {/* Spinner icon */}
                <Loader2
                    className="h-10 w-10 animate-spin text-indigo-600"
                    strokeWidth={2.5}
                    style={{ willChange: 'transform' }}
                />
            </div>
        </div>
    );
}

export default Loader;

