import { LoginScreen } from "./LoginScreen";
import { isLocalAdminBypass } from "@/lib/local-admin";
export default function LoginPage() {
  return <LoginScreen localPreview={isLocalAdminBypass()} />;
}
