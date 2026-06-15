import { createFileRoute } from "@tanstack/react-router";
import { ChatScreen } from "@/components/chat/ChatScreen";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Letícia VIP — Área Privada 🔥" },
      {
        name: "description",
        content:
          "Conteúdo exclusivo só pra quem veio do Insta. Acesso VIP imediato via Pix.",
      },
      { property: "og:title", content: "Letícia VIP — Área Privada 🔥" },
      {
        property: "og:description",
        content:
          "Vídeos exclusivos, bastidores e conteúdos que não vão pro Instagram.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return <ChatScreen />;
}
