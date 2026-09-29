import { redirect } from "next/navigation";

// Сразу каталог: идея сервиса рассказана в баннерах над ним, без лишнего шага
export default function HomePage() {
  redirect("/catalog");
}
