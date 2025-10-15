import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Talawa-Plugin Documentation',
  tagline: 'Complete guides and references for building with Talawa',
  favicon: 'img/icons/favicon_palisadoes.ico',

  // Set the URL for this specific documentation site
  url: 'https://docs-plugin.talawa.io',
  baseUrl: '/',
  deploymentBranch: 'gh-pages',

  organizationName: 'PalisadoesFoundation', // GitHub organization
  projectName: 'talawa-plugin', // GitHub repository name

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  // Use the centralized stylesheet for consistent styling across all Talawa documentation sites
  stylesheets: ['https://docs.talawa.io/assets/css/styles-latest.css'],

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl: ({ docPath }) => {
            return `https://github.com/PalisadoesFoundation/talawa-plugin/edit/develop/docs/docs/${docPath}`;
          },
        },
        blog: {
          showReadingTime: true,
          // Blog edit URL points to the docs directory as blog content might be within it,
          // or this section is a placeholder if no dedicated blog exists.
          editUrl:
            'https://github.com/PalisadoesFoundation/talawa-plugin/tree/develop/docs/docs',
        },
        theme: {
          // Local custom CSS is removed to ensure all styling comes from the centralized stylesheet
          // customCss: require.resolve('./src/css/custom.css'),
        },
      },
    ],
  ],

  themeConfig: {
    docs: {
      sidebar: {
        hideable: false,
      },
    },
    navbar: {
      title: 'Talawa',
      logo: {
        alt: 'Talawa Logo',
        src: 'img/icons/logo.png',
        href: 'https://docs.talawa.io/', // Link to the main documentation site
        className: 'LogoAnimation',
      },
      items: [
        {
          label: 'General',
          position: 'left',
          to: 'https://docs.talawa.io/docs',
          target: '_self', // Stay in the same tab for cross-site navigation within the ecosystem
        },
        {
          label: 'Mobile Guide',
          position: 'left',
          to: 'https://docs-mobile.talawa.io/docs',
          target: '_self',
        },
        {
          to: 'https://docs-admin.talawa.io/docs',
          label: 'Admin Guide',
          position: 'left',
          target: '_self',
        },
        {
          label: 'API Guide',
          position: 'left',
          to: 'https://docs-api.talawa.io/docs',
          target: '_self',
        },
        {
          to: '/docs', // Link to the current site's documentation
          label: 'Plugin Guide',
          position: 'left',
          target: '_self',
        },
        {
          label: 'Demo',
          position: 'left',
          to: 'https://demo.talawa.io/',
        },
        {
          to: 'https://github.com/PalisadoesFoundation',
          position: 'right',
          className: 'header-github-link',
          'aria-label': 'GitHub repository',
        },
        {
          to: 'https://www.youtube.com/@PalisadoesOrganization',
          position: 'right',
          className: 'header-youtube-link',
          'aria-label': 'Palisadoes Youtube channel',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Community',
          items: [
            {
              label: 'Slack',
              to: 'https://github.com/PalisadoesFoundation', // Placeholder, ideally a Slack invite link
              className: 'footer__icon footer__slack',
            },
            {
              label: 'News',
              to: 'https://www.palisadoes.org/news/',
              className: 'footer__icon footer__news',
            },
            {
              label: 'Contact Us',
              to: 'https://www.palisadoes.org/contact/',
              className: 'footer__icon footer__contact',
            },
          ],
        },
        {
          title: 'Social Media',
          items: [
            {
              label: ' Twitter',
              to: 'https://twitter.com/palisadoesorg?lang=en',
              className: 'footer__icon footer__twitter',
            },
            {
              label: ' Facebook',
              to: 'https://www.facebook.com/palisadoesproject/',
              className: 'footer__icon footer__facebook',
            },
            {
              label: ' Instagram',
              to: 'https://www.instagram.com/palisadoes/?hl=en',
              className: 'footer__icon footer__instagram',
            },
          ],
        },
        {
          title: 'Development',
          items: [
            {
              label: ' GitHub',
              to: 'https://github.com/PalisadoesFoundation',
              className: 'footer__icon footer__github',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} The Palisadoes Foundation, LLC. Built with Docusaurus.`,
    },
    colorMode: {
      defaultMode: 'light',
      disableSwitch: false, // Allow users to switch between light/dark mode
      respectPrefersColorScheme: false, // Do not automatically respect system preference
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  },
};

export default config;