import { AlertCircle } from 'lucide-react';

interface ErrorMessageProps {
    message: string;
    retry?: () => void;
}

export default function ErrorMessage({ message, retry }: ErrorMessageProps) {
    return (
        <div className="glass-card p-6 border-l-4 border-red-500">
            <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                    <AlertCircle className="w-6 h-6 text-red-500" />
                </div>
                <div className="flex-1">
                    <h3 className="text-lg font-semibold text-[#0d1b0d]">Something went wrong</h3>
                    <p className="text-muted-green mt-1">{message}</p>
                    {retry && (
                        <button
                            onClick={retry}
                            className="mt-4 btn-secondary text-sm"
                        >
                            Try Again
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
