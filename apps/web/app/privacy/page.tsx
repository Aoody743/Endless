import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { resolveSite } from "@/lib/content-store";

export const dynamic = "force-static";

export async function generateMetadata(): Promise<Metadata> {
  const site = await resolveSite();
  return {
    title: "隐私政策 / Privacy Policy",
    description: `Endless ${site.name} 的隐私政策与数据说明 / Privacy policy and data notice for ${site.name}.`
  };
}

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      eyebrowZh="永久页面"
      eyebrowEn="Permanent page"
      titleZh="隐私政策"
      titleEn="Privacy Policy"
      descriptionZh="这是一份面向 Endless 网站与工作台的双语隐私说明，说明我们会收集什么、如何使用，以及你可以如何联系我。"
      descriptionEn="This bilingual page explains what the Endless site and studio collect, how the data is used, and how to reach me if you need help."
      sections={[
        {
          titleZh: "我们会收集什么",
          titleEn: "What we collect",
          paragraphs: [
            {
              zh: "当你浏览网站时，我们会记录常规的服务器访问日志，例如请求时间、页面地址、浏览器信息和基础网络信息。这些信息用于站点运行、排错和安全防护。",
              en: "When you browse the site, we may record standard server access logs such as request time, page URL, browser details, and basic network information. We use this data for operation, debugging, and security."
            },
            {
              zh: "当你在 Studio 中登录、编辑内容、上传媒体或保存设置时，系统会保存你主动提交的内容、账号信息、页面内容、媒体资源与站点配置。",
              en: "When you sign in to Studio, edit content, upload media, or save settings, the system stores the information you actively submit, including account details, page content, media assets, and site configuration."
            }
          ]
        },
        {
          titleZh: "我们如何使用这些数据",
          titleEn: "How we use the data",
          paragraphs: [
            {
              zh: "这些数据仅用于提供和维护 Endless 网站、管理内容、支持登录、保存草稿、发布页面，以及处理你发起的操作。",
              en: "We use the data only to operate and maintain the Endless site, manage content, support sign-in, save drafts, publish pages, and process actions you request."
            },
            {
              zh: "网站会使用浏览器本地存储记住你的主题和语言偏好。这个设置只保存在你的设备上，便于下次访问时保持一致。",
              en: "The site uses browser local storage to remember your theme and language preferences. This setting stays on your device so the next visit feels consistent."
            }
          ]
        },
        {
          titleZh: "AI 与第三方服务",
          titleEn: "AI and third-party services",
          paragraphs: [
            {
              zh: "如果你在 Studio 中启用了 AI 功能，你输入的提示词、正在编辑的草稿内容以及生成请求，可能会被发送到你配置的 AI 服务提供方，用于生成结果。",
              en: "If AI is enabled in Studio, the prompts you enter, the draft content you are editing, and the generation request may be sent to the configured AI provider to produce results."
            },
            {
              zh: "站点还会使用托管、数据库和图片存储等基础服务来提供页面浏览、内容保存和媒体分发。这些服务仅在提供功能所需的范围内处理数据。",
              en: "The site also uses hosting, database, and image storage services to power browsing, content saving, and media delivery. Those services process data only as needed to provide the feature."
            }
          ]
        },
        {
          titleZh: "保存与安全",
          titleEn: "Retention and security",
          paragraphs: [
            {
              zh: "内容会在你删除、修改或请求我们协助处理之前持续保留。我们会尽量只保留提供服务所需的数据，并用合理的方式保护它。",
              en: "Content is retained until you delete it, change it, or ask us to help with a change. We try to keep only the data needed to provide the service and protect it with reasonable safeguards."
            },
            {
              zh: "如果你认为自己的数据有误，或者希望我们协助删除、导出或更正，请通过技术支持页面联系我。",
              en: "If you believe something is wrong with your data, or you want help deleting, exporting, or correcting it, please use the support page to contact me."
            }
          ]
        }
      ]}
      footerZh="继续使用本站，即表示你理解并接受以上说明。"
      footerEn="By continuing to use the site, you acknowledge the notice above."
    />
  );
}
