import type {
  ContentRecord,
  PageSectionRecord,
  PageSectionType,
  SiteRecord,
  TaxonomyRecord
} from "./types";

export const site: SiteRecord = {
  name: "Endless",
  title: "Endless",
  description: "一个面向长期写作、公开页面与安静发布流程的内容系统。",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  author: "Endless",
  language: "zh-CN"
};

const writingSystemTag: TaxonomyRecord = {
  name: "写作系统",
  nameEn: "Writing Systems",
  slug: "writing-system",
  description: "关于内容生产、编辑器和发布流程。",
  descriptionEn: "Notes on editorial workflows, authoring tools, and publishing flows."
};
const chineseTypographyTag: TaxonomyRecord = {
  name: "中文排版",
  nameEn: "Chinese Typography",
  slug: "chinese-typography",
  description: "关于中文长文、阅读节奏和页面密度。",
  descriptionEn: "Long-form Chinese reading, rhythm, and page density."
};
const aiAssistTag: TaxonomyRecord = {
  name: "AI 辅助",
  nameEn: "AI Assistance",
  slug: "ai-assist",
  description: "人写作，AI 负责排版、翻译和总结，并且结果需要确认后才进入正文。",
  descriptionEn: "Human-written work where AI handles formatting, translation, and summarization only after confirmation."
};
const builderTag: TaxonomyRecord = {
  name: "页面构建",
  nameEn: "Page Builder",
  slug: "page-builder",
  description: "关于模块系统、展示页和结构化画布。",
  descriptionEn: "Modules, presentation pages, and structured section canvases."
};
const themeTag: TaxonomyRecord = {
  name: "主题系统",
  nameEn: "Theme System",
  slug: "theme-system",
  description: "关于 light / dark 主题和视觉语言。",
  descriptionEn: "Light and dark themes, plus the visual language behind them."
};

export const tags: TaxonomyRecord[] = [writingSystemTag, chineseTypographyTag, aiAssistTag, builderTag, themeTag];

const notesCategory: TaxonomyRecord = {
  name: "札记",
  nameEn: "Notes",
  slug: "notes",
  description: "阶段性想法和产品设计记录。",
  descriptionEn: "Working notes and product design logs."
};
const docsCategory: TaxonomyRecord = {
  name: "文档",
  nameEn: "Docs",
  slug: "docs",
  description: "可沉淀、可复用的知识库条目。",
  descriptionEn: "Reusable knowledge-base entries and durable documentation."
};
const showcaseCategory: TaxonomyRecord = {
  name: "展示",
  nameEn: "Showcase",
  slug: "showcase",
  description: "适合首页、展示页与公开说明的内容。",
  descriptionEn: "Content suited for home pages, public presentations, and showcase pages."
};
const systemCategory: TaxonomyRecord = {
  name: "系统",
  nameEn: "Systems",
  slug: "systems",
  description: "长期维护的系统和公开模块。",
  descriptionEn: "Long-lived systems and public-facing modules."
};

export const categories: TaxonomyRecord[] = [notesCategory, docsCategory, showcaseCategory, systemCategory];

const quietDeskCover = {
  key: "quiet-desk",
  url: "/images/quiet-desk.png",
  mimeType: "image/png",
  width: 1600,
  height: 1000,
  alt: "安静写作台上的纸张、屏幕和边注"
};

const tempAvatarImage = "/images/daydreamer-avatar.png";
const tempBackgroundImage = "/images/daydreamer-quzhou.jpeg";

function section(
  id: string,
  type: PageSectionType,
  order: number,
  columnSpan: PageSectionRecord["columnSpan"],
  variant: string,
  props: Record<string, unknown>,
  enabled = true
): PageSectionRecord {
  return { id, type, order, columnSpan, variant, props, enabled };
}

