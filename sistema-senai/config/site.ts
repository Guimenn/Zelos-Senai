export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "Sistema de Chamados SENAI",
  description: "Gerencie chamados, equipes e notificações de forma eficiente no SENAI.",
  navItems: [
    {
      label: "Início",
      href: "/",
    },
    {
      label: "Chamados",
      href: "/chamados",
    },
    {
      label: "Equipe",
      href: "/equipe",
    },
    {
      label: "Relatórios",
      href: "/relatorios",
    },
    {
      label: "Configurações",
      href: "/configuracoes",
    },
  ],
  navMenuItems: [
    {
      label: "Perfil",
      href: "/configuracoes/perfil",
    },
    {
      label: "Painel",
      href: "/dashboard",
    },
    {
      label: "Chamados",
      href: "/chamados",
    },
    {
      label: "Equipe",
      href: "/equipe",
    },
    {
      label: "Notificações",
      href: "/notificacoes",
    },
    {
      label: "Configurações",
      href: "/configuracoes",
    },
    {
      label: "Ajuda",
      href: "/ajuda",
    },
    {
      label: "Sair",
      href: "/logout",
    },
  ],
  links: {
    github: "https://github.com/seu-usuario/seu-repo",
    twitter: "https://twitter.com/seu_usuario",
    docs: "https://seusite.com/docs",
    discord: "https://discord.gg/seulink",
    sponsor: "https://patreon.com/seuusuario",
  },
};
