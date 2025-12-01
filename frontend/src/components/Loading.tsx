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
