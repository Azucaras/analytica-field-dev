// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightLlmsTxt from 'starlight-llms-txt';

// Replace `site` with your deployed URL before the first build.
// starlight-llms-txt needs it to write absolute links into llms.txt.
export default defineConfig({
  site: 'https://field-shift-docs.vercel.app/',
  integrations: [
    starlight({
      title: 'Field Shift Docs',
      defaultLocale: 'root',
      locales: {
        root: { label: 'English', lang: 'en' },
        'pt-br': { label: 'Português', lang: 'pt-BR' },
      },
      description: 'Research, decisions and build steps for a rotation decision support tool on NASA Earth observation.',
      social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/carloshnp/field-shift-docs' }],
      plugins: [
        starlightLlmsTxt({
          projectName: 'Field Shift Docs',
          description:
            'Field Shift entry documentation: the evidence on what satellite observation can carry, the farmer constraints that decide a rotation, the interaction rules, and the build path.',
          promote: ['index*', '00-start-here/*'],
        }),
      ],
      customCss: ['./src/styles/custom.css'],
      sidebar: [
        { label: 'Start here', translations: { 'pt-BR': 'Comece aqui' }, items: [{ autogenerate: { directory: '00-start-here' } }] },
        { label: '1. Research', translations: { 'pt-BR': '1. Pesquisa' }, items: [{ autogenerate: { directory: '10-research' } }] },
        { label: '2. Design', translations: { 'pt-BR': '2. Design' }, items: [{ autogenerate: { directory: '20-design' } }] },
        { label: '3. Build', translations: { 'pt-BR': '3. Construção' }, items: [{ autogenerate: { directory: '30-build' } }] },
        { label: 'Reference', translations: { 'pt-BR': 'Referência' }, items: [{ autogenerate: { directory: '40-reference' } }] },
        { label: 'Dossier', translations: { 'pt-BR': 'Dossiê' }, collapsed: true, items: [
            { label: "The challenge, read closely", translations: { 'pt-BR': "O desafio, lido com atenção" }, items: [{ autogenerate: { directory: '50-dossier/s1-the-challenge', collapsed: true } }] },
            { label: "What the satellite record can and cannot say", translations: { 'pt-BR': "O que o registro de satélites pode e não pode dizer" }, items: [{ autogenerate: { directory: '50-dossier/s2-what-the-satellite-record-carries', collapsed: true } }] },
            { label: "The non-NASA half of the data problem", translations: { 'pt-BR': "A metade não NASA do problema dos dados" }, items: [{ autogenerate: { directory: '50-dossier/s3-the-non-nasa-data-problem', collapsed: true } }] },
            { label: "What US farmers weigh", translations: { 'pt-BR': "O que pesa para os agricultores dos EUA" }, items: [{ autogenerate: { directory: '50-dossier/s4-what-us-farmers-weigh', collapsed: true } }] },
            { label: "What Brazilian farmers weigh", translations: { 'pt-BR': "O que pesa para o produtor brasileiro" }, items: [{ autogenerate: { directory: '50-dossier/s5-what-brazilian-farmers-weigh', collapsed: true } }] },
            { label: "The 2026 conditions a recommendation lands in", translations: { 'pt-BR': "As condições de 2026 em que uma recomendação se aplica" }, items: [{ autogenerate: { directory: '50-dossier/s6-the-2026-conditions', collapsed: true } }] },
            { label: "The companion site and what is already built", translations: { 'pt-BR': "O site complementar e o que já está construído" }, items: [{ autogenerate: { directory: '50-dossier/s7-the-companion-site-and-prior-art', collapsed: true } }] },
            { label: "Making the app usable: game UX, map, agent, voice, evidence and abstention", translations: { 'pt-BR': "Tornar o aplicativo utilizável: UX de jogos, mapa, agente, voz, evidência e abstenção" }, items: [{ autogenerate: { directory: '50-dossier/s8-making-the-app-usable', collapsed: true } }] },
            { label: "Build annex", translations: { 'pt-BR': "Anexo de construção" }, items: [{ autogenerate: { directory: '50-dossier/s9-build-annex', collapsed: true } }] },
          ] },
      ],
    }),
  ],
});