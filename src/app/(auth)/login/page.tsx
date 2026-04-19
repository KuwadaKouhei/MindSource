import { Header } from "@/components/ui/Header";
import { LoginForm } from "@/components/ui/LoginForm";

export default function LoginPage() {
  return (
    <>
      <Header />
      <main style={{ maxWidth: 420, margin: "40px auto", padding: "0 20px" }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>ログイン</h1>
        <p style={{ color: "#9aa3b5", fontSize: 13, marginBottom: 20 }}>
          メールアドレスにマジックリンクを送ります。
        </p>
        <LoginForm />
      </main>
    </>
  );
}
