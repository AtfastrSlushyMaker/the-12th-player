import { Github, Heart } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="glass-card mx-4 my-4 mt-12">
            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
                    <div className="text-center md:text-left">
                        <p className="text-muted-green text-sm">
                            © 2025 The 12th Player. Powered by Machine Learning.
                        </p>
                        <p className="text-[#4f6b4f]/70 text-xs mt-1">
                            KNN • Random Forest • KMeans • LightGBM
                        </p>
                    </div>

                    <div className="flex items-center space-x-6">
                        <a
                            href="https://github.com/AtfastrSlushyMaker/the-12th-player"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 text-muted-green hover:stat-green transition-colors"
                        >
                            <Github className="w-5 h-5" />
                            <span className="text-sm">App</span>
                        </a>
                        <a
                            href="https://github.com/AtfastrSlushyMaker/pl-standings-prediction-project"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 text-muted-green hover:stat-green transition-colors"
                        >
                            <Github className="w-5 h-5" />
                            <span className="text-sm">ML Models</span>
                        </a>
                        <div className="flex items-center space-x-2 text-muted-green">
                            <span className="text-sm">Made with</span>
                            <Heart className="w-4 h-4 stat-green fill-current animate-pulse" />
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
