import { useState } from "react";

/* ===================================================================
   Bandeira — Palpite na Mesa (portado do Caju).
   Agora recebe a sigla flagcdn (`cc`, ex.: "br", "gb-eng") direto das
   nossas RPCs, em vez de mapear código FIFA. Renderiza a imagem real
   da bandeira (flagcdn) e cai pro emoji quando a imagem falha ou não
   há sigla.
   =================================================================== */

type Props = {
  cc?: string | null;        // sigla flagcdn (ex.: "br", "gb-eng")
  emoji?: string | null;     // fallback emoji vindo da RPC (ex.: "🇧🇷")
  alt?: string;
  tamanho?: number;
  className?: string;
};

export function Bandeira({
  cc,
  emoji,
  alt = "",
  tamanho = 24,
  className = "",
}: Props) {
  const [erro, setErro] = useState(false);

  if (!cc || erro) {
    return (
      <span
        aria-hidden
        className={`inline-flex items-center justify-center ${className}`}
        style={{ fontSize: Math.round(tamanho * 0.92), lineHeight: 1 }}
        title={alt}
      >
        {emoji || "🏳️"}
      </span>
    );
  }

  return (
    <img
      src={`https://flagcdn.com/h40/${cc}.png`}
      srcSet={`https://flagcdn.com/h80/${cc}.png 2x`}
      alt={alt}
      onError={() => setErro(true)}
      className={`inline-block object-cover ${className}`}
      style={{
        height: tamanho,
        width: "auto",
        borderRadius: 3,
        boxShadow: "0 0 0 0.5px rgba(0,0,0,0.15)",
      }}
    />
  );
}
