//@ts-nocheck

/** Man... I really need *something like* this */
const getPackageTypes = async (owner: string, repo: string) => {
  const client = new Uithub({ apiKey: env.UITHUB_API_KEY });
  const packages: any[] = await client.get({
    owner,
    repo,
    pathPatterns: ["**/package.json"],
  });
  const typedPackages = packages
    .map(
      (file) => JSON.parse(file.content) as { name?: string; types?: string }
    )
    .filter((x) => x.name && x.types);
  const dtsFileUrls = typedPackages.map(
    (x) => `https://unpkg.com/${x.name}/${x.types}`
  );
  return { dtsFileUrls };
};

getPackageTypes("vercel", "ai").then(
  ({ dtsFileUrls }) => `Packages available: \n\n ${dtsFileUrls.join("\n")}`
);
