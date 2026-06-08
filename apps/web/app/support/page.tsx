import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { resolveSite } from "@/lib/content-store";

export const dynamic = "force-static";

export async function generateMetadata(): Promise<Metadata> {
  const site = await resolveSite();
  return {
    title: "技术支持 / Support",
    description: `Endless ${site.name} 的技术支持页面，问题请联系 andyxecm@gmail.com / Technical support for ${site.name}; contact andyxecm@gmail.com.`
  };
}

export default function SupportPage() {
  return (
    <LegalPage
      eyebrowZh="永久页面"
      eyebrowEn="Permanent page"
      titleZh="技术支持"
      titleEn="Support"
      descriptionZh="如果你在 Endless 网站或 Studio 里遇到问题，这里就是正式的联系入口。"
      descriptionEn="If you run into a problem on the Endless site or in Studio, this is the official contact page."
      sections={[
        {
          titleZh: "你可以联系什么问题",
          titleEn: "What to contact us about",
          paragraphs: [
            {
              zh: "页面显示异常、双语切换不正常、内容无法保存、图片上传失败、发布流程卡住，或者你发现任何明显的站点错误，都可以直接联系我。",
              en: "You can contact me about display issues, bilingual toggle problems, content that will not save, failed image uploads, publishing steps that get stuck, or any obvious site bug."
            },
            {
              zh: "如果你只是想确认某个页面是否应该存在、某条内容是否已经发布，或者想请求删除和更正，也可以直接发邮件。",
              en: "If you want to confirm whether a page should exist, whether something has already been published, or request deletion or correction, email me directly."
            }
          ]
        },
        {
          titleZh: "我们会怎么处理",
          titleEn: "How issues are handled",
          paragraphs: [
            {
              zh: "我会先确认问题属于前台展示、Studio 编辑、数据库内容还是第三方服务，然后尽量给你一个直接的修复或下一步说明。",
              en: "I will first check whether the issue belongs to the public site, Studio editing, the database content, or a third-party service, and then give you either a direct fix or a clear next step."
            },
            {
              zh: "如果你附上截图、页面地址和大致操作步骤，通常会更快定位问题。",
              en: "If you include a screenshot, page URL, and the steps you took, it is usually much faster to pinpoint the issue."
            }
          ]
        }
      ]}
      footerZh="有问题请发邮件到"
      footerEn="For anything else, email"
      contactHref="mailto:andyxecm@gmail.com"
      contactZh="andyxecm@gmail.com"
      contactEn="andyxecm@gmail.com"
      updatedLabelZh="邮箱"
      updatedLabelEn="Email"
    />
  );
}
