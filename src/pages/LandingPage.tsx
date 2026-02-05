import { Link } from 'react-router-dom';
import { ClipboardList, FileBarChart } from 'lucide-react';

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold tracking-tight text-primary mb-4">Maintenance Database</h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    Welcome. Please select a section to proceed.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
                <Link
                    to="/forms"
                    className="group relative overflow-hidden bg-card hover:bg-accent/50 border-2 border-primary/10 hover:border-primary/50 rounded-xl p-8 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                >
                    <div className="flex flex-col items-center text-center space-y-4">
                        <div className="p-4 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors">
                            <ClipboardList className="h-12 w-12 text-primary" />
                        </div>
                        <h2 className="text-2xl font-bold text-foreground">Forms</h2>
                        <p className="text-muted-foreground">
                            Manage machines, maintenance plans, non-conformities, and spare parts.
                        </p>
                    </div>
                </Link>

                <Link
                    to="/reports"
                    className="group relative overflow-hidden bg-card hover:bg-accent/50 border-2 border-info/10 hover:border-info/50 rounded-xl p-8 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                >
                    <div className="flex flex-col items-center text-center space-y-4">
                        <div className="p-4 bg-info/10 rounded-full group-hover:bg-info/20 transition-colors">
                            <FileBarChart className="h-12 w-12 text-info" />
                        </div>
                        <h2 className="text-2xl font-bold text-foreground">Reports</h2>
                        <p className="text-muted-foreground">
                            View tooling lists, maintenance summaries, and authorization reports.
                        </p>
                    </div>
                </Link>
            </div>
        </div>
    );
}
