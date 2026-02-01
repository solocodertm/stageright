const fs = require("fs");
const globby = require("globby");
const languages = [
  {
    "name": "English",
    "code": "en"
  },
  {
    "name": "German",
    "code": "de"
  },
  {
    "name": "Albanian",
    "code": "sq"
  },
  {
    "name": "Armenian",
    "code": "hy"
  },
  {
    "name": "Azerbaijani",
    "code": "az"
  },
  {
    "name": "Belarusian",
    "code": "be"
  },
  {
    "name": "Bosnian",
    "code": "bs"
  },
  {
    "name": "Bulgarian",
    "code": "bg"
  },
  {
    "name": "Croatian",
    "code": "hr"
  },
  {
    "name": "Greek",
    "code": "el"
  },
  {
    "name": "Czech",
    "code": "cs"
  },
  {
    "name": "Danish",
    "code": "da"
  },
  {
    "name": "Estonian",
    "code": "et"
  },
  {
    "name": "Finnish",
    "code": "fi"
  },
  {
    "name": "Georgian",
    "code": "ka"
  },
  {
    "name": "Hungarian",
    "code": "hu"
  },
  {
    "name": "Icelandic",
    "code": "is"
  },
  {
    "name": "Kazakh",
    "code": "kk"
  },
  {
    "name": "Kyrgyz",
    "code": "kg"
  },
  {
    "name": "Latvian",
    "code": "lv"
  },
  {
    "name": "Lithuanian",
    "code": "lt"
  },
  {
    "name": "Mongolian",
    "code": "mn"
  },
  {
    "name": "Montenegrin",
    "code": "cnr"
  },
  {
    "name": "Macedonian",
    "code": "mk"
  },
  {
    "name": "Polish",
    "code": "pl"
  },
  {
    "name": "Romanian",
    "code": "ro"
  },
  {
    "name": "Russian",
    "code": "ru"
  },
  {
    "name": "Serbia",
    "code": "sr"
  },
  {
    "name": "Slovak",
    "code": "sk"
  },
  {
    "name": "Slovene",
    "code": "sl"
  },
  {
    "name": "Swedish",
    "code": "sv"
  },
  {
    "name": "Tajik",
    "code": "tg"
  },
  {
    "name": "Turkey",
    "code": "tr"
  },
  {
    "name": "Turkmen",
    "code": "tk"
  },
  {
    "name": "Ukrainian",
    "code": "uk"
  },
  {
    "name": "Uzbek",
    "code": "uz"
  },
  {
    "name": "Pashto",
    "code": "ps"
  },
  {
    "name": "Bangla",
    "code": "bd"
  }
]
const addPage = (page) => {
  let path = page
    .replace(/^src\/app\//, "")
    .replace(/^content\//, "")
    .replace(/index(\.mdx|\.js|\.jsx|\.ts|\.tsx)?$/, "")
    .replace(/\.(js|jsx|ts|tsx|mdx)$/, "")
    .replace(/page$/, "")
    .replace(/\/$/, "");

  const route = path === "" ? "" : `/${path}`;
  const cleanRoute = route.replace(/\/+$/, "");

  return `  <url>
    <loc>${process.env.NEXT_PUBLIC_WEB_URL}${cleanRoute}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>`;
};
const addLanguageUrls = () => {
  return languages
    .map(
      (lang) => `
  <url>
    <loc>${process.env.NEXT_PUBLIC_WEB_URL}/locale/${lang?.name?.toLocaleLowerCase()}?lang=${lang?.code}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
  `
    )
    .join("");
};

const generateSitemap = async () => {
  const pages = await globby([
    "src/app/**/*.{js,jsx,ts,tsx,mdx}",
    "content/**/*.mdx",
    "!src/app/_*.{js,jsx,ts,tsx}",
    "!src/app/api/**",
  ]);
  const staticPages = pages.filter((p) => !p.includes("["));
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPages.map(addPage).join("\n")}
${addLanguageUrls()}
</urlset>`;

  fs.writeFileSync("public/sitemap.xml", sitemap);
};

generateSitemap();
