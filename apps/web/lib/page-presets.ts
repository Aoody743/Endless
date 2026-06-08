import type { ContentRecord, PageSectionRecord } from "@endless/content";

export type PagePresetKey = "home" | "about" | "lab" | "friends" | "thoughts" | "links" | "photos" | "resume" | "comments";

export function createSection(type: PageSectionRecord["type"], order: number): PageSectionRecord {
  const base = {
    id: `section-${Math.random().toString(36).slice(2, 10)}`,
    type,
    order,
    enabled: true
  };

  switch (type) {
    case "hero_statement":
      return {
        ...base,
        variant: "page-title",
        columnSpan: "full",
        props: {
          eyebrow: "New section",
          eyebrowZh: "新模块",
          eyebrowEn: "New section",
          titleZh: "新的开场区块",
          titleEn: "New opening statement",
          bodyZh: "用一个清楚的想法打开这个页面。",
          bodyEn: "Use this section to open the page with one strong idea."
        }
      };
    case "intro_richtext":
      return {
        ...base,
        variant: "narrative",
        columnSpan: "wide",
        props: {
          bodyMarkdown: ""
        }
      };
    case "feature_grid":
      return {
        ...base,
        variant: "magazine",
        columnSpan: "full",
        props: {
          title: "Discover more",
          items: [{ eyebrow: "Label", title: "Feature title", description: "Explain what this section points to.", href: "/" }]
        }
      };
    case "featured_posts":
      return {
        ...base,
        variant: "editorial",
        columnSpan: "wide",
        props: {
          title: "Selected writing",
          description: "Choose a few pieces to feature.",
          slugs: []
        }
      };
    case "project_directory":
      return {
        ...base,
        variant: "catalog",
        columnSpan: "full",
        props: {
          title: "Project directory",
          description: "This section reads from published project items."
        }
      };
    case "quote_panel":
      return {
        ...base,
        variant: "statement",
        columnSpan: "half",
        props: {
          quoteZh: "一段值得停下来的话。",
          quoteEn: "A quotation worth pausing on.",
          citationZh: "出处",
          citationEn: "Source"
        }
      };
    case "link_cluster":
      return {
        ...base,
        variant: "stack",
        columnSpan: "half",
        props: {
          title: "Links",
          links: [{ label: "Link label", href: "/", description: "A short note." }]
        }
      };
    case "image_story":
      return {
        ...base,
        variant: "immersive",
        columnSpan: "wide",
        props: {
          eyebrow: "Image story",
          title: "A section with image and copy",
          body: "Pair one strong image with a clear paragraph.",
          image: "/images/quiet-desk.png",
          alt: "Preview"
        }
      };
    case "timeline":
      return {
        ...base,
        variant: "milestones",
        columnSpan: "wide",
        props: {
          title: "Timeline",
          items: [{ meta: "Now", title: "Milestone", body: "Describe one step." }]
        }
      };
    case "contact_strip":
    default:
      return {
        ...base,
        variant: "footer",
        columnSpan: "full",
        props: {
          title: "Call to action",
          body: "Wrap up the page with a clear next step.",
          links: [{ label: "Primary action", href: "/" }]
        }
      };
    case "custom_html":
      return {
        ...base,
        variant: "free-html",
        columnSpan: "full",
        props: {
          titleZh: "自定义页面模块",
          titleEn: "Custom page module",
          htmlZh: "<section><h2>自定义内容</h2><p>在这里写 HTML，顶栏会继续保留。</p></section>",
          htmlEn: "<section><h2>Custom content</h2><p>Write HTML here while keeping the site header.</p></section>"
        }
      };
  }
}

export function toPagePresetKey(value?: string): PagePresetKey | undefined {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase();
  if (
    normalized === "home" ||
    normalized === "about" ||
    normalized === "lab" ||
    normalized === "friends" ||
    normalized === "thoughts" ||
    normalized === "links" ||
    normalized === "photos" ||
    normalized === "resume" ||
    normalized === "comments"
  ) {
    return normalized;
  }
  return undefined;
}