export const contentItems: ContentRecord[] = [
  {
    type: "PAGE",
    status: "PUBLISHED",
    slug: "home",
    title: "SkyWT",
    summary: "SkyWT 的个人站点，放写作、页面、thoughts 和长期实验。",
    bodyMarkdown: "",
    layoutMode: "SECTIONS",
    templateKey: "HOME",
    sections: [
      section("home-hero", "hero_statement", 1, "full", "poster-emoji", {
        eyebrow: "SkyWT",
        eyebrowZh: "SkyWT",
        eyebrowEn: "SkyWT",
        body: "Hi 👋 我是 SkyWT，一名来自中国杭州的 🧑‍💻 软件工程师，也喜欢折腾系统、做有趣的产品和画画。",
        bodyZh: "Hi 👋 我是 SkyWT，一名来自中国杭州的 🧑‍💻 软件工程师，也喜欢折腾系统、做有趣的产品和画画。",
        bodyEn: "Hi 👋 I'm SkyWT, a software engineer from Hangzhou, China, into systems, playful products, and painting.",
        socialBrand: "SkyWT",
        socialLinks: [
          { label: "Email", href: "mailto:me@skywt.eu", external: true },
          { label: "GitHub", href: "https://github.com", external: true },
          { label: "Twitter", href: "https://x.com", external: true },
          { label: "Telegram", href: "https://t.me", external: true }
        ],
        socialIcons: {
          Email: "ri-mail-line",
          GitHub: "ri-github-line",
          Twitter: "ri-twitter-line",
          Telegram: "ri-telegram-2-line"
        },
        heroLines: [
          { text: "Software Engineer", textEn: "Software Engineer", emoji: "🛠️", suffix: ",", suffixEn: "," },
          { text: "Hacker & Painter", textEn: "Hacker & Painter", emoji: "🎨", suffix: ".", suffixEn: "." }
        ]
      }),
      section("home-intro", "intro_richtext", 2, "full", "intro-lines", {
        lines: [
          { text: "Hi 👋 我是 SkyWT，一名来自杭州的 🧑‍💻 软件工程师。", textEn: "Hi 👋 I'm SkyWT, a software engineer from Hangzhou, China." },
          {
            text: "我喜欢黑客式折腾、安静写作，也把画画当作长期表达的一部分。",
            textEn: "I like hacker-style tinkering, calm writing, and keeping painting in the mix.",
            emoji: "🪄"
          },
          { text: "这里会放文章、页面、thoughts 朋友圈和我正在做的各种实验。", textEn: "This is where I keep essays, pages, thoughts, and the experiments I'm building.", emoji: "🌙" }
        ]
      }),
      section("home-bento", "feature_grid", 3, "full", "home-bento-reference", {
        items: [
          {
            layoutKey: "tech",
            cardType: "text_stat_card",
            headline: "📱💻⌨️🛠️\nTech\nEnthusiast",
            headlineEn: "📱💻⌨️🛠️\nTech\nEnthusiast",
            gridAreaLg: "1 / 1 / 3 / 3",
            gridAreaSm: "1 / 1 / 3 / 3"
          },
          {
            layoutKey: "self-hoster",
            cardType: "cta_link_card",
            headline: "Self-\nhoster",
            headlineEn: "Self-\nhoster",
            subheadline: "Check Out\nMy lab",
            subheadlineEn: "Check Out\nMy lab",
            ctaLabel: "进入",
            ctaLabelEn: "Check out",
            href: "/lab",
            gridAreaLg: "1 / 3 / 3 / 5",
            gridAreaSm: "1 / 3 / 3 / 5"
          },
          {
            layoutKey: "infj",
            cardType: "mbti_card",
            meta: "MBTI Personality Type",
            metaEn: "MBTI Personality Type",
            headline: "INFJ",
            headlineEn: "INFJ",
            overlayTitle: "Advocate",
            overlayTitleEn: "Advocate",
            ctaLabel: "Learn More",
            ctaLabelEn: "Learn More",
            externalHref: "https://www.16personalities.com/infj-personality",
            image: "/images/infj-reference.svg",
            gridAreaLg: "1 / 5 / 3 / 9",
            gridAreaSm: "3 / 1 / 5 / 5"
          },
          {
            layoutKey: "hometown",
            cardType: "image_location_card",
            meta: "Hometown",
            metaEn: "Hometown",
            overlayTitle: "Quzhou,\nZhejiang",
            overlayTitleEn: "Quzhou,\nZhejiang",
            image: "/images/daydreamer-quzhou.jpeg",
            gridAreaLg: "3 / 1 / 7 / 3",
            gridAreaSm: "5 / 1 / 9 / 3"
          },
          {
            layoutKey: "undergrad",
            cardType: "image_school_card",
            meta: "Self-made",
            metaEn: "Self-made",
            overlayTitle: "Human\nUniversity",
            overlayTitleEn: "Human\nUniversity",
            image: "/images/daydreamer-hnu.jpg",
            overlayTone: "dark",
            gridAreaLg: "3 / 3 / 5 / 5",
            gridAreaSm: "5 / 3 / 7 / 5"
          },
          {
            layoutKey: "map",
            cardType: "map_card",
            meta: "Current Location",
            metaEn: "Current Location",
            overlayTitle: "Yuhang, Hangzhou",
            overlayTitleEn: "Yuhang, Hangzhou",
            image: "/images/daydreamer-map.png",
            overlayTone: "muted",
            gridAreaLg: "3 / 5 / 5 / 9",
            gridAreaSm: "9 / 1 / 11 / 5"
          },
          {
            layoutKey: "campus",
            cardType: "image_school_card",
            meta: "Campus",
            metaEn: "Campus",
            overlayTitle: "I ❤️\nHFI!!!",
            overlayTitleEn: "I ❤️\nHFI!!!",
            image: "/images/daydreamer-changsha.jpg",
            overlayTone: "dark",
            gridAreaLg: "5 / 7 / 7 / 9",
            gridAreaSm: "7 / 3 / 9 / 5"
          },
          {
            layoutKey: "builder",
            cardType: "creator_card",
            emoji: "👨‍💻",
            headline: "Creating\nSomething Cool.",
            headlineEn: "Creating\nSomething Cool.",
            meta: "持续创造",
            metaEn: "Creator",
            iconStack: [
              "ri-html5-line",
              "ri-css3-line",
              "ri-javascript-line",
              "ri-reactjs-line",
              "ri-nextjs-line",
              "ri-vuejs-line",
              "ri-svelte-line",
              "ri-npmjs-line",
              "ri-nodejs-line",
              "ri-tailwind-css-line",
              "ri-bootstrap-line",
              "ri-webpack-line",
              "ri-chrome-line",
              "ri-firefox-line",
              "ri-flutter-line",
              "ri-apple-line",
              "ri-android-line",
              "ri-google-play-line",
              "ri-windows-line",
              "ri-github-line",
              "ri-openai-line",
              "ri-open-source-line",
              "ri-product-hunt-line",
              "ri-stack-overflow-line"
            ],
            gridAreaLg: "5 / 3 / 9 / 7",
            gridAreaSm: "11 / 1 / 15 / 5"
          },
          {
            layoutKey: "avatar",
            cardType: "avatar_card",
            image: tempAvatarImage,
            headline: "Avatar",
            headlineEn: "Avatar",
            gridAreaLg: "7 / 1 / 9 / 3",
            gridAreaSm: "15 / 1 / 17 / 3"
          },
          {
            layoutKey: "resume",
            cardType: "resume_link_card",
            headline: "📄 My Resume",
            headlineEn: "My Resume",
            ctaLabel: "打开",
            ctaLabelEn: "Open",
            href: "/resume",
            gridAreaLg: "7 / 7 / 8 / 9",
            gridAreaSm: "15 / 3 / 16 / 5"
          },
          {
            layoutKey: "email",
            cardType: "email_link_card",
            headline: "✉ me@skywt.eu",
            headlineEn: "✉ me@skywt.eu",
            ctaLabel: "发送邮件",
            ctaLabelEn: "Send Mail",
            href: "mailto:me@skywt.eu",
            external: "true",
            gridAreaLg: "8 / 7 / 9 / 9",
            gridAreaSm: "16 / 3 / 17 / 5"
          },
        ]
      }),
      section("home-discover", "feature_grid", 4, "full", "discover-grid-reference", {
        title: "发现更多",
        titleEn: "Discover More",
        items: [
          {
            meta: "博客",
            metaEn: "Blog",
            headline: "记录思考，\n期待与你共鸣",
            headlineEn: "Capturing Thoughts,\nHoping to Connect with Yours",
            subheadline: "产品写作、排版与编辑流程相关笔记。",
            subheadlineEn: "Notes on product writing, typography, and editorial workflows.",
            href: "/blog"
          },
          {
            meta: "项目",
            metaEn: "Projects",
            headline: "设计、编码、构建，\n乐在其中",
            headlineEn: "Design. Code. Build,\nJust for Fun!",
            subheadline: "小型系统、视觉实验与长期副项目。",
            subheadlineEn: "Small systems, visual experiments, and long-term side projects.",
            href: "/projects"
          },
          {
            meta: "实验室",
            metaEn: "Lab",
            headline: "持续折腾，\n持续进化",
            headlineEn: "Endless Life,\nRelentless Tinkering!",
            subheadline: "基础设施、构建器内部机制与写作工具实现。",
            subheadlineEn: "Infrastructure, builder internals, and writing-tool mechanics.",
            href: "/lab"
          },
          {
            meta: "朋友",
            metaEn: "Friends",
            headline: "长期友谊",
            headlineEn: "Everlasting Friendship.",
            subheadline: "值得反复拜访的朋友与站点。",
            subheadlineEn: "Friends and pages worth revisiting.",
            href: "/friends"
          }
        ]
      }),
      section("home-footer-columns", "link_cluster", 5, "full", "footer-columns-reference", {
        brandDescription: "长期写作、页面编排与安静发布的一体化站点系统。",
        brandDescriptionZh: "长期写作、页面编排与安静发布的一体化站点系统。",
        brandDescriptionEn: "An integrated site system for long-form writing, page composition, and quiet publishing.",
        socialLinks: [
          { label: "邮箱", labelZh: "邮箱", labelEn: "Email", href: "mailto:me@endlesscms.dev", external: true },
          { label: "GitHub", labelZh: "GitHub", labelEn: "GitHub", href: "https://github.com", external: true },
          { label: "推特", labelZh: "推特", labelEn: "Twitter", href: "https://x.com", external: true },
          { label: "Telegram", labelZh: "Telegram", labelEn: "Telegram", href: "https://t.me", external: true }
        ],
        columns: [
          {
            title: "链接",
            titleZh: "链接",
            titleEn: "Links",
            links: [
              { label: "精选站点", labelZh: "精选站点", labelEn: "StoreWeb", href: "https://example.com", external: true },
              { label: "博客圈", labelZh: "博客圈", labelEn: "BoYouQuan", href: "https://example.com", external: true },
              { label: "长期写作", labelZh: "长期写作", labelEn: "ForeverBlog", href: "https://example.com", external: true },
              { label: "虫洞", labelZh: "虫洞", labelEn: "WormHole", href: "https://example.com", external: true }
            ]
          },
          {
            title: "朋友",
            titleZh: "朋友",
            titleEn: "Friends",
            links: [
              { label: "Anjing", href: "https://example.com", external: true },
              { label: "CaptainSlow", href: "https://example.com", external: true },
              { label: "CrynoCry", href: "https://example.com", external: true },
              { label: "查看全部", labelZh: "查看全部", labelEn: "View All", href: "/friends" }
            ]
          },
          {
            title: "联系",
            titleZh: "联系",
            titleEn: "Contact",
            links: [
              { label: "邮箱", labelZh: "邮箱", labelEn: "Email", href: "mailto:me@endlesscms.dev", external: true },
              { label: "GitHub", labelZh: "GitHub", labelEn: "GitHub", href: "https://github.com", external: true },
              { label: "推特", labelZh: "推特", labelEn: "Twitter", href: "https://x.com", external: true },
              { label: "Telegram", href: "https://t.me", external: true }
            ]
          }
        ],
        legalLine: "内容采用 CC BY-NC 4.0 许可",
        legalLineZh: "内容采用 CC BY-NC 4.0 许可",
        legalLineEn: "Licensed under CC BY-NC 4.0",
        legalLinks: [
          { label: "ICP备案 202019606", labelZh: "ICP备案 202019606", labelEn: "ICP 202019606", href: "https://beian.miit.gov.cn", external: true },
          { label: "公网安备 33080202000472", labelZh: "公网安备 33080202000472", labelEn: "Public Security 33080202000472", href: "http://www.beian.gov.cn", external: true }
        ]
      })
    ],
    tags: [builderTag, writingSystemTag],
    categories: [showcaseCategory],
    seoTitle: "Endless",
    seoDescription: "一个面向长期写作、公开页面与安静发布流程的内容系统。"
  },
  {
    type: "PAGE",
    status: "PUBLISHED",
    slug: "about",
    title: "About",
    titleEn: "About",
    summary: "关于 Endless 的设计目标、内容许可与站点哲学。",
    summaryEn: "The design goals, content license, and site philosophy behind Endless.",
    bodyMarkdown: "",
    bodyMarkdownEn: "",
    layoutMode: "SECTIONS",
    templateKey: "ABOUT",
    sections: [
      section("about-hero", "hero_statement", 1, "full", "editorial-page", {
        eyebrow: "About",
        title: "About",
        titleZh: "一个内容优先的个人网站 CMS。",
        titleEn: "A content-first CMS for personal publishing.",
        body: "它服务博客、知识库、作品集和展示页，也试图让后台与前台共享一种克制、安静、适合长期写作的界面语言。",
        bodyEn: "It serves blogs, knowledge bases, portfolios, and presentation pages while letting Studio and the public site share one calm visual language."
      }),
      section("about-intro", "intro_richtext", 2, "wide", "about-prose", {
        bodyMarkdown: `## ☕ About Endless

Endless 的第一原则不是“管理内容”，而是先照顾内容出现的方式。  
如果一个系统无法让作者愿意长期待在里面写作，那么它再完整，也只是一个后台。

## ⚙️ About This Site

> 这是一套演示性质的原创实现：它尽量贴近你想要的那种页面节奏、导航方式、标题气质和模块分布，但内容模型、组件实现、样式变量与交互细节都独立构建。

公开站的重点是呼吸感、留白、窄正文和安静的层级；Studio 的重点是让作者清楚自己在哪、正在改什么、准备发到哪里。

## 📝 Content License

演示内容默认采用署名-非商业性使用的思路。  
真实站点可以在 Studio 中补充版权说明、转载策略和朋友链接政策。

## 🔏 Privacy

第一版会把认证、媒体、草稿、版本、发布状态和 SEO 收口到同一套内容结构里；AI 只提供建议，不会静默覆盖作者正文。

## 🧑‍🤝‍🧑 Friend Links

朋友页不是“互换链接脚本”的容器，而更像一份带注释的朋友名单。  
如果你想把它变成自己的站，完全可以继续在 section 里扩展分类、备注、头像和链接字段。`
        ,
        bodyMarkdownEn: `## ☕ About Endless

Endless does not begin with "content management."  
It begins with the way content shows up on the page.

If a system cannot make the author want to stay and write inside it for a long time, then no amount of features will save it from feeling like a dashboard.

## ⚙️ About This Site

> This is an original implementation built to recreate a certain editorial rhythm without copying its source.

The public site prioritizes breathing room, narrow reading columns, and quiet hierarchy. Studio prioritizes orientation: where the author is, what is being edited, and where the piece is headed.

## 📝 Content License

Demo content follows a credit-first, non-commercial-friendly spirit.  
Real sites can define their own licensing, repost policies, and friend-link notes inside Studio.

## 🔏 Privacy

The first version keeps authentication, media, drafts, revisions, publishing state, and SEO in one content model. AI remains suggestion-only and never silently overwrites the author.

## 🧑‍🤝‍🧑 Friend Links

The friends page is not a link-exchange script.  
It is closer to an annotated list of people and pages worth revisiting.`
      }),
      section("about-timeline", "timeline", 3, "wide", "milestones", {
        title: "网站里程碑",
        titleZh: "网站里程碑",
        titleEn: "Website milestones",
        items: [
          { meta: "Phase 0", metaZh: "Phase 0", metaEn: "Phase 0", title: "工程基线", titleEn: "Engineering Baseline", body: "Next.js、Prisma、内容渲染管线、主题变量和公开站路由全部落地。", bodyEn: "Next.js, Prisma, the rendering pipeline, theme tokens, and public routes all landed." },
          { meta: "Phase 1", metaZh: "Phase 1", metaEn: "Phase 1", title: "写作前台", titleEn: "Writing Frontend", body: "首页、Blog、阅读页、标签、搜索、RSS、SEO 与 OG 一起成型。", bodyEn: "Home, blog, reading pages, tags, search, RSS, SEO, and OG were completed together." },
          { meta: "当前", metaZh: "当前", metaEn: "Current", title: "视觉重构", titleEn: "Visual Rebuild", body: "把公开站节奏重做成更接近作品站的样子，同时保留可编辑内容结构。", bodyEn: "Reworked the public site rhythm to feel like a portfolio while keeping editable content structures." }
        ]
      }),
      section("about-contact", "contact_strip", 4, "full", "editorial-strip", {
        title: "想把它变成你自己的站？",
        titleEn: "Want to turn it into your own site?",
        body: "用 section 页面做首页和展示页，用 Markdown 写长文，用 suggestion-only AI 做风格不变的扩充和排版。",
        bodyEn: "Build the home page and presentation pages with sections, write long-form work in Markdown, and use suggestion-only AI to expand and format without changing your voice.",
        links: [
          { label: "浏览博客", labelEn: "Browse Blog", href: "/blog" },
          { label: "打开实验室", labelEn: "Open Lab", href: "/lab" }
        ]
      })
    ],
    tags: [builderTag, themeTag],
    categories: [showcaseCategory],
    seoTitle: "About - Endless",
    seoTitleEn: "About - Endless",
    seoDescription: "Endless 的设计目标、内容模型与站点哲学。"
    ,
    seoDescriptionEn: "The design goals, editorial model, and site philosophy behind Endless."
  },
  {
    type: "PAGE",
    status: "PUBLISHED",
    slug: "lab",
    title: "Lab",
    titleEn: "Lab",
    summary: "系统、模块和公开实验的目录页。",
    summaryEn: "A directory for systems, modules, and public experiments.",
    bodyMarkdown: "",
    bodyMarkdownEn: "",
    layoutMode: "SECTIONS",
    templateKey: "LAB",
    sections: [
      section("lab-hero", "hero_statement", 1, "full", "editorial-page", {
        eyebrow: "Lab",
        eyebrowZh: "实验室",
        eyebrowEn: "Lab",
        title: "Lab",
        titleZh: "持续折腾，\n持续进化。",
        titleEn: "Endless life,\nrelentless tinkering.",
        body: "把公开系统、工具条目、内部模块和长期实验收纳进同一份目录，而不是把它们扔进普通作品列表。",
        bodyEn: "A single directory for public systems, tools, internal modules, and long-term experiments."
      }),
      section("lab-status", "feature_grid", 2, "wide", "status-pills", {
        items: [
          { title: "14", description: "Running" },
          { title: "3", description: "Drafting" },
          { title: "7", description: "In progress" }
        ]
      }),
      section("lab-public", "feature_grid", 3, "full", "tool-directory", {
        title: "公开内容",
        titleZh: "公开内容",
        titleEn: "Public",
        items: [
          { title: "博客", titleEn: "Blog", description: "公开文章、专题页与归档索引。", descriptionEn: "Published articles, series pages, and archives.", href: "/blog", meta: "已发布", metaEn: "Published", icon: "newspaper" },
          { title: "文档", titleEn: "Docs", description: "知识库、说明页与带目录的长文模板。", descriptionEn: "Knowledge base pages with table of contents and long-form templates.", href: "/about", meta: "可用", metaEn: "Ready", icon: "book-open-text" },
          { title: "作品", titleEn: "Portfolio", description: "把项目、委托和长期作品放进同一套展示模型。", descriptionEn: "Projects, commissions, and long-term work in one presentation model.", href: "/lab", meta: "模板", metaEn: "Template", icon: "folder-kanban" }
        ]
      }),
      section("lab-tools", "feature_grid", 4, "full", "tool-directory", {
        title: "工具",
        titleZh: "工具",
        titleEn: "Tools",
        items: [
          { title: "搜索", titleEn: "Search", description: "搜索标题、摘要、正文和 section 文案。", descriptionEn: "Search titles, summaries, body content, and section copy.", href: "/search", meta: "已索引", metaEn: "Indexed", icon: "search" },
          { title: "RSS", titleEn: "RSS", description: "面向阅读器和自动化订阅的输出。", descriptionEn: "Feed output for readers and automated subscriptions.", href: "/rss.xml", meta: "在线", metaEn: "Live", icon: "rss" },
          { title: "分享图", titleEn: "OG Images", description: "为每篇内容生成基础分享图。", descriptionEn: "Generate a baseline share image for each item.", href: "/blog", meta: "已启用", metaEn: "Enabled", icon: "image" }
        ]
      }),
      section("lab-devops", "feature_grid", 5, "full", "tool-directory", {
        title: "部署与运维",
        titleZh: "部署与运维",
        titleEn: "DevOps",
        items: [
          { title: "PostgreSQL", titleEn: "PostgreSQL", description: "结构化字段、发布状态、版本和页面 section 全部落库。", descriptionEn: "Structured fields, publish state, revisions, and page sections all live here.", href: "/about", meta: "主数据库", metaEn: "Primary DB", icon: "database" },
          { title: "Prisma", titleEn: "Prisma", description: "模型、seed 与 Studio 持久化读写接口。", descriptionEn: "Models, seed data, and persistence APIs for Studio.", href: "/about", meta: "ORM", metaEn: "ORM", icon: "blocks" },
          { title: "PM2 / 宝塔", titleEn: "PM2 / Baota", description: "生产环境可被宝塔识别并由 PM2 接管。", descriptionEn: "Production runs under PM2 and stays manageable from Baota.", href: "/about", meta: "部署", metaEn: "Deploy", icon: "server" }
        ]
      }),
      section("lab-storage", "feature_grid", 6, "full", "tool-directory", {
        title: "存储",
        titleZh: "存储",
        titleEn: "Storage",
        items: [
          { title: "本地媒体", titleEn: "Local Media", description: "第一版走本地媒体存储，后续可平滑接 S3 / R2。", descriptionEn: "The first version stores media locally, with a clean path to S3 or R2 later.", href: "/studio/media", meta: "当前", metaEn: "Current", icon: "hard-drive" },
          { title: "资源元信息", titleEn: "Asset Metadata", description: "媒体 alt、尺寸、mime 与 provider 一并保存。", descriptionEn: "Alt text, dimensions, mime type, and provider are saved together.", href: "/studio/media", meta: "已跟踪", metaEn: "Tracked", icon: "image-up" },
          { title: "草稿快照", titleEn: "Draft Snapshots", description: "自动保存和版本历史会留下可恢复节点。", descriptionEn: "Autosave and revision history keep restorable checkpoints.", href: "/studio", meta: "已版本化", metaEn: "Versioned", icon: "history" }
        ]
      }),
      section("lab-admin", "feature_grid", 7, "full", "tool-directory", {
        title: "工作台",
        titleZh: "工作台",
        titleEn: "Admin",
        items: [
          { title: "Studio", titleEn: "Studio", description: "三栏写作台，左导航、中编辑、右侧发布与属性。", descriptionEn: "A three-column writing workspace with nav, editor, and publishing controls.", href: "/studio", meta: "工作区", metaEn: "Workspace", icon: "pen-square" },
          { title: "媒体库", titleEn: "Media Library", description: "上传、管理并复用公开页面和文章资源。", descriptionEn: "Upload, manage, and reuse assets across posts and public pages.", href: "/studio/media", meta: "资源库", metaEn: "Library", icon: "library-big" },
          { title: "站点设置", titleEn: "Site Settings", description: "站点标题、描述、URL、作者与语言配置。", descriptionEn: "Site title, description, URL, author, and language settings.", href: "/studio/settings/site", meta: "配置", metaEn: "Config", icon: "settings-2" }
        ]
      })
    ],
    tags: [builderTag, writingSystemTag],
    categories: [showcaseCategory],
    seoTitle: "Lab - Endless",
    seoTitleEn: "Lab - Endless",
    seoDescription: "Endless 的系统、模块、目录页和公开实验。",
    seoDescriptionEn: "Systems, modules, directories, and public experiments inside Endless."
  },
  {
    type: "PAGE",
    status: "PUBLISHED",
    slug: "friends",
    title: "Friends",
    titleEn: "Friends",
    summary: "一份带注释的朋友名单与互相拜访的入口。",
    summaryEn: "An annotated friends page and a place to keep revisiting good people and good pages.",
    bodyMarkdown: "",
    bodyMarkdownEn: "",
    layoutMode: "SECTIONS",
    templateKey: "DEFAULT",
    sections: [
      section("friends-hero", "hero_statement", 1, "full", "editorial-page", {
        eyebrow: "Friends",
        eyebrowZh: "友链",
        eyebrowEn: "Friends",
        title: "Friends",
        titleZh: "长期友谊。",
        titleEn: "Everlasting friendship.",
        body: "比起交换链接，我更喜欢把朋友页做成一份带注释、带气味、带一点点人情味的名单。",
        bodyEn: "More than link exchange, this is an annotated list of people and pages I keep revisiting."
      }),
      section("friends-grid", "feature_grid", 2, "full", "friend-cards", {
        title: "我会反复拜访的朋友与页面",
        titleZh: "我会反复拜访的朋友与页面",
        titleEn: "People and pages I like revisiting",
        items: [
          { title: "Northfolk", titleEn: "Northfolk", description: "「慢一点也没关系，先把句子写顺。」", descriptionEn: "\"It's okay to go slowly. First make the sentence feel right.\"", href: "https://example.com", meta: "写作者 / 周记", metaEn: "Writer / Weekly Notes", avatar: "N" },
          { title: "Rivernote", titleEn: "Rivernote", description: "「记录不是为了证明，而是为了照看。」", descriptionEn: "\"Recording is not for proof. It's a way of tending to things.\"", href: "https://example.com", meta: "知识摘录", metaEn: "Notes / Fragments", avatar: "R" },
          { title: "Plainframe", titleEn: "Plainframe", description: "「做界面时，留白本身就是一种决定。」", descriptionEn: "\"When designing interfaces, whitespace is itself a decision.\"", href: "https://example.com", meta: "产品 / 设计", metaEn: "Product / Design", avatar: "P" },
          { title: "Linseed", titleEn: "Linseed", description: "「愿每个项目都能留下手感。」", descriptionEn: "\"May every project leave behind some trace of the maker's hand.\"", href: "https://example.com", meta: "独立开发", metaEn: "Indie Dev", avatar: "L" },
          { title: "Afterglow", titleEn: "Afterglow", description: "「把想说的话，说成别人愿意停下来看一眼的话。」", descriptionEn: "\"Turn what you want to say into something others will actually pause for.\"", href: "https://example.com", meta: "长文 / 评论", metaEn: "Essays / Commentary", avatar: "A" },
          { title: "Mosslab", titleEn: "Mosslab", description: "「系统要可靠，页面也该有一点温度。」", descriptionEn: "\"Systems should be reliable, but pages deserve a little warmth too.\"", href: "https://example.com", meta: "工程 / 运维", metaEn: "Engineering / Ops", avatar: "M" },
          { title: "Sparrow Ink", titleEn: "Sparrow Ink", description: "「不是所有页面都要很满，安静也能成立。」", descriptionEn: "\"Not every page needs to be full. Quiet can stand on its own.\"", href: "https://example.com", meta: "随笔 / 摄影", metaEn: "Essays / Photography", avatar: "S" },
          { title: "Quiet Hour", titleEn: "Quiet Hour", description: "「写作其实是把模糊的感觉一点点对焦。」", descriptionEn: "\"Writing is the slow act of bringing a blurry feeling into focus.\"", href: "https://example.com", meta: "阅读 / 文字", metaEn: "Reading / Writing", avatar: "Q" },
          { title: "Overcast", titleEn: "Overcast", description: "「愿我们都能保留一点慢慢搭站的耐心。」", descriptionEn: "\"May we all keep a little patience for slowly building our own sites.\"", href: "https://example.com", meta: "前端 / 系统", metaEn: "Frontend / Systems", avatar: "O" }
        ]
      })
    ],
    tags: [builderTag],
    categories: [showcaseCategory],
    seoTitle: "Friends - Endless",
    seoTitleEn: "Friends - Endless",
    seoDescription: "一份带注释的朋友名单与来往入口。",
    seoDescriptionEn: "An annotated list of friends, pages, and places worth revisiting."
  },
  {
    type: "PAGE",
    status: "PUBLISHED",
    slug: "thoughts",
    title: "Thoughts",
    titleEn: "Thoughts",
    summary: "像朋友圈一样，持续更新的公开思想页。",
    summaryEn: "A public thought feed that updates like moments.",
    bodyMarkdown: "",
    bodyMarkdownEn: "",
    layoutMode: "SECTIONS",
    templateKey: "DEFAULT",
    sections: [
      section("thoughts-hero", "hero_statement", 1, "full", "editorial-page", {
        eyebrow: "Thoughts",
        eyebrowZh: "朋友圈",
        eyebrowEn: "Thoughts",
        title: "Thoughts",
        titleZh: "日常想法流。",
        titleEn: "Daily streams of thought.",
        body: "这个页面像朋友圈一样，记录短思考、生活片段和工作瞬间。",
        bodyEn: "This page works like moments: short thoughts, life fragments, and work snapshots."
      }),
      section("thoughts-feed", "feature_grid", 2, "full", "friend-cards", {
        title: "最近动态",
        titleZh: "最近动态",
        titleEn: "Recent moments",
        items: [
          { title: "05/31", titleEn: "05/31", description: "今天把 Studio 的写作布局收紧到手绘稿节奏，效率明显提升。", descriptionEn: "Today we tightened the Studio writing layout to match the sketch rhythm.", meta: "工作记录", metaEn: "Work note", avatar: "记", href: "/studio" },
          { title: "05/30", titleEn: "05/30", description: "把首页展示卡片改成更轻、更安静的节奏，整体终于顺眼。", descriptionEn: "Refined the home showcase cards into a lighter, calmer rhythm.", meta: "设计修复", metaEn: "Design fix", avatar: "改", href: "/blog" },
          { title: "05/29", titleEn: "05/29", description: "开始把 Home / Blog / Lab / Friends / About 统一成一套双语系统。", descriptionEn: "Started unifying Home / Blog / Lab / Friends / About under one bilingual system.", meta: "站点进度", metaEn: "Site progress", avatar: "站", href: "/about" }
        ]
      })
    ],
    tags: [builderTag, writingSystemTag],
    categories: [notesCategory],
    seoTitle: "Thoughts - Endless",
    seoTitleEn: "Thoughts - Endless",
    seoDescription: "一个像朋友圈一样持续更新的公开思想页。",
    seoDescriptionEn: "A moments-style public page for short thoughts and updates."
  },
  {
    type: "POST",
    status: "PUBLISHED",
    slug: "studio-is-not-admin",
    title: "写作台不是后台",
    titleEn: "Studio Is Not Admin",
    summary: "Endless Studio 的第一原则：先让作者进入文本，再让工具安静地出现。",
    summaryEn: "The first rule of Endless Studio: get the author into the text first, then let the tools appear quietly.",
    bodyMarkdown: `# 写作台不是后台

传统 CMS 往往从管理出发：入口是数据表、状态数字和批量操作。Endless 的第一版反过来，从一篇未完成的文章出发。

## 三栏，但不压迫

左侧是内容关系，中间是文本，右侧是发布与元信息。三栏结构不是为了显得专业，而是为了让作者知道自己在哪里、正在写什么、准备发到哪里。

> 好的写作工具应该像一张收拾过的桌面：东西都在手边，但不会替你说话。

右侧面板只放会影响发布的字段：slug、摘要、标签、封面、SEO、可见性和定时发布。其他内容先不出现。

## 自动保存是背景动作

自动保存不应该打断作者。它只需要在角落里短暂显示状态，并在版本历史中留下可恢复的节点。

\`\`\`ts
type AutosaveState = "idle" | "saving" | "saved" | "offline";

function shouldCreateRevision(changeSize: number, minutesSinceLastRevision: number) {
  return changeSize > 600 || minutesSinceLastRevision >= 10;
}
\`\`\`

## AI 只做建议

自然语言编辑器的核心不是让 AI 接管写作，而是在人写完以后，提供保持原文风格的扩充、排版和润色候选。

$$
\\text{Trust} = \\frac{\\text{confirmation}}{\\text{silent overwrite} + 1}
$$

所有 AI 输出都必须停留在建议层，直到作者确认。`,
    bodyMarkdownEn: `# Studio Is Not Admin

Traditional CMS products usually begin with management: tables, status counts, and bulk actions. The first version of Endless starts from the opposite direction, with one unfinished piece of writing.

## Three Columns, Without Pressure

The left side shows content relationships, the middle holds the text, and the right side handles publishing and metadata. The point of the three-column structure is not to look professional. It is to help the author understand where they are, what they are writing, and where the piece is going.

> A good writing tool should feel like a desk that has been tidied up: everything is within reach, but nothing speaks over you.

The right rail only shows fields that actually affect publishing: slug, summary, tags, cover, SEO, visibility, and scheduled publishing. Everything else stays out of the way.

## Autosave Belongs in the Background

Autosave should not interrupt the author. It only needs to show a brief state in the corner and leave recoverable checkpoints in revision history.

\`\`\`ts
type AutosaveState = "idle" | "saving" | "saved" | "offline";

function shouldCreateRevision(changeSize: number, minutesSinceLastRevision: number) {
  return changeSize > 600 || minutesSinceLastRevision >= 10;
}
\`\`\`

## AI Stays Suggestion-Only

The core of the natural-language editor is not to let AI take over. It is to offer style-preserving expansion, formatting, and polishing after the human has already written the piece.

$$
\\text{Trust} = \\frac{\\text{confirmation}}{\\text{silent overwrite} + 1}
$$

Every AI output must remain a suggestion until the author explicitly confirms it.`,
    layoutMode: "MARKDOWN",
    templateKey: "DEFAULT",
    sections: [],
    tags: [writingSystemTag, aiAssistTag],
    categories: [notesCategory],
    cover: quietDeskCover,
    publishedAt: "2026-05-18T09:00:00.000Z",
    seoTitle: "写作台不是后台 - Endless",
    seoTitleEn: "Studio Is Not Admin - Endless",
    seoDescription: "Endless 如何把后台管理改造成一个以写作为中心的创作工作台。",
    seoDescriptionEn: "How Endless turns admin into a writing-centered workspace."
  },
  {
    type: "POST",
    status: "PUBLISHED",
    slug: "density-of-chinese-reading",
    title: "中文长文的呼吸密度",
    titleEn: "The Breathing Density of Chinese Reading",
    summary: "阅读页要把宋体气质、窄正文、注释、代码和图片放进同一种节奏里。",
    summaryEn: "A reading page should bring serif tone, narrow measure, notes, code, and images into one rhythm.",
    bodyMarkdown: `# 中文长文的呼吸密度

中文阅读页最怕两件事：一是像后台文档一样密不透风，二是像营销页一样把每段话都做成展示。Endless 的阅读页会优先照顾正文。

## 正文宽度

正文栏保持窄宽度，目录和元信息退到边缘。这样一行中文不会太长，也不会因为工具信息太多而失去文学感。

| 元素 | 处理方式 | 目的 |
| --- | --- | --- |
| 正文 | serif / 宋体气质 | 降低屏幕的工具感 |
| 目录 | 轻量 sticky | 提供方向，不抢注意力 |
| 代码 | 暖灰底色 | 和正文纸感保持一致 |

## 图片与引用

![安静写作台上的纸张、屏幕和边注](/images/quiet-desk.png)

图片不只是装饰，它应该帮助读者理解文章的状态。引用则需要像边注一样安静。

> 页面不是容器，页面是语气。`,
    bodyMarkdownEn: `# The Breathing Density of Chinese Reading

Chinese long-form reading is most easily ruined in two ways: it can feel as dense as an admin document, or as over-designed as a marketing page. Endless treats the body text as the first-class surface.

## Body Width

The reading column stays narrow while the table of contents and metadata retreat to the edge. That keeps one line of Chinese from becoming too wide, and it avoids burying the text under too much interface chrome.

| Element | Treatment | Why |
| --- | --- | --- |
| Body text | serif / Song-style tone | Reduce the feeling of tooling on screen |
| TOC | quiet sticky rail | Offer direction without stealing focus |
| Code | warm gray surface | Keep the same paper-like mood as the prose |

## Images and Quotations

![Paper, screen, and notes on a quiet writing desk](/images/quiet-desk.png)

Images are not decoration alone. They should help the reader understand the state of the piece. Quotations should remain as quiet as marginal notes.

> A page is not just a container. A page is part of the voice.`,
    layoutMode: "MARKDOWN",
    templateKey: "DEFAULT",
    sections: [],
    tags: [chineseTypographyTag, writingSystemTag],
    categories: [notesCategory],
    cover: quietDeskCover,
    publishedAt: "2026-05-14T11:30:00.000Z",
    seoTitle: "中文长文的呼吸密度 - Endless",
    seoTitleEn: "The Breathing Density of Chinese Reading - Endless",
    seoDescription: "一篇关于 Endless 前台中文阅读页排版原则的设计记录。",
    seoDescriptionEn: "A design note on the reading principles behind Endless front-end typography."
  },
  {
    type: "POST",
    status: "PUBLISHED",
    slug: "style-preserving-ai-editor",
    title: "风格保持的 AI 编辑器",
    titleEn: "A Style-Preserving AI Editor",
    summary: "自然语言编辑器的边界：人决定文本，AI 提供可比较、可撤销、可拒绝的建议。",
    summaryEn: "The boundary of the natural-language editor: humans decide the text, AI proposes suggestions that can be compared, undone, or rejected.",
    bodyMarkdown: `# 风格保持的 AI 编辑器

Endless 的自然语言编辑器不是从空白页开始生成文章，而是从作者已经写下的内容开始理解语气。

## 建议，而不是覆盖

AI 可以做三类事：

- 扩充：补足论证或例子。
- 排版：整理标题层级、列表、引用和表格。
- 润色：让句子更顺，但不改变作者的声音。

它不应该未经确认改写正文。第一版会把所有结果保存为 \`Suggestion\`，由作者决定插入、替换或忽略。

## 风格锁定

风格锁定意味着 provider 调用必须带上原文样本、语气备注和明确任务。即使后续接入 OpenAI API，接口也不会暴露“直接覆盖正文”的方法。

\`\`\`ts
interface AIEditRequest {
  originalMarkdown: string;
  instruction: string;
  preserveStyle: true;
}
\`\`\`

这让 AI 更像一位坐在旁边的编辑，而不是替作者写完一切的机器。`,
    bodyMarkdownEn: `# A Style-Preserving AI Editor

The natural-language editor in Endless does not start from a blank page. It begins by understanding the tone of what the author has already written.

## Suggest, Don't Overwrite

AI is allowed to do three things:

- Expand: add examples or supporting arguments.
- Format: organize headings, lists, quotations, and tables.
- Polish: make sentences clearer without changing the author's voice.

It must never rewrite the body without confirmation. In the first version, every output is stored as a \`Suggestion\` so the author can insert it, replace with it, or ignore it.

## Style Locking

Style locking means provider calls must include writing samples, tone notes, and a clear task. Even after a real OpenAI provider is connected, the interface will still avoid any "overwrite the article directly" method.

\`\`\`ts
interface AIEditRequest {
  originalMarkdown: string;
  instruction: string;
  preserveStyle: true;
}
\`\`\`

That makes AI feel more like an editor sitting beside the author, not a machine that writes the whole piece in their place.`,
    layoutMode: "MARKDOWN",
    templateKey: "DEFAULT",
    sections: [],
    tags: [aiAssistTag, writingSystemTag],
    categories: [docsCategory],
    cover: quietDeskCover,
    publishedAt: "2026-05-10T08:20:00.000Z",
    seoTitle: "风格保持的 AI 编辑器 - Endless",
    seoTitleEn: "A Style-Preserving AI Editor - Endless",
    seoDescription: "Endless 为自然语言写作预留的 AI provider 抽象和产品原则。",
    seoDescriptionEn: "The provider abstraction and product rules Endless uses for natural-language writing."
  },
  {
    type: "POST",
    status: "PUBLISHED",
    slug: "theme-is-a-reading-mood",
    title: "主题不是反色，而是阅读气氛",
    titleEn: "Theme Is a Reading Mood, Not an Inversion",
    summary: "light 和 dark 不该只是颜色互换，而应该像两种不同的纸面和室内光线。",
    summaryEn: "Light and dark should not be simple inversions. They should feel like different paper stocks and different indoor light.",
    bodyMarkdown: `# 主题不是反色，而是阅读气氛

很多网站的主题切换只是把白底换成黑底，但阅读感受并没有真正被重新设计。

## 两套气氛

浅色主题像温纸，深色主题像被灯光压暗后的工作台。  
两者都应该让正文、引用、代码和元信息保持可读，而不是简单把对比拉满。

## 节奏比装饰重要

如果导航过厚、边框过重、卡片太多，再好的主题色也救不了页面。  
真正决定气氛的是字号、行高、留白、分隔线和标题与正文的距离。`,
    bodyMarkdownEn: `# Theme Is a Reading Mood, Not an Inversion

Many sites implement theme switching by swapping white for black, but the reading feeling itself never gets redesigned.

## Two Different Moods

The light theme should feel like warm paper. The dark theme should feel like a desk dimmed by evening light. Both must keep body text, quotations, code, and metadata readable without forcing contrast to the maximum.

## Rhythm Matters More Than Decoration

If the navigation is too thick, the borders too heavy, and the cards too numerous, even a good palette cannot save the page. What really shapes the mood is type scale, line height, whitespace, separators, and the distance between headings and prose.`,
    layoutMode: "MARKDOWN",
    templateKey: "DEFAULT",
    sections: [],
    tags: [themeTag, chineseTypographyTag],
    categories: [notesCategory],
    cover: quietDeskCover,
    publishedAt: "2026-05-07T10:45:00.000Z",
    seoTitle: "主题不是反色，而是阅读气氛 - Endless",
    seoTitleEn: "Theme Is a Reading Mood - Endless",
    seoDescription: "关于 Endless light / dark 主题系统的一篇设计说明。",
    seoDescriptionEn: "A design note on the light and dark theme system inside Endless."
  },
  {
    type: "POST",
    status: "PUBLISHED",
    slug: "building-home-with-sections",
    title: "首页不是 landing page，而是一份目录",
    titleEn: "Home Is Not a Landing Page, but a Directory",
    summary: "当首页真正可编辑以后，它更像作者的目录与宣言，而不是产品宣传页。",
    summaryEn: "Once the home page becomes truly editable, it behaves more like an author's directory and statement than a marketing landing page.",
    bodyMarkdown: `# 首页不是 landing page，而是一份目录

个人站首页不需要模仿产品官网的大段营销文案。  
它更像一份目录，一段宣言，以及几块愿意让人继续往下看的入口。

## 结构化，而不是像素摆放

Endless 的 section builder 不追求像 Figma 那样自由拖拽。  
它做的是响应式结构化画布：模块有顺序、有宽度、有变体，但不允许把页面拖成一团。

## 原创但熟悉

我们追求的是一种熟悉的优秀体验：轻导航、大标题、模块节奏、面包屑、页脚列关系。  
实现方式必须原创，但用户进入页面时应该立刻知道“这是一套认真做过的个人站系统”。`,
    bodyMarkdownEn: `# Home Is Not a Landing Page, but a Directory

A personal site's home page does not need to imitate a product website full of marketing copy. It should feel closer to a directory, a statement, and a handful of carefully chosen entrances worth following downward.

## Structured, Not Pixel-Placed

The Endless section builder does not aim for Figma-style freeform dragging. It provides a responsive structured canvas: modules have order, width, and variants, but the page is never allowed to collapse into chaos.

## Original, Yet Familiar

We are chasing a familiar kind of excellence: light navigation, strong headings, confident module rhythm, breadcrumbs, and a clear footer structure. The implementation must stay original, but the user should immediately feel that this is a thoughtfully made personal publishing system.`,
    layoutMode: "MARKDOWN",
    templateKey: "DEFAULT",
    sections: [],
    tags: [builderTag, writingSystemTag],
    categories: [docsCategory],
    cover: quietDeskCover,
    publishedAt: "2026-05-04T09:12:00.000Z",
    seoTitle: "首页不是 landing page，而是一份目录 - Endless",
    seoTitleEn: "Home Is Not a Landing Page - Endless",
    seoDescription: "关于 Endless 首页结构和模块化 section 设计的一篇说明。",
    seoDescriptionEn: "A note on the home-page structure and section-based design in Endless."
  },
  {
    type: "POST",
    status: "PUBLISHED",
    slug: "publishing-with-silence",
    title: "发布流应该像背景动作一样安静",
    titleEn: "Publishing Should Feel Quiet in the Background",
    summary: "草稿、定时发布、版本和 SEO 字段都很重要，但它们不该在作者没准备好时抢戏。",
    summaryEn: "Drafts, scheduling, revisions, and SEO matter, but they should not steal attention before the author is ready.",
    bodyMarkdown: `# 发布流应该像背景动作一样安静

发布并不只是点一下 Publish。  
它还包括摘要、slug、SEO、封面、标签、发布时间和可恢复的历史节点。

## 工具出现的时机

这些字段当然重要，但它们出现的时机同样重要。  
在作者还没进入正文时，右侧面板不该用十几个输入框堵住注意力。

## 可恢复，比花哨更值钱

一个真正会被长期使用的 CMS，往往不是靠炫功能留住人，而是靠稳定的自动保存、可靠的版本回退和清楚的发布状态。`,
    bodyMarkdownEn: `# Publishing Should Feel Quiet in the Background

Publishing is not just pressing the Publish button. It includes summary, slug, SEO, cover, tags, publish time, and recoverable history.

## When Tools Should Appear

Those fields absolutely matter, but the moment they appear matters too. When the author has not even entered the body text yet, the right rail should not bury their attention under a dozen inputs.

## Recoverability Is Worth More Than Flash

A CMS that people keep using for years usually does not win through flashy features. It wins through stable autosave, reliable revision restore, and a clear understanding of publish state.`,
    layoutMode: "MARKDOWN",
    templateKey: "DEFAULT",
    sections: [],
    tags: [writingSystemTag, builderTag],
    categories: [notesCategory],
    cover: quietDeskCover,
    publishedAt: "2026-05-01T07:25:00.000Z",
    seoTitle: "发布流应该像背景动作一样安静 - Endless",
    seoTitleEn: "Publishing Should Feel Quiet - Endless",
    seoDescription: "关于草稿、发布、版本与 SEO 面板设计的一篇记录。",
    seoDescriptionEn: "A note on drafts, publishing, revisions, and the SEO side panel."
  },
  {
    type: "PROJECT",
    status: "PUBLISHED",
    slug: "bento-builder",
    title: "Bento Builder",
    titleEn: "Bento Builder",
    summary: "把首页模块从硬编码拼接改成可配置的 section 页面。",
    summaryEn: "Turn hard-coded home-page modules into configurable section-driven pages.",
    bodyMarkdown: `# Bento Builder

Bento Builder 是旧首页系统的出发点。新的 Endless 把它提升为统一的 section 页面模型：首页、About、Lab 和 Friends 都可以通过同一套结构化画布生成。`,
    bodyMarkdownEn: `# Bento Builder

Bento Builder was the starting point of the older home-page system. The new Endless lifts it into a unified section-page model so Home, About, Lab, and Friends can all be generated from the same structured canvas.`,
    layoutMode: "MARKDOWN",
    templateKey: "DEFAULT",
    sections: [],
    tags: [builderTag, writingSystemTag],
    categories: [systemCategory],
    cover: quietDeskCover,
    publishedAt: "2026-05-08T10:10:00.000Z",
    seoDescription: "Endless 的模块化页面构建系统。",
    seoDescriptionEn: "The modular page-building system inside Endless."
  },
  {
    type: "PROJECT",
    status: "PUBLISHED",
    slug: "quiet-themes",
    title: "Quiet Themes",
    titleEn: "Quiet Themes",
    summary: "为 light / dark 主题建立独立的阅读气氛，而不是简单反色。",
    summaryEn: "Create distinct reading moods for light and dark themes instead of simple inversion.",
    bodyMarkdown: `# Quiet Themes

Quiet Themes 负责前台与 Studio 的共享主题变量：色彩、边框、阴影、字体和动效都从这里统一抽出。`,
    bodyMarkdownEn: `# Quiet Themes

Quiet Themes owns the shared variables for the public site and Studio: color, borders, shadow, typography, and motion all come from one source.`,
    layoutMode: "MARKDOWN",
    templateKey: "DEFAULT",
    sections: [],
    tags: [themeTag, builderTag],
    categories: [systemCategory],
    cover: quietDeskCover,
    publishedAt: "2026-05-06T08:00:00.000Z",
    seoDescription: "Endless 的共享主题与设计 token 系统。",
    seoDescriptionEn: "The shared theme and design-token system for Endless."
  },
  {
    type: "PROJECT",
    status: "PUBLISHED",
    slug: "revision-engine",
    title: "Revision Engine",
    titleEn: "Revision Engine",
    summary: "把自动保存、人工保存和版本恢复收进同一套内容历史系统。",
    summaryEn: "Bring autosave, manual save, and revision restore into one content-history system.",
    bodyMarkdown: `# Revision Engine

自动保存、版本历史和恢复操作都依赖同一套 revision 记录。它保证作者可以随时回到更早的内容状态。`,
    bodyMarkdownEn: `# Revision Engine

Autosave, revision history, and restore all rely on the same revision record model. It ensures the author can return to an earlier state whenever needed.`,
    layoutMode: "MARKDOWN",
    templateKey: "DEFAULT",
    sections: [],
    tags: [writingSystemTag],
    categories: [systemCategory],
    cover: quietDeskCover,
    publishedAt: "2026-05-03T08:00:00.000Z",
    seoDescription: "Endless 的自动保存与版本系统。",
    seoDescriptionEn: "The autosave and revision system used by Endless."
  }
];
