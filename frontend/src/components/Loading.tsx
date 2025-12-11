interface LoadingProps {
    message?: string;
}

export default function Loading({ message = 'Loading predictions...' }: LoadingProps) {
    return (
        <div className="flex flex-col items-center justify-center py-12">
            <div className="relative w-20 h-20">
                <div className="absolute inset-0 rounded-full border-4 border-[#0b6623]/20"></div>
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#0b6623] animate-spin"></div>
                <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-[#2ecc71] animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
            </div>
            <p className="mt-6 text-muted-green animate-pulse">{message}</p>
        </div>
    );
}

export function PlayerCardSkeleton() {
    return (
        <div className="glass-card p-5 animate-pulse">
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-[#e9f9ec]"></div>
                    <div>
                        <div className="h-4 w-24 bg-[#e9f9ec] rounded mb-1"></div>
                        <div className="h-3 w-16 bg-[#e9f9ec] rounded"></div>
                    </div>
                </div>
                <div className="w-8 h-6 bg-[#e9f9ec] rounded"></div>
            </div>
            <div className="flex items-center gap-4 mb-4">
                <div className="h-3 w-20 bg-[#e9f9ec] rounded"></div>
            </div>
            <div className="mb-4">
                <div className="h-2 w-full bg-[#e9f9ec] rounded"></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-12 bg-[#e9f9ec] rounded-lg"></div>
                ))}
            </div>
        </div>
    );
}