export function presetBlueprint(preset: PagePresetKey) {
  const table: Record<
    PagePresetKey,
    {
      slug: string;
      title: string;
      titleEn: string;
      summary: string;
      summaryEn: string;
      templateKey: ContentRecord["templateKey"];
    }
  > = {
    home: {
      slug: "home",
      title: "首页",
      titleEn: "Home",
      summary: "站点首页，展示核心模块。",
      summaryEn: "Homepage with core modules.",
      templateKey: "HOME"
    },
    about: {
      slug: "about",
      title: "关于",
      titleEn: "About",
      summary: "关于页面，用于叙事和介绍。",
      summaryEn: "Narrative about page.",
      templateKey: "ABOUT"
    },
    lab: {
      slug: "lab",
      title: "实验室",
      titleEn: "Lab",
      summary: "实验项目和系统目录。",
      summaryEn: "Projects and systems directory.",
      templateKey: "LAB"
    },
    friends: {
      slug: "friends",
      title: "友链",
      titleEn: "Friends",
      summary: "友情链接和同路人的页面。",
      summaryEn: "Friends and links page.",
      templateKey: "DEFAULT"
    },
    thoughts: {
      slug: "thoughts",
      title: "朋友圈",
      titleEn: "Thoughts",
      summary: "短内容流页面。",
      summaryEn: "Short-form thoughts feed.",
      templateKey: "DEFAULT"
    },
    links: {
      slug: "links",
      title: "链接",
      titleEn: "Links",
      summary: "链接聚合页。",
      summaryEn: "Link cluster page.",
      templateKey: "DEFAULT"
    },
    photos: {
      slug: "photos",
      title: "照片墙",
      titleEn: "Photo Wall",
      summary: "照片和视觉记录页面。",
      summaryEn: "Photo wall page.",
      templateKey: "DEFAULT"
    },
    resume: {
      slug: "resume",
      title: "个人简历",
      titleEn: "Resume",
      summary: "履历、时间线和联系信息。",
      summaryEn: "Resume, timeline, and contact info.",
      templateKey: "DEFAULT"
    },
    comments: {
      slug: "comments",
      title: "评论管理",
      titleEn: "Comments",
      summary: "评论相关页面。",
      summaryEn: "Comments management page.",
      templateKey: "DEFAULT"
    }
  };
  return table[preset];
}

