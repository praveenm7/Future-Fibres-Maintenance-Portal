import { Link } from 'react-router-dom';
import { ClipboardList, FileBarChart, BarChart3, CircleUser, Shield, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function LandingPage() {
    const { toast } = useToast();

    const handleLogout = () => {
        toast({
            title: 'Coming soon',
            description: 'Login system is under development.',
        });
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Top Navigation Bar */}
            <header className="bg-card/80 backdrop-blur-sm border-b border-border px-6 py-3 flex items-center justify-between">
                {/* Left: Logo + Future Fibres */}
                <div className="flex items-center gap-3">
                    <div className="bg-white p-1.5 rounded-lg border border-border">
                        <img
                            src="https://www.futurefibres.com/wp-content/uploads/2025/02/Untitled-design-11.png"
                            alt="Future Fibres"
                            className="h-8 w-auto object-contain"
                        />
                    </div>
                    <span className="text-sm font-semibold text-foreground hidden sm:block">
                        Future Fibres
                    </span>
                </div>

                {/* Right: North Technology Group + User + Admin + Logout */}
                <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground hidden md:block mr-2">
                        North Technology Group
                    </span>

                    <div className="h-5 w-px bg-border mx-1 hidden md:block" />

                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-muted-foreground">
                        <CircleUser className="h-5 w-5" />
                        <span className="hidden sm:block">Guest User</span>
                    </div>

                    <div className="h-5 w-px bg-border mx-1" />

                    <Link
                        to="/admin"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        title="Admin Panel"
                    >
                        <Shield className="h-4 w-4" />
                        <span className="hidden sm:block">Admin</span>
                    </Link>

                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        title="Log out"
                    >
                        <LogOut className="h-4 w-4" />
                        <span className="hidden sm:block">Logout</span>
                    </button>
                </div>
            </header>

            {/* Main Content — vertically centered */}
            <div className="flex-1 flex flex-col items-center justify-center p-6">
                <div className="text-center mb-12">
                    <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-3">Maintenance Portal</h1>
                    <p className="text-base text-muted-foreground max-w-xl mx-auto">
                        Welcome. Select a section to get started.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full">
                    <Link
                        to="/forms"
                        className="group bg-card border border-border rounded-lg p-6 transition-all duration-200 hover:shadow-md hover:border-primary/40"
                    >
                        <div className="flex flex-col items-center text-center space-y-3">
                            <div className="p-3 bg-primary/8 rounded-lg group-hover:bg-primary/12 transition-colors">
                                <ClipboardList className="h-8 w-8 text-primary" />
                            </div>
                            <h2 className="text-xl font-semibold text-foreground">Forms</h2>
                            <p className="text-sm text-muted-foreground">
                                Manage machines, maintenance plans, non-conformities, and spare parts.
                            </p>
                        </div>
                    </Link>

                    <Link
                        to="/reports"
                        className="group bg-card border border-border rounded-lg p-6 transition-all duration-200 hover:shadow-md hover:border-primary/40"
                    >
                        <div className="flex flex-col items-center text-center space-y-3">
                            <div className="p-3 bg-primary/8 rounded-lg group-hover:bg-primary/12 transition-colors">
                                <FileBarChart className="h-8 w-8 text-primary" />
                            </div>
                            <h2 className="text-xl font-semibold text-foreground">Reports</h2>
                            <p className="text-sm text-muted-foreground">
                                View tooling lists, maintenance summaries, and authorization reports.
                            </p>
                        </div>
                    </Link>

                    <Link
                        to="/dashboards"
                        className="group bg-card border border-border rounded-lg p-6 transition-all duration-200 hover:shadow-md hover:border-primary/40"
                    >
                        <div className="flex flex-col items-center text-center space-y-3">
                            <div className="p-3 bg-primary/8 rounded-lg group-hover:bg-primary/12 transition-colors">
                                <BarChart3 className="h-8 w-8 text-primary" />
                            </div>
                            <h2 className="text-xl font-semibold text-foreground">Dashboards</h2>
                            <p className="text-sm text-muted-foreground">
                                Visual analytics for machines, maintenance, NCs, and inventory.
                            </p>
                        </div>
                    </Link>
                </div>
            </div>

            {/* Bottom Watermark */}
            <footer className="py-4 text-center">
                <p className="text-xs text-muted-foreground/50">
                    Powered by North Technology Group Data Team
                </p>
            </footer>
        </div>
    );
}
