import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { Mail, Lock, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signIn(email, password);
      toast.success(isLogin ? "Welcome back!" : "Demo account created!");
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10">
            <span className="font-mono text-lg font-semibold tracking-[0.2em] text-primary">AA</span>
          </div>
          <h1 className="aa-headline-lg text-foreground">
            AA <span className="aa-gradient-text">Console</span>
          </h1>
          <p className="aa-body mt-2">Content operations, no fluff, no decorative layer.</p>
        </div>

        <div className="aa-card">
          <div className="mb-8 flex gap-2 rounded-xl border border-border/70 bg-secondary/40 p-1">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 rounded-lg py-3 font-medium transition-colors ${
                isLogin ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 rounded-lg py-3 font-medium transition-colors ${
                !isLogin ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Demo Access
            </button>
          </div>

          <form onSubmit={handleAuth} className="space-y-6">
            <div>
              <Label className="mb-2 block text-muted-foreground">Email</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="h-14 pl-12"
                  required
                />
              </div>
            </div>

            <div>
              <Label className="mb-2 block text-muted-foreground">Password</Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-14 pl-12"
                  required
                  minLength={4}
                />
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? "Loading..." : <><ArrowRight className="mr-2 h-4 w-4" />{isLogin ? "Sign In" : "Enter Demo"}</>}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {isLogin ? "Need demo access? " : "Already in? "}
            <button onClick={() => setIsLogin(!isLogin)} className="font-medium text-primary hover:underline">
              {isLogin ? "Switch to demo" : "Switch to sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