export function presetSections(preset: PagePresetKey): PageSectionRecord[] {
  const hero = createSection("hero_statement", 1);
  const intro = createSection("intro_richtext", 2);
  const grid = createSection("feature_grid", 3);
  const links = createSection("link_cluster", 4);
  const timeline = createSection("timeline", 5);
  const contact = createSection("contact_strip", 6);
  const directory = createSection("project_directory", 3);

  if (preset === "home") {
    return [
      {
        ...hero,
        variant: "poster-emoji",
        props: {
          eyebrowZh: "SITE HOME",
          eyebrowEn: "SITE HOME",
          titleZh: "欢迎来到我的站点",
          titleEn: "Welcome to my site",
          bodyZh: "这是可以在 Studio 自由编排的首页。",
          bodyEn: "This homepage is fully editable in Studio."
        }
      },
      {
        ...intro,
        variant: "intro-lines",
        props: {
          lines: [
            { text: "创作、发布、归档。", textEn: "Write, publish, archive.", emoji: "🪶" },
            { text: "内容优先，界面克制。", textEn: "Content first, calm interface.", emoji: "🫧" }
          ]
        }
      },
      {
        ...grid,
        variant: "home-bento-reference",
        props: {
          titleZh: "主页模块",
          titleEn: "Home modules",
          items: []
        }
      }
    ];
  }

  if (preset === "about") {
    return [
      {
        ...hero,
        variant: "editorial-page",
        props: {
          eyebrowZh: "ABOUT",
          eyebrowEn: "ABOUT",
          titleZh: "关于我",
          titleEn: "About me",
          bodyZh: "在这里写一段更完整的自我介绍。",
          bodyEn: "Write a fuller introduction here."
        }
      },
      {
        ...timeline,
        props: {
          title: "Milestones",
          items: [{ meta: "Now", title: "New chapter", body: "Describe a milestone." }]
        }
      },
      contact
    ];
  }

  if (preset === "lab") {
    return [
      {
        ...hero,
        variant: "editorial-page",
        props: {
          eyebrowZh: "LAB",
          eyebrowEn: "LAB",
          titleZh: "实验室",
          titleEn: "Lab",
          bodyZh: "这里展示系统、实验和项目。",
          bodyEn: "Show systems, experiments, and projects here."
        }
      },
      directory
    ];
  }

  if (preset === "friends") {
    return [
      {
        ...hero,
        variant: "editorial-page",
        props: {
          eyebrowZh: "FRIENDS",
          eyebrowEn: "FRIENDS",
          titleZh: "友情链接",
          titleEn: "Friends",
          bodyZh: "记录互相欣赏的创作者。",
          bodyEn: "A list of creators I admire."
        }
      },
      {
        ...grid,
        variant: "friend-cards",
        props: {
          titleZh: "朋友们",
          titleEn: "Friends",
          items: []
        }
      }
    ];
  }

  if (preset === "thoughts") {
    return [
      {
        ...hero,
        variant: "editorial-page",
        props: {
          eyebrowZh: "THOUGHTS",
          eyebrowEn: "THOUGHTS",
          titleZh: "朋友圈",
          titleEn: "Thoughts",
          bodyZh: "短笔记、碎片观点和日常记录。",
          bodyEn: "Short notes, fragments, and daily logs."
        }
      },
      {
        ...grid,
        variant: "thought-stream",
        props: {
          titleZh: "Moments / 朋友圈",
          titleEn: "Moments / Thoughts",
          items: []
        }
      }
    ];
  }

  if (preset === "photos") {
    return [
      {
        ...hero,
        variant: "editorial-page",
        props: {
          eyebrowZh: "PHOTOS",
          eyebrowEn: "PHOTOS",
          titleZh: "照片墙",
          titleEn: "Photo Wall",
          bodyZh: "用图片和简短文字记录片段。",
          bodyEn: "A visual wall of moments."
        }
      },
      {
        ...grid,
        variant: "gallery",
        props: {
          titleZh: "相册",
          titleEn: "Gallery",
          items: []
        }
      }
    ];
  }

  if (preset === "resume") {
    return [
      {
        ...hero,
        variant: "editorial-page",
        props: {
          eyebrowZh: "RESUME",
          eyebrowEn: "RESUME",
          titleZh: "个人简历",
          titleEn: "Resume",
          bodyZh: "在这里展示经历、技能和联系方式。",
          bodyEn: "Show your experiences, skills, and contacts."
        }
      },
      timeline,
      contact
    ];
  }

  if (preset === "comments") {
    return [
      {
        ...hero,
        variant: "editorial-page",
        props: {
          eyebrowZh: "COMMENTS",
          eyebrowEn: "COMMENTS",
          titleZh: "评论管理",
          titleEn: "Comments",
          bodyZh: "集中管理评论相关内容。",
          bodyEn: "Manage comments in one place."
        }
      },
      {
        ...grid,
        variant: "comment-stream",
        props: {
          titleZh: "评论队列",
          titleEn: "Comment queue",
          items: []
        }
      }
    ];
  }

  return [
    {
      ...hero,
      variant: "editorial-page",
      props: {
        eyebrowZh: "LINKS",
        eyebrowEn: "LINKS",
        titleZh: "链接集合",
        titleEn: "Links",
        bodyZh: "维护你常用的链接入口。",
        bodyEn: "Maintain your link collection."
      }
    },
    links
  ];
}
