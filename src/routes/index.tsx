import { createFileRoute } from "@tanstack/react-router";
import TarifarioFinal from "@/components/TarifarioFinal";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tarifario CDGM" },
      { name: "description", content: "Tarifario para profesionales del diseño - CDGM." },
      { property: "og:title", content: "Tarifario CDGM" },
      { property: "og:description", content: "Tarifario para profesionales del diseño - CDGM." },
    ],
  }),
  component: () => <TarifarioFinal />,
});
