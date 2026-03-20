"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, CheckCircle2 } from "lucide-react";

export default function AuthPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [signUpDone, setSignUpDone] = useState(false);

  async function handleLogin() {
    if (!email || !password) {
      setError("이메일과 비밀번호를 입력해주세요.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("네트워크 오류가 발생했습니다. 다시 시도해주세요.");
      setLoading(false);
    }
  }

  async function handleSignUp() {
    if (!email || !password) {
      setError("이메일과 비밀번호를 입력해주세요.");
      return;
    }
    if (password.length < 6) {
      setError("비밀번호는 최소 6자 이상이어야 합니다.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName || email.split("@")[0] },
        },
      });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      if (data.session) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setSignUpDone(true);
        setLoading(false);
      }
    } catch {
      setError("네트워크 오류가 발생했습니다. 다시 시도해주세요.");
      setLoading(false);
    }
  }

  async function handleSignUpThenLogin() {
    setError(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError("아직 이메일 인증이 완료되지 않았거나 정보가 올바르지 않습니다.");
        setLoading(false);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("네트워크 오류가 발생했습니다.");
      setLoading(false);
    }
  }

  if (signUpDone) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-xl font-bold">
              회원가입 완료!
            </CardTitle>
            <CardDescription className="mt-2">
              이메일 인증이 필요할 수 있습니다.<br />
              인증 후 아래 버튼을 눌러 로그인하세요.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}
            <Button
              className="w-full"
              onClick={handleSignUpThenLogin}
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              로그인하기
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setSignUpDone(false);
                setError(null);
              }}
            >
              돌아가기
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            User Story 관리 툴
          </CardTitle>
          <CardDescription>
            계정으로 로그인하거나 새로 가입하세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">로그인</TabsTrigger>
              <TabsTrigger value="signup">회원가입</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">이메일</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">비밀번호</Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                />
              </div>
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              <Button
                className="w-full"
                onClick={handleLogin}
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                로그인
              </Button>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="signup-name">표시 이름</Label>
                <Input
                  id="signup-name"
                  type="text"
                  placeholder="홍길동"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-email">이메일</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">비밀번호</Label>
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="6자 이상"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSignUp()}
                />
              </div>
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              <Button
                className="w-full"
                onClick={handleSignUp}
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                가입하기
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
