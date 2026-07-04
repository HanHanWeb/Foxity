"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const GEETEST_CAPTCHA_ID = "163a936b1a0e329ff04d7e33eb74a019";

interface GeetestValidate {
  lot_number: string;
  captcha_output: string;
  pass_token: string;
  gen_time: string;
}

export default function AuthPage() {
  const router = useRouter();

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regCode, setRegCode] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regError, setRegError] = useState("");
  const [regLoading, setRegLoading] = useState(false);

  // 验证码倒计时
  const [codeCountdown, setCodeCountdown] = useState(0);
  const [codeSending, setCodeSending] = useState(false);
  const [codeMessage, setCodeMessage] = useState("");

  // GEETEST 实例
  const geetestRef = useRef<any>(null);
  const geetestReadyRef = useRef(false);
  const [geetestReady, setGeetestReady] = useState(false);

  // 用于在 GEETEST 成功后继续发送验证码的邮箱值（闭包里读取最新邮箱）
  const emailRef = useRef("");
  useEffect(() => {
    emailRef.current = regEmail;
  }, [regEmail]);

  const saveUserAndRedirect = () => {
    router.push("/");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    if (!loginEmail.trim() || !loginPassword) {
      setLoginError("请输入邮箱和密码");
      return;
    }

    setLoginLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginEmail.trim(),
          password: loginPassword,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setLoginError(data.error || "登录失败");
        return;
      }

      saveUserAndRedirect();
    } catch (err) {
      setLoginError("网络错误，请稍后重试");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError("");

    if (regName.trim().length < 1) {
      setRegError("请输入姓名");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail.trim())) {
      setRegError("请输入有效的邮箱地址");
      return;
    }
    if (!regCode.trim()) {
      setRegError("请输入邮箱验证码");
      return;
    }
    if (regPassword.length < 6) {
      setRegError("密码至少需要 6 个字符");
      return;
    }

    setRegLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: regName.trim(),
          email: regEmail.trim(),
          code: regCode.trim(),
          password: regPassword,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setRegError(data.error || "注册失败");
        return;
      }

      saveUserAndRedirect();
    } catch (err) {
      setRegError("网络错误，请稍后重试");
    } finally {
      setRegLoading(false);
    }
  };

  // 初始化 GEETEST
  const initGeetest = useCallback(() => {
    const w = window as any;
    if (!w.initGeetest4 || geetestRef.current) return;
    w.initGeetest4(
      {
        captchaId: GEETEST_CAPTCHA_ID,
        product: "bind",
      },
      (captcha: any) => {
        captcha.onReady(() => {
          geetestReadyRef.current = true;
          setGeetestReady(true);
        });
        captcha.onSuccess(() => {
          const validate: GeetestValidate = captcha.getValidate();
          if (validate) {
            sendCodeToEmail(emailRef.current.trim(), validate);
          }
        });
        captcha.onError(() => {
          setCodeMessage("人机验证失败，请重试");
          setCodeSending(false);
        });
        geetestRef.current = captcha;
      }
    );
  }, []);

  const handleGeetestScriptLoad = () => {
    initGeetest();
  };

  // 发送验证码到指定邮箱
  const sendCodeToEmail = async (email: string, validate: GeetestValidate) => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setCodeMessage("请输入有效的邮箱地址");
      setCodeSending(false);
      return;
    }
    setCodeMessage("");
    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          lot_number: validate.lot_number,
          captcha_output: validate.captcha_output,
          pass_token: validate.pass_token,
          gen_time: validate.gen_time,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCodeMessage(data.error || "验证码发送失败");
        return;
      }
      setCodeMessage("验证码已发送，请查收邮件");
      // 开始 60s 倒计时
      setCodeCountdown(60);
    } catch (err) {
      setCodeMessage("网络错误，请稍后重试");
    } finally {
      setCodeSending(false);
    }
  };

  // 点击"获取验证码"按钮：触发 GEETEST
  const handleGetCode = () => {
    setCodeMessage("");
    const email = regEmail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setCodeMessage("请先输入有效的邮箱地址");
      return;
    }
    if (codeCountdown > 0 || codeSending) return;

    if (!geetestReadyRef.current || !geetestRef.current) {
      setCodeMessage("人机验证加载中，请稍候");
      return;
    }

    setCodeSending(true);
    // 重置上一次验证状态，重新弹出
    try {
      geetestRef.current.reset && geetestRef.current.reset();
    } catch (_) {}
    geetestRef.current.showCaptcha();
  };

  // 倒计时
  useEffect(() => {
    if (codeCountdown <= 0) return;
    const t = setInterval(() => {
      setCodeCountdown((c) => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [codeCountdown]);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#fbf7ef] px-6 py-16">
      <Script
        src="https://static.geetest.com/v4/gt4.js"
        onLoad={handleGeetestScriptLoad}
      />
      <div className="pointer-events-none absolute -left-24 top-10 h-80 w-80 rounded-full bg-fox-orange/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-10 right-12 h-72 w-72 rounded-full bg-fox-mint/10 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="mb-8 flex flex-col items-center gap-3">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white shadow-[0_20px_50px_rgba(242,170,114,0.18)]"
          >
            <img src="/fox.png" alt="Foxity" width={56} height={56} className="rounded-2xl" />
          </motion.div>
          <h1 className="text-2xl font-semibold tracking-[-0.02em] text-[#425a7a]">
            Foxity
          </h1>
          <p className="text-sm font-medium text-[#9ca7b7]">
            和小狐狸一起，看见更真实的自己
          </p>
        </div>

        <Card className="border-[#dfe4ec] bg-white/80 shadow-lg shadow-[#425a7a]/5 backdrop-blur">
          <CardHeader>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-[#f3eee4]">
                <TabsTrigger
                  value="login"
                  className="data-[state=active]:bg-white data-[state=active]:text-[#425a7a] data-[state=active]:shadow-sm"
                >
                  登录
                </TabsTrigger>
                <TabsTrigger
                  value="register"
                  className="data-[state=active]:bg-white data-[state=active]:text-[#425a7a] data-[state=active]:shadow-sm"
                >
                  注册
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="mt-6">
                <CardContent className="px-0">
                  <form onSubmit={handleLogin} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="login-email" className="text-[#425a7a]">
                        邮箱
                      </Label>
                      <Input
                        id="login-email"
                        type="email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="输入邮箱"
                        autoComplete="email"
                        className="border-[#d9dee8] bg-white/70 text-[#425a7a] placeholder:text-[#b6c0cf] focus-visible:border-[#425a7a] focus-visible:ring-[#425a7a]/15"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="login-password" className="text-[#425a7a]">
                        密码
                      </Label>
                      <Input
                        id="login-password"
                        type="password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="输入密码"
                        autoComplete="current-password"
                        className="border-[#d9dee8] bg-white/70 text-[#425a7a] placeholder:text-[#b6c0cf] focus-visible:border-[#425a7a] focus-visible:ring-[#425a7a]/15"
                      />
                    </div>

                    {loginError && (
                      <p className="text-sm font-medium text-red-500">
                        {loginError}
                      </p>
                    )}

                    <Button
                      type="submit"
                      disabled={loginLoading}
                      className="mt-2 h-11 rounded-full bg-[#f2aa72] text-base font-semibold text-white shadow-md shadow-[#f2aa72]/20 hover:bg-[#ea9862] disabled:opacity-60"
                    >
                      {loginLoading ? "登录中..." : "登录"}
                    </Button>
                  </form>
                </CardContent>
              </TabsContent>

              <TabsContent value="register" className="mt-6">
                <CardContent className="px-0">
                  <form onSubmit={handleRegister} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="reg-name" className="text-[#425a7a]">
                        姓名
                      </Label>
                      <Input
                        id="reg-name"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="你的姓名"
                        autoComplete="name"
                        className="border-[#d9dee8] bg-white/70 text-[#425a7a] placeholder:text-[#b6c0cf] focus-visible:border-[#425a7a] focus-visible:ring-[#425a7a]/15"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="reg-email" className="text-[#425a7a]">
                        邮箱
                      </Label>
                      <Input
                        id="reg-email"
                        type="email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="用于接收验证码"
                        autoComplete="email"
                        className="border-[#d9dee8] bg-white/70 text-[#425a7a] placeholder:text-[#b6c0cf] focus-visible:border-[#425a7a] focus-visible:ring-[#425a7a]/15"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="reg-code" className="text-[#425a7a]">
                        邮箱验证码
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id="reg-code"
                          value={regCode}
                          onChange={(e) => setRegCode(e.target.value)}
                          placeholder="输入 6 位验证码"
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          className="border-[#d9dee8] bg-white/70 text-[#425a7a] placeholder:text-[#b6c0cf] focus-visible:border-[#425a7a] focus-visible:ring-[#425a7a]/15"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleGetCode}
                          disabled={
                            codeCountdown > 0 ||
                            codeSending ||
                            !geetestReady
                          }
                          className="h-9 shrink-0 rounded-full border-[#d9dee8] bg-white/70 px-3 text-xs font-medium text-[#425a7a] hover:bg-[#f3eee4] hover:text-[#425a7a] disabled:opacity-50"
                        >
                          {codeCountdown > 0
                            ? `${codeCountdown}s`
                            : codeSending
                            ? "发送中..."
                            : "获取验证码"}
                        </Button>
                      </div>
                      {codeMessage && (
                        <p
                          className={`text-xs font-medium ${
                            codeMessage.includes("已发送")
                              ? "text-emerald-600"
                              : "text-red-500"
                          }`}
                        >
                          {codeMessage}
                        </p>
                      )}
                      {!geetestReady && (
                        <p className="text-xs text-[#b6c0cf]">
                          人机验证加载中...
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="reg-password" className="text-[#425a7a]">
                        密码
                      </Label>
                      <Input
                        id="reg-password"
                        type="password"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="至少 6 个字符"
                        autoComplete="new-password"
                        className="border-[#d9dee8] bg-white/70 text-[#425a7a] placeholder:text-[#b6c0cf] focus-visible:border-[#425a7a] focus-visible:ring-[#425a7a]/15"
                      />
                    </div>

                    {regError && (
                      <p className="text-sm font-medium text-red-500">
                        {regError}
                      </p>
                    )}

                    <Button
                      type="submit"
                      disabled={regLoading}
                      className="mt-2 h-11 rounded-full bg-[#f2aa72] text-base font-semibold text-white shadow-md shadow-[#f2aa72]/20 hover:bg-[#ea9862] disabled:opacity-60"
                    >
                      {regLoading ? "注册中..." : "注册"}
                    </Button>
                  </form>
                </CardContent>
              </TabsContent>
            </Tabs>
          </CardHeader>
        </Card>

        <p className="mt-6 text-center text-xs font-medium text-[#b6c0cf]">
          登录即代表你同意与 Foxity 的小狐狸开始一段真诚的对话
        </p>
      </motion.div>
    </main>
  );
}
